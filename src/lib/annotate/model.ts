// NOTE: ported from fyredocs_app/src/lib/annotate/model.ts — keep in sync.
/**
 * Annotation data model (Phase 7). PURE — no native imports, fully
 * unit-tested. All geometry is NORMALIZED 0..1 against the page image's
 * pixel grid (the CornerEditor convention): annotations survive the
 * preview→export resolution change and any letterboxing math stays in the
 * view layer. Stroke widths and font sizes are fractions of the page WIDTH
 * for the same reason. Z-order is array position (later = on top).
 */

export type AnnotationKind =
  | 'pen'
  | 'highlight'
  | 'underline'
  | 'strike'
  | 'rect'
  | 'ellipse'
  | 'arrow'
  | 'text'
  | 'note'
  | 'stamp'
  | 'date'
  | 'signature'
  | 'blur'
  | 'redact';

interface AnnotationBase {
  id: string;
  kind: AnnotationKind;
}

/**
 * Ink alpha, 0..1. OPTIONAL by design (Phase 7): undefined means fully
 * opaque, so annotations written before the colour picker existed keep
 * parsing untouched — annotationsJson validates required fields and passes
 * the object through, so an optional field needs no schema bump. Highlight
 * keeps its own baked 0.4 and ignores this.
 */
interface Inked {
  opacity?: number;
}

export interface Pt {
  x: number;
  y: number;
}

/** Freehand stroke. Sampled points stay in the model (not a baked SVG
 *  string) so display and bake can each emit a path in THEIR pixel space —
 *  scaling a normalized path via canvas transforms would distort stroke
 *  width, because x and y normalize against different page dimensions.
 *  Moves accumulate in dx/dy. Highlight renders wide + translucent with
 *  multiply blending; pen renders opaque. */
export interface PathAnnotation extends AnnotationBase, Inked {
  kind: 'pen' | 'highlight';
  points: Pt[];
  /** Post-draw translation, applied by renderer and baker alike. */
  dx: number;
  dy: number;
  color: string;
  strokeWidth: number;
  /** Stroke bounds INCLUDING dx/dy (kept in sync by moveAnnotation). */
  bounds: Rect;
}

export interface LineAnnotation extends AnnotationBase, Inked {
  kind: 'underline' | 'strike' | 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth: number;
}

export interface BoxAnnotation extends AnnotationBase, Inked {
  kind: 'rect' | 'ellipse';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth: number;
}

/** text = plain label; note = sticky card behind the text; stamp/date =
 *  bordered uppercase label (date defaults to today, editable). */
export interface TextAnnotation extends AnnotationBase, Inked {
  kind: 'text' | 'note' | 'stamp' | 'date';
  x: number;
  y: number;
  text: string;
  color: string;
  /** Text height as a fraction of page width. */
  fontScale: number;
}

export interface SignatureAnnotation extends AnnotationBase {
  kind: 'signature';
  x: number;
  y: number;
  /** Width as a fraction of page width; height derives from aspect. */
  w: number;
  /** Stored signature PNG height/width ratio. */
  aspect: number;
  /** Library-relative path of the signature PNG (signatures store). */
  sigRelPath: string;
  /**
   * Degrees clockwise about the centre. OPTIONAL — undefined = unrotated, so
   * signatures placed before Phase 7's handles keep parsing. Rotated
   * signatures are FLATTEN-ONLY: `pdfAnnots` writes axis-aligned /Rect
   * appearance streams, so `computeAnnotateBlocked` refuses annotation-mode
   * saving rather than silently dropping the rotation.
   */
  rotation?: number;
}

/** blur = Gaussian over the region at bake (pixel privacy, not markup);
 *  redact = opaque black — TRUE removal because the exported page is raster. */
