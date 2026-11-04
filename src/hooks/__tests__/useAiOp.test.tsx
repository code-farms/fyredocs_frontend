// NOTE: ported from fyredocs_app/src/hooks/__tests__/useAiOp.test.tsx — keep in sync.
import { describe, it, expect, vi, afterEach } from 'vitest';
/**
 * Pins the AI op hook (Phase 23): streamed deltas coalesce into the final
 * text, errors become the jobErrors sentence, a missing provider fails
 * honestly, and unmounting cancels the in-flight stream.
 */
import { act, renderHook, waitFor } from '@testing-library/react';

import { createAiStream, registerAiProvider } from '@/lib/ai/provider';
import { createStubProvider } from '@/lib/ai/stubProvider';
import { useAiOp } from '@/hooks/useAiOp';

afterEach(() => registerAiProvider(null));

describe('useAiOp', () => {
  it('streams to done with the full text and usage', async () => {
    registerAiProvider(createStubProvider({ chunks: () => ['Hel', 'lo'] }));
    const { result } = renderHook(() => useAiOp());
    await act(async () => {
      await result.current.run({ op: 'summarize', pages: [] });
    });
    expect(result.current.state).toMatchObject({ status: 'done', text: 'Hello', usage: { outputTokens: 2 } });
  });

  it('maps an error code to its sentence', async () => {
    registerAiProvider(createStubProvider({ failWith: 'AI_REQUEST_TOO_LARGE' }));
    const { result } = renderHook(() => useAiOp());
    await act(async () => {
      await result.current.run({ op: 'notes', pages: [] });
    });
    expect(result.current.state).toMatchObject({
      status: 'error',
      errorCode: 'AI_REQUEST_TOO_LARGE',
      error: 'That document is too large for an AI request — try fewer pages.',
    });
  });

  it('fails honestly with no provider registered', async () => {
    const { result } = renderHook(() => useAiOp());
    await act(async () => {
      await result.current.run({ op: 'notes', pages: [] });
    });
    expect(result.current.state.errorCode).toBe('AI_UNAVAILABLE');
  });

  it('cancels the stream on unmount', async () => {
    let aborted = false;
    registerAiProvider({
      id: 'backend',
      run: () =>
        createAiStream(
          (_emit, signal) =>
            new Promise<void>((resolve) => {
              signal.addEventListener('abort', () => {
                aborted = true;
                resolve();
              });
            }),
        ),
    });
    const { result, unmount } = renderHook(() => useAiOp());
    act(() => {
      void result.current.run({ op: 'notes', pages: [] });
    });
    await waitFor(() => expect(result.current.state.status).toBe('running'));
    unmount();
    expect(aborted).toBe(true);
  });
});
