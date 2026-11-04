import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Copy, FileDown, GraduationCap, Layers, LogIn, PenLine, RotateCcw, ScanSearch, Sparkles, Square, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import { AskChat } from './AskChat';
import { DetailsCard } from './DetailsCard';
import { CitedText } from './CitedText';
import { RewriteDialog } from './RewriteDialog';
import { useAuth } from '@/auth/useAuth';
import { useAiOp } from '@/hooks/useAiOp';
import { useAiQuota } from '@/hooks/useAiQuota';
import { createBackendProvider } from '@/lib/ai/backendProvider';
import { checkCost, estimateRun, formatTokens } from '@/lib/ai/cost';
import { flashcardsToMarkdown, parseFlashcards, parseList } from '@/lib/ai/parse';
import { collectAiText, getAiProvider, registerAiProvider, type AiOp, type AiPage, type AiRequest } from '@/lib/ai/provider';
import { AiRequestError, buildAiRequest, chunkForMapReduce, summariesAsPages } from '@/lib/ai/request';
import { translationForDisplay } from '@/lib/ai/translation';
import { ExtractionError, requestExtraction } from '@/lib/ai/extractRun';
import type { Extraction } from '@/lib/ai/extraction';
import { estimateTranscribe, TRANSCRIBE_MAX_PAGES, transcribePages } from '@/lib/ai/transcribe';
import { ApiHttpError } from '@/lib/apiClient';
import { AI_MAX_PAGES } from '@/lib/budgets';
import { humanizeJobFailure } from '@/lib/jobErrors';
import { toast } from '@/lib/toast';
import type { FlashcardsState } from '@/pages/FlashcardsPage';

// One backend provider for the whole web app (the app registers its own in
// app/_layout.tsx). Module scope: it carries the docRef cache across runs.
if (!getAiProvider()) registerAiProvider(createBackendProvider());

type DocOp = Exclude<AiOp, 'ask' | 'rewrite'>;

const OPS: { op: DocOp; label: string }[] = [
  { op: 'summarize', label: 'Summarize' },
  { op: 'keyPoints', label: 'Key points' },
  { op: 'explain', label: 'Explain' },
  { op: 'actionItems', label: 'Action items' },
  { op: 'notes', label: 'Study notes' },
  { op: 'flashcards', label: 'Flashcards' },
  { op: 'translate', label: 'Translate…' },
];

const LIST_OPS = new Set<AiOp>(['keyPoints', 'actionItems']);

/** Same list as the app's AiPanel; anything else via "Other…". */
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Bengali', 'Chinese', 'Japanese'];
const OTHER = '__other';
/** ai-service caps targetLang at 40 characters. */
const MAX_LANG = 40;

type Scope = 'document' | 'page' | 'range';

interface AiPanelProps {
  pageCount: number;
  currentPage: number;
  title: string;
  getPageText: (page: number) => Promise<string>;
  /** Page (1-based) as an AI-sized JPEG data URL; null when it can't be rendered. */
  getPageImage: (page: number) => Promise<string | null>;
  onCite: (page: number) => void;
  onClose: () => void;
  /** Downloads the PDF under another name (the extraction's suggested title). */
  onDownloadAs?: (fileName: string) => void;
}

/** Pages [from..to] (1-based) as AI pages (0-based index), blank pages dropped. */
const collectPages = async (getPageText: AiPanelProps['getPageText'], from: number, to: number): Promise<AiPage[]> => {
  const out: AiPage[] = [];
  for (let p = from; p <= to; p++) {
    const text = (await getPageText(p).catch(() => '')).trim();
    if (text) out.push({ index: p - 1, text });
  }
  return out;
};

const download = (name: string, text: string, type = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * The reader's AI side panel (the app's AiPanel): reading ops, Ask,
 * flashcards, translation and Simplify over the PDF's text layer, with page
 * citations that jump the reader.
 *
 * Cost honesty, as in the app: each run is estimated the way the server
 * reserves it; a run the quota can't cover is refused up front with the reset
 * date, large or multi-part runs ask first, and over AI_MAX_PAGES the whole
 * document is only available as an explicit "summarize in parts".
 */
