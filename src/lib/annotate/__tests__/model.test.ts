// NOTE: ported from fyredocs_app/src/lib/annotate/__tests__/model.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach } from 'vitest';
/**
 * Pins the annotation model's pure invariants: normalized geometry stays in
 * 0..1 under moves, hit-testing respects z-order, and the path/arrow math
 * the renderer AND the baker both consume.
 */

import {
  annotationAt,
  annotationBounds,
  arrowHead,
  dragRect,
  handleAt,
  handlesFor,
  MAX_FONT_SCALE,
  MIN_BOX_W,
  MIN_FONT_SCALE,
  MIN_SIGNATURE_W,
  moveAnnotation,
  pointsBounds,
  pointsToSvgPath,
  resizeAnnotation,
  restyleAnnotation,
  rotatedRectBounds,
  rotateSignature,
  textBounds,
  type Annotation,
  type BoxAnnotation,
  type PathAnnotation,
  type SignatureAnnotation,
  type TextAnnotation,
  shouldFlushDraft,
} from '@/lib/annotate/model';
import { HANDLE_GAP_PX, HANDLE_MIN_SEP_PX } from '@/lib/annotate/handleMetrics';

const box = (over: Partial<BoxAnnotation> = {}): BoxAnnotation => ({
  id: 'b1',
  kind: 'rect',
  x: 0.2,
  y: 0.2,
  w: 0.3,
  h: 0.2,
  color: '#111111',
  strokeWidth: 0.006,
  ...over,
});

const stroke = (over: Partial<PathAnnotation> = {}): PathAnnotation => ({
  id: 'p1',
  kind: 'pen',
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.3, y: 0.2 },
  ],
  dx: 0,
  dy: 0,
  color: '#111111',
  strokeWidth: 0.01,
  bounds: pointsBounds(
    [
      { x: 0.1, y: 0.1 },
      { x: 0.3, y: 0.2 },
    ],
    0.01
  ),
  ...over,
});

/** A4 portrait: the aspect that made the old width-fraction bug visible. */
const A = 1.414;

const sig = (over: Partial<SignatureAnnotation> = {}): SignatureAnnotation => ({
  id: 's1',
  kind: 'signature',
  x: 0.2,
  y: 0.2,
  w: 0.3,
  aspect: 0.5,
  sigRelPath: 'signatures/s1.png',
  ...over,
});

const label = (over: Partial<TextAnnotation> = {}): TextAnnotation => ({
  id: 't1',
  kind: 'text',
  x: 0.2,
  y: 0.2,
  text: 'hello',
  color: '#111111',
  fontScale: 0.035,
  ...over,
});

describe('pageAspect conversion (width-fraction → normalized height)', () => {
  // The bug this pins: w/fontScale/strokeWidth are fractions of page WIDTH,
  // but a Rect's h is normalized against page HEIGHT. Returning them
  // unconverted made every text/signature box ~41% too tall on A4 — and the
  // selection outline, hit test and handles all read that box.
  it("a signature's bounds height matches its drawn pixel height", () => {
    const W = 1000;
    const H = W * A;
    const a = sig();
    const drawnPx = a.w * a.aspect * W; // AnnotationCanvas / engine draw this
    expect(annotationBounds(a, A).h * H).toBeCloseTo(drawnPx, 6);
  });

  it("a text box's bounds height matches its drawn pixel height", () => {
    const W = 1000;
    const H = W * A;
    const a = label();
    expect(textBounds(a, A).h * H).toBeCloseTo(a.fontScale * 1.4 * W, 6);
  });

  it('a square page is the degenerate case where the conversion vanishes', () => {
    expect(annotationBounds(sig(), 1).h).toBeCloseTo(0.15, 10);
  });
});

describe('rotatedRectBounds', () => {
  const r = { x: 0.25, y: 0.25, w: 0.5, h: 0.5 / A };

  it('is identity at 0 and 360 degrees', () => {
    expect(rotatedRectBounds(r, 0, A)).toEqual(r);
    expect(rotatedRectBounds(r, 360, A).w).toBeCloseTo(r.w, 10);
  });

  it('grows the AABB at 45° and keeps the centre put', () => {
    const out = rotatedRectBounds(r, 45, A);
    expect(out.w).toBeGreaterThan(r.w);
    expect(out.x + out.w / 2).toBeCloseTo(r.x + r.w / 2, 10);
    expect(out.y + out.h / 2).toBeCloseTo(r.y + r.h / 2, 10);
  });

  it('a square (in screen space) returns to its own size at 90°', () => {
    // Square on screen means h * pageAspect === w.
    const square = { x: 0.2, y: 0.2, w: 0.4, h: 0.4 / A };
    const out = rotatedRectBounds(square, 90, A);
    expect(out.w).toBeCloseTo(square.w, 8);
    expect(out.h).toBeCloseTo(square.h, 8);
  });
});

