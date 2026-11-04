// NOTE: ported from fyredocs_app/src/lib/annotate/__tests__/pageSpace.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach } from 'vitest';
/**
 * Pins the model ⇄ PDF-user-space mapping: corner identities for every
 * /Rotate value, exact inverses, non-zero MediaBox origins, and the
 * width-fraction conventions. Every /Annot Rect flows through this.
 */

import {
  fromPdf,
  ptToWidthFrac,
  rectFromPdf,
  rectToPdf,
  renderedSize,
  toPdf,
  widthFracToPt,
  type PageGeom,
} from '@/lib/annotate/pageSpace';

const geom = (rotation: PageGeom['rotation'], x = 0, y = 0): PageGeom => ({
  mediaBox: { x, y, width: 400, height: 600 },
  rotation,
});

describe('renderedSize', () => {
  it('swaps dimensions at 90/270', () => {
    expect(renderedSize(geom(0))).toEqual({ width: 400, height: 600 });
    expect(renderedSize(geom(90))).toEqual({ width: 600, height: 400 });
    expect(renderedSize(geom(180))).toEqual({ width: 400, height: 600 });
    expect(renderedSize(geom(270))).toEqual({ width: 600, height: 400 });
  });
});

describe('toPdf corner identities', () => {
  // The model's top-left (0,0) is where the RENDERED page starts; the table
  // below states where that lands in unrotated user space.
  it('rotation 0: top-left → (0, H)', () => {
    expect(toPdf(geom(0), 0, 0)).toEqual({ u: 0, v: 600 });
    expect(toPdf(geom(0), 1, 1)).toEqual({ u: 400, v: 0 });
  });

  it('rotation 90: top-left → (0, 0), top-right → (0, W)... the CW turn', () => {
    // Rendered size 600×400. Model (0,0) → dx=0,dy=0 → a=0, b=0.
    expect(toPdf(geom(90), 0, 0)).toEqual({ u: 0, v: 0 });
    // Model top-right (1,0) → dx=600 → b=600? No: b=dx where dx along rendered width.
    expect(toPdf(geom(90), 1, 0)).toEqual({ u: 0, v: 600 });
    expect(toPdf(geom(90), 0, 1)).toEqual({ u: 400, v: 0 });
  });

  it('rotation 180: top-left → (W, 0)', () => {
    expect(toPdf(geom(180), 0, 0)).toEqual({ u: 400, v: 0 });
    expect(toPdf(geom(180), 1, 1)).toEqual({ u: 0, v: 600 });
  });

  it('rotation 270: top-left → (W, H)', () => {
    expect(toPdf(geom(270), 0, 0)).toEqual({ u: 400, v: 600 });
    expect(toPdf(geom(270), 1, 1)).toEqual({ u: 0, v: 0 });
  });

  it('offsets by a non-zero MediaBox origin', () => {
    expect(toPdf(geom(0, 10, 20), 0, 0)).toEqual({ u: 10, v: 620 });
  });
});

describe('fromPdf inverts toPdf', () => {
  const samples: [number, number][] = [
    [0, 0],
    [1, 1],
    [0.25, 0.7],
    [0.5, 0.5],
    [0.9, 0.1],
  ];
  for (const rotation of [0, 90, 180, 270] as const) {
    it(`round-trips at rotation ${rotation} (with origin offset)`, () => {
      const g = geom(rotation, 12, 34);
      for (const [nx, ny] of samples) {
        const { u, v } = toPdf(g, nx, ny);
        const back = fromPdf(g, u, v);
        expect(back.nx).toBeCloseTo(nx, 10);
        expect(back.ny).toBeCloseTo(ny, 10);
      }
    });
  }
});

describe('width fraction conversions', () => {
  it('uses the RENDERED width (swapped at 90/270)', () => {
    expect(widthFracToPt(geom(0), 0.01)).toBeCloseTo(4);
    expect(widthFracToPt(geom(90), 0.01)).toBeCloseTo(6);
    expect(ptToWidthFrac(geom(90), 6)).toBeCloseTo(0.01);
  });
});

describe('rectToPdf / rectFromPdf', () => {
  const r = { x: 0.1, y: 0.2, w: 0.3, h: 0.1 };
  for (const rotation of [0, 90, 180, 270] as const) {
    it(`corners sorted and round-trips at rotation ${rotation}`, () => {
      const g = geom(rotation, 5, 7);
      const rect = rectToPdf(g, r);
      expect(rect[0]).toBeLessThanOrEqual(rect[2]);
      expect(rect[1]).toBeLessThanOrEqual(rect[3]);
      const back = rectFromPdf(g, rect);
      expect(back.x).toBeCloseTo(r.x, 10);
      expect(back.y).toBeCloseTo(r.y, 10);
      expect(back.w).toBeCloseTo(r.w, 10);
      expect(back.h).toBeCloseTo(r.h, 10);
    });
  }

  it('rotation 0 matches the plain flip', () => {
    expect(rectToPdf(geom(0), r)).toEqual([40, 420, 160, 480]);
  });
});
