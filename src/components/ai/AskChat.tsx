import { useState } from 'react';
import { RotateCcw, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Text } from '@/components/ui/typography';
import { CitedText } from './CitedText';
import { useAiOp } from '@/hooks/useAiOp';
import type { AiPage, AiTurn } from '@/lib/ai/provider';
import { AiRequestError, buildAiRequest, trimHistory } from '@/lib/ai/request';
import { toast } from '@/lib/toast';

/** Server limit for a question (ai-service internal/ops maxQuestionChars). */
const MAX_QUESTION = 2000;

/**
 * Multi-turn "Ask about this document" (the app's AskChat). History is in
 * memory only — a conversation is a reading aid, not a record. Each turn
 * sends prior turns trimmed to the server's limits; the backend provider
 * swaps the pages for the cached docRef after the first turn. Only completed
 * exchanges join the history, so a failed or stopped answer never becomes
 * context for the next question.
 */
export const AskChat = ({
  getPages,
  pageCount,
  onCite,
}: {
  /** Pages for the current scope; null when they can't be sent (the caller explains why). */
  getPages: () => Promise<AiPage[] | null>;
  pageCount: number;
  onCite: (page: number) => void;
}) => {
  const ai = useAiOp();
  const [turns, setTurns] = useState<AiTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const running = ai.state.status === 'running';

  const ask = async (question: string) => {
    const pages = await getPages();
    if (!pages) return;
    let request;
    try {
      request = buildAiRequest('ask', pages, { question, history: trimHistory(turns) });
    } catch (err) {
      toast.error(err instanceof AiRequestError ? err.message : "Couldn't ask that.");
      return;
    }
    setPending(question);
    setDraft('');
    const result = await ai.run(request);
    if (result.status === 'done' && result.text.trim()) {
      setTurns((prev) => [...prev, { role: 'user', text: question }, { role: 'assistant', text: result.text }]);
      setPending(null);
      ai.reset();
    }
  };

  const send = () => {
    const q = draft.trim();
    if (q && !running) void ask(q);
  };

  const bubbleUser = 'ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-3 py-2 text-body-sm text-primary-foreground';
  const bubbleAi = 'max-w-[95%] whitespace-pre-wrap rounded-2xl bg-muted px-3 py-2 text-body-sm';

  return (
    <div className="space-y-3">
      {turns.length === 0 && !pending && (
        <Text variant="body-sm" tone="muted">
          Ask anything about this document — answers cite the pages they come from.
        </Text>
      )}

      {turns.map((t, i) =>
        t.role === 'user' ? (
          <div key={i} className={bubbleUser}>
            {t.text}
          </div>
        ) : (
          <div key={i} className={bubbleAi}>
            <CitedText text={t.text} pageCount={pageCount} onCite={onCite} />
          </div>
        )
      )}

      {pending && (
        <>
          <div className={bubbleUser}>{pending}</div>
          <div className={bubbleAi} aria-live="polite">
            {ai.state.text ? (
              <CitedText text={ai.state.text} pageCount={pageCount} />
            ) : running ? (
              <Text variant="body-sm" tone="muted" as="span">
                Thinking…
              </Text>
            ) : null}
            {ai.state.status === 'error' && (
              <Text variant="body-sm" className="mt-1 text-destructive">
                {ai.state.error}
              </Text>
            )}
          </div>
          {!running && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void ask(pending)}>
                <RotateCcw aria-hidden />
                Try again
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPending(null);
                  ai.reset();
                }}
              >
                Discard
              </Button>
            </div>
          )}
        </>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask a question…"
          aria-label="Question about this document"
          maxLength={MAX_QUESTION}
          disabled={running}
          rows={2}
          className="min-h-0 flex-1 resize-none"
        />
        {running ? (
          <Button variant="ghost" size="icon" onClick={ai.stop} aria-label="Stop answering">
            <Square aria-hidden />
          </Button>
        ) : (
          <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Send question">
            <Send aria-hidden />
          </Button>
        )}
      </div>
      {turns.length > 0 && !running && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTurns([]);
            setPending(null);
            ai.reset();
          }}
        >
          New conversation
        </Button>
      )}
    </div>
  );
};
