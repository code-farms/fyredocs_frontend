import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageView, type PageHighlight } from './PageView';
import { ReaderSearchBar } from './ReaderSearchBar';
import { ReaderSidePanel, type SidePanelTab } from './ReaderSidePanel';
import { ReaderToolbar } from './ReaderToolbar';
import { ReadAloudBar } from './ReadAloudBar';
import { AiPanel } from '@/components/ai/AiPanel';
import { DuplicateNotice } from './DuplicateNotice';
import { useAuth } from '@/auth/useAuth';
import { simhash } from '@/lib/dedupe/simhash';
import { getDocumentDuplicates, saveDocumentExtraction, updateDocument, type DuplicateMatches } from '@/lib/documentsApi';
import type { Extraction } from '@/lib/ai/extraction';
import { AnnotateToolbar } from '@/components/annotate/AnnotateToolbar';
import { AnnotationLayer, type AnnotateTool, type PendingSignature } from '@/components/annotate/AnnotationLayer';
import { SignaturePad } from '@/components/common/SignaturePad';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportAnnotationsJson, exportAnnotationsXfdf, importAnnotations, readOwnAnnotations } from '@/lib/annotate/webInterchange';
import { signatureUrl, storeSignature, toPngSignature } from '@/lib/annotate/webSignatures';
import { DEFAULT_INK, HIGHLIGHT_INK } from '@/lib/annotate/inkColors';
import type { Annotation } from '@/lib/annotate/model';
import { AnnotateSaveError, saveAnnotatedPdf } from '@/lib/annotate/savePdf';
import { loadDrafts, markupCount, saveDrafts } from '@/lib/annotate/webDrafts';
import { useFlags } from '@/hooks/useFlags';
import { useReadAloud } from '@/hooks/useReadAloud';
import { printPdfBytes } from '@/lib/reader/print';
import { pageImageForAi } from '@/lib/pdf/pageImage';
import type { PdfPermissions } from '@/lib/pdf/permissions';
import { locateMatch, useDocSearch } from '@/hooks/useDocSearch';
import { findMatches } from '@/lib/docSearch';
import { rectsForRange } from '@/lib/pdf/oracle/oracleMath';
import {
  docFingerprint,
  pageSize,
  pageTextLayer,
  readOutline,
  readPermissions,
  type OutlineEntry,
  type PDFDocumentProxy,
} from '@/lib/pdf/pdfjs';
import type { PageTextLayer } from '@/lib/pdf/textItems';
import {
  DEFAULT_ZOOM,
  PAGE_GAP,
  pageAt,
  pageOffsets,
  renderWindow,
  stepZoom,
  themeFilter,
  type ReaderTheme,
} from '@/lib/reader/reader';
import {
  loadReaderState,
  removeBookmark,
  renameBookmark,
  saveLastPage,
  toggleBookmark,
  type Bookmark,
} from '@/lib/reader/readerStore';
import { toast } from '@/lib/toast';

/** Advisory permissions are explained, never silently greyed out (the app's Phase 16 contract). */
const restricted = (action: string) => `${action} is restricted by this document's permissions.`;

/** Highlight cap per page, as in the app: a one-letter query must not draw thousands of boxes. */
const MAX_HIGHLIGHTS_PER_PAGE = 200;
const SAVE_PAGE_DELAY_MS = 500;

interface ReaderViewProps {
  doc: PDFDocumentProxy;
  title: string;
  downloadUrl?: string;
  /** The library document being read, when there is one: AI details and duplicates attach to it. */
  libraryDoc?: { id: string; orgId?: string } | null;
}

/** Fingerprinting reads the text layer; past this many pages it isn't worth the wait. */
const FINGERPRINT_MAX_PAGES = 200;
/** Library documents already fingerprinted this session — one PATCH per document. */
const fingerprinted = new Set<string>();

