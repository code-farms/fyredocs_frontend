// NOTE: ported from fyredocs_app/src/hooks/useAiOp.ts — keep in sync.
import { useCallback, useEffect, useRef, useState } from 'react';

import { getAiProvider, type AiRequest, type AiStream, type AiUsage } from '@/lib/ai/provider';
import { humanizeJobFailure } from '@/lib/jobErrors';

/**
 * Runs one AI op at a time and exposes its streaming text (Phase 23).
 *
 * Deltas are coalesced into one state update per FLUSH_MS: a model streams
 * dozens of tiny chunks per second, and a re-render per chunk stutters long
 * answers on low-end Android. Starting a new run cancels the previous one;
 * unmounting cancels whatever is in flight, so a closed sheet stops spending
 * the user's quota.
 */

const FLUSH_MS = 60;

export type AiOpStatus = 'idle' | 'running' | 'done' | 'error';

export interface AiOpState {
  status: AiOpStatus;
  text: string;
  usage?: AiUsage;
  /** Human sentence for an error (humanizeJobFailure over the code). */
  error?: string;
  errorCode?: string;
}

const IDLE: AiOpState = { status: 'idle', text: '' };

export const useAiOp = () => {
  const [state, setState] = useState<AiOpState>(IDLE);
  const streamRef = useRef<AiStream | null>(null);
  const runIdRef = useRef(0);

  const cancel = useCallback(() => {
    streamRef.current?.cancel();
    streamRef.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const run = useCallback(
    async (request: AiRequest): Promise<AiOpState> => {
      cancel();
      const provider = getAiProvider();
      if (!provider) {
        const s: AiOpState = { status: 'error', text: '', errorCode: 'AI_UNAVAILABLE', error: humanizeJobFailure('AI_UNAVAILABLE', undefined) };
        setState(s);
        return s;
      }
      const runId = ++runIdRef.current;
      const stream = provider.run(request);
      streamRef.current = stream;
      setState({ status: 'running', text: '' });

      let text = '';
      let timer: ReturnType<typeof setTimeout> | null = null;
      const flush = () => {
        timer = null;
        if (runIdRef.current === runId) setState((prev) => ({ ...prev, text }));
      };

      let final: AiOpState = { status: 'done', text: '' };
      for await (const event of stream) {
        if (event.type === 'delta') {
          text += event.text;
          if (!timer) timer = setTimeout(flush, FLUSH_MS);
        } else if (event.type === 'done') {
          final = { status: 'done', text, usage: event.usage };
        } else {
          final = { status: 'error', text, errorCode: event.code, error: humanizeJobFailure(event.code, undefined) };
        }
      }
      if (timer) clearTimeout(timer);
      // Cancelled (or superseded) runs end silently: the caller moved on.
      if (runIdRef.current !== runId || streamRef.current !== stream) return final;
      streamRef.current = null;
      setState(final);
      return final;
    },
    [cancel],
  );

  const stop = useCallback(() => {
    cancel();
    setState((prev) => (prev.status === 'running' ? { ...prev, status: 'done' } : prev));
  }, [cancel]);

  const reset = useCallback(() => {
    cancel();
    runIdRef.current++;
    setState(IDLE);
  }, [cancel]);

  return { state, run, stop, reset };
};
