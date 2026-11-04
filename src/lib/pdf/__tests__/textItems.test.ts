import { describe, expect, it } from 'vitest';
import { textLayerFrom } from '@/lib/pdf/textItems';
import { rectsForRange } from '@/lib/pdf/oracle/oracleMath';

// A 600×800 page at scale 1: pdf.js's viewport transform flips y.
const VIEWPORT = [1, 0, 0, -1, 0, 800];

describe('textLayerFrom', () => {
  it('normalizes baseline and top corners and joins with the oracle rule', () => {
    const layer = textLayerFrom(
      [
        { str: 'Hello', transform: [10, 0, 0, 10, 60, 700], width: 50, height: 10, hasEOL: true },
        { str: 'world', transform: [10, 0, 0, 10, 60, 680], width: 50, height: 10, hasEOL: false },
      ],
      VIEWPORT,
      600,
      800
    );
    expect(layer.text).toBe('Hello world');
    expect(layer.offsets).toEqual([0, 6]);
    expect(layer.items[0]).toMatchObject({ bx: 0.1, by: 0.125, ex: 110 / 600, tx: 0.1, ty: 90 / 800, eol: true });
  });

  it('feeds rectsForRange so a match lands on its item', () => {
    const layer = textLayerFrom(
      [{ str: 'abcd', transform: [10, 0, 0, 10, 0, 700], width: 40, height: 10, hasEOL: false }],
      VIEWPORT,
      600,
      800
    );
    const [r] = rectsForRange(layer.items, layer.offsets, 1, 3);
    expect(r.x).toBeCloseTo(10 / 600);
    expect(r.w).toBeCloseTo(20 / 600);
    expect(r.y).toBeCloseTo(90 / 800);
    expect(r.h).toBeCloseTo(10 / 800);
  });
});
