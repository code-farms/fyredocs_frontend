// NOTE: ported from fyredocs_app/src/lib/pdf/oracle/__tests__/oracleMath.test.ts — keep in sync.
import { describe, it, expect } from 'vitest';
/**
 * Pins the oracle's pure geometry. The design fact under test: baseline
 * endpoints + a top corner survive anisotropic normalization because lerp
 * commutes with linear maps — so sub-item rects stay exact under rotation,
 * where unit-vector emissions would not.
 */

import {
  containBox,
  joinItems,
  looksLikeGarbageText,
  rectsForRange,
  rectToContainer,
  type OracleItem,
} from '@/lib/pdf/oracle/oracleMath';

/** Horizontal run: baseline left→right at y=0.5, glyph height 0.05. */
const hRun = (str: string, x0: number, x1: number, over: Partial<OracleItem> = {}): OracleItem => ({
  str,
  bx: x0,
  by: 0.5,
  ex: x1,
  ey: 0.5,
  tx: x0,
  ty: 0.45,
  eol: false,
  ...over,
});

describe('joinItems', () => {
  it('concatenates directly and appends one space on eol', () => {
    const { text, offsets } = joinItems([
      { str: 'Hel', eol: false },
      { str: 'lo world', eol: true },
      { str: 'next line', eol: false },
    ]);
    expect(text).toBe('Hello world next line');
    expect(offsets).toEqual([0, 3, 12]);
  });

  it('handles empty input and empty items', () => {
    expect(joinItems([])).toEqual({ text: '', offsets: [] });
    const { text, offsets } = joinItems([
      { str: '', eol: true },
      { str: 'a', eol: false },
    ]);
    expect(text).toBe(' a');
    expect(offsets).toEqual([0, 1]);
  });
});

describe('rectsForRange', () => {
  it('slices an unrotated item proportionally', () => {
    // "abcdefghij" spanning x 0.1..0.6 — chars 2..5 occupy t 0.2..0.5.
    const items = [hRun('abcdefghij', 0.1, 0.6)];
    const [r] = rectsForRange(items, [0], 2, 5);
    expect(r.x).toBeCloseTo(0.1 + 0.5 * 0.2, 10);
    expect(r.w).toBeCloseTo(0.5 * 0.3, 10);
    expect(r.y).toBeCloseTo(0.45, 10);
    expect(r.h).toBeCloseTo(0.05, 10);
  });

  it('covers the whole item for a full-range match', () => {
    const items = [hRun('word', 0.2, 0.4)];
    const [r] = rectsForRange(items, [0], 0, 4);
    expect(r.x).toBeCloseTo(0.2, 10);
    expect(r.y).toBeCloseTo(0.45, 10);
    expect(r.w).toBeCloseTo(0.2, 10);
    expect(r.h).toBeCloseTo(0.05, 10);
  });

  it('emits one rect per touched item when a match straddles runs', () => {
    // "Hel" + "lo" joined → "Hello"; match "llo" = chars 2..5.
    const items = [hRun('Hel', 0.1, 0.25), hRun('lo', 0.25, 0.35)];
    const { offsets } = joinItems(items);
    const rects = rectsForRange(items, offsets, 2, 5);
    expect(rects).toHaveLength(2);
    // Last third of the first item, all of the second.
    expect(rects[0].x).toBeCloseTo(0.1 + 0.15 * (2 / 3), 10);
    expect(rects[1].x).toBeCloseTo(0.25, 10);
    expect(rects[1].w).toBeCloseTo(0.1, 10);
  });

  it('handles a VERTICAL run (rotated page) exactly, including sub-ranges', () => {
    // Baseline runs DOWN the page: x fixed, y 0.2 → 0.7; the up edge points
    // in -x. This is where direction-vector math with anisotropic
    // normalization would drift; lerp on endpoints cannot.
    const items: OracleItem[] = [
      { str: 'vertical..', bx: 0.5, by: 0.2, ex: 0.5, ey: 0.7, tx: 0.46, ty: 0.2, eol: false },
    ];
    const [r] = rectsForRange(items, [0], 5, 10); // second half
    expect(r.x).toBeCloseTo(0.46, 10);
    expect(r.w).toBeCloseTo(0.04, 10);
    expect(r.y).toBeCloseTo(0.2 + 0.5 * 0.5, 10);
    expect(r.h).toBeCloseTo(0.25, 10);
  });

  it('returns nothing for empty/invalid ranges and mismatched offsets', () => {
    const items = [hRun('word', 0.2, 0.4)];
    expect(rectsForRange(items, [0], 3, 3)).toEqual([]);
    expect(rectsForRange(items, [0], 5, 2)).toEqual([]);
    expect(rectsForRange(items, [], 0, 2)).toEqual([]);
    expect(rectsForRange([], [], 0, 2)).toEqual([]);
  });

  it('skips items the range does not touch (eol gap chars belong to no item)', () => {
    const items = [hRun('ab', 0.1, 0.2, { eol: true }), hRun('cd', 0.3, 0.4)];
    const { offsets, text } = joinItems(items);
    expect(text).toBe('ab cd');
    // Match only the joiner space (index 2..3): touches neither item's chars.
    expect(rectsForRange(items, offsets, 2, 3)).toEqual([]);
  });
});

describe('containBox', () => {
  it('is the identity inset when aspects match', () => {
    expect(containBox(100, 140, 500, 700)).toEqual({ x: 0, y: 0, w: 500, h: 700 });
  });

  it('letterboxes a wider-than-cell image vertically', () => {
    // Landscape 200x100 in a 400x600 cell → drawn 400x200, y offset 200.
    expect(containBox(200, 100, 400, 600)).toEqual({ x: 0, y: 200, w: 400, h: 200 });
  });

  it('pillarboxes a taller-than-cell image horizontally', () => {
    expect(containBox(100, 400, 400, 400)).toEqual({ x: 150, y: 0, w: 100, h: 400 });
  });

  it('degrades to the raw box on degenerate input', () => {
    expect(containBox(0, 0, 400, 600)).toEqual({ x: 0, y: 0, w: 400, h: 600 });
  });
});

describe('rectToContainer', () => {
  it('maps through the letterbox inset', () => {
    const box = { x: 0, y: 200, w: 400, h: 200 };
    expect(rectToContainer({ x: 0.5, y: 0.5, w: 0.25, h: 0.1 }, box)).toEqual({
      x: 200,
      y: 300,
      w: 100,
      h: 20,
    });
  });
});

describe('looksLikeGarbageText', () => {
  it('accepts normal text and rejects empty', () => {
    expect(looksLikeGarbageText('Hello world, this is a page.')).toBe(false);
    expect(looksLikeGarbageText('')).toBe(true);
    expect(looksLikeGarbageText('   \n  ')).toBe(true);
  });

  it('flags replacement-character soup (missing CMaps)', () => {
    expect(looksLikeGarbageText('���� a')).toBe(true);
    // A single stray replacement char in real text is fine.
    expect(looksLikeGarbageText('caf� normal sentence continuing here')).toBe(false);
  });
});
