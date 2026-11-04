// NOTE: ported from fyredocs_app/src/lib/ai/backendProvider.ts — keep in sync.
/**
 * The real AiProvider: the backend `ai-service` proxy (Phase 23). One POST
 * per op to /api/ai/ops/:op, streamed as SSE through `apiStream`.
 *
 * docRef reuse: the server returns a `docRef` for every document it has
 * seen; the next request on the SAME pages sends that ref instead of
 * re-uploading up to ~1 MiB of text — what makes a multi-turn Ask cheap on a
 * phone, and what keeps the prompt prefix byte-identical for provider
 * caching. Refs are remembered per page-list fingerprint in a small LRU.
 * A 410 AI_DOCUMENT_EXPIRED (TTL, eviction, server restart) is retried once
 * with the pages — invisible to the user.
 */

import { ApiHttpError, apiStream } from '@/lib/apiClient';

import { createAiStream, type AiEvent, type AiPage, type AiProvider, type AiRequest, type AiUsage } from './provider';

const EXPIRED = 'AI_DOCUMENT_EXPIRED';
const REF_CACHE_SIZE = 16;

type Streamer = typeof apiStream;

/** FNV-1a over the page list — a cheap, stable key for "same document". */
export const pagesFingerprint = (pages: AiPage[]): string => {
  let h = 0x811c9dc5;
  const feed = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  };
  for (const p of pages) {
    feed(String(p.index));
    feed('\u0000');
    feed(p.text);
    feed('\u0001');
  }
  return `${pages.length}:${h.toString(16)}`;
};

/** Wire frame → AiEvent; anything unrecognised is dropped (null). Also
 *  accepts the JSON envelope the server sends without SSE. */
export const parseWireEvent = (raw: unknown): AiEvent[] | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.type === 'delta' && typeof o.text === 'string') return [{ type: 'delta', text: o.text }];
  if (o.type === 'done') {
    return [{ type: 'done', usage: usageOf(o.usage), docRef: typeof o.docRef === 'string' ? o.docRef : undefined }];
  }
  if (o.type === 'error' && typeof o.code === 'string') {
    return [{ type: 'error', code: o.code, message: typeof o.message === 'string' ? o.message : undefined }];
  }
  if (o.success === true && typeof o.data === 'object' && o.data !== null) {
    const d = o.data as Record<string, unknown>;
    if (typeof d.text !== 'string') return null;
    return [
      { type: 'delta', text: d.text },
      { type: 'done', usage: usageOf(d.usage), docRef: typeof d.docRef === 'string' ? d.docRef : undefined },
    ];
  }
  return null;
};

const usageOf = (u: unknown): AiUsage | undefined => {
  if (typeof u !== 'object' || u === null) return undefined;
  const o = u as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return { inputTokens: n(o.inputTokens), outputTokens: n(o.outputTokens), cachedTokens: n(o.cachedTokens) };
};

export const createBackendProvider = (stream: Streamer = apiStream): AiProvider & { forgetRefs(): void } => {
  const refs = new Map<string, string>();

  const remember = (key: string, ref: string) => {
    refs.delete(key);
    refs.set(key, ref);
    while (refs.size > REF_CACHE_SIZE) refs.delete(refs.keys().next().value as string);
  };

  return {
    id: 'backend',
    forgetRefs: () => refs.clear(),
    run(request: AiRequest) {
      return createAiStream(async (emit, signal) => {
        const key = request.pages.length > 0 ? pagesFingerprint(request.pages) : null;
        const send = async (useRef: boolean): Promise<void> => {
          const ref = useRef && key ? refs.get(key) : undefined;
          const body: AiRequest = ref ? { ...request, pages: [], docRef: ref } : { ...request };
          delete (body as { op?: string }).op;
          let terminal: AiEvent | null = null;
          await stream(
            `/api/ai/ops/${encodeURIComponent(request.op)}`,
            body,
            (raw) => {
              for (const event of parseWireEvent(raw) ?? []) {
                if (event.type === 'done' && event.docRef && key) remember(key, event.docRef);
                if (event.type !== 'delta') terminal = event;
                emit(event);
              }
            },
            signal,
          );
          if (!terminal && !signal.aborted) emit({ type: 'done' });
        };
        try {
          await send(true);
        } catch (err) {
          if (err instanceof ApiHttpError && err.code === EXPIRED && key) {
            refs.delete(key);
            await send(false);
            return;
          }
          throw err;
        }
      });
    },
  };
};