export interface RegionAnnotation extends AnnotationBase {
  kind: 'blur' | 'redact';
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Annotation =
  | PathAnnotation
  | LineAnnotation
  | BoxAnnotation
  | TextAnnotation
  | SignatureAnnotation
  | RegionAnnotation;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const STAMP_PRESETS = ['APPROVED', 'REJECTED', 'DRAFT', 'CONFIDENTIAL'] as const;

// Defaults, all normalized against page width.
export const DEFAULT_STROKE = 0.006;
export const HIGHLIGHT_STROKE = 0.035;
export const DEFAULT_FONT_SCALE = 0.035;
/** Estimated glyph width : height ratio for the system font — used only for
 *  hit-test/render box estimation, never for layout-critical math. */
export const TEXT_ASPECT = 0.55;
/** Default signature width as a fraction of page width. */
export const DEFAULT_SIGNATURE_W = 0.3;

let counter = 0;
/** Annotation id. Since Phase 15 these persist (draft rows, `/NM` keys in
 *  saved PDFs, exports) — the timestamp prefix keeps them unique across
 *  sessions; the counter keeps them unique within one. */
export const annotationId = (): string => {
  counter += 1;
  return `a${Date.now().toString(36)}-${counter}`;
};

/** Draft re-render throttle (Phase 17): pan events arrive at digitizer rate
 *  (120–240 Hz) but a React+Skia re-render per event buys nothing over one
 *  per frame. Points still accumulate per event in the draft ref — only the
 *  setState flush is capped. */
export const shouldFlushDraft = (nowMs: number, lastFlushMs: number, frameMs = 16): boolean =>
  nowMs - lastFlushMs >= frameMs;

/** Normalizes a drag from (x1,y1) to (x2,y2) into a positive-size rect. */
export const dragRect = (x1: number, y1: number, x2: number, y2: number): Rect => ({
  x: Math.min(x1, x2),
  y: Math.min(y1, y2),
  w: Math.abs(x2 - x1),
  h: Math.abs(y2 - y1),
});

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Converts a WIDTH-fraction length into a normalized HEIGHT.
 *
 * `w`, `fontScale` and `strokeWidth` are all fractions of page WIDTH (see the
 * file header), but a Rect's `h` is normalized against page HEIGHT — so a
 * width fraction must be divided by the page aspect before it can be stored
 * as one. Getting this wrong makes boxes ~41% too tall on A4.
 * `pdfAnnots.textModelRect` has always done this via its rw/rh ratio; this is
 * the same conversion, back-ported to the model so preview, bake and PDF
 * finally agree.
 */
const asHeight = (widthFraction: number, pageAspect: number): number =>
  widthFraction / (pageAspect || 1);

/** Estimated text box for a text-ish annotation (x,y = top-left).
 *  `pageAspect` = rendered page height / width. */
export const textBounds = (a: TextAnnotation, pageAspect: number): Rect => ({
  x: a.x,
  y: a.y,
  w: Math.max(0.02, a.text.length * a.fontScale * TEXT_ASPECT),
  h: asHeight(a.fontScale * 1.4, pageAspect),
});

/** Axis-aligned bounds of a rect rotated `deg` about its centre. Rotation is
 *  a SCREEN transform, so the math happens in square space (both axes in
 *  page-width units) and converts back at the end. */
export const rotatedRectBounds = (r: Rect, deg: number, pageAspect: number): Rect => {
  if (!deg) return r;
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  // Half-extents in square space (page-width units on both axes).
  const hw = r.w / 2;
  const hh = (r.h * pageAspect) / 2;
  const rw = hw * cos + hh * sin;
  const rh = hw * sin + hh * cos;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const outW = rw * 2;
  const outH = asHeight(rh * 2, pageAspect);
  return { x: cx - outW / 2, y: cy - outH / 2, w: outW, h: outH };
};

/** Bounding box of any annotation, for hit-testing and selection outlines.
 *  `pageAspect` = rendered page height / width — REQUIRED, because several
 *  kinds store width-fraction sizes that only become heights through it. */
export const annotationBounds = (a: Annotation, pageAspect: number): Rect => {
  switch (a.kind) {
    case 'pen':
    case 'highlight':
      return a.bounds;
    case 'underline':
    case 'strike':
    case 'arrow':
      return dragRect(a.x1, a.y1, a.x2, a.y2);
    case 'rect':
    case 'ellipse':
    case 'blur':
    case 'redact':
      return { x: a.x, y: a.y, w: a.w, h: a.h };
    case 'text':
    case 'note':
    case 'stamp':
    case 'date':
      return textBounds(a, pageAspect);
    case 'signature': {
      const base = { x: a.x, y: a.y, w: a.w, h: asHeight(a.w * a.aspect, pageAspect) };
      return a.rotation ? rotatedRectBounds(base, a.rotation, pageAspect) : base;
    }
  }
};

/** Topmost annotation whose (slop-expanded) bounds contain the point, or
 *  null. Later array entries win — they render on top. */
export const annotationAt = (
  list: Annotation[],
  x: number,
  y: number,
  pageAspect: number,
  slop = 0.015
): Annotation | null => {
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const b = annotationBounds(list[i], pageAspect);
    if (x >= b.x - slop && x <= b.x + b.w + slop && y >= b.y - slop && y <= b.y + b.h + slop) {
      return list[i];
    }
  }
  return null;
};

