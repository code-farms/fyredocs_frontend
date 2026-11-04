// NOTE: ported from fyredocs_app/src/lib/ai/__tests__/request.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
/// <reference types="jest" />
import {
  AiRequestError,
  buildAiRequest,
  checkBudget,
  chunkForMapReduce,
  estimateRequestTokens,
  estimateTokens,
  selectPages,
  summariesAsPages,
  trimHistory,
} from './../request';

const content = ['one', '  ', 'three', 'four'].join('\f');

describe('selectPages', () => {
  it('maps form-feed pages to 0-based indices and drops blank pages', () => {
    expect(selectPages(content)).toEqual([
      { index: 0, text: 'one' },
      { index: 2, text: 'three' },
      { index: 3, text: 'four' },
    ]);
  });

  it('selects a sorted, deduped subset and ignores out-of-range indices', () => {
    expect(selectPages(content, [3, 0, 3, 9, -1]).map((p) => p.index)).toEqual([0, 3]);
  });
});

describe('token estimates', () => {
  it('is ~4 chars per token, rounded up', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcde')).toBe(2);
  });

  it('counts pages, question, passage and history', () => {
    const base = estimateRequestTokens({ op: 'ask', pages: [{ index: 0, text: 'x'.repeat(400) }] });
    const more = estimateRequestTokens({
      op: 'ask',
      pages: [{ index: 0, text: 'x'.repeat(400) }],
      question: 'y'.repeat(40),
      history: [{ role: 'user', text: 'z'.repeat(40) }],
    });
    expect(more - base).toBe(20);
  });
});

describe('checkBudget', () => {
  it('passes within budget', () => {
    expect(checkBudget(50, 0, 50)).toEqual({ ok: true });
  });

  it('suggests an in-budget window from the current page, clamped to the end', () => {
    expect(checkBudget(120, 10, 50)).toEqual({ ok: false, overBy: 70, suggestRange: { start: 10, end: 59 } });
    expect(checkBudget(120, 100, 50)).toEqual({ ok: false, overBy: 70, suggestRange: { start: 70, end: 119 } });
  });
});

describe('map-reduce chunking', () => {
  const pages = Array.from({ length: 7 }, (_, i) => ({ index: i, text: `p${i}` }));

  it('splits into contiguous chunks', () => {
    expect(chunkForMapReduce(pages, 3).map((c) => c.map((p) => p.index))).toEqual([[0, 1, 2], [3, 4, 5], [6]]);
  });

  it('rejects a non-positive chunk size', () => {
    expect(() => chunkForMapReduce(pages, 0)).toThrow();
  });

  it('tags each summary with its chunk first page', () => {
    const chunks = chunkForMapReduce(pages, 3);
    expect(summariesAsPages(chunks, ['a', 'b', 'c']).map((p) => p.index)).toEqual([0, 3, 6]);
  });
});

describe('buildAiRequest', () => {
  const pages = [{ index: 0, text: 'hello' }];

  it('requires text for document ops', () => {
    expect(() => buildAiRequest('summarize', [])).toThrow(AiRequestError);
  });

  it('requires a trimmed question for ask and keeps history', () => {
    expect(() => buildAiRequest('ask', pages, { question: '   ' })).toThrow(AiRequestError);
    const r = buildAiRequest('ask', pages, {
      question: ' why? ',
      history: [{ role: 'user', text: 'hi' }],
    });
    expect(r).toEqual({ op: 'ask', pages, question: 'why?', history: [{ role: 'user', text: 'hi' }] });
  });

  it('requires a language for translate and a passage for rewrite', () => {
    expect(() => buildAiRequest('translate', pages)).toThrow(AiRequestError);
    expect(buildAiRequest('translate', pages, { targetLang: 'Hindi' }).targetLang).toBe('Hindi');
    expect(() => buildAiRequest('rewrite', [])).toThrow(AiRequestError);
    expect(buildAiRequest('rewrite', [], { passage: 'text' })).toEqual({ op: 'rewrite', pages: [], passage: 'text' });
  });

  it('does not leak op-irrelevant inputs onto the wire', () => {
    expect(buildAiRequest('summarize', pages, { question: 'x', targetLang: 'y' })).toEqual({ op: 'summarize', pages });
  });
});

describe('trimHistory', () => {
  const turns = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant', text: `t${i}` }));

  it('keeps short histories as-is', () => {
    expect(trimHistory(turns(4))).toEqual(turns(4));
  });

  it('keeps the most recent turns and starts on a user turn', () => {
    const out = trimHistory(turns(9), 4);
    expect(out.map((t) => t.text)).toEqual(['t6', 't7', 't8']);
    expect(out[0].role).toBe('user');
  });

  it('clips over-long turns to the server cap', () => {
    const out = trimHistory([{ role: 'user', text: 'x'.repeat(50) }], 20, 10);
    expect(out[0].text).toHaveLength(10);
    expect(out[0].text.endsWith('…')).toBe(true);
  });
});