describe('dragRect', () => {
  it('normalizes any drag direction into a positive rect', () => {
    const r = dragRect(0.6, 0.7, 0.2, 0.3);
    expect(r.x).toBeCloseTo(0.2, 10);
    expect(r.y).toBeCloseTo(0.3, 10);
    expect(r.w).toBeCloseTo(0.4, 10);
    expect(r.h).toBeCloseTo(0.4, 10);
  });
});

describe('annotationAt (hit-testing)', () => {
  it('returns the topmost (last) annotation containing the point', () => {
    const under = box({ id: 'under' });
    const over = box({ id: 'over' });
    expect(annotationAt([under, over], 0.3, 0.3, A)?.id).toBe('over');
  });

  it('misses outside the slop-expanded bounds', () => {
    expect(annotationAt([box()], 0.9, 0.9, A)).toBeNull();
    // Just inside the default slop.
    expect(annotationAt([box()], 0.19, 0.2, A)?.id).toBe('b1');
  });
});

describe('moveAnnotation', () => {
  it('moves boxes and clamps to the page', () => {
    const moved = moveAnnotation(box(), 0.9, 0.9, A) as BoxAnnotation;
    expect(moved.x + moved.w).toBeLessThanOrEqual(1);
    expect(moved.y + moved.h).toBeLessThanOrEqual(1);
  });

  it('moves lines by shifting both endpoints equally', () => {
    const line: Annotation = {
      id: 'l1',
      kind: 'arrow',
      x1: 0.1,
      y1: 0.1,
      x2: 0.4,
      y2: 0.3,
      color: '#111111',
      strokeWidth: 0.006,
    };
    const moved = moveAnnotation(line, 0.1, 0.1, A);
    if (moved.kind !== 'arrow') throw new Error('kind changed');
    expect(moved.x2 - moved.x1).toBeCloseTo(0.3, 10);
    expect(moved.y2 - moved.y1).toBeCloseTo(0.2, 10);
  });

  it('moves strokes via dx/dy and keeps bounds in sync', () => {
    const s = stroke();
    const moved = moveAnnotation(s, 0.2, 0.1, A);
    if (moved.kind !== 'pen') throw new Error('kind changed');
    expect(moved.points).toBe(s.points); // path untouched
    expect(moved.dx).toBeCloseTo(0.2, 10);
    expect(moved.bounds.x).toBeCloseTo(s.bounds.x + 0.2, 10);
    expect(annotationBounds(moved, A)).toEqual(moved.bounds);
  });

  it('clamps stroke moves at the page edge', () => {
    const moved = moveAnnotation(stroke(), 5, 5, A);
    if (moved.kind !== 'pen') throw new Error('kind changed');
    expect(moved.bounds.x + moved.bounds.w).toBeLessThanOrEqual(1.0000001);
  });
});

