// NOTE: ported from fyredocs_app/src/lib/annotate/pdfAnnots.ts — keep in sync.
/**
 * Model → PDF /Annot writer (Phase 15). PURE pdf-lib, no expo imports —
 * bytes/geometry in, mutated document out (Node-testable, writer.ts
 * convention).
 *
 * pdf-lib has NO annotation API: every dictionary here is hand-built via
 * `context.obj`, and every annotation carries a hand-built /AP appearance
 * stream — without one, viewers that honour NeedAppearances:false render
 * nothing. Appearance streams are form XObjects with an explicit
 * `BBox [0 0 w h]` (pdf-lib defaults BBox to zeros) and operators in
 * Rect-relative coordinates, so placement is rotation-independent — the
 * pageSpace mapping already inverted the page's stored /Rotate.
 *
 * Round-trip strategy is belt-and-braces: standard fields (Subtype, Rect,
 * InkList, /L, QuadPoints, Contents) make Acrobat/Preview honour the
 * annotations; a private /FyreAnnot key (the model JSON) makes OUR re-open
 * lossless (dx/dy, fontScale, sigRelPath aren't reconstructible from the
 * standard fields). /NM carries the model id.
 */

import {
  appendBezierCurve,
  beginText,
  concatTransformationMatrix,
  drawObject,
  endText,
  fill,
  LineCapStyle,
  LineJoinStyle,
  lineTo,
  moveText,
  moveTo,
  PDFContext,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFRef,
  PDFString,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  setFillingRgbColor,
  setFontAndSize,
  setGraphicsState,
  setLineCap,
  setLineJoin,
  setLineWidth,
  setStrokingRgbColor,
  showText,
  StandardFonts,
  stroke,
  type PDFFont,
  type PDFImage,
  type PDFOperator,
  type PDFPage,
} from 'pdf-lib';

import { serializeAnnotation } from '@/lib/annotate/annotationsJson';
import {
  arrowHead,
  TEXT_ASPECT,
  type Annotation,
  type LineAnnotation,
  type PathAnnotation,
  type SignatureAnnotation,
  type TextAnnotation,
} from '@/lib/annotate/model';
import { NOTE_FILL } from '@/lib/annotate/inkColors';
import {
  pageGeometries,
  rectToPdf,
  renderedSize,
  toPdf,
  widthFracToPt,
  type PageGeom,
} from '@/lib/annotate/pageSpace';

/** The private key that marks (and losslessly carries) our annotations. */
export const FYRE_ANNOT_KEY = 'FyreAnnot';

export interface AnnotAssets {
  /** Signature PNG bytes (or base64 — embedPng takes both) keyed by the
   *  model's sigRelPath. */
  signatures: Map<string, Uint8Array | string>;
}

/** '#RGB'/'#RRGGBB' → 0..1 RGB triple ('#000000' on garbage). */
export const hexToRgb01 = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
};

// WinAnsi (CP1252) coverage: printable ASCII, Latin-1, and the 0x80–0x9F
// block's Unicode homes. Anything else becomes '?' — the honest non-Latin
// deferral (embedding subset fonts is a real dependency; see TODO.md).
const CP1252_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039,
  0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122,
  0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

export const winAnsiSanitize = (text: string): string => {
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const ok = (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) || CP1252_EXTRAS.has(cp);
    out += ok ? ch : '?';
  }
  return out;
};

