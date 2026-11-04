// NOTE: ported from fyredocs_app/src/lib/ai/stubProvider.ts — keep in sync.
/**
 * Deterministic AiProvider for tests and render suites. Never counts toward
 * `aiAvailable()` — a stub registered in production would be a fake feature.
 */

import { createAiStream, type AiProvider, type AiRequest } from './provider';

export interface StubOptions {
  /** Text chunks to stream; default echoes the op and page count. */
  chunks?: (request: AiRequest) => string[];
  /** Fail with this code instead of answering. */
  failWith?: string;
}

export const createStubProvider = (options: StubOptions = {}): AiProvider & { calls: AiRequest[] } => {
  const calls: AiRequest[] = [];
  return {
    id: 'stub',
    calls,
    run(request) {
      calls.push(request);
      return createAiStream(async (emit, signal) => {
        if (options.failWith) throw Object.assign(new Error('stub failure'), { code: options.failWith });
        const chunks = options.chunks?.(request) ?? [`${request.op}:`, ` ${request.pages.length} pages`];
        for (const text of chunks) {
          if (signal.aborted) return;
          await Promise.resolve();
          emit({ type: 'delta', text });
        }
        emit({ type: 'done', usage: { inputTokens: 1, outputTokens: chunks.length, cachedTokens: 0 } });
      });
    },
  };
};
