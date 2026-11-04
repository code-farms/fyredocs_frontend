// NOTE: ported from fyredocs_app/src/lib/ai/provider.ts — keep in sync.
/**
 * AI provider seam (Phase 23). Every AI feature talks to ONE interface; the
 * concrete adapter is the backend `ai-service` proxy (backendProvider.ts).
 * There is deliberately no on-device or bring-your-own-key adapter: a key in
 * an RN bundle or SecureStore is an extractable key, and the server is where
 * quota, prompt templates and caching live.
 *
 * Streaming-shaped from day one: every op returns an `AiStream` — an async
 * iterable of events plus cancel() — so a non-streaming transport is just a
 * stream that yields once.
 *
 * Capability + flag, the DESIGN.md pair: `aiAvailable()` is "a real adapter
 * is registered" (there is no native module to detect — onDevicePdfWriter's
 * precedent), and consumers ALSO check `isFlagEnabled('aiReading')`.
 */

export type AiOp =
  | 'summarize'
  | 'explain'
  | 'ask'
  | 'translate'
  | 'rewrite'
  | 'keyPoints'
  | 'actionItems'
  | 'notes'
  | 'flashcards';

export const AI_OPS: readonly AiOp[] = [
  'summarize',
  'explain',
  'ask',
  'translate',
  'rewrite',
  'keyPoints',
  'actionItems',
  'notes',
  'flashcards',
];

/** One page of document text; `index` is 0-based like everywhere in the app. */
export interface AiPage {
  index: number;
  text: string;
}

export interface AiTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** The wire request. Prompt templates are server-owned — the app sends
 *  inputs only, so the endpoint can't be used as a general LLM proxy. */
export interface AiRequest {
  op: AiOp;
  pages: AiPage[];
  /** ask: the current question. */
  question?: string;
  /** ask: prior turns, oldest first. */
  history?: AiTurn[];
  /** translate: BCP-47-ish language name or code. */
  targetLang?: string;
  /** rewrite: the passage to rewrite (pages give context). */
  passage?: string;
  /** Server-side cached document standing in for `pages` (backend adapter
   *  fills it; callers never set it). */
  docRef?: string;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
}

export type AiEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; usage?: AiUsage; docRef?: string }
  | { type: 'error'; code: string; message?: string };

export interface AiStream extends AsyncIterable<AiEvent> {
  cancel(): void;
}

export interface AiProvider {
  /** Diagnostic id ('backend', 'stub'). */
  readonly id: string;
  run(request: AiRequest): AiStream;
}

let registered: AiProvider | null = null;

export const registerAiProvider = (provider: AiProvider | null): void => {
  registered = provider;
};

export const getAiProvider = (): AiProvider | null => registered;

/** Capability half of the gate. The stub never counts as available. */
export const aiAvailable = (): boolean => registered !== null && registered.id !== 'stub';

/**
 * Build an AiStream from a push-style producer. The producer emits events
 * and resolves when finished; cancel() aborts its signal and ends iteration.
 * A producer throw becomes a terminal `error` event (code from `.code` when
 * present) — consumers handle one shape, never a rejected iterator.
 */
export const createAiStream = (
  producer: (emit: (event: AiEvent) => void, signal: AbortSignal) => Promise<void>,
): AiStream => {
  const controller = new AbortController();
  const queue: AiEvent[] = [];
  let finished = false;
  let wake: (() => void) | null = null;

  const notify = () => {
    const w = wake;
    wake = null;
    w?.();
  };
  const emit = (event: AiEvent) => {
    if (finished) return;
    queue.push(event);
    if (event.type !== 'delta') finished = true;
    notify();
  };

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    producer(emit, controller.signal)
      .then(() => emit({ type: 'done' }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const code = (err as { code?: unknown })?.code;
        emit({
          type: 'error',
          code: typeof code === 'string' && code ? code : 'AI_UNAVAILABLE',
          message: err instanceof Error ? err.message : undefined,
        });
      });
  };

  return {
    cancel() {
      if (finished) return;
      finished = true;
      controller.abort();
      notify();
    },
    async *[Symbol.asyncIterator]() {
      start();
      for (;;) {
        const next = queue.shift();
        if (next) {
          yield next;
          if (next.type !== 'delta') return;
          continue;
        }
        if (finished) return;
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }
    },
  };
};

/** Drain a stream to its full text — for ops whose UI parses the whole
 *  answer (lists, flashcards). Throws the error event as `{code}`. */
export const collectAiText = async (stream: AiStream): Promise<{ text: string; usage?: AiUsage }> => {
  let text = '';
  for await (const event of stream) {
    if (event.type === 'delta') text += event.text;
    else if (event.type === 'done') return { text, usage: event.usage };
    else throw Object.assign(new Error(event.message ?? event.code), { code: event.code });
  }
  return { text };
};
