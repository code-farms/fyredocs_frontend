// NOTE: ported from fyredocs_app/src/lib/annotate/pageSpace.ts — keep in sync.
/**
 * Coordinate mapping between the annotation model and PDF user space
 * (Phase 15). PURE — pdf-lib types only, Node-testable.
 *
 * Model space: normalized 0..1 against the RENDERED page (i.e. after the
 * stored /Rotate is applied), origin top-left, y down — the CornerEditor
 * convention the whole annotate flow uses. PDF user space: points, origin
 * at the MediaBox lower-left, y up, UNROTATED. So the mapping scales,
 * flips y, and inverts the page rotation.
 *
 * Rotation table (derived from the viewer's clockwise /Rotate and corner-
 * verified in pageSpace.test.ts): with page MediaBox W×H, display point
 * (dx, dy) in points on the rendered image, page-relative (a, b) with b up:
 *   /Rotate 0:   a = dx,      b = H − dy
 *   /Rotate 90:  a = dy,      b = dx
 *   /Rotate 180: a = W − dx,  b = dy
 *   /Rotate 270: a = W − dy,  b = H − dx
 */

import type { PDFDocument } from 'pdf-lib';

export interface PageGeom {
  mediaBox: { x: number; y: number; width: number; height: number };
  /** Stored /Rotate, normalized to 0/90/180/270. */
  rotation: 0 | 90 | 180 | 270;
}

/** Rendered (post-rotation) page size in points. */
export const renderedSize = (g: PageGeom): { width: number; height: number } =>
  g.rotation === 90 || g.rotation === 270
    ? { width: g.mediaBox.height, height: g.mediaBox.width }
    : { width: g.mediaBox.width, height: g.mediaBox.height };

/** Normalized model point → PDF user-space point. */
export const toPdf = (g: PageGeom, nx: number, ny: number): { u: number; v: number } => {
  const { width: rw, height: rh } = renderedSize(g);
  const dx = nx * rw;
  const dy = ny * rh;
  const { width: W, height: H } = g.mediaBox;
  let a: number;
  let b: number;
  switch (g.rotation) {
    case 90:
      a = dy;
      b = dx;
      break;
    case 180:
      a = W - dx;
      b = dy;
      break;
    case 270:
      a = W - dy;
      b = H - dx;
      break;
    default:
      a = dx;
      b = H - dy;
  }
  return { u: g.mediaBox.x + a, v: g.mediaBox.y + b };
};

/** PDF user-space point → normalized model point (exact inverse of toPdf). */
export const fromPdf = (g: PageGeom, u: number, v: number): { nx: number; ny: number } => {
  const a = u - g.mediaBox.x;
  const b = v - g.mediaBox.y;
  const { width: W, height: H } = g.mediaBox;
  let dx: number;
  let dy: number;
  switch (g.rotation) {
    case 90:
      dx = b;
      dy = a;
      break;
    case 180:
      dx = W - a;
      dy = b;
      break;
    case 270:
      dx = H - b;
      dy = W - a;
      break;
    default:
      dx = a;
      dy = H - b;
  }
  const { width: rw, height: rh } = renderedSize(g);
  return { nx: dx / Math.max(1e-9, rw), ny: dy / Math.max(1e-9, rh) };
};

/** Width-fraction (the model's strokeWidth/fontScale convention: fraction
 *  of the RENDERED page width) → points. */
export const widthFracToPt = (g: PageGeom, frac: number): number =>
  frac * renderedSize(g).width;

export const ptToWidthFrac = (g: PageGeom, pt: number): number =>
  pt / Math.max(1e-9, renderedSize(g).width);

/** Normalized model rect → PDF Rect [x1, y1, x2, y2] (corners sorted —
 *  rotation permutes them). */
export const rectToPdf = (
  g: PageGeom,
  r: { x: number; y: number; w: number; h: number }
): [number, number, number, number] => {
  const p1 = toPdf(g, r.x, r.y);
  const p2 = toPdf(g, r.x + r.w, r.y + r.h);
  return [Math.min(p1.u, p2.u), Math.min(p1.v, p2.v), Math.max(p1.u, p2.u), Math.max(p1.v, p2.v)];
};

/** PDF Rect → normalized model rect (inverse of rectToPdf). */
export const rectFromPdf = (
  g: PageGeom,
  rect: [number, number, number, number]
): { x: number; y: number; w: number; h: number } => {
  const p1 = fromPdf(g, rect[0], rect[1]);
  const p2 = fromPdf(g, rect[2], rect[3]);
  const x = Math.min(p1.nx, p2.nx);
  const y = Math.min(p1.ny, p2.ny);
  return { x, y, w: Math.abs(p2.nx - p1.nx), h: Math.abs(p2.ny - p1.ny) };
};

const normalizeRotation = (angle: number): PageGeom['rotation'] => {
  const r = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  return (r === 90 || r === 180 || r === 270 ? r : 0) as PageGeom['rotation'];
};

/** Geometry for every page of a loaded document — the only place that
 *  touches MediaBox offsets, so callers never re-derive them. */
export const pageGeometries = (doc: PDFDocument): PageGeom[] =>
  doc.getPages().map((page) => {
    const mb = page.getMediaBox();
    return {
      mediaBox: { x: mb.x, y: mb.y, width: mb.width, height: mb.height },
      rotation: normalizeRotation(page.getRotation().angle),
    };
  });
