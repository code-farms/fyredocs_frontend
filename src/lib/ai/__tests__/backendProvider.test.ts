// NOTE: ported from fyredocs_app/src/lib/ai/__tests__/backendProvider.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
/// <reference types="jest" />
import { ApiHttpError } from '@/lib/apiClient';

import { createBackendProvider, pagesFingerprint, parseWireEvent } from './../backendProvider';
import { aiAvailable, collectAiText, registerAiProvider, type AiRequest } from './../provider';

const pages = [{ index: 0, text: 'hello' }];
const req: AiRequest = { op: 'summarize', pages };
const REF = 'a'.repeat(64);

type Call = { path: string; body: Record<string, unknown> };

/** Fake apiStream: replays frames, optionally throwing first. */
const fakeStream = (script: (call: Call, n: number) => unknown[] | Error) => {
  const calls: Call[] = [];
  const fn = vi.fn(async (path: string, body: unknown, onEvent: (e: unknown) => void) => {
    const call = { path, body: body as Record<string, unknown> };
    calls.push(call);
    const out = script(call, calls.length);
    if (out instanceof Error) throw out;
    out.forEach(onEvent);
  });
  return { fn, calls };
};

describe('parseWireEvent', () => {
  it('maps SSE frames and the JSON envelope, dropping junk', () => {
    expect(parseWireEvent({ type: 'delta', text: 'x' })).toEqual([{ type: 'delta', text: 'x' }]);
    expect(parseWireEvent({ type: 'done', usage: { inputTokens: 3, outputTokens: 'bad' }, docRef: REF })).toEqual([
      { type: 'done', usage: { inputTokens: 3, outputTokens: 0, cachedTokens: 0 }, docRef: REF },
    ]);
    expect(parseWireEvent({ type: 'error', code: 'AI_UNAVAILABLE' })).toEqual([
      { type: 'error', code: 'AI_UNAVAILABLE', message: undefined },
    ]);
    expect(parseWireEvent({ success: true, data: { text: 'all', docRef: REF } })).toEqual([
      { type: 'delta', text: 'all' },
      { type: 'done', usage: undefined, docRef: REF },
    ]);
    expect(parseWireEvent({ type: 'delta' })).toBeNull();
    expect(parseWireEvent('nope')).toBeNull();
  });
});

describe('pagesFingerprint', () => {
  it('is stable for equal pages and differs on any change', () => {
    expect(pagesFingerprint(pages)).toBe(pagesFingerprint([{ index: 0, text: 'hello' }]));
    expect(pagesFingerprint(pages)).not.toBe(pagesFingerprint([{ index: 1, text: 'hello' }]));
    expect(pagesFingerprint(pages)).not.toBe(pagesFingerprint([{ index: 0, text: 'hellp' }]));
  });
});

describe('createBackendProvider', () => {
  it('posts inputs (never the op) to the op path and streams text', async () => {
    const { fn, calls } = fakeStream(() => [{ type: 'delta', text: 'Hi' }, { type: 'done' }]);
    const r = await collectAiText(createBackendProvider(fn).run({ op: 'ask', pages, question: 'q?' }));
    expect(r.text).toBe('Hi');
    expect(calls[0].path).toBe('/api/ai/ops/ask');
    expect(calls[0].body).toEqual({ pages, question: 'q?' });
  });

  it('reuses the returned docRef instead of re-sending pages', async () => {
    const { fn, calls } = fakeStream(() => [{ type: 'done', docRef: REF }]);
    const p = createBackendProvider(fn);
    await collectAiText(p.run(req));
    await collectAiText(p.run({ op: 'ask', pages, question: 'again' }));
    expect(calls[1].body).toEqual({ pages: [], docRef: REF, question: 'again' });
  });

  it('retries once with pages when the ref expired', async () => {
    const { fn, calls } = fakeStream((call, n) => {
      if (n === 2) return new ApiHttpError('gone', 410, 'AI_DOCUMENT_EXPIRED');
      return [{ type: 'delta', text: `t${n}` }, { type: 'done', docRef: REF }];
    });
    const p = createBackendProvider(fn);
    await collectAiText(p.run(req));
    const r = await collectAiText(p.run(req));
    expect(calls.map((c) => c.body.docRef ?? 'pages')).toEqual([undefined, REF, undefined].map((v) => v ?? 'pages'));
    expect(calls[2].body.pages).toEqual(pages);
    expect(r.text).toBe('t3');
  });

  it('surfaces other HTTP codes as error events', async () => {
    const { fn } = fakeStream(() => new ApiHttpError('quota', 429, 'AI_QUOTA_EXCEEDED'));
    await expect(collectAiText(createBackendProvider(fn).run(req))).rejects.toMatchObject({ code: 'AI_QUOTA_EXCEEDED' });
  });

  it('emits done when the server closed without a terminal frame', async () => {
    const { fn } = fakeStream(() => [{ type: 'delta', text: 'partial' }]);
    const r = await collectAiText(createBackendProvider(fn).run(req));
    expect(r.text).toBe('partial');
  });

  it('counts as available once registered', () => {
    registerAiProvider(createBackendProvider(vi.fn()));
    expect(aiAvailable()).toBe(true);
    registerAiProvider(null);
  });
});
