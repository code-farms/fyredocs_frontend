// NOTE: ported from fyredocs_app/src/lib/annotate/pdfAnnotsRead.ts — keep in sync.
/**
 * /Annots → model reader (Phase 15). PURE pdf-lib, defensive by contract
 * (outlines.ts style): every annotation parses inside its own try/catch —
 * a malformed dict is skipped, never fatal, because reading annotations
 * back is a bonus on top of the stored bytes.
 *
 * Two paths per dict: our own annotations carry /FyreAnnot (the lossless
 * model JSON) and re-open exactly; foreign annotations (from Acrobat etc.)
 * reverse-map from standard fields into the nearest model kind — a visual
 * approximation, good enough to move/delete/re-save them.
 */

import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFString,
} from 'pdf-lib';

import { parseAnnotation } from '@/lib/annotate/annotationsJson';
import { FYRE_ANNOT_KEY } from '@/lib/annotate/pdfAnnots';
import {
  annotationId,
  DEFAULT_FONT_SCALE,
  DEFAULT_STROKE,
  pointsBounds,
  type Annotation,
  type Pt,
} from '@/lib/annotate/model';
import {
  fromPdf,
  pageGeometries,
  ptToWidthFrac,
  rectFromPdf,
  type PageGeom,
} from '@/lib/annotate/pageSpace';

const num = (v: unknown): number | null => (v instanceof PDFNumber ? v.asNumber() : null);

const numbers = (v: unknown): number[] | null => {
  if (!(v instanceof PDFArray)) return null;
  const out: number[] = [];
  for (const entry of v.asArray()) {
    const n = num(entry);
    if (n === null) return null;
    out.push(n);
  }
  return out;
};

const text = (v: unknown): string | null =>
  v instanceof PDFString || v instanceof PDFHexString ? v.decodeText() : null;

