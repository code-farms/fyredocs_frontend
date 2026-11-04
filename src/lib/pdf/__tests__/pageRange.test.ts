// NOTE: ported from fyredocs_app/src/lib/pdf/__tests__/pageRange.test.ts — keep in sync.
import { describe, it, expect, vi } from 'vitest';
/**
 * Phase 6 page-range parser. Pure input→output, no fixtures. The two
 * behaviours most likely to be "fixed" by a future reader — sort+dedup, and
 * reject-don't-clamp — are asserted explicitly and named in pageRange.ts's
 * docblock.
 */

import { initialPlan } from '@/lib/pdf/pagePlan';
import {
  describeSelection,
  formatPageRange,
  parsePageRange,
  subsetPlan,
  type PageRangeParse,
} from '@/lib/pdf/pageRange';

const N = 10;

/** Unwraps a parse that MUST have succeeded (fails loudly if it didn't). */
const idx = (input: string, pageCount = N): number[] => {
  const r = parsePageRange(input, pageCount);
  // Explicit casts: the web tsconfig has no strictNullChecks, so `ok` doesn't narrow the union.
  if (r.ok === false) {
    const f = r as Extract<PageRangeParse, { ok: false }>;
    throw new Error(`expected "${input}" to parse, got ${f.code}: ${f.message}`);
  }
  return (r as Extract<PageRangeParse, { ok: true }>).indices;
};

const err = (input: string, pageCount = N): Extract<PageRangeParse, { ok: false }> => {
  const r = parsePageRange(input, pageCount);
  if (r.ok === true) throw new Error(`expected "${input}" to fail, got [${(r as Extract<PageRangeParse, { ok: true }>).indices.join(',')}]`);
  return r as Extract<PageRangeParse, { ok: false }>;
};

describe('parsePageRange', () => {
  it('parses singles, ranges, and mixes (1-based in, 0-based out)', () => {
    expect(idx('3')).toEqual([2]);
    expect(idx('2,4')).toEqual([1, 3]);
    expect(idx('6-8')).toEqual([5, 6, 7]);
    expect(idx('2,4,6-8')).toEqual([1, 3, 5, 6, 7]);
    expect(idx('5-5')).toEqual([4]);
  });

  it('tolerates whitespace, and spaces as separators', () => {
    expect(idx('  2 , 4 ,  6 - 8 ')).toEqual([1, 3, 5, 6, 7]);
    expect(idx('5 7')).toEqual([4, 6]);
  });

  it('accepts unicode dashes — iOS smart punctuation rewrites typed hyphens', () => {
    expect(idx('6–8')).toEqual([5, 6, 7]); // en dash
    expect(idx('6—8')).toEqual([5, 6, 7]); // em dash
    expect(idx('6−8')).toEqual([5, 6, 7]); // minus sign
  });

  it('drops empty tokens so live validation never flashes red mid-type', () => {
    expect(idx('2,,4,')).toEqual([1, 3]);
    expect(idx('2,')).toEqual([1]);
  });

  it('sorts AND de-duplicates — a subset is document-ordered, never a reorder', () => {
    expect(idx('3,1,3,2-3')).toEqual([0, 1, 2]);
    expect(idx('8,2')).toEqual([1, 7]);
  });

  it('accepts all/* only as the entire input', () => {
    expect(idx('all')).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(idx('ALL')).toHaveLength(N);
    expect(idx('*')).toHaveLength(N);
    expect(err('all,2').code).toBe('syntax');
  });

  it('supports open-ended ranges, like every desktop print dialog', () => {
    expect(idx('8-')).toEqual([7, 8, 9]);
    expect(idx('-3')).toEqual([0, 1, 2]);
  });

  it('rejects out-of-range instead of clamping, naming the real count', () => {
    for (const bad of ['11', '1-11', '0', '-0', '0-2']) {
      const e = err(bad);
      expect(e.code).toBe('out-of-range');
      expect(e.message).toContain('10');
    }
  });

  it('rejects backwards ranges', () => {
    const e = err('8-6');
    expect(e.code).toBe('reverse-range');
    expect(e.token).toBe('8-6');
  });

  it('rejects malformed tokens and echoes the offender', () => {
    for (const bad of ['abc', '1--3', '1.5', '1-2-3', '1;;', '-', 'a-b']) {
      const e = err(bad);
      expect(e.code).toBe('syntax');
      expect(e.token).toBeDefined();
    }
    expect(err('2,abc,4').token).toBe('abc');
  });

  it('caps digits before expanding — no huge allocation on a keystroke', () => {
    expect(err('1-99999999999').code).toBe('out-of-range');
    expect(err('99999999999').code).toBe('out-of-range');
  });

  it('reports empty input as its own code (so the UI can hint, not error)', () => {
    expect(err('').code).toBe('empty');
    expect(err('   ').code).toBe('empty');
    expect(err(',,').code).toBe('empty');
  });

  it('handles degenerate page counts', () => {
    expect(err('1', 0).code).toBe('out-of-range');
    expect(err('all', 0).code).toBe('out-of-range');
    expect(idx('1', 1)).toEqual([0]);
    expect(idx('all', 1)).toEqual([0]);
    expect(err('2', 1).message).toContain('1 page');
  });

  it('every successful parse is sorted, unique, and in bounds', () => {
    const corpus = ['3', '2,4', '6-8', '2,4,6-8', 'all', '8-', '-3', '3,1,3,2-3', '5 7', '2,,4,'];
    for (const input of corpus) {
      const out = idx(input);
      expect(out).toEqual([...new Set(out)].sort((a, b) => a - b));
      expect(out.every((i) => Number.isInteger(i) && i >= 0 && i < N)).toBe(true);
      expect(out.length).toBeGreaterThan(0);
    }
  });

  it('round-trips through formatPageRange', () => {
    for (const pages of [[0], [4], [0, 1, 2, 6], [0, 2, 4], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]) {
      expect(idx(formatPageRange(pages))).toEqual(pages);
    }
  });
});