/**
 * Returns a moved copy, clamped so the annotation cannot leave the page.
 *
 * `origin` is the annotation as it was when the drag STARTED and (dx, dy) is
 * the TOTAL delta since then — not a per-event increment. That distinction is
 * the whole point: clamping an increment discards the excess, so dragging
 * past an edge and back never retraces the pointer and the annotation
 * silently desyncs from the finger. Recomputing from the origin every frame
 * makes the result a pure function of the pointer, so a move that hits an
 * edge sticks there and resumes exactly when the finger comes back.
 */
export const moveAnnotation = (
  origin: Annotation,
  dx: number,
  dy: number,
  pageAspect: number
): Annotation => {
  const a = origin;
  // Text boxes clamp position only: their bounds are a glyph-width ESTIMATE,
  // so clamping the right/bottom edge against it would fight the user over a
  // number that is approximate by construction.
  if (a.kind === 'text' || a.kind === 'note' || a.kind === 'stamp' || a.kind === 'date') {
    return { ...a, x: clamp01(a.x + dx), y: clamp01(a.y + dy) };
  }
  const b = annotationBounds(a, pageAspect);
  const cdx = Math.min(Math.max(dx, -b.x), Math.max(0, 1 - (b.x + b.w)));
  const cdy = Math.min(Math.max(dy, -b.y), Math.max(0, 1 - (b.y + b.h)));
  switch (a.kind) {
    case 'pen':
    case 'highlight':
      return {
        ...a,
        dx: a.dx + cdx,
        dy: a.dy + cdy,
        bounds: { ...a.bounds, x: a.bounds.x + cdx, y: a.bounds.y + cdy },
      };
    case 'underline':
    case 'strike':
    case 'arrow':
      return { ...a, x1: a.x1 + cdx, y1: a.y1 + cdy, x2: a.x2 + cdx, y2: a.y2 + cdy };
    default:
      // rect / ellipse / blur / redact / signature all carry a plain top-left.
      return { ...a, x: a.x + cdx, y: a.y + cdy };
  }
};

/** The two arrow-head segment endpoints for a line ending at (x2,y2). Head
 *  size is normalized; degenerate (zero-length) arrows point right. */
export const arrowHead = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size = 0.02
): { hx1: number; hy1: number; hx2: number; hy2: number } => {
  let angle = Math.atan2(y2 - y1, x2 - x1);
  if (x1 === x2 && y1 === y2) angle = 0;
  const spread = Math.PI / 7;
  return {
    hx1: x2 - size * Math.cos(angle - spread),
    hy1: y2 - size * Math.sin(angle - spread),
    hx2: x2 - size * Math.cos(angle + spread),
    hy2: y2 - size * Math.sin(angle + spread),
  };
};

/** Builds an SVG path from sampled points, scaled into the caller's pixel
 *  space and offset by (dx, dy) in NORMALIZED units. Move + line segments —
 *  smoothing happens visually via round stroke joins, not path math. */
export const pointsToSvgPath = (points: Pt[], sx = 1, sy = 1, dx = 0, dy = 0): string => {
  if (points.length === 0) return '';
  const emit = (p: Pt) => `${((p.x + dx) * sx).toFixed(2)} ${((p.y + dy) * sy).toFixed(2)}`;
  const [first, ...rest] = points;
  const parts = [`M${emit(first)}`];
  for (const p of rest) {
    parts.push(`L${emit(p)}`);
  }
  return parts.join(' ');
};

// ── Selection handles: resize + rotate (Phase 7) ──────────────────────────
//
// Every resize takes the ORIGIN annotation (as it was at gesture start) plus
// the pointer's ABSOLUTE position, for the same reason moveAnnotation does.
// Sizes are clamped by moving the dragged edge against its anchor — never by
// building a rect and clamping its size, because dragRect takes Math.abs, so
// the naive version lets a drag past the opposite edge flip the annotation
// inside out and teleport the handle across it.

export type HandleId =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'p1'
  | 'p2'
  | 'rotate';

