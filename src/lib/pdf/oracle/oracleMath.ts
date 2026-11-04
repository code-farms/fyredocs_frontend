// NOTE: ported from fyredocs_app/src/lib/pdf/oracle/oracleMath.ts — keep in sync.
/**
 * Pure math for the pdf.js text oracle (Phases 9/12). Node-testable — this
 * module must never import anything that reaches pdfjsSource.gen.ts (1.8 MB),
 * or every jest run pays for it.
 *
 * Coordinate facts everything rests on:
 *
 * - Oracle geometry is normalized 0..1 against the RENDERED page (top-left
 *   origin, y-down, /Rotate applied) — deliberately the same space as
 *   `lib/annotate/pageSpace.ts`, so a rect could later feed a real
 *   /Highlight annotation unchanged.
 * - Items carry their baseline START and END plus the TOP corner at the
 *   start, not direction vectors. Normalizing x by page width and y by page
 *   height is anisotropic, which mangles unit vectors — but it is a linear
 *   map, and linear interpolation commutes with linear maps, so
 *   lerp(start, end, t) lands exactly where the same lerp in pixel space
 *   would. That one fact makes sub-item rects correct under any /Rotate or
 *   in-page rotation with three stored points per item.
 * - pdf.js text items carry no inter-item spaces and split mid-word, so
 *   matching MUST run against the joined page string (`joinItems`), never
 *   per item — a per-item indexOf misses every match that straddles a run.
 */

export interface OracleItem {
  str: string;
  /** Baseline start, normalized 0..1, y-down. */
  bx: number;
  by: number;
  /** Baseline end (start of the run's last advance ends here). */
  ex: number;
  ey: number;
  /** The glyph-top corner ABOVE the baseline start — (tx-bx, ty-by) is the
   *  run's "up" edge, carried as a point so it survives normalization. */
  tx: number;
  ty: number;
  eol: boolean;
}

export interface JoinedText {
  text: string;
  /** text offset where items[i].str begins; length === items.length. */
  offsets: number[];
}

/**
 * ONE explicit join rule, shared by the WebView page script and this module's
 * offset math: items concatenate directly; an item marked eol appends a
 * single space. The rule exists so `offsets` can be reconstructed exactly on
 * either side of the bridge — change it in both places or in neither.
 */
export const joinItems = (items: { str: string; eol: boolean }[]): JoinedText => {
  const offsets: number[] = [];
  let text = '';
  for (const item of items) {
    offsets.push(text.length);
    text += item.str;
    if (item.eol) text += ' ';
  }
  return { text, offsets };
};

export interface NormalizedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Maps a character range [start, end) of the JOINED page text onto normalized
 * rects — one rect per touched item, which is also what makes a match that
 * wraps across lines look right.
 *
 * A sub-item range interpolates `t = chars / str.length` uniformly along the
 * baseline: exact for monospace, close for body text, and the honest limit
 * for heavily kerned or justified lines (pdf.js exposes no per-glyph advances
 * without building its DOM text layer — documented upgrade path, not v1).
 */
export const rectsForRange = (
  items: OracleItem[],
  offsets: number[],
  start: number,
  end: number
): NormalizedRect[] => {
  if (end <= start || items.length === 0 || offsets.length !== items.length) return [];
  const out: NormalizedRect[] = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const itemStart = offsets[i];
    const itemEnd = itemStart + item.str.length;
    if (itemEnd <= start || itemStart >= end) continue;
    const L = item.str.length;
    if (L === 0) continue;

    const t0 = Math.max(0, (start - itemStart) / L);
    const t1 = Math.min(1, (end - itemStart) / L);
    if (t1 <= t0) continue;

    // lerp along the baseline, then raise both points by the up edge.
    const upX = item.tx - item.bx;
    const upY = item.ty - item.by;
    const p0x = item.bx + (item.ex - item.bx) * t0;
    const p0y = item.by + (item.ey - item.by) * t0;
    const p1x = item.bx + (item.ex - item.bx) * t1;
    const p1y = item.by + (item.ey - item.by) * t1;
    out.push(
      aabb(
        [p0x, p1x, p1x + upX, p0x + upX],
        [p0y, p1y, p1y + upY, p0y + upY]
      )
    );
  }
  return out;
};

const aabb = (xs: number[], ys: number[]): NormalizedRect => {
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
};

export interface ContainBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The drawn box of a `fit="contain"` image inside a container — the letterbox
 * inset the viewer's highlights must respect. The viewer sizes every page
 * cell from ONE document-wide aspect, so on a mixed-size document the bitmap
 * is inset within its cell and a rect placed against the container would sit
 * off the glyphs.
 */
export const containBox = (imgW: number, imgH: number, boxW: number, boxH: number): ContainBox => {
  if (imgW <= 0 || imgH <= 0 || boxW <= 0 || boxH <= 0) return { x: 0, y: 0, w: boxW, h: boxH };
  const s = Math.min(boxW / imgW, boxH / imgH);
  const w = imgW * s;
  const h = imgH * s;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
};

/** Places a normalized page rect into container pixels through the contain
 *  box. */
export const rectToContainer = (r: NormalizedRect, box: ContainBox): NormalizedRect => ({
  x: box.x + r.x * box.w,
  y: box.y + r.y * box.h,
  w: r.w * box.w,
  h: r.h * box.h,
});

/**
 * Heuristic for "the text layer is garbage" — predefined-CMap (CJK) documents
 * with no bundled cmaps decode to empty strings or replacement characters.
 * Used to fall back to OCR rather than storing junk.
 */
export const looksLikeGarbageText = (text: string): boolean => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  let bad = 0;
  for (const ch of trimmed) {
    const code = ch.codePointAt(0) ?? 0;
    // U+FFFD replacement char and C0 controls (except whitespace) are
    // decode-failure tells.
    if (code === 0xfffd || (code < 0x20 && ch !== '\n' && ch !== '\t' && ch !== '\r')) bad += 1;
  }
  return bad / trimmed.length > 0.2;
};