describe('formatPageRange', () => {
  it('collapses consecutive runs', () => {
    expect(formatPageRange([0, 1, 2, 6])).toBe('1-3, 7');
    expect(formatPageRange([4])).toBe('5');
    expect(formatPageRange([0, 2, 4])).toBe('1, 3, 5');
    expect(formatPageRange([0, 1])).toBe('1-2');
  });

  it('is empty for no pages and sorts/dedupes defensively', () => {
    expect(formatPageRange([])).toBe('');
    expect(formatPageRange([6, 0, 1, 2, 6])).toBe('1-3, 7');
  });
});

describe('describeSelection', () => {
  it('pluralizes in one place', () => {
    expect(describeSelection(1)).toBe('1 page selected');
    expect(describeSelection(7)).toBe('7 pages selected');
    expect(describeSelection(0)).toBe('0 pages selected');
  });
});

describe('subsetPlan', () => {
  it('emits source specs matching initialPlan, with no rotation delta', () => {
    const plan = subsetPlan(5, [0, 2, 4]);
    const full = initialPlan(5);
    expect(plan).toHaveLength(3);
    expect(plan.map((s) => (s.kind === 'source' ? s.src : -1))).toEqual([0, 2, 4]);
    expect(plan.every((s) => s.kind === 'source' && s.rotate === 0)).toBe(true);
    // Same ids as the full plan's corresponding pages — these ARE those pages.
    expect(plan.map((s) => s.id)).toEqual([full[0].id, full[2].id, full[4].id]);
  });

  it("preserves the caller's order", () => {
    expect(subsetPlan(5, [4, 0]).map((s) => (s.kind === 'source' ? s.src : -1))).toEqual([4, 0]);
  });

  it('throws rather than silently dropping bad input', () => {
    expect(() => subsetPlan(5, [])).toThrow();
    expect(() => subsetPlan(5, [5])).toThrow();
    expect(() => subsetPlan(5, [-1])).toThrow();
    expect(() => subsetPlan(5, [1.5])).toThrow();
  });
});