export interface Handle {
  id: HandleId;
  /** Normalized page coords. */
  x: number;
  y: number;
}

export const MIN_BOX_W = 0.01;
export const MIN_BOX_H = 0.01;
export const MIN_SIGNATURE_W = 0.03;
export const MIN_FONT_SCALE = 0.008;
export const MAX_FONT_SCALE = 0.3;
export const MIN_LINE_LEN = 0.01;
/** Pen/highlight resize clamps the SCALE FACTOR, not the resulting bounds:
 *  clamping bounds lets a stroke collapse toward zero extent and become
 *  permanently un-resizable (every later scale divides by ~0). */
export const MIN_PEN_SCALE = 0.1;
export const MAX_PEN_SCALE = 10;
/** Gap between the rotate knob and the top edge, in page-width units. */
export const ROTATE_OFFSET = 0.06;

const CORNERS: HandleId[] = ['nw', 'ne', 'se', 'sw'];
const EDGES: HandleId[] = ['n', 'e', 's', 'w'];

/** Rotates (x, y) about (cx, cy) by `deg` clockwise, in SQUARE space (both
 *  axes in page-width units) so the rotation matches what is on screen. */
const rotatePt = (x: number, y: number, cx: number, cy: number, deg: number, pageAspect: number) => {
  if (!deg) return { x, y };
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const ox = x - cx;
  const oy = (y - cy) * pageAspect;
  return { x: cx + ox * cos - oy * sin, y: cy + asHeight(ox * sin + oy * cos, pageAspect) };
};

const cornerPoint = (b: Rect, id: HandleId): { x: number; y: number } => {
  const midX = b.x + b.w / 2;
  const midY = b.y + b.h / 2;
  switch (id) {
    case 'nw':
      return { x: b.x, y: b.y };
    case 'n':
      return { x: midX, y: b.y };
    case 'ne':
      return { x: b.x + b.w, y: b.y };
    case 'e':
      return { x: b.x + b.w, y: midY };
    case 'se':
      return { x: b.x + b.w, y: b.y + b.h };
    case 's':
      return { x: midX, y: b.y + b.h };
    case 'sw':
      return { x: b.x, y: b.y + b.h };
    default:
      return { x: b.x, y: midY };
  }
};

/**
 * Handles this annotation exposes, on bounds inflated by `padX` (page-width
 * units) so a small annotation still has separable corners.
 *
 * `minSepX` degrades the set rather than rendering handles that overlap: below
 * two separations the edge handles go, below one only `se` survives. Zoom is
 * the real escape hatch — the caller divides padX/minSepX by the zoom scale,
 * so pinching in separates handles in page space.
 */
export const handlesFor = (
  a: Annotation,
  pageAspect: number,
  padX: number,
  minSepX = 0
): Handle[] => {
  if (a.kind === 'underline' || a.kind === 'strike' || a.kind === 'arrow') {
    return [
      { id: 'p1', x: a.x1, y: a.y1 },
      { id: 'p2', x: a.x2, y: a.y2 },
    ];
  }
  const raw = annotationBounds(a, pageAspect);
  const padY = asHeight(padX, pageAspect);
  const b: Rect = {
    x: raw.x - padX,
    y: raw.y - padY,
    w: raw.w + padX * 2,
    h: raw.h + padY * 2,
  };

  let ids: HandleId[];
  if (b.w < minSepX) ids = ['se'];
  else if (b.w < minSepX * 2 || a.kind === 'signature' || isTextKind(a)) ids = CORNERS;
  else ids = [...CORNERS, ...EDGES];

  const out = ids.map((id) => ({ id, ...cornerPoint(b, id) }));

  if (a.kind === 'signature') {
    out.push({ id: 'rotate', x: b.x + b.w / 2, y: b.y - asHeight(ROTATE_OFFSET, pageAspect) });
    if (a.rotation) {
      // Handles ride the rotation, so they stay on the artwork's corners.
      const cx = raw.x + raw.w / 2;
      const cy = raw.y + raw.h / 2;
      return out.map((h) => ({ id: h.id, ...rotatePt(h.x, h.y, cx, cy, a.rotation ?? 0, pageAspect) }));
    }
  }
  return out;
};

const isTextKind = (a: Annotation): a is TextAnnotation =>
  a.kind === 'text' || a.kind === 'note' || a.kind === 'stamp' || a.kind === 'date';