const pdfDate = (d: Date): string => {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `D:${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

type Ctx = {
  doc: PDFDocument;
  getFont: () => PDFFont;
  getSignature: (relPath: string) => Promise<PDFImage>;
};

/** pdf-lib doesn't export its LiteralObject type — recover it from the API. */
type FormXObjectDict = NonNullable<Parameters<PDFContext['formXObject']>[1]>;

/** Registers a Rect-relative appearance stream; returns its ref. */
const registerAp = (
  doc: PDFDocument,
  w: number,
  h: number,
  ops: PDFOperator[],
  resources?: Record<string, unknown>
): PDFRef =>
  doc.context.register(
    doc.context.formXObject(ops, {
      BBox: [0, 0, Math.max(w, 0.01), Math.max(h, 0.01)],
      ...(resources ? { Resources: resources } : {}),
    } as unknown as FormXObjectDict)
  );

/** Builds + registers the annotation dict with the shared field set. */
const registerDict = (
  doc: PDFDocument,
  a: Annotation,
  fields: Record<string, unknown>,
  opts: { color?: [number, number, number]; contents?: string }
): PDFRef => {
  const dict = doc.context.obj({ Type: 'Annot', F: 4, ...fields }) as PDFDict;
  dict.set(PDFName.of('NM'), PDFString.of(a.id));
  dict.set(PDFName.of('M'), PDFString.of(pdfDate(new Date())));
  if (opts.color) dict.set(PDFName.of('C'), doc.context.obj(opts.color));
  if (opts.contents !== undefined) {
    dict.set(PDFName.of('Contents'), PDFHexString.fromText(opts.contents));
  }
  dict.set(PDFName.of(FYRE_ANNOT_KEY), PDFString.of(serializeAnnotation(a)));
  return doc.context.register(dict);
};

const strokePreamble = (color: [number, number, number], widthPt: number): PDFOperator[] => [
  setLineCap(LineCapStyle.Round),
  setLineJoin(LineJoinStyle.Round),
  setLineWidth(widthPt),
  setStrokingRgbColor(...color),
];

/** Perpendicular half-offset for a segment (QuadPoints expansion). */
const perp = (
  p: { u: number; v: number },
  q: { u: number; v: number },
  half: number
): { nx: number; ny: number } | null => {
  const dx = q.u - p.u;
  const dy = q.v - p.v;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return null;
  return { nx: (-dy / len) * half, ny: (dx / len) * half };
};

/** Acrobat's QuadPoints corner order: UL, UR, LL, LR. */
const segmentQuad = (
  p: { u: number; v: number },
  q: { u: number; v: number },
  half: number
): number[] | null => {
  const n = perp(p, q, half);
  if (!n) return null;
  return [p.u + n.nx, p.v + n.ny, q.u + n.nx, q.v + n.ny, p.u - n.nx, p.v - n.ny, q.u - n.nx, q.v - n.ny];
};

const buildPath = (ctx: Ctx, g: PageGeom, a: PathAnnotation): PDFRef => {
  const { doc } = ctx;
  const pts = a.points.map((p) => toPdf(g, p.x + a.dx, p.y + a.dy));
  const strokePt = widthFracToPt(g, a.strokeWidth);
  const rect = rectToPdf(g, a.bounds);
  const [x1, y1, x2, y2] = rect;
  const color = hexToRgb01(a.color);

  const pathOps: PDFOperator[] = [];
  pts.forEach((p, i) => {
    pathOps.push(i === 0 ? moveTo(p.u - x1, p.v - y1) : lineTo(p.u - x1, p.v - y1));
  });
  // A single tap still needs visible ink: degenerate to a dot-length line.
  if (pts.length === 1) pathOps.push(lineTo(pts[0].u - x1 + 0.1, pts[0].v - y1));

  const isHighlight = a.kind === 'highlight';
  const ops: PDFOperator[] = [
    ...(isHighlight ? [setGraphicsState('GS0')] : []),
    ...strokePreamble(color, strokePt),
    ...pathOps,
    stroke(),
  ];
  const resources = isHighlight
    ? { ExtGState: { GS0: { Type: 'ExtGState', CA: 0.4, ca: 0.4, BM: 'Multiply' } } }
    : undefined;
  const ap = registerAp(doc, x2 - x1, y2 - y1, ops, resources);

  const fields: Record<string, unknown> = {
    Subtype: isHighlight ? 'Highlight' : 'Ink',
    Rect: rect,
    AP: { N: ap },
  };
  if (isHighlight) {
    const half = strokePt / 2;
    const quads: number[] = [];
    for (let i = 0; i + 1 < pts.length; i += 1) {
      const quad = segmentQuad(pts[i], pts[i + 1], half);
      if (quad) quads.push(...quad);
    }
    // A degenerate gesture still needs one quad — use the Rect itself.
    if (quads.length === 0) quads.push(x1, y2, x2, y2, x1, y1, x2, y1);
    fields.QuadPoints = quads;
    fields.CA = 1; // the 0.4 alpha lives in the AP's ExtGState — not both
  } else {
    fields.InkList = [pts.flatMap((p) => [p.u, p.v])];
    fields.BS = { W: strokePt, S: 'S' };
  }
  return registerDict(doc, a, fields, { color });
};

const buildLine = (ctx: Ctx, g: PageGeom, a: LineAnnotation): PDFRef => {
  const { doc } = ctx;
  const p1 = toPdf(g, a.x1, a.y1);
  const p2 = toPdf(g, a.x2, a.y2);
  const strokePt = widthFracToPt(g, a.strokeWidth);
  const color = hexToRgb01(a.color);

  const extraPts: { u: number; v: number }[] = [];
  if (a.kind === 'arrow') {
    const head = arrowHead(a.x1, a.y1, a.x2, a.y2);
    extraPts.push(toPdf(g, head.hx1, head.hy1), toPdf(g, head.hx2, head.hy2));
  }
  const all = [p1, p2, ...extraPts];
  const pad = Math.max(strokePt, 1);
  const x1 = Math.min(...all.map((p) => p.u)) - pad;
  const y1 = Math.min(...all.map((p) => p.v)) - pad;
  const x2 = Math.max(...all.map((p) => p.u)) + pad;
  const y2 = Math.max(...all.map((p) => p.v)) + pad;
  const rect: [number, number, number, number] = [x1, y1, x2, y2];

  const seg = (from: { u: number; v: number }, to: { u: number; v: number }): PDFOperator[] => [
    moveTo(from.u - x1, from.v - y1),
    lineTo(to.u - x1, to.v - y1),
  ];
  const ops: PDFOperator[] = [
    ...strokePreamble(color, strokePt),
    ...seg(p1, p2),
    ...(a.kind === 'arrow' ? [...seg(extraPts[0], p2), ...seg(extraPts[1], p2)] : []),
    stroke(),
  ];
  const ap = registerAp(doc, x2 - x1, y2 - y1, ops);

  if (a.kind === 'arrow') {
    return registerDict(
      doc,
      a,
      {
        Subtype: 'Line',
        Rect: rect,
        L: [p1.u, p1.v, p2.u, p2.v],
        LE: ['None', 'OpenArrow'],
        BS: { W: strokePt, S: 'S' },
        AP: { N: ap },
      },
      { color }
    );
  }
  const quad = segmentQuad(p1, p2, strokePt / 2) ?? [x1, y2, x2, y2, x1, y1, x2, y1];
  return registerDict(
    doc,
    a,
    {
      Subtype: a.kind === 'underline' ? 'Underline' : 'StrikeOut',
      Rect: rect,
      QuadPoints: quad,
      AP: { N: ap },
    },
    { color }
  );
};

const buildBox = (
  ctx: Ctx,
  g: PageGeom,
  a: Extract<Annotation, { kind: 'rect' | 'ellipse' }>
): PDFRef => {
  const { doc } = ctx;
  const strokePt = widthFracToPt(g, a.strokeWidth);
  const inner = rectToPdf(g, { x: a.x, y: a.y, w: a.w, h: a.h });
  const half = strokePt / 2;
  const rect: [number, number, number, number] = [
    inner[0] - half,
    inner[1] - half,
    inner[2] + half,
    inner[3] + half,
  ];
  const w = rect[2] - rect[0];
  const h = rect[3] - rect[1];
  const color = hexToRgb01(a.color);

  let shape: PDFOperator[];
  if (a.kind === 'rect') {
    shape = [rectangle(half, half, w - strokePt, h - strokePt)];
  } else {
    // Ellipse inscribed in the inset box: 4 Béziers, kappa ≈ 0.5523.
    const cx = w / 2;
    const cy = h / 2;
    const rx = Math.max(0.01, w / 2 - half);
    const ry = Math.max(0.01, h / 2 - half);
    const k = 0.5523;
    shape = [
      moveTo(cx + rx, cy),
      appendBezierCurve(cx + rx, cy + k * ry, cx + k * rx, cy + ry, cx, cy + ry),
      appendBezierCurve(cx - k * rx, cy + ry, cx - rx, cy + k * ry, cx - rx, cy),
      appendBezierCurve(cx - rx, cy - k * ry, cx - k * rx, cy - ry, cx, cy - ry),
      appendBezierCurve(cx + k * rx, cy - ry, cx + rx, cy - k * ry, cx + rx, cy),
    ];
  }
  const ap = registerAp(doc, w, h, [...strokePreamble(color, strokePt), ...shape, stroke()]);
  return registerDict(
    doc,
    a,
    {
      Subtype: a.kind === 'rect' ? 'Square' : 'Circle',
      Rect: rect,
      BS: { W: strokePt, S: 'S' },
      AP: { N: ap },
    },
    { color }
  );
};

/** Model rect (normalized, RENDERED space) for a text-ish annotation —
 *  fontScale is a width fraction, so the height converts via rw/rh. */
const textModelRect = (g: PageGeom, a: TextAnnotation) => {
  const { width: rw, height: rh } = renderedSize(g);
  const upper = a.kind === 'stamp' || a.kind === 'date';
  const text = upper ? a.text.toUpperCase() : a.text;
  const padFrac = upper ? 0.6 : 0.15; // stamps carry a border + breathing room
  return {
    rect: {
      x: a.x,
      y: a.y,
      w: Math.max(0.02, (text.length * TEXT_ASPECT + padFrac) * a.fontScale),
      h: (a.fontScale * 1.5 * rw) / rh,
    },
    text,
  };
};

const buildText = (ctx: Ctx, g: PageGeom, a: TextAnnotation): PDFRef => {
  const { doc, getFont } = ctx;
  const font = getFont();
  const fontPt = widthFracToPt(g, a.fontScale);
  const color = hexToRgb01(a.color);

  if (a.kind === 'note') {
    // Sticky note: a fixed-size comment icon (yellow card + border + two
    // rule lines); the text pops up from /Contents.
    const size = 20;
    const anchor = toPdf(g, a.x, a.y);
    const rect: [number, number, number, number] = [anchor.u, anchor.v - size, anchor.u + size, anchor.v];
    const noteFill = hexToRgb01(NOTE_FILL);
    const border: [number, number, number] = [0.45, 0.4, 0.2];
    const ops: PDFOperator[] = [
      setFillingRgbColor(...noteFill),
      rectangle(1, 1, size - 2, size - 2),
      fill(),
      setStrokingRgbColor(...border),
      setLineWidth(1),
      rectangle(1, 1, size - 2, size - 2),
      stroke(),
      moveTo(4, size * 0.62),
      lineTo(size - 4, size * 0.62),
      moveTo(4, size * 0.38),
      lineTo(size - 4, size * 0.38),
      stroke(),
    ];
    const ap = registerAp(doc, size, size, ops);
    return registerDict(
      doc,
      a,
      { Subtype: 'Text', Rect: rect, Name: 'Comment', Open: false, AP: { N: ap } },
      { color, contents: a.text }
    );
  }

  const { rect: modelRect, text } = textModelRect(g, a);
  const rect = rectToPdf(g, modelRect);
  const w = rect[2] - rect[0];
  const h = rect[3] - rect[1];
  const cleanShown = winAnsiSanitize(text.replace(/\s+/g, ' '));
  const encoded = font.encodeText(cleanShown);

  if (a.kind === 'text') {
    const ops: PDFOperator[] = [
      beginText(),
      setFillingRgbColor(...color),
      setFontAndSize('Helv', fontPt),
      moveText(fontPt * 0.1, h - fontPt),
      showText(encoded),
      endText(),
    ];
    const ap = registerAp(doc, w, h, ops, { Font: { Helv: font.ref } });
    const [r, gg, b] = color;
    const dict = registerDict(
      doc,
      a,
      { Subtype: 'FreeText', Rect: rect, Q: 0, AP: { N: ap } },
      { color, contents: a.text }
    );
    // /DA is a plain string field FreeText requires.
    const d = doc.context.lookup(dict, PDFDict);
    d.set(PDFName.of('DA'), PDFString.of(`${r} ${gg} ${b} rg /Helv ${fontPt} Tf`));
    return dict;
  }

  // stamp / date: bordered uppercase label — mirrors the Skia bake look.
  const borderPt = Math.max(1, fontPt * 0.09);
  const textW = font.widthOfTextAtSize(cleanShown, fontPt);
  const ops: PDFOperator[] = [
    setStrokingRgbColor(...color),
    setLineWidth(borderPt),
    rectangle(borderPt / 2, borderPt / 2, w - borderPt, h - borderPt),
    stroke(),
    beginText(),
    setFillingRgbColor(...color),
    setFontAndSize('Helv', fontPt),
    moveText(Math.max(borderPt, (w - textW) / 2), (h - fontPt * 0.72) / 2),
    showText(encoded),
    endText(),
  ];
  const ap = registerAp(doc, w, h, ops, { Font: { Helv: font.ref } });
  return registerDict(
    doc,
    a,
    { Subtype: 'Stamp', Rect: rect, Name: 'Draft', AP: { N: ap } },
    { color, contents: a.text }
  );
};

const buildSignature = async (ctx: Ctx, g: PageGeom, a: SignatureAnnotation): Promise<PDFRef> => {
  const { doc } = ctx;
  const img = await ctx.getSignature(a.sigRelPath);
  const { width: rw, height: rh } = renderedSize(g);
  const modelRect = { x: a.x, y: a.y, w: a.w, h: (a.w * a.aspect * rw) / rh };
  const rect = rectToPdf(g, modelRect);
  const w = rect[2] - rect[0];
  const h = rect[3] - rect[1];
  const ops: PDFOperator[] = [
    pushGraphicsState(),
    concatTransformationMatrix(w, 0, 0, h, 0, 0),
    drawObject('Im0'),
    popGraphicsState(),
  ];
  const ap = registerAp(doc, w, h, ops, { XObject: { Im0: img.ref } });
  return registerDict(doc, a, { Subtype: 'Stamp', Rect: rect, Name: 'Draft', AP: { N: ap } }, {});
};

/** Strips every annotation carrying /FyreAnnot from every page — replace
 *  semantics for re-saves; foreign annotations are untouched. */
export const removeFyreAnnotations = (doc: PDFDocument): void => {
  for (const page of doc.getPages()) {
    const annots = page.node.Annots();
    if (!annots) continue;
    for (let i = annots.size() - 1; i >= 0; i -= 1) {
      const dict = doc.context.lookupMaybe(annots.get(i), PDFDict);
      if (dict?.get(PDFName.of(FYRE_ANNOT_KEY))) annots.remove(i);
    }
  }
};

/**
 * Appends every page's annotations as real /Annot objects (with /AP).
 * Throws on blur/redact — those are flatten-only by design (their whole
 * correctness argument is that the original pixels don't survive), and a
 * silent skip here would lie about what got saved.
 */
export const appendAnnotationsToPdf = async (
  doc: PDFDocument,
  pages: Record<number, Annotation[]>,
  assets: AnnotAssets = { signatures: new Map() }
): Promise<void> => {
  const geoms = pageGeometries(doc);
  const pdfPages = doc.getPages();

  let font: PDFFont | null = null;
  const sigCache = new Map<string, PDFImage>();
  const ctx: Ctx = {
    doc,
    getFont: () => {
      font ??= doc.embedStandardFont(StandardFonts.Helvetica);
      return font;
    },
    getSignature: async (relPath: string) => {
      const cached = sigCache.get(relPath);
      if (cached) return cached;
      const bytes = assets.signatures.get(relPath);
      if (!bytes) throw new Error(`No signature bytes for ${relPath}`);
      const img = await doc.embedPng(bytes);
      sigCache.set(relPath, img);
      return img;
    },
  };

  removeFyreAnnotations(doc);

  for (const [key, list] of Object.entries(pages)) {
    const pageIndex = Number(key);
    const page: PDFPage | undefined = pdfPages[pageIndex];
    const g = geoms[pageIndex];
    if (!page || !g || list.length === 0) continue;
    for (const a of list) {
      let ref: PDFRef;
      switch (a.kind) {
        case 'blur':
        case 'redact':
          throw new Error('Blur and redact cannot be saved as annotations — flatten instead.');
        case 'pen':
        case 'highlight':
          ref = buildPath(ctx, g, a);
          break;
        case 'underline':
        case 'strike':
        case 'arrow':
          ref = buildLine(ctx, g, a);
          break;
        case 'rect':
        case 'ellipse':
          ref = buildBox(ctx, g, a);
          break;
        case 'text':
        case 'note':
        case 'stamp':
        case 'date':
          ref = buildText(ctx, g, a);
          break;
        case 'signature':
          ref = await buildSignature(ctx, g, a);
          break;
      }
      page.node.normalize();
      page.node.normalizedEntries().Annots.push(ref);
    }
  }
};
