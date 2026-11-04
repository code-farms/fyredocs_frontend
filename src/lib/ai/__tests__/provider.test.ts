// NOTE: ported from fyredocs_app/src/lib/ai/__tests__/provider.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
/// <reference types="jest" />
import {
  aiAvailable,
  collectAiText,
  createAiStream,
  getAiProvider,
  registerAiProvider,
  type AiEvent,
} from './../provider';
import { createStubProvider } from './../stubProvider';

const drain = async (it: AsyncIterable<AiEvent>) => {
  const out: AiEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
};

afterEach(() => registerAiProvider(null));

describe('provider registry', () => {
  it('is unavailable with nothing or only the stub registered', () => {
    expect(aiAvailable()).toBe(false);
    registerAiProvider(createStubProvider());
    expect(getAiProvider()?.id).toBe('stub');
    expect(aiAvailable()).toBe(false);
  });

  it('is available with a real adapter', () => {
    registerAiProvider({ id: 'backend', run: () => createAiStream(async () => undefined) });
    expect(aiAvailable()).toBe(true);
  });
});

describe('createAiStream', () => {
  it('streams deltas then one terminal done', async () => {
    const stub = createStubProvider({ chunks: () => ['a', 'b'] });
    const events = await drain(stub.run({ op: 'summarize', pages: [] }));
    expect(events.map((e) => e.type)).toEqual(['delta', 'delta', 'done']);
  });

  it('adds done when the producer resolves without one', async () => {
    const events = await drain(createAiStream(async (emit) => emit({ type: 'delta', text: 'x' })));
    expect(events).toEqual([{ type: 'delta', text: 'x' }, { type: 'done' }]);
  });

  it('turns a producer throw into an error event carrying the code', async () => {
    const stub = createStubProvider({ failWith: 'AI_QUOTA_EXCEEDED' });
    const events = await drain(stub.run({ op: 'ask', pages: [] }));
    expect(events).toEqual([{ type: 'error', code: 'AI_QUOTA_EXCEEDED', message: 'stub failure' }]);
  });

  it('defaults an uncoded failure to AI_UNAVAILABLE', async () => {
    const events = await drain(
      createAiStream(async () => {
        throw new Error('network');
      }),
    );
    expect(events[0]).toMatchObject({ type: 'error', code: 'AI_UNAVAILABLE' });
  });

  it('cancel aborts the producer and ends iteration', async () => {
    let aborted = false;
    const stream = createAiStream(
      (emit, signal) =>
        new Promise<void>((resolve) => {
          emit({ type: 'delta', text: 'first' });
          signal.addEventListener('abort', () => {
            aborted = true;
            resolve();
          });
        }),
    );
    const seen: AiEvent[] = [];
    for await (const e of stream) {
      seen.push(e);
      stream.cancel();
    }
    expect(seen).toEqual([{ type: 'delta', text: 'first' }]);
    expect(aborted).toBe(true);
  });
});

describe('collectAiText', () => {
  it('joins deltas and returns usage', async () => {
    const r = await collectAiText(createStubProvider({ chunks: () => ['he', 'llo'] }).run({ op: 'notes', pages: [] }));
    expect(r.text).toBe('hello');
    expect(r.usage?.outputTokens).toBe(2);
  });

  it('throws the error code', async () => {
    await expect(
      collectAiText(createStubProvider({ failWith: 'AI_UNAVAILABLE' }).run({ op: 'notes', pages: [] })),
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
});