/**
 * Nearest handle within `radiusX` (page-width units), or null. The y delta is
 * scaled by `pageAspect` so the hit disc is ROUND ON SCREEN — x and y
 * normalize against different page dimensions, so comparing them raw would
 * give an oval target. Ties resolve by distance, never by array order.
 */
export const handleAt = (
  a: Annotation,
  x: number,
  y: number,
  pageAspect: number,
  radiusX: number,
  padX: number,
  minSepX = 0
): HandleId | null => {
  let best: HandleId | null = null;
  let bestD = radiusX * radiusX;
  for (const h of handlesFor(a, pageAspect, padX, minSepX)) {
    const dx = x - h.x;
    const dy = (y - h.y) * pageAspect;
    const d = dx * dx + dy * dy;
    if (d <= bestD) {
      bestD = d;
      best = h.id;
    }
  }
  return best;
};

/** Resizes `origin` so the dragged handle follows the pointer. */
export const resizeAnnotation = (
  origin: Annotation,
  handle: HandleId,
  px: number,
  py: number,
  pageAspect: number
): Annotation => {
  const x = clamp01(px);
  const y = clamp01(py);

  if (origin.kind === 'underline' || origin.kind === 'strike' || origin.kind === 'arrow') {
    if (handle !== 'p1' && handle !== 'p2') return origin;
    const ax = handle === 'p1' ? origin.x2 : origin.x1;
    const ay = handle === 'p1' ? origin.y2 : origin.y1;
    // Keep a minimum length by pushing the moved end out along the drag
    // direction rather than collapsing it onto the anchor.
    let nx = x;
    let ny = y;
    const dx = nx - ax;
    const dy = (ny - ay) * pageAspect;
    const len = Math.hypot(dx, dy);
    if (len < MIN_LINE_LEN) {
      const ang = len === 0 ? 0 : Math.atan2(dy, dx);
      nx = ax + MIN_LINE_LEN * Math.cos(ang);
      ny = ay + asHeight(MIN_LINE_LEN * Math.sin(ang), pageAspect);
    }
    return handle === 'p1'
      ? { ...origin, x1: clamp01(nx), y1: clamp01(ny) }
      : { ...origin, x2: clamp01(nx), y2: clamp01(ny) };
  }

  const b = annotationBounds(origin, pageAspect);
  const west = handle === 'nw' || handle === 'w' || handle === 'sw';
  const east = handle === 'ne' || handle === 'e' || handle === 'se';
  const north = handle === 'nw' || handle === 'n' || handle === 'ne';
  const south = handle === 'sw' || handle === 's' || handle === 'se';

  if (origin.kind === 'rect' || origin.kind === 'ellipse' || origin.kind === 'blur' || origin.kind === 'redact') {
    let { x: nx, y: ny, w: nw, h: nh } = { x: origin.x, y: origin.y, w: origin.w, h: origin.h };
    if (west) {
      const anchor = origin.x + origin.w;
      nx = Math.min(x, anchor - MIN_BOX_W);
      nw = anchor - nx;
    } else if (east) {
      nw = Math.max(x, origin.x + MIN_BOX_W) - origin.x;
    }
    if (north) {
      const anchor = origin.y + origin.h;
      ny = Math.min(y, anchor - MIN_BOX_H);
      nh = anchor - ny;
    } else if (south) {
      nh = Math.max(y, origin.y + MIN_BOX_H) - origin.y;
    }
    return { ...origin, x: nx, y: ny, w: nw, h: nh };
  }

  if (origin.kind === 'signature') {
    // Corners only, aspect-locked: the model cannot express a free aspect, and
    // a stretched signature is a forged-looking signature.
    if (!CORNERS.includes(handle)) return origin;
    const anchorX = west ? b.x + b.w : b.x;
    const anchorY = north ? b.y + b.h : b.y;
    const fromX = Math.abs(x - anchorX);
    const fromY = (Math.abs(y - anchorY) * pageAspect) / (origin.aspect || 1);
    const w = Math.max(MIN_SIGNATURE_W, Math.max(fromX, fromY));
    const h = asHeight(w * origin.aspect, pageAspect);
    return {
      ...origin,
      w,
      x: west ? anchorX - w : anchorX,
      y: north ? anchorY - h : anchorY,
    };
  }

  if (isTextKind(origin)) {
    if (!CORNERS.includes(handle)) return origin;
    const anchorX = west ? b.x + b.w : b.x;
    const anchorY = north ? b.y + b.h : b.y;
    // textBounds masks an empty string with Math.max(0.02, …); the inverse
    // would divide by zero, so guard the glyph count directly.
    const glyphs = Math.max(1, origin.text.length) * TEXT_ASPECT;
    const fromX = Math.abs(x - anchorX) / glyphs;
    const fromY = (Math.abs(y - anchorY) * pageAspect) / 1.4;
    const fontScale = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, Math.max(fromX, fromY)));
    const next: TextAnnotation = { ...origin, fontScale };
    const nb = textBounds(next, pageAspect);
    return { ...next, x: west ? anchorX - nb.w : anchorX, y: north ? anchorY - nb.h : anchorY };
  }

  // pen / highlight — UNIFORM scale only. Non-uniform scaling makes
  // handwriting look font-stretched and leaves "what happens to strokeWidth"
  // unanswerable; a single factor scales the width cleanly too.
  if (origin.kind !== 'pen' && origin.kind !== 'highlight') return origin;
  if (!CORNERS.includes(handle)) return origin;
  const anchorX = west ? b.x + b.w : b.x;
  const anchorY = north ? b.y + b.h : b.y;
  const wideEnough = b.w > 1e-6;
  const tallEnough = b.h > 1e-6;
  const sx = wideEnough ? Math.abs(x - anchorX) / b.w : Number.NaN;
  const sy = tallEnough ? Math.abs(y - anchorY) / b.h : Number.NaN;
  const raw = Math.max(Number.isFinite(sx) ? sx : 0, Number.isFinite(sy) ? sy : 0);
  if (!Number.isFinite(raw) || raw <= 0) return origin;
  const s = Math.min(MAX_PEN_SCALE, Math.max(MIN_PEN_SCALE, raw));

  // dx/dy must be BAKED here: `bounds` already includes them, so scaling
  // about an anchor while they are still live double-counts the translation.
  const points = origin.points.map((p) => ({
    x: anchorX + (p.x + origin.dx - anchorX) * s,
    y: anchorY + (p.y + origin.dy - anchorY) * s,
  }));
  const strokeWidth = origin.strokeWidth * s;
  return { ...origin, points, dx: 0, dy: 0, strokeWidth, bounds: pointsBounds(points, strokeWidth) };
};