export const AiPanel = ({
  pageCount,
  currentPage,
  title,
  getPageText,
  getPageImage,
  onCite,
  onClose,
  onDownloadAs,
}: AiPanelProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const quota = useAiQuota(isAuthenticated);
  const ai = useAiOp();
  const overBudget = pageCount > AI_MAX_PAGES;
  const [scope, setScope] = useState<Scope>(overBudget ? 'page' : 'document');
  const [range, setRange] = useState({ from: '1', to: String(Math.min(pageCount, AI_MAX_PAGES)) });
  const [lastOp, setLastOp] = useState<DocOp | null>(null);
  const [resultLabel, setResultLabel] = useState('');
  const [pending, setPending] = useState<{ message: string; go: () => void } | null>(null);
  const [parts, setParts] = useState<{ done: number; total: number } | null>(null);
  const [noText, setNoText] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState('Hindi');
  const [otherLang, setOtherLang] = useState('');
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [transcribing, setTranscribing] = useState<{ done: number; total: number } | null>(null);
  const [transcript, setTranscript] = useState<{ page: number; text: string }[] | null>(null);
  const [transcribeLang, setTranscribeLang] = useState('');

  const header = (
    <div className="flex items-center gap-2 border-b px-4 py-3">
      <Sparkles className="h-4 w-4 text-primary" aria-hidden />
      <h2 className="flex-1 font-semibold">AI assistant</h2>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close AI assistant">
        <X aria-hidden />
      </Button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <aside className="flex w-full flex-col border-l bg-card md:w-96" aria-label="AI assistant">
        {header}
        <div className="space-y-3 p-6 text-center">
          <Text>Sign in to use AI</Text>
          <Text variant="body-sm" tone="muted">
            Summaries, questions and notes run on Fyredocs servers, so they need an account.
          </Text>
          <Button asChild>
            <Link to="/signin">
              <LogIn aria-hidden />
              Sign in
            </Link>
          </Button>
        </div>
      </aside>
    );
  }

  const refreshQuota = () => void queryClient.invalidateQueries({ queryKey: ['ai', 'quota'] });

  /** The chosen scope as a page span, or null after telling the user why not. */
  const scopeRange = (max = AI_MAX_PAGES): { from: number; to: number; label: string } | null => {
    let from = 1;
    let to = pageCount;
    let label = 'Whole document';
    if (scope === 'page') {
      from = to = currentPage;
      label = `Page ${currentPage}`;
    } else if (scope === 'range') {
      from = Number(range.from);
      to = Number(range.to);
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > pageCount || from > to) {
        toast.error(`Enter a page range between 1 and ${pageCount}.`);
        return null;
      }
      label = from === to ? `Page ${from}` : `Pages ${from}–${to}`;
    }
    if (to - from + 1 > max) {
      toast.error(`AI reads up to ${max} pages at a time — pick a shorter range.`);
      return null;
    }
    return { from, to, label };
  };

  /** The chosen scope's pages, or null after telling the user why not. */
  const scopePages = async (): Promise<{ pages: AiPage[]; label: string } | null> => {
    const span = scopeRange();
    if (!span) return null;
    const { from, to, label } = span;
    const pages = await collectPages(getPageText, from, to);
    setNoText(pages.length === 0);
    return pages.length ? { pages, label } : null;
  };

  /** Cost gate; `go` runs immediately or after the inline confirmation. */
  const gate = (requests: AiRequest[], calls: number, go: () => void) => {
    const c = checkCost(estimateRun(requests), quota.data, calls);
    if (c.kind === 'insufficient') {
      toast.error(
        `Not enough AI quota left this month — this needs about ${formatTokens(c.estimate)} tokens and ${formatTokens(
          c.remaining
        )} remain. It resets ${format(new Date(c.resetsAt), 'd MMM')}.`
      );
      return;
    }
    if (c.kind === 'confirm') {
      const left = c.remaining !== undefined ? ` of the ${formatTokens(c.remaining)} you have left this month` : '';
      setPending({
        message: `${calls > 1 ? `This runs ${calls} AI requests and uses` : 'This uses'} up to about ${formatTokens(c.estimate)} tokens${left}.`,
        go,
      });
      return;
    }
    go();
  };

  const runOp = async (op: DocOp, targetLang?: string) => {
    const target = await scopePages();
    if (!target) return;
    let request: AiRequest;
    try {
      request = buildAiRequest(op, target.pages, { targetLang });
    } catch (err) {
      toast.error(err instanceof AiRequestError ? err.message : "Couldn't start that.");
      return;
    }
    gate([request], 1, async () => {
      setPending(null);
      setLangOpen(false);
      setLastOp(op);
      setResultLabel(targetLang ? `${target.label} → ${targetLang}` : target.label);
      await ai.run(request);
      refreshQuota();
    });
  };

  const translate = () => {
    const target = (lang === OTHER ? otherLang : lang).trim().slice(0, MAX_LANG);
    if (!target) {
      toast.error('Enter a language to translate into.');
      return;
    }
    void runOp('translate', target);
  };

  /** Explicit map-reduce over the page budget: summarize each part, then the summaries. */
  const summarizeInParts = async () => {
    const provider = getAiProvider();
    if (!provider) return;
    const pages = await collectPages(getPageText, 1, pageCount);
    setNoText(pages.length === 0);
    if (pages.length === 0) return;
    const chunks = chunkForMapReduce(pages);
    const requests = chunks.map((c) => buildAiRequest('summarize', c));
    gate(requests, chunks.length + 1, async () => {
      setPending(null);
      ai.reset();
      setLastOp('summarize');
      setResultLabel('Whole document (in parts)');
      setParts({ done: 0, total: chunks.length });
      const summaries: string[] = [];
      for (let i = 0; i < requests.length; i++) {
        try {
          summaries.push((await collectAiText(provider.run(requests[i]))).text);
        } catch (err) {
          toast.error(humanizeJobFailure((err as { code?: string }).code, undefined));
          setParts(null);
          refreshQuota();
          return;
        }
        setParts({ done: i + 1, total: chunks.length });
      }
      setParts(null);
      await ai.run(buildAiRequest('summarize', summariesAsPages(chunks, summaries)));
      refreshQuota();
    });
  };

  const aiError = (err: unknown) =>
    err instanceof ExtractionError ? err.message : humanizeJobFailure(err instanceof ApiHttpError ? err.code : undefined, undefined);

  /** Type, fields and tables from the first pages' text plus a picture of page 1. */
  const detect = async () => {
    setExtracting(true);
    try {
      const [pages, image] = await Promise.all([
        collectPages(getPageText, 1, Math.min(pageCount, AI_MAX_PAGES)),
        getPageImage(1),
      ]);
      setExtraction(await requestExtraction(pages, image ? [image] : []));
      refreshQuota();
    } catch (err) {
      toast.error(aiError(err));
    } finally {
      setExtracting(false);
    }
  };

  /** Handwriting/scans: page pictures → text through the vision model. */
  const transcribe = () => {
    const span = scopeRange(TRANSCRIBE_MAX_PAGES);
    if (!span) return;
    const pageList = Array.from({ length: span.to - span.from + 1 }, (_, i) => span.from + i);
    const estimate = estimateTranscribe(pageList.length);
    const go = async () => {
      setPending(null);
      setTranscript(null);
      setTranscribing({ done: 0, total: pageList.length });
      try {
        const out = await transcribePages(pageList, {
          render: getPageImage,
          language: transcribeLang || undefined,
          onProgress: (done, total) => setTranscribing({ done, total }),
        });
        setTranscript(out);
      } catch (err) {
        toast.error(aiError(err));
      } finally {
        setTranscribing(null);
        refreshQuota();
      }
    };
    const c = checkCost(estimate, quota.data, Math.ceil(pageList.length / 2));
    if (c.kind === 'insufficient') {
      toast.error(`Not enough AI quota left this month — it resets ${format(new Date(c.resetsAt), 'd MMM')}.`);
      return;
    }
    if (c.kind === 'confirm') {
      setPending({ message: `Transcribing ${pageList.length} pages uses up to about ${formatTokens(estimate)} tokens.`, go });
      return;
    }
    void go();
  };

  const transcriptText = transcript?.map((t) => `Page ${t.page}\n${t.text || '(nothing readable)'}`).join('\n\n') ?? '';

  const running = ai.state.status === 'running' || parts !== null;
  const answer = ai.state.text;
  const opLabel = OPS.find((o) => o.op === lastOp)?.label.replace('…', '') ?? '';
  const cards = lastOp === 'flashcards' && ai.state.status === 'done' ? parseFlashcards(answer) : [];
  const shownText = lastOp === 'translate' ? translationForDisplay(answer) : answer;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shownText);
      toast.success('Copied to clipboard');
    } catch {
      toast.error("Couldn't copy the text.");
    }
  };

  const saveFile = () => {
    if (lastOp === 'flashcards') {
      download(`${title} — Flashcards.md`, flashcardsToMarkdown(title, cards), 'text/markdown');
    } else {
      download(`${title} — ${lastOp === 'translate' ? resultLabel.split('→ ')[1] ?? opLabel : opLabel}.txt`, shownText);
    }
  };

  const result = () => {
    if (parts) {
      return (
        <Text tone="muted" aria-live="polite">
          Summarizing part {Math.min(parts.done + 1, parts.total)} of {parts.total}…
        </Text>
      );
    }
    if (running && !answer) return <Text tone="muted">Reading the document…</Text>;
    if (lastOp === 'flashcards') {
      if (running) return <Text tone="muted">Writing flashcards…</Text>;
      return cards.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Text variant="body-sm" className="flex-1">
            {cards.length} flashcards ready.
          </Text>
          <Button
            size="sm"
            onClick={() => navigate('/ai/flashcards', { state: { title, cards } satisfies FlashcardsState })}
          >
            <GraduationCap aria-hidden />
            Review
          </Button>
        </div>
      ) : (
        <Text tone="muted">No flashcards came back — try again or pick different pages.</Text>
      );
    }
    if (lastOp && LIST_OPS.has(lastOp) && ai.state.status === 'done') {
      const items = parseList(answer);
      return items.length === 0 ? (
        <Text tone="muted">Nothing came back — try a different page range.</Text>
      ) : (
        <ul className="list-disc space-y-2 pl-5 text-body-sm">
          {items.map((item, i) => (
            <li key={i}>
              <CitedText text={item} pageCount={pageCount} onCite={onCite} />
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="whitespace-pre-wrap text-body-sm">
        {lastOp === 'translate' ? shownText : <CitedText text={answer} pageCount={pageCount} onCite={onCite} />}
      </div>
    );
  };

  return (
    <aside className="flex w-full flex-col border-l bg-card md:w-96" aria-label="AI assistant">
      {header}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div className="space-y-2">
          <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <SelectTrigger aria-label="Pages to read">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="document" disabled={overBudget}>
                Whole document{overBudget ? ` (over ${AI_MAX_PAGES} pages)` : ''}
              </SelectItem>
              <SelectItem value="page">This page ({currentPage})</SelectItem>
              <SelectItem value="range">Page range…</SelectItem>
            </SelectContent>
          </Select>
          {scope === 'range' && (
            <div className="flex items-center gap-2">
              <Input
                aria-label="From page"
                inputMode="numeric"
                className="h-8 w-20"
                value={range.from}
                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              />
              <Text variant="body-sm" tone="muted" as="span">
                to
              </Text>
              <Input
                aria-label="To page"
                inputMode="numeric"
                className="h-8 w-20"
                value={range.to}
                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              />
            </div>
          )}
          {overBudget && (
            <Text variant="caption" tone="muted">
              AI reads up to {AI_MAX_PAGES} pages at a time. Pick a range, or summarize the whole document in parts.
            </Text>
          )}
        </div>

        {noText && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <Text variant="body-sm">These pages have no text layer, so AI can't read them.</Text>
            <Button variant="link" size="sm" className="h-auto px-0" asChild>
              <Link to="/ocr">Make the PDF searchable with OCR first</Link>
            </Button>
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
              <Text variant="body-sm" className="w-full">
                Handwritten? AI can read the page pictures (up to {TRANSCRIBE_MAX_PAGES} pages).
              </Text>
              <Select value={transcribeLang || 'auto'} onValueChange={(v) => setTranscribeLang(v === 'auto' ? '' : v)}>
                <SelectTrigger className="h-8 w-40" aria-label="Handwriting language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Detect language</SelectItem>
                  <SelectItem value="eng">English</SelectItem>
                  <SelectItem value="hin">Hindi</SelectItem>
                  <SelectItem value="eng+hin">English + Hindi</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" disabled={transcribing !== null} onClick={transcribe}>
                <PenLine aria-hidden />
                Transcribe with AI
              </Button>
            </div>
          </div>
        )}

        {transcribing && (
          <Text variant="body-sm" tone="muted" aria-live="polite">
            Transcribing page {Math.min(transcribing.done + 1, transcribing.total)} of {transcribing.total}…
          </Text>
        )}
        {transcript && (
          <section className="space-y-2 rounded-lg border p-3" aria-label="Transcription">
            <Text variant="body-sm" className="font-medium">
              Transcription
            </Text>
            <div className="whitespace-pre-wrap text-body-sm">{transcriptText}</div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  void navigator.clipboard.writeText(transcriptText).then(
                    () => toast.success('Copied to clipboard'),
                    () => toast.error("Couldn't copy the text.")
                  )
                }
              >
                <Copy aria-hidden />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => download(`${title} — Transcription.txt`, transcriptText)}>
                <FileDown aria-hidden />
                Download .txt
              </Button>
            </div>
          </section>
        )}

        <Tabs defaultValue="document">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="ask">Ask</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {OPS.map(({ op, label }) => (
                <Button
                  key={op}
                  variant={lastOp === op ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={running}
                  onClick={() => (op === 'translate' ? setLangOpen((o) => !o) : void runOp(op))}
                >
                  {label}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled={running} onClick={() => setRewriteOpen(true)}>
                <Wand2 aria-hidden />
                Simplify text…
              </Button>
              {overBudget && (
                <Button variant="outline" size="sm" className="col-span-2" disabled={running} onClick={() => void summarizeInParts()}>
                  <Layers aria-hidden />
                  Summarize whole document in parts
                </Button>
              )}
            </div>

            {langOpen && (
              <div className="space-y-2 rounded-lg border p-3">
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger aria-label="Translate into">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER}>Other…</SelectItem>
                  </SelectContent>
                </Select>
                {lang === OTHER && (
                  <Input
                    aria-label="Other language"
                    placeholder="e.g. Marathi"
                    maxLength={MAX_LANG}
                    value={otherLang}
                    onChange={(e) => setOtherLang(e.target.value)}
                  />
                )}
                <Button size="sm" onClick={translate} disabled={running}>
                  Translate
                </Button>
              </div>
            )}

            {pending && (
              <div role="alertdialog" aria-label="Confirm AI request" className="space-y-3 rounded-lg border bg-muted/50 p-3">
                <Text variant="body-sm">{pending.message}</Text>
                <div className="flex gap-2">
                  <Button size="sm" onClick={pending.go}>
                    Run
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {(lastOp || running) && (
              <section className="space-y-3 rounded-lg border p-3" aria-live="polite">
                <div className="flex items-center gap-2">
                  <Text variant="body-sm" className="flex-1 font-medium">
                    {opLabel} · {resultLabel}
                  </Text>
                  {running && (
                    <Button variant="ghost" size="sm" onClick={ai.stop}>
                      <Square aria-hidden />
                      Stop
                    </Button>
                  )}
                </div>
                {ai.state.status === 'error' ? (
                  <div className="space-y-2">
                    <Text variant="body-sm" className="text-destructive">
                      {ai.state.error}
                    </Text>
                    {lastOp && lastOp !== 'translate' && (
                      <Button variant="outline" size="sm" onClick={() => void runOp(lastOp)}>
                        <RotateCcw aria-hidden />
                        Try again
                      </Button>
                    )}
                  </div>
                ) : (
                  result()
                )}
                {ai.state.status === 'done' && answer && (lastOp !== 'flashcards' || cards.length > 0) && (
                  <div className="flex gap-2">
                    {lastOp !== 'flashcards' && (
                      <Button variant="ghost" size="sm" onClick={() => void copy()}>
                        <Copy aria-hidden />
                        Copy
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={saveFile}>
                      <FileDown aria-hidden />
                      {lastOp === 'flashcards' ? 'Download .md' : 'Download .txt'}
                    </Button>
                  </div>
                )}
              </section>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-3">
            {extraction ? (
              <DetailsCard extraction={extraction} docName={title} onDownloadAs={onDownloadAs} />
            ) : (
              <Text variant="body-sm" tone="muted">
                Detect the document type — invoice, receipt, ID, business card, form, statement… — and pull out names,
                dates, totals and tables.
              </Text>
            )}
            <Button variant={extraction ? 'ghost' : 'outline'} size="sm" disabled={extracting} onClick={() => void detect()}>
              <ScanSearch aria-hidden />
              {extracting ? 'Detecting…' : extraction ? 'Re-detect' : 'Detect details'}
            </Button>
          </TabsContent>

          <TabsContent value="ask">
            <AskChat
              getPages={() => scopePages().then((t) => t?.pages ?? null)}
              pageCount={pageCount}
              onCite={onCite}
            />
          </TabsContent>
        </Tabs>

        {quota.data && (
          <Text variant="caption" tone="muted">
            {formatTokens(quota.data.remainingTokens)} AI tokens left this month · resets{' '}
            {format(new Date(quota.data.resetsAt), 'd MMM')}
          </Text>
        )}
      </div>
      <RewriteDialog open={rewriteOpen} onOpenChange={setRewriteOpen} />
    </aside>
  );
};