export const ReaderView = ({ doc, title, downloadUrl, libraryDoc }: ReaderViewProps) => {
  const fp = useMemo(() => docFingerprint(doc), [doc]);
  const [sizes, setSizes] = useState<{ width: number; height: number }[]>([]);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<SidePanelTab>('pages');
  const [outline, setOutline] = useState<OutlineEntry[] | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matchIndex, setMatchIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const layers = useRef(new Map<number, Promise<PageTextLayer>>());
  const resumeTo = useRef<number | null>(null);
  const [permissions, setPermissions] = useState<PdfPermissions | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  // ── Annotate (markup keyed by 0-based page, like the app's model) ──
  const [annotating, setAnnotating] = useState(false);
  const [tool, setTool] = useState<AnnotateTool>('pen');
  const [ink, setInk] = useState<string>(DEFAULT_INK);
  const [markup, setMarkup] = useState<Record<number, Annotation[]>>({});
  const [undoStack, setUndoStack] = useState<Record<number, Annotation[]>[]>([]);
  const [selected, setSelected] = useState<{ page: number; id: string } | null>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [sigDialog, setSigDialog] = useState(false);
  const [sigDraft, setSigDraft] = useState<string | null>(null);
  const [pendingSig, setPendingSig] = useState<PendingSignature | null>(null);
  const [pendingImport, setPendingImport] = useState<Record<number, Annotation[]> | null>(null);
  // Gated on the gateway's runtime flag (FEATURE_FLAGS_JSON), fail-closed.
  const aiEnabled = useFlags().aiReading === true;

  // Page sizes start from page 1 for every page; refined near the reader below.
  useEffect(() => {
    let cancelled = false;
    layers.current = new Map();
    pageSize(doc, 1)
      .then((first) => !cancelled && setSizes(Array.from({ length: doc.numPages }, () => first)))
      .catch(() => !cancelled && setSizes(Array.from({ length: doc.numPages }, () => ({ width: 612, height: 792 }))));
    readOutline(doc).then((o) => !cancelled && setOutline(o));
    readPermissions(doc).then((p) => !cancelled && setPermissions(p));
    const drafts = loadDrafts(fp);
    setMarkup(drafts);
    setUndoStack([]);
    // No draft: re-open the marks a previous save wrote into this PDF.
    if (Object.keys(drafts).length === 0) {
      Promise.resolve()
        .then(() => doc.getData())
        .then(readOwnAnnotations)
        .then((saved) => {
          if (!cancelled && Object.keys(saved).length > 0) setMarkup(saved);
        })
        .catch(() => undefined);
    }
    const saved = loadReaderState(fp);
    setBookmarks(saved.bookmarks);
    if (saved.lastPage > 1 && saved.lastPage <= doc.numPages) resumeTo.current = saved.lastPage;
    return () => {
      cancelled = true;
    };
  }, [doc, fp]);

  useEffect(() => {
    let cancelled = false;
    const wanted = [...renderWindow(page, doc.numPages, 4)];
    Promise.all(wanted.map((p) => pageSize(doc, p).then((s) => [p, s] as const)))
      .then((entries) => {
        if (cancelled) return;
        setSizes((prev) => {
          if (prev.length === 0) return prev;
          let changed = false;
          const next = prev.slice();
          for (const [p, s] of entries) {
            if (next[p - 1].width !== s.width || next[p - 1].height !== s.height) {
              next[p - 1] = s;
              changed = true;
            }
          }
          return changed ? next : prev;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [doc, page]);

  const offsets = useMemo(() => pageOffsets(sizes.map((s) => Math.floor(s.height * zoom))), [sizes, zoom]);
  const visible = useMemo(() => renderWindow(page, doc.numPages), [page, doc]);
  const filter = themeFilter(theme);

  const goTo = useCallback(
    (p: number) => {
      scrollRef.current?.scrollTo({ top: Math.max(0, (offsets[p - 1] ?? 0) - PAGE_GAP) });
      setPage(p);
    },
    [offsets]
  );

  // Resume once the layout exists.
  useEffect(() => {
    if (resumeTo.current && offsets.length === doc.numPages) {
      const p = resumeTo.current;
      resumeTo.current = null;
      goTo(p);
      toast.info(`Resumed at page ${p}`);
    }
  }, [offsets, doc, goTo]);

  useEffect(() => {
    const t = setTimeout(() => saveLastPage(fp, page), SAVE_PAGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [fp, page]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // A third of the way down the viewport counts as "the page being read".
    setPage(pageAt(offsets, el.scrollTop + el.clientHeight / 3));
  }, [offsets]);

  // ── Search ──
  const getLayer = useCallback(
    (p: number) => {
      let layer = layers.current.get(p);
      if (!layer) {
        layer = pageTextLayer(doc, p);
        layers.current.set(p, layer);
      }
      return layer;
    },
    [doc]
  );
  const opts = useMemo(() => ({ caseSensitive, wholeWord }), [caseSensitive, wholeWord]);
  const activeQuery = searchOpen ? query : '';
  const search = useDocSearch(doc.numPages, getLayer, activeQuery, opts);
  const located = search.total > 0 ? locateMatch(search.hits, Math.min(matchIndex, search.total - 1)) : null;

  useEffect(() => setMatchIndex(0), [activeQuery, caseSensitive, wholeWord]);

  const step = (dir: 1 | -1) => {
    if (search.total === 0) return;
    const next = (matchIndex + dir + search.total) % search.total;
    setMatchIndex(next);
    const loc = locateMatch(search.hits, next);
    if (loc) goTo(loc.page);
  };

  // Highlight rects for rendered pages; layers are already cached by the scan.
  const [highlights, setHighlights] = useState<Map<number, PageHighlight[]>>(new Map());
  useEffect(() => {
    const needle = activeQuery.trim();
    if (!needle || search.total === 0) {
      setHighlights(new Map());
      return;
    }
    let cancelled = false;
    const pages = [...visible].filter((p) => search.hits.some((h) => h.page === p));
    Promise.all(
      pages.map(async (p) => {
        const layer = await getLayer(p);
        const matches = findMatches(layer.text, needle, opts).slice(0, MAX_HIGHLIGHTS_PER_PAGE);
        const list: PageHighlight[] = matches.map((m, i) => ({
          rects: rectsForRange(layer.items, layer.offsets, m.start, m.end),
          active: located?.page === p && located.inPage === i,
        }));
        return [p, list] as const;
      })
    )
      .then((entries) => !cancelled && setHighlights(new Map(entries)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeQuery, opts, search, visible, getLayer, located?.page, located?.inPage]);

  // Ctrl/Cmd+F opens the reader's search instead of the browser's (which can't see canvas text).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const bookmarked = bookmarks.some((b) => b.page === page);

  // ── Library document: text fingerprint + duplicates (document-service D1) ──
  const { isAuthenticated } = useAuth();
  const [duplicates, setDuplicates] = useState<DuplicateMatches | null>(null);
  const libId = libraryDoc?.id;
  const libOrg = libraryDoc?.orgId;
  useEffect(() => {
    if (!libId || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      // Fingerprint first (once per document per session) so the near-duplicate
      // check below can already match on it.
      if (!fingerprinted.has(libId) && doc.numPages <= FINGERPRINT_MAX_PAGES) {
        fingerprinted.add(libId);
        try {
          const texts: string[] = [];
          for (let p = 1; p <= doc.numPages && !cancelled; p++) texts.push((await getLayer(p)).text);
          const fp = simhash(texts.join('\f'));
          if (fp && !cancelled) await updateDocument(libId, { simhash: fp }, libOrg);
        } catch {
          // Best-effort: no fingerprint only means no near-duplicate matches.
        }
      }
      if (cancelled) return;
      try {
        setDuplicates(await getDocumentDuplicates(libId, libOrg));
      } catch {
        setDuplicates(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [libId, libOrg, isAuthenticated, doc, getLayer]);

  const saveExtraction = libId
    ? async (e: Extraction) => {
        try {
          await saveDocumentExtraction(libId, e.docType, e, libOrg);
        } catch {
          toast.error("The details were detected but couldn't be saved to your library.");
        }
      }
    : undefined;

  // ── Annotate ──
  const MAX_UNDO = 50;
  /** Replaces the markup as one undoable step. */
  const commitMarkup = (next: Record<number, Annotation[]>) => {
    setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), markup]);
    setMarkup(next);
  };

  // Drafts persist shortly after each change (best-effort, this browser only).
  useEffect(() => {
    const t = setTimeout(() => saveDrafts(fp, markup), 400);
    return () => clearTimeout(t);
  }, [fp, markup]);

  const addMark = (pageIdx: number, a: Annotation) => commitMarkup({ ...markup, [pageIdx]: [...(markup[pageIdx] ?? []), a] });
  const moveStart = useRef<Record<number, Annotation[]> | null>(null);
  const updateMark = (pageIdx: number, a: Annotation) => {
    // A drag fires many updates; record ONE undo step for the whole move.
    if (!moveStart.current) {
      moveStart.current = markup;
      setUndoStack((u) => [...u.slice(-(MAX_UNDO - 1)), markup]);
    }
    setMarkup((prev) => ({ ...prev, [pageIdx]: (prev[pageIdx] ?? []).map((x) => (x.id === a.id ? a : x)) }));
  };
  const undo = () => {
    if (undoStack.length === 0) return;
    setMarkup(undoStack[undoStack.length - 1]);
    setUndoStack(undoStack.slice(0, -1));
    setSelected(null);
    moveStart.current = null;
  };
  const deleteSelected = () => {
    if (!selected) return;
    commitMarkup({ ...markup, [selected.page]: (markup[selected.page] ?? []).filter((a) => a.id !== selected.id) });
    setSelected(null);
  };

  const startAnnotating = () => {
    if (annotating) {
      setAnnotating(false);
      setSelected(null);
      return;
    }
    if (permissions && !permissions.annotate) {
      toast.info(restricted('Adding annotations'));
      return;
    }
    setAnnotating(true);
  };

  const savePdf = async () => {
    setSavingPdf(true);
    try {
      const out = await saveAnnotatedPdf(await doc.getData(), markup);
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\.pdf$/i, '')}-annotated.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Saved — the text stays searchable and the marks stay editable in other PDF apps.');
    } catch (err) {
      toast.error(err instanceof AnnotateSaveError ? err.message : "The PDF couldn't be saved.");
    } finally {
      setSavingPdf(false);
    }
  };

  const downloadText = (name: string, body: string, type: string) => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const baseName = title.replace(/\.pdf$/i, '');

  const exportXfdf = async () => {
    try {
      downloadText(`${baseName}-annotations.xfdf`, await exportAnnotationsXfdf(await doc.getData(), markup), 'application/vnd.adobe.xfdf');
    } catch {
      toast.error("The annotations couldn't be exported.");
    }
  };

  const importFile = async (file: File) => {
    try {
      const imported = await importAnnotations(await file.text(), await doc.getData());
      if (!imported || markupCount(imported) === 0) {
        toast.error("That file isn't an XFDF or Fyredocs annotations file, or it has nothing for this PDF.");
        return;
      }
      // Import replaces wholesale, as in the app — confirm when it would discard marks.
      if (markupCount(markup) > 0) setPendingImport(imported);
      else commitMarkup(imported);
    } catch {
      toast.error("That file couldn't be read.");
    }
  };

  const applySignature = async () => {
    if (!sigDraft) return;
    try {
      const png = await toPngSignature(sigDraft);
      setPendingSig({ relPath: storeSignature(png.url), aspect: png.aspect });
      setTool('signature');
      setSelected(null);
      setSigDialog(false);
      toast.info('Click on a page to place the signature.');
    } catch {
      toast.error("That image couldn't be used as a signature.");
    }
  };

  useEffect(() => {
    if (!annotating) return;
    const onKey = (e: KeyboardEvent) => {
      const typingInField = (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable="true"]');
      if (typingInField) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Read aloud, print, copy ──
  const getPageText = useCallback(async (p: number) => (await getLayer(p)).text, [getLayer]);
  const readAloud = useReadAloud({
    pageCount: doc.numPages,
    getPageText,
    onPage: (p) => p !== page && goTo(p),
  });

  const print = async () => {
    if (permissions && !permissions.print) {
      toast.info(restricted('Printing'));
      return;
    }
    try {
      printPdfBytes(await doc.getData());
    } catch {
      toast.error("The document couldn't be printed — try downloading it instead.");
    }
  };

  const copyText = async () => {
    if (permissions && !permissions.copy) {
      toast.info(restricted('Copying text'));
      return;
    }
    const text = (await getPageText(page).catch(() => '')).trim();
    if (!text) {
      toast.info('This page has no text to copy. Scanned pages need OCR first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied the text of page ${page}`);
    } catch {
      toast.error("Couldn't copy to the clipboard.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <ReaderToolbar
        title={title}
        page={page}
        pageCount={doc.numPages}
        zoom={zoom}
        theme={theme}
        thumbsOpen={panelOpen}
        downloadUrl={downloadUrl}
        searchOpen={searchOpen}
        bookmarked={bookmarked}
        onPage={goTo}
        onToggleSearch={() => setSearchOpen((o) => !o)}
        onToggleBookmark={() => {
          const next = toggleBookmark(fp, page);
          setBookmarks(next);
          toast.success(next.some((b) => b.page === page) ? `Bookmarked page ${page}` : 'Bookmark removed');
        }}
        onReadAloud={
          readAloud.supported
            ? () => (readAloud.status === 'idle' ? void readAloud.start(page) : readAloud.stop())
            : undefined
        }
        readAloudActive={readAloud.status !== 'idle'}
        onPrint={print}
        onCopyText={copyText}
        onAi={aiEnabled ? () => setAiOpen((o) => !o) : undefined}
        onAnnotate={startAnnotating}
        annotating={annotating}
        aiOpen={aiOpen}
        onZoom={(dir) => setZoom((z) => stepZoom(z, dir))}
        onTheme={setTheme}
        onToggleThumbs={() => setPanelOpen((o) => !o)}
      />
      {duplicates && <DuplicateNotice matches={duplicates} orgId={libOrg} />}
      {annotating && (
        <AnnotateToolbar
          tool={tool}
          color={ink}
          count={markupCount(markup)}
          canUndo={undoStack.length > 0}
          hasSelection={selected !== null}
          saving={savingPdf}
          onTool={(t) => {
            if (t === 'signature' && !pendingSig) {
              setSigDialog(true);
              return;
            }
            setTool(t);
            setSelected(null);
            if (t === 'highlight' && ink === DEFAULT_INK) setInk(HIGHLIGHT_INK);
          }}
          onColor={setInk}
          onUndo={undo}
          onDelete={deleteSelected}
          onSave={() => void savePdf()}
          onDiscard={() => {
            commitMarkup({});
            setSelected(null);
          }}
          onClose={() => {
            setAnnotating(false);
            setSelected(null);
          }}
          onSignature={() => {
            setSigDraft(null);
            setSigDialog(true);
          }}
          onExportXfdf={() => void exportXfdf()}
          onExportJson={() => downloadText(`${baseName}-annotations.json`, exportAnnotationsJson(markup), 'application/json')}
          onImport={(f) => void importFile(f)}
        />
      )}
      <Dialog open={sigDialog} onOpenChange={setSigDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a signature</DialogTitle>
            <DialogDescription>Draw or upload it, then click on a page to place it. It's kept in this browser.</DialogDescription>
          </DialogHeader>
          <SignaturePad idPrefix="reader-signature" onChange={setSigDraft} />
          <Button disabled={!sigDraft} onClick={() => void applySignature()}>
            Use signature
          </Button>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(open) => !open && setPendingImport(null)}
        title="Replace the current markup?"
        description="Importing replaces every mark on this document. You can undo it."
        confirmLabel="Replace"
        tone="destructive"
        onConfirm={() => {
          if (pendingImport) commitMarkup(pendingImport);
          setPendingImport(null);
        }}
      />
      {readAloud.status !== 'idle' && (
        <ReadAloudBar
          status={readAloud.status}
          page={readAloud.page}
          rate={readAloud.rate}
          onPause={readAloud.pause}
          onResume={readAloud.resume}
          onStop={readAloud.stop}
          onRate={readAloud.setRate}
        />
      )}
      {searchOpen && (
        <ReaderSearchBar
          query={query}
          caseSensitive={caseSensitive}
          wholeWord={wholeWord}
          state={search}
          pageCount={doc.numPages}
          current={Math.min(matchIndex, Math.max(0, search.total - 1))}
          onQuery={setQuery}
          onCaseSensitive={setCaseSensitive}
          onWholeWord={setWholeWord}
          onStep={step}
          onClose={() => setSearchOpen(false)}
        />
      )}
      <div className="flex min-h-0 flex-1">
        {panelOpen && (
          <div className="hidden md:flex">
            <ReaderSidePanel
              doc={doc}
              currentPage={page}
              filter={filter}
              tab={panelTab}
              outline={outline}
              bookmarks={bookmarks}
              onTab={setPanelTab}
              onSelect={goTo}
              onRenameBookmark={(p, label) => setBookmarks(renameBookmark(fp, p, label))}
              onRemoveBookmark={(p) => setBookmarks(removeBookmark(fp, p))}
            />
          </div>
        )}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="min-w-0 flex-1 overflow-auto bg-muted/50 px-4"
          style={{ paddingTop: PAGE_GAP, paddingBottom: PAGE_GAP }}
        >
          <div className="flex flex-col items-center" style={{ gap: PAGE_GAP }}>
            {sizes.map((size, i) => (
              <PageView
                key={i + 1}
                doc={doc}
                pageNumber={i + 1}
                scale={zoom}
                size={size}
                active={visible.has(i + 1)}
                filter={filter}
                highlights={highlights.get(i + 1)}
                overlay={
                  annotating || markup[i]?.length
                    ? (w, h) => (
                        <AnnotationLayer
                          width={w}
                          height={h}
                          annotations={markup[i] ?? []}
                          tool={annotating ? tool : null}
                          color={ink}
                          selectedId={selected?.page === i ? selected.id : null}
                          onAdd={(a) => addMark(i, a)}
                          onUpdate={(a) => updateMark(i, a)}
                          onSelect={(id) => {
                            moveStart.current = null;
                            setSelected(id ? { page: i, id } : null);
                          }}
                          pendingSignature={pendingSig}
                          signatureUrl={signatureUrl}
                        />
                      )
                    : undefined
                }
              />
            ))}
          </div>
        </div>
        {aiEnabled && aiOpen && (
          <AiPanel
            pageCount={doc.numPages}
            currentPage={page}
            title={title.replace(/\.pdf$/i, '')}
            getPageText={getPageText}
            getPageImage={(p) => pageImageForAi(doc, p)}
            onDownloadAs={async (fileName) => {
              const bytes = await doc.getData();
              const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
            onCite={goTo}
            onClose={() => setAiOpen(false)}
            onExtracted={saveExtraction}
          />
        )}
      </div>
    </div>
  );
};