describe('resizeAnnotation', () => {
  it('moves the dragged corner and pins the opposite one', () => {
    const b = box(); // x .2 y .2 w .3 h .2 → se corner at (.5, .4)
    const out = resizeAnnotation(b, 'se', 0.7, 0.6, A) as BoxAnnotation;
    expect(out.x).toBeCloseTo(0.2, 10);
    expect(out.y).toBeCloseTo(0.2, 10);
    expect(out.x + out.w).toBeCloseTo(0.7, 10);
    expect(out.y + out.h).toBeCloseTo(0.6, 10);
  });

  it('dragging the west edge east keeps the east edge pinned', () => {
    const out = resizeAnnotation(box(), 'w', 0.35, 0.3, A) as BoxAnnotation;
    expect(out.x).toBeCloseTo(0.35, 10);
    expect(out.x + out.w).toBeCloseTo(0.5, 10);
  });

  it('NEVER inverts when dragged past the opposite edge', () => {
    // dragRect takes Math.abs, so a naive build-then-clamp would flip the box
    // inside out and teleport the handle across it.
    const out = resizeAnnotation(box(), 'e', 0.0, 0.3, A) as BoxAnnotation;
    expect(out.w).toBeGreaterThanOrEqual(MIN_BOX_W);
    expect(out.x).toBeCloseTo(0.2, 10);
    expect(out.x + out.w).toBeGreaterThan(out.x);
  });

  it('is a pure function of the pointer — clamping at the minimum releases again', () => {
    const b = box();
    const squashed = resizeAnnotation(b, 'e', 0, 0.3, A) as BoxAnnotation;
    expect(squashed.w).toBeCloseTo(MIN_BOX_W, 10);
    // Coming back out retraces exactly, because every frame recomputes from
    // the ORIGIN rather than accumulating deltas.
    const back = resizeAnnotation(b, 'e', 0.6, 0.3, A) as BoxAnnotation;
    expect(back.x + back.w).toBeCloseTo(0.6, 10);
  });

  it('keeps a signature aspect-locked and refuses edge handles', () => {
    const s = sig();
    const out = resizeAnnotation(s, 'se', 0.8, 0.9, A) as SignatureAnnotation;
    expect(out.aspect).toBe(s.aspect);
    expect(out.x).toBeCloseTo(s.x, 10);
    expect(out.y).toBeCloseTo(s.y, 10);
    // Height still derives from width — the model has no separate h.
    expect(annotationBounds(out, A).h).toBeCloseTo((out.w * out.aspect) / A, 10);
    // Edge handles are not offered, so they must be no-ops.
    expect(resizeAnnotation(s, 'e', 0.9, 0.9, A)).toBe(s);
  });

  it('clamps a signature to a usable minimum width', () => {
    const out = resizeAnnotation(sig(), 'se', 0.2, 0.2, A) as SignatureAnnotation;
    expect(out.w).toBeCloseTo(MIN_SIGNATURE_W, 10);
  });

  it('scales text through fontScale, clamped both ways', () => {
    const t = label();
    const bigger = resizeAnnotation(t, 'se', 0.9, 0.9, A) as TextAnnotation;
    expect(bigger.fontScale).toBeGreaterThan(t.fontScale);
    expect(bigger.fontScale).toBeLessThanOrEqual(MAX_FONT_SCALE);
    const tiny = resizeAnnotation(t, 'se', 0.2001, 0.2001, A) as TextAnnotation;
    expect(tiny.fontScale).toBeCloseTo(MIN_FONT_SCALE, 10);
  });

  it('survives an empty text string (the inverse divides by glyph count)', () => {
    const empty = label({ text: '' });
    expect(() => resizeAnnotation(empty, 'se', 0.6, 0.6, A)).not.toThrow();
    const out = resizeAnnotation(empty, 'se', 0.6, 0.6, A) as TextAnnotation;
    expect(Number.isFinite(out.fontScale)).toBe(true);
  });

  it('moves a line endpoint and enforces a minimum length', () => {
    const line: Annotation = {
      id: 'l1',
      kind: 'arrow',
      x1: 0.1,
      y1: 0.1,
      x2: 0.4,
      y2: 0.3,
      color: '#111111',
      strokeWidth: 0.006,
    };
    const out = resizeAnnotation(line, 'p2', 0.8, 0.5, A);
    if (out.kind !== 'arrow') throw new Error('kind changed');
    expect(out.x1).toBeCloseTo(0.1, 10);
    expect(out.x2).toBeCloseTo(0.8, 10);
    // Collapsed onto the anchor → pushed back out, never zero-length.
    const collapsed = resizeAnnotation(line, 'p2', 0.1, 0.1, A);
    if (collapsed.kind !== 'arrow') throw new Error('kind changed');
    expect(Math.hypot(collapsed.x2 - collapsed.x1, (collapsed.y2 - collapsed.y1) * A)).toBeCloseTo(
      0.01,
      6
    );
  });

  it('scales a pen stroke uniformly, bakes dx/dy, and keeps bounds in sync', () => {
    const moved = moveAnnotation(stroke(), 0.1, 0.05, A) as PathAnnotation;
    expect(moved.dx).toBeCloseTo(0.1, 10);
    const out = resizeAnnotation(moved, 'se', 0.9, 0.9, A) as PathAnnotation;
    // dx/dy folded into the points — leaving them live would double-count,
    // because `bounds` already includes them.
    expect(out.dx).toBe(0);
    expect(out.dy).toBe(0);
    expect(out.bounds).toEqual(pointsBounds(out.points, out.strokeWidth));
    expect(out.strokeWidth).toBeGreaterThan(moved.strokeWidth);
    // Uniform: the aspect of the point cloud is preserved.
    const srcAspect = (moved.bounds.h - moved.strokeWidth) / (moved.bounds.w - moved.strokeWidth);
    const outAspect = (out.bounds.h - out.strokeWidth) / (out.bounds.w - out.strokeWidth);
    expect(outAspect).toBeCloseTo(srcAspect, 6);
  });

  it('refuses a degenerate pen origin instead of producing NaN', () => {
    const dot = stroke({
      points: [{ x: 0.5, y: 0.5 }],
      bounds: pointsBounds([{ x: 0.5, y: 0.5 }], 0),
      strokeWidth: 0,
    });
    const out = resizeAnnotation(dot, 'se', 0.9, 0.9, A);
    expect(out).toBe(dot);
  });
});

