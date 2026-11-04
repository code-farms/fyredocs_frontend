import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageView, type PageHighlight } from './PageView';
import { ReaderSearchBar } from './ReaderSearchBar';
import { ReaderSidePanel, type SidePanelTab } from './ReaderSidePanel';
import { ReaderToolbar } from './ReaderToolbar';
import { locateMatch, useDocSearch } from '@/hooks/useDocSearch';
import { findMatches } from '@/lib/docSearch';
import { rectsForRange } from '@/lib/pdf/oracle/oracleMath';
import {
  docFingerprint,
  pageSize,
  pageTextLayer,
  readOutline,
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

/** Highlight cap per page, as in the app: a one-letter query must not draw thousands of boxes. */
const MAX_HIGHLIGHTS_PER_PAGE = 200;
const SAVE_PAGE_DELAY_MS = 500;

interface ReaderViewProps {
  doc: PDFDocumentProxy;
  title: string;
  downloadUrl?: string;
}

export const ReaderView = ({ doc, title, downloadUrl }: ReaderViewProps) => {
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

  // Page sizes start from page 1 for every page; refined near the reader below.
  useEffect(() => {
    let cancelled = false;
    layers.current = new Map();
    pageSize(doc, 1)
      .then((first) => !cancelled && setSizes(Array.from({ length: doc.numPages }, () => first)))
      .catch(() => !cancelled && setSizes(Array.from({ length: doc.numPages }, () => ({ width: 612, height: 792 }))));
    readOutline(doc).then((o) => !cancelled && setOutline(o));
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
        onZoom={(dir) => setZoom((z) => stepZoom(z, dir))}
        onTheme={setTheme}
        onToggleThumbs={() => setPanelOpen((o) => !o)}
      />
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
