import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Copy, FileDown, Layers, LogIn, RotateCcw, Sparkles, Square, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { CitedText } from './CitedText';
import { useAuth } from '@/auth/useAuth';
import { useAiOp } from '@/hooks/useAiOp';
import { useAiQuota } from '@/hooks/useAiQuota';
import { createBackendProvider } from '@/lib/ai/backendProvider';
import { checkCost, estimateRun, formatTokens } from '@/lib/ai/cost';
import { parseList } from '@/lib/ai/parse';
import { collectAiText, getAiProvider, registerAiProvider, type AiOp, type AiPage, type AiRequest } from '@/lib/ai/provider';
import { AiRequestError, buildAiRequest, chunkForMapReduce, summariesAsPages } from '@/lib/ai/request';
import { AI_MAX_PAGES } from '@/lib/budgets';
import { humanizeJobFailure } from '@/lib/jobErrors';
import { toast } from '@/lib/toast';

// One backend provider for the whole web app (the app registers its own in
// app/_layout.tsx). Module scope: it carries the docRef cache across runs.
if (!getAiProvider()) registerAiProvider(createBackendProvider());

type ReadingOp = Extract<AiOp, 'summarize' | 'keyPoints' | 'explain' | 'actionItems'>;

const OPS: { op: ReadingOp; label: string }[] = [
  { op: 'summarize', label: 'Summarize' },
  { op: 'keyPoints', label: 'Key points' },
  { op: 'explain', label: 'Explain' },
  { op: 'actionItems', label: 'Action items' },
];

const LIST_OPS = new Set<AiOp>(['keyPoints', 'actionItems']);

type Scope = 'document' | 'page' | 'range';

interface AiPanelProps {
  pageCount: number;
  currentPage: number;
  title: string;
  getPageText: (page: number) => Promise<string>;
  onCite: (page: number) => void;
  onClose: () => void;
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

const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * The reader's AI side panel (the app's AiPanel, reading ops only): summary,
 * key points, explanation and action items over the PDF's text layer, with
 * page citations that jump the reader.
 *
 * Cost honesty, as in the app: each run is estimated the way the server
 * reserves it; a run the quota can't cover is refused up front with the reset
 * date, large or multi-part runs ask first, and over AI_MAX_PAGES the whole
 * document is only available as an explicit "summarize in parts".
 */
export const AiPanel = ({ pageCount, currentPage, title, getPageText, onCite, onClose }: AiPanelProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const quota = useAiQuota(isAuthenticated);
  const ai = useAiOp();
  const overBudget = pageCount > AI_MAX_PAGES;
  const [scope, setScope] = useState<Scope>(overBudget ? 'page' : 'document');
  const [range, setRange] = useState({ from: '1', to: String(Math.min(pageCount, AI_MAX_PAGES)) });
  const [lastOp, setLastOp] = useState<ReadingOp | null>(null);
  const [scopeLabel, setScopeLabel] = useState('');
  const [pending, setPending] = useState<{ message: string; go: () => void } | null>(null);
  const [parts, setParts] = useState<{ done: number; total: number } | null>(null);
  const [noText, setNoText] = useState(false);

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
            Summaries and key points run on Fyredocs servers, so they need an account.
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

  const scopePages = (): { from: number; to: number; label: string } | null => {
    if (scope === 'document') return { from: 1, to: pageCount, label: 'Whole document' };
    if (scope === 'page') return { from: currentPage, to: currentPage, label: `Page ${currentPage}` };
    const from = Number(range.from);
    const to = Number(range.to);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > pageCount || from > to) {
      toast.error(`Enter a page range between 1 and ${pageCount}.`);
      return null;
    }
    if (to - from + 1 > AI_MAX_PAGES) {
      toast.error(`AI reads up to ${AI_MAX_PAGES} pages at a time — pick a shorter range.`);
      return null;
    }
    return { from, to, label: from === to ? `Page ${from}` : `Pages ${from}–${to}` };
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

  const runOp = async (op: ReadingOp) => {
    const target = scopePages();
    if (!target) return;
    const pages = await collectPages(getPageText, target.from, target.to);
    if (pages.length === 0) {
      setNoText(true);
      return;
    }
    setNoText(false);
    let request: AiRequest;
    try {
      request = buildAiRequest(op, pages);
    } catch (err) {
      toast.error(err instanceof AiRequestError ? err.message : "Couldn't start that.");
      return;
    }
    gate([request], 1, async () => {
      setPending(null);
      setLastOp(op);
      setScopeLabel(target.label);
      await ai.run(request);
      refreshQuota();
    });
  };

  /** Explicit map-reduce over the page budget: summarize each part, then the summaries. */
  const summarizeInParts = async () => {
    const provider = getAiProvider();
    if (!provider) return;
    const pages = await collectPages(getPageText, 1, pageCount);
    if (pages.length === 0) {
      setNoText(true);
      return;
    }
    const chunks = chunkForMapReduce(pages);
    const requests = chunks.map((c) => buildAiRequest('summarize', c));
    gate(requests, chunks.length + 1, async () => {
      setPending(null);
      ai.reset();
      setLastOp('summarize');
      setScopeLabel('Whole document (in parts)');
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

  const running = ai.state.status === 'running' || parts !== null;
  const answer = ai.state.text;
  const opLabel = OPS.find((o) => o.op === lastOp)?.label ?? '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      toast.success('Copied to clipboard');
    } catch {
      toast.error("Couldn't copy the text.");
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
      <div className="space-y-3 whitespace-pre-wrap text-body-sm">
        <CitedText text={answer} pageCount={pageCount} onCite={onCite} />
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

        <div className="grid grid-cols-2 gap-2">
          {OPS.map(({ op, label }) => (
            <Button key={op} variant="outline" size="sm" disabled={running} onClick={() => void runOp(op)}>
              {label}
            </Button>
          ))}
          {overBudget && (
            <Button variant="outline" size="sm" className="col-span-2" disabled={running} onClick={() => void summarizeInParts()}>
              <Layers aria-hidden />
              Summarize whole document in parts
            </Button>
          )}
        </div>

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

        {noText && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <Text variant="body-sm">These pages have no text layer, so AI can't read them.</Text>
            <Button variant="link" size="sm" className="h-auto px-0" asChild>
              <Link to="/ocr">Make the PDF searchable with OCR first</Link>
            </Button>
          </div>
        )}

        {(lastOp || running) && (
          <section className="space-y-3 rounded-lg border p-3" aria-live="polite">
            <div className="flex items-center gap-2">
              <Text variant="body-sm" className="flex-1 font-medium">
                {opLabel} · {scopeLabel}
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
                {lastOp && (
                  <Button variant="outline" size="sm" onClick={() => void runOp(lastOp)}>
                    <RotateCcw aria-hidden />
                    Try again
                  </Button>
                )}
              </div>
            ) : (
              result()
            )}
            {ai.state.status === 'done' && answer && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => void copy()}>
                  <Copy aria-hidden />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={() => download(`${title} — ${opLabel}.txt`, answer)}>
                  <FileDown aria-hidden />
                  Download .txt
                </Button>
              </div>
            )}
          </section>
        )}

        {quota.data && (
          <Text variant="caption" tone="muted">
            {formatTokens(quota.data.remainingTokens)} AI tokens left this month · resets{' '}
            {format(new Date(quota.data.resetsAt), 'd MMM')}
          </Text>
        )}
      </div>
    </aside>
  );
};
