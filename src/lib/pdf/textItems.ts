/**
 * pdf.js text items → the normalized geometry oracleMath.ts expects.
 *
 * NOTE: mirrors DRIVER_JS in fyredocs_app/src/lib/pdf/oracle/PdfOracleHost.tsx
 * (baseline start/end + the glyph-top corner, mapped through
 * viewport.transform and normalized 0..1). The join rule is oracleMath's
 * joinItems — offsets and highlight rects are only valid against that string.
 */
import { joinItems, type JoinedText, type OracleItem } from './oracle/oracleMath';

/** The fields of a pdf.js TextItem this mapping reads. */
export interface RawTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
}

/** Cap per page, as in the app: pathological pages must not explode memory. */
export const MAX_ITEMS_PER_PAGE = 5000;

const apply = (p: [number, number], m: number[]): [number, number] => [
  m[0] * p[0] + m[2] * p[1] + m[4],
  m[1] * p[0] + m[3] * p[1] + m[5],
];

export interface PageTextLayer extends JoinedText {
  items: OracleItem[];
}

/**
 * `viewportTransform` and `vw`/`vh` come from page.getViewport({ scale: 1 }),
 * so /Rotate and the y-flip are applied exactly as the renderer draws.
 */
export const textLayerFrom = (
  raw: RawTextItem[],
  viewportTransform: number[],
  vw: number,
  vh: number
): PageTextLayer => {
  const items: OracleItem[] = [];
  for (const it of raw) {
    if (items.length >= MAX_ITEMS_PER_PAGE) break;
    if (typeof it.str !== 'string') continue;
    const T = it.transform;
    const sx = Math.hypot(T[0], T[1]) || 1;
    const sy = Math.hypot(T[2], T[3]) || 1;
    const b: [number, number] = [T[4], T[5]];
    const e: [number, number] = [T[4] + (T[0] / sx) * it.width, T[5] + (T[1] / sx) * it.width];
    const t: [number, number] = [T[4] + (T[2] / sy) * it.height, T[5] + (T[3] / sy) * it.height];
    const B = apply(b, viewportTransform);
    const E = apply(e, viewportTransform);
    const P = apply(t, viewportTransform);
    items.push({
      str: it.str,
      bx: B[0] / vw,
      by: B[1] / vh,
      ex: E[0] / vw,
      ey: E[1] / vh,
      tx: P[0] / vw,
      ty: P[1] / vh,
      eol: !!it.hasEOL,
    });
  }
  return { items, ...joinItems(items) };
};