describe('rotateSignature', () => {
  it('is 0° when the pointer is straight above the centre', () => {
    const s = sig();
    const h = (s.w * s.aspect) / A;
    const out = rotateSignature(s, s.x + s.w / 2, s.y + h / 2 - 0.2, A);
    expect(out.rotation).toBeCloseTo(0, 6);
  });

  it('snaps to 15° steps near them but stays free between', () => {
    const s = sig();
    const h = (s.w * s.aspect) / A;
    const cx = s.x + s.w / 2;
    const cy = s.y + h / 2;
    // Pointer to the right of centre → 90°.
    expect(rotateSignature(s, cx + 0.2, cy, A).rotation).toBeCloseTo(90, 6);
    // A deliberately off-snap angle survives.
    const odd = rotateSignature(s, cx + 0.2, cy - 0.05, A).rotation ?? 0;
    expect(odd % 15).not.toBeCloseTo(0, 6);
  });

  it('normalizes into 0..360 and leaves a centred pointer alone', () => {
    const s = sig();
    const h = (s.w * s.aspect) / A;
    const out = rotateSignature(s, s.x + s.w / 2, s.y + h / 2, A);
    expect(out).toBe(s);
    for (const [px, py] of [
      [0.9, 0.9],
      [0.01, 0.9],
      [0.01, 0.01],
    ] as const) {
      const r = rotateSignature(s, px, py, A).rotation ?? 0;
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(360);
    }
  });

  it('rotation widens the hit box via the rotated AABB', () => {
    const flat = sig({ w: 0.4, aspect: 0.25 });
    const turned = { ...flat, rotation: 90 };
    expect(annotationBounds(turned, A).w).toBeLessThan(annotationBounds(flat, A).w);
    expect(annotationBounds(turned, A).h).toBeGreaterThan(annotationBounds(flat, A).h);
  });
});

describe('handlesFor / handleAt', () => {
  const PAD = 0.01;
  const R = 0.03;

  it('offers 8 handles on a box and only corners on text and signatures', () => {
    expect(handlesFor(box(), A, PAD).map((h) => h.id).sort()).toEqual(
      ['e', 'n', 'ne', 'nw', 's', 'se', 'sw', 'w'].sort()
    );
    expect(handlesFor(label(), A, PAD).map((h) => h.id).sort()).toEqual(
      ['ne', 'nw', 'se', 'sw'].sort()
    );
    expect(handlesFor(sig(), A, PAD).map((h) => h.id)).toContain('rotate');
  });

  it('puts line handles on the endpoints, not on the bounding box', () => {
    const line: Annotation = {
      id: 'l1',
      kind: 'arrow',
      x1: 0.1,
      y1: 0.3,
      x2: 0.4,
      y2: 0.1,
      color: '#111111',
      strokeWidth: 0.006,
    };
    expect(handlesFor(line, A, PAD)).toEqual([
      { id: 'p1', x: 0.1, y: 0.3 },
      { id: 'p2', x: 0.4, y: 0.1 },
    ]);
  });

  it('degrades to fewer handles when they would overlap, and zoom brings them back', () => {
    // Derived exactly as the editor derives them, so this pins the real
    // relationship rather than arbitrary numbers: px thresholds divided by
    // (display width × zoom).
    const DISP_W = 400;
    const padFor = (zoom: number) => HANDLE_GAP_PX / (DISP_W * zoom);
    const sepFor = (zoom: number) => HANDLE_MIN_SEP_PX / (DISP_W * zoom);

    const tiny = box({ w: 0.02, h: 0.02 }); // 8px wide at 1×
    expect(handlesFor(tiny, A, padFor(1), sepFor(1))).toEqual([
      expect.objectContaining({ id: 'se' }),
    ]);

    // Pinching in is the escape hatch: at 8× the same annotation is 64px
    // wide, so its corners separate and become grabbable.
    expect(handlesFor(tiny, A, padFor(8), sepFor(8)).length).toBeGreaterThan(1);

    // A comfortably large annotation always gets the full set.
    expect(handlesFor(box(), A, padFor(1), sepFor(1))).toHaveLength(8);
  });

  it('picks the NEAREST handle, not the first in the array', () => {
    const b = box();
    const hs = handlesFor(b, A, PAD);
    const se = hs.find((h) => h.id === 'se')!;
    expect(handleAt(b, se.x, se.y, A, R, PAD)).toBe('se');
    const nw = hs.find((h) => h.id === 'nw')!;
    expect(handleAt(b, nw.x, nw.y, A, R, PAD)).toBe('nw');
  });

  it('misses when the pointer is outside the hit radius', () => {
    expect(handleAt(box(), 0.35, 0.3, A, 0.01, PAD)).toBeNull();
  });

  it('measures the hit disc in SCREEN space, not normalized space', () => {
    // A pointer one radius below a handle in normalized-y is FURTHER than one
    // radius away on screen (y compresses by pageAspect), so it must miss.
    const b = box();
    const se = handlesFor(b, A, PAD).find((h) => h.id === 'se')!;
    expect(handleAt(b, se.x, se.y + R * 0.9, A, R, PAD)).toBeNull();
    expect(handleAt(b, se.x + R * 0.9, se.y, A, R, PAD)).toBe('se');
  });
});