/** Rotates a signature so its rotate knob follows the pointer. Angle is
 *  measured in square space so it matches what the user sees, and snaps to
 *  15° steps within 3° to make upright and diagonal placement reachable. */
export const rotateSignature = (
  origin: SignatureAnnotation,
  px: number,
  py: number,
  pageAspect: number
): SignatureAnnotation => {
  const h = asHeight(origin.w * origin.aspect, pageAspect);
  const cx = origin.x + origin.w / 2;
  const cy = origin.y + h / 2;
  const dx = px - cx;
  const dy = (py - cy) * pageAspect;
  if (dx === 0 && dy === 0) return origin;
  // The knob sits above the top edge, so 0° is straight up.
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const snapped = Math.round(deg / 15) * 15;
  if (Math.abs(deg - snapped) <= 3) deg = snapped;
  const norm = ((deg % 360) + 360) % 360;
  return { ...origin, rotation: norm };
};

/** Applies a style patch without touching geometry. Kinds that carry no ink
 *  (blur, redact, signature) are returned unchanged. */
export const restyleAnnotation = (
  a: Annotation,
  patch: { color?: string; opacity?: number; strokeWidth?: number }
): Annotation => {
  if (a.kind === 'blur' || a.kind === 'redact' || a.kind === 'signature') return a;
  const next = { ...a } as Annotation & { color: string; opacity?: number; strokeWidth?: number };
  if (patch.color !== undefined) next.color = patch.color;
  if (patch.opacity !== undefined) next.opacity = Math.min(1, Math.max(0, patch.opacity));
  if (patch.strokeWidth !== undefined && 'strokeWidth' in a) {
    next.strokeWidth = Math.max(0.0005, patch.strokeWidth);
  }
  return next;
};

/** Bounding box of sampled stroke points, padded by half the stroke width. */
export const pointsBounds = (points: Pt[], strokeWidth: number): Rect => {
  if (points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const pad = strokeWidth / 2;
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: maxX - minX + strokeWidth,
    h: maxY - minY + strokeWidth,
  };
};