const rgb01ToHex = (c: number[] | null): string => {
  if (!c || c.length !== 3) return '#000000';
  const part = (x: number) =>
    Math.round(Math.min(1, Math.max(0, x)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${part(c[0])}${part(c[1])}${part(c[2])}`;
};

const strokeFrac = (g: PageGeom, dict: PDFDict): number => {
  const bs = dict.get(PDFName.of('BS'));
  if (bs instanceof PDFDict) {
    const w = num(bs.get(PDFName.of('W')));
    if (w !== null && w > 0) return ptToWidthFrac(g, w);
  }
  return DEFAULT_STROKE;
};

/** Midpoints of each quad's left/right edges → a centerline polyline plus
 *  its thickness (QuadPoints order: UL UR LL LR). Shared with the XFDF
 *  importer. */
export const quadsToLine = (
  g: PageGeom,
  quads: number[]
): { points: Pt[]; thicknessFrac: number } | null => {
  if (quads.length < 8 || quads.length % 8 !== 0) return null;
  const points: Pt[] = [];
  let thickness = 0;
  for (let i = 0; i < quads.length; i += 8) {
    const [ulx, uly, urx, ury, llx, lly, lrx, lry] = quads.slice(i, i + 8);
    const start = fromPdf(g, (ulx + llx) / 2, (uly + lly) / 2);
    const end = fromPdf(g, (urx + lrx) / 2, (ury + lry) / 2);
    if (i === 0) points.push({ x: start.nx, y: start.ny });
    points.push({ x: end.nx, y: end.ny });
    thickness = Math.max(thickness, Math.hypot(ulx - llx, uly - lly));
  }
  return { points, thicknessFrac: ptToWidthFrac(g, thickness) };
};

/** Font size out of a FreeText /DA string ("0 0 0 rg /Helv 14 Tf").
 *  Shared with the XFDF importer. */
export const daFontSize = (da: string | null): number | null => {
  const m = da ? /\/\S+\s+([\d.]+)\s+Tf/.exec(da) : null;
  const size = m ? Number.parseFloat(m[1]) : NaN;
  return Number.isFinite(size) && size > 0 ? size : null;
};

const SKIP_SUBTYPES = new Set(['Link', 'Widget', 'Popup', 'FileAttachment', 'Sound', 'Movie']);

const reverseMap = (g: PageGeom, dict: PDFDict): Annotation | null => {
  const subtype = dict.get(PDFName.of('Subtype'));
  const name = subtype instanceof PDFName ? subtype.decodeText() : '';
  if (!name || SKIP_SUBTYPES.has(name)) return null;

  const id = text(dict.get(PDFName.of('NM'))) ?? annotationId();
  const color = rgb01ToHex(numbers(dict.get(PDFName.of('C'))));
  const contents = text(dict.get(PDFName.of('Contents'))) ?? '';
  const rectNums = numbers(dict.get(PDFName.of('Rect')));
  const rect = rectNums && rectNums.length === 4
    ? rectFromPdf(g, rectNums as [number, number, number, number])
    : null;

  switch (name) {
    case 'Ink': {
      const inkList = dict.get(PDFName.of('InkList'));
      if (!(inkList instanceof PDFArray)) return null;
      const points: Pt[] = [];
      for (const gesture of inkList.asArray()) {
        const coords = numbers(gesture);
        if (!coords) continue;
        for (let i = 0; i + 1 < coords.length; i += 2) {
          const p = fromPdf(g, coords[i], coords[i + 1]);
          points.push({ x: p.nx, y: p.ny });
        }
      }
      if (points.length === 0) return null;
      const strokeWidth = strokeFrac(g, dict);
      return {
        kind: 'pen',
        id,
        points,
        dx: 0,
        dy: 0,
        color,
        strokeWidth,
        bounds: pointsBounds(points, strokeWidth),
      };
    }
    case 'Highlight': {
      const line = quadsToLine(g, numbers(dict.get(PDFName.of('QuadPoints'))) ?? []);
      if (!line) return null;
      const strokeWidth = Math.max(line.thicknessFrac, 0.005);
      return {
        kind: 'highlight',
        id,
        points: line.points,
        dx: 0,
        dy: 0,
        color,
        strokeWidth,
        bounds: pointsBounds(line.points, strokeWidth),
      };
    }
    case 'Underline':
    case 'StrikeOut': {
      const line = quadsToLine(g, numbers(dict.get(PDFName.of('QuadPoints'))) ?? []);
      if (!line || line.points.length < 2) return null;
      const first = line.points[0];
      const last = line.points[line.points.length - 1];
      return {
        kind: name === 'Underline' ? 'underline' : 'strike',
        id,
        x1: first.x,
        y1: first.y,
        x2: last.x,
        y2: last.y,
        color,
        strokeWidth: Math.max(line.thicknessFrac, 0.002),
      };
    }
    case 'Line': {
      const l = numbers(dict.get(PDFName.of('L')));
      if (!l || l.length !== 4) return null;
      const p1 = fromPdf(g, l[0], l[1]);
      const p2 = fromPdf(g, l[2], l[3]);
      return {
        kind: 'arrow',
        id,
        x1: p1.nx,
        y1: p1.ny,
        x2: p2.nx,
        y2: p2.ny,
        color,
        strokeWidth: strokeFrac(g, dict),
      };
    }
    case 'Square':
    case 'Circle': {
      if (!rect) return null;
      return {
        kind: name === 'Square' ? 'rect' : 'ellipse',
        id,
        ...rect,
        color,
        strokeWidth: strokeFrac(g, dict),
      };
    }
    case 'FreeText': {
      if (!rect) return null;
      const sizePt = daFontSize(text(dict.get(PDFName.of('DA'))));
      return {
        kind: 'text',
        id,
        x: rect.x,
        y: rect.y,
        text: contents,
        color,
        fontScale: sizePt !== null ? ptToWidthFrac(g, sizePt) : DEFAULT_FONT_SCALE,
      };
    }
    case 'Text': {
      if (!rect) return null;
      return {
        kind: 'note',
        id,
        x: rect.x,
        y: rect.y,
        text: contents,
        color,
        fontScale: DEFAULT_FONT_SCALE,
      };
    }
    case 'Stamp': {
      // Text stamps reconstruct; image-only stamps (foreign) are skipped —
      // our signatures round-trip via /FyreAnnot, not this path.
      if (!rect || !contents) return null;
      return {
        kind: 'stamp',
        id,
        x: rect.x,
        y: rect.y,
        text: contents,
        color,
        fontScale: DEFAULT_FONT_SCALE,
      };
    }
    default:
      return null;
  }
};

/** All annotations of a document, keyed by 0-indexed page. Unparseable
 *  entries are skipped; unparseable documents throw (callers decide).
 *
 *  `includeForeign: false` returns only our own /FyreAnnot annotations. The
 *  editor MUST use it to seed markup: appendAnnotationsToPdf replaces only
 *  /FyreAnnot dicts on save, so a reverse-mapped foreign annotation would be
 *  written back next to its untouched original — a duplicate of every
 *  Acrobat (etc.) mark on each save. */
export const readAnnotationsFromPdf = async (
  bytes: Uint8Array | string,
  opts: { includeForeign?: boolean } = {}
): Promise<Record<number, Annotation[]>> => {
  const includeForeign = opts.includeForeign ?? true;
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const geoms = pageGeometries(doc);
  const out: Record<number, Annotation[]> = {};

  doc.getPages().forEach((page, pageIndex) => {
    const annots = page.node.Annots();
    if (!annots) return;
    const list: Annotation[] = [];
    for (let i = 0; i < annots.size(); i += 1) {
      try {
        const dict = doc.context.lookupMaybe(annots.get(i), PDFDict);
        if (!dict) continue;
        const fyre = text(dict.get(PDFName.of(FYRE_ANNOT_KEY)));
        if (fyre) {
          const parsed = parseAnnotation(fyre);
          if (parsed) {
            list.push(parsed);
            continue;
          }
        }
        if (!includeForeign) continue;
        const mapped = reverseMap(geoms[pageIndex], dict);
        if (mapped) list.push(mapped);
      } catch {
        // One malformed annotation must not sink the page.
      }
    }
    if (list.length > 0) out[pageIndex] = list;
  });
  return out;
};