describe('restyleAnnotation', () => {
  it('changes ink without touching geometry', () => {
    const b = box();
    const out = restyleAnnotation(b, { color: '#2f6fd4', opacity: 0.5, strokeWidth: 0.02 });
    if (out.kind !== 'rect') throw new Error('kind changed');
    expect(out.color).toBe('#2f6fd4');
    expect(out.opacity).toBe(0.5);
    expect(out.strokeWidth).toBe(0.02);
    expect([out.x, out.y, out.w, out.h]).toEqual([b.x, b.y, b.w, b.h]);
  });

  it('clamps opacity and leaves inkless kinds untouched', () => {
    const b = box();
    expect((restyleAnnotation(b, { opacity: 5 }) as BoxAnnotation).opacity).toBe(1);
    expect((restyleAnnotation(b, { opacity: -5 }) as BoxAnnotation).opacity).toBe(0);
    const s = sig();
    expect(restyleAnnotation(s, { color: '#ff0000' })).toBe(s);
  });

  it('ignores strokeWidth on kinds that have none', () => {
    const out = restyleAnnotation(label(), { strokeWidth: 0.05 });
    expect('strokeWidth' in out).toBe(false);
  });
});

describe('arrowHead', () => {
  it('places both head points behind the tip', () => {
    const h = arrowHead(0, 0.5, 1, 0.5, 0.05);
    expect(h.hx1).toBeLessThan(1);
    expect(h.hx2).toBeLessThan(1);
    // Symmetric around the shaft.
    expect(h.hy1 + h.hy2).toBeCloseTo(1, 10);
  });

  it('degenerate arrows point right instead of NaN', () => {
    const h = arrowHead(0.5, 0.5, 0.5, 0.5);
    expect(Number.isNaN(h.hx1)).toBe(false);
    expect(h.hx1).toBeLessThan(0.5);
  });
});

describe('pointsToSvgPath', () => {
  it('scales and offsets into the caller pixel space', () => {
    const svg = pointsToSvgPath(
      [
        { x: 0.5, y: 0.5 },
        { x: 1, y: 1 },
      ],
      100,
      200,
      0.1,
      0
    );
    expect(svg).toBe('M60.00 100.00 L110.00 200.00');
  });

  it('empty points yield an empty path', () => {
    expect(pointsToSvgPath([])).toBe('');
  });
});

// sortedImageEntries (annotate/zip.ts) is app-only (expo/fflate); its tests stay in the app.

describe('shouldFlushDraft (Phase 17 frame batching)', () => {
  it('flushes at most once per frame window', () => {
    expect(shouldFlushDraft(1000, 0)).toBe(true);
    expect(shouldFlushDraft(1010, 1000)).toBe(false);
    expect(shouldFlushDraft(1016, 1000)).toBe(true);
    expect(shouldFlushDraft(1008, 1000, 8)).toBe(true);
  });
});
