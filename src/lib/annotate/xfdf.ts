// NOTE: ported from fyredocs_app/src/lib/annotate/xfdf.ts — keep in sync.
/**
 * XFDF export/import (Phase 15) — the interchange format Acrobat's
 * "Import Comments" understands. PURE string work, no XML dependency: the
 * importer is a small tolerant parser for the subset we emit (plus
 * whatever whitespace/entities/unknown elements a foreign producer adds).
 *
 * Coordinates are PDF user space (Acrobat's frame), converted through
 * pageSpace. Honest scope: blur/redact have no XFDF vocabulary and
 * signatures would need a base64 appearance stream — both are exported
 * only by the JSON format (the full-fidelity one); signatures appear here
 * as bare stamps.
 */

import {
  annotationId,
  arrowHead,
  DEFAULT_FONT_SCALE,
  DEFAULT_STROKE,
  pointsBounds,
  TEXT_ASPECT,
  type Annotation,
  type Pt,
} from '@/lib/annotate/model';
import { daFontSize, quadsToLine } from '@/lib/annotate/pdfAnnotsRead';
import {
  fromPdf,
  rectFromPdf,
  renderedSize,
  toPdf,
  widthFracToPt,
  type PageGeom,
} from '@/lib/annotate/pageSpace';

// ─── Export ──────────────────────────────────────────────────────────────────

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n2 = (v: number): string => (Math.round(v * 100) / 100).toString();

const attrs = (map: Record<string, string | number | undefined>): string =>
  Object.entries(map)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${esc(String(v))}"`)
    .join(' ');

const perpQuad = (p: { u: number; v: number }, q: { u: number; v: number }, half: number): number[] | null => {
  const dx = q.u - p.u;
  const dy = q.v - p.v;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return null;
  const nx = (-dy / len) * half;
  const ny = (dx / len) * half;
  return [p.u + nx, p.v + ny, q.u + nx, q.v + ny, p.u - nx, p.v - ny, q.u - nx, q.v - ny];
};

const boundsRect = (pts: { u: number; v: number }[], pad: number): [number, number, number, number] => [
  Math.min(...pts.map((p) => p.u)) - pad,
  Math.min(...pts.map((p) => p.v)) - pad,
  Math.max(...pts.map((p) => p.u)) + pad,
  Math.max(...pts.map((p) => p.v)) + pad,
];

const rectAttr = (r: [number, number, number, number]): string => r.map(n2).join(',');

const annotToXfdf = (a: Annotation, page: number, g: PageGeom): string | null => {
  const common = { page, name: a.id, flags: 'print' };
  switch (a.kind) {
    case 'blur':
    case 'redact':
      return null; // no XFDF vocabulary — JSON export carries these
    case 'pen':
    case 'highlight': {
      const pts = a.points.map((p) => toPdf(g, p.x + a.dx, p.y + a.dy));
      const width = widthFracToPt(g, a.strokeWidth);
      const rect = rectAttr(boundsRect(pts, width / 2));
      if (a.kind === 'pen') {
        const gesture = pts.map((p) => `${n2(p.u)},${n2(p.v)}`).join(';');
        return `<ink ${attrs({ ...common, rect, color: a.color, width: n2(width) })}><inklist><gesture>${gesture}</gesture></inklist></ink>`;
      }
      const quads: number[] = [];
      for (let i = 0; i + 1 < pts.length; i += 1) {
        const q = perpQuad(pts[i], pts[i + 1], width / 2);
        if (q) quads.push(...q);
      }
      if (quads.length === 0) return null;
      return `<highlight ${attrs({ ...common, rect, color: a.color, opacity: '0.4', coords: quads.map(n2).join(',') })}/>`;
    }
    case 'underline':
    case 'strike': {
      const p1 = toPdf(g, a.x1, a.y1);
      const p2 = toPdf(g, a.x2, a.y2);
      const width = widthFracToPt(g, a.strokeWidth);
      const quad = perpQuad(p1, p2, width / 2);
      if (!quad) return null;
      const el = a.kind === 'underline' ? 'underline' : 'strikeout';
      return `<${el} ${attrs({ ...common, rect: rectAttr(boundsRect([p1, p2], width)), color: a.color, coords: quad.map(n2).join(',') })}/>`;
    }
    case 'arrow': {
      const p1 = toPdf(g, a.x1, a.y1);
      const p2 = toPdf(g, a.x2, a.y2);
      const head = arrowHead(a.x1, a.y1, a.x2, a.y2);
      const hp = [toPdf(g, head.hx1, head.hy1), toPdf(g, head.hx2, head.hy2)];
      const width = widthFracToPt(g, a.strokeWidth);
      return `<line ${attrs({
        ...common,
        rect: rectAttr(boundsRect([p1, p2, ...hp], width)),
        color: a.color,
        width: n2(width),
        start: `${n2(p1.u)},${n2(p1.v)}`,
        end: `${n2(p2.u)},${n2(p2.v)}`,
        head: 'OpenArrow',
        tail: 'None',
      })}/>`;
    }
    case 'rect':
    case 'ellipse': {
      const p1 = toPdf(g, a.x, a.y);
      const p2 = toPdf(g, a.x + a.w, a.y + a.h);
      const rect = rectAttr([
        Math.min(p1.u, p2.u),
        Math.min(p1.v, p2.v),
        Math.max(p1.u, p2.u),
        Math.max(p1.v, p2.v),
      ]);
      const el = a.kind === 'rect' ? 'square' : 'circle';
      return `<${el} ${attrs({ ...common, rect, color: a.color, width: n2(widthFracToPt(g, a.strokeWidth)) })}/>`;
    }
    case 'text':
    case 'stamp':
    case 'date': {
      const fontPt = widthFracToPt(g, a.fontScale);
      const { width: rw, height: rh } = renderedSize(g);
      const isStamp = a.kind !== 'text';
      const shown = isStamp ? a.text.toUpperCase() : a.text;
      const modelRect = {
        x: a.x,
        y: a.y,
        w: Math.max(0.02, (shown.length * TEXT_ASPECT + (isStamp ? 0.6 : 0.15)) * a.fontScale),
        h: (a.fontScale * 1.5 * rw) / rh,
      };
      const p1 = toPdf(g, modelRect.x, modelRect.y);
      const p2 = toPdf(g, modelRect.x + modelRect.w, modelRect.y + modelRect.h);
      const rect = rectAttr([
        Math.min(p1.u, p2.u),
        Math.min(p1.v, p2.v),
        Math.max(p1.u, p2.u),
        Math.max(p1.v, p2.v),
      ]);
      if (a.kind === 'text') {
        return `<freetext ${attrs({ ...common, rect, color: a.color })}><contents>${esc(a.text)}</contents><defaultappearance>0 0 0 rg /Helv ${n2(fontPt)} Tf</defaultappearance></freetext>`;
      }
      return `<stamp ${attrs({ ...common, rect, color: a.color, icon: 'Draft' })}><contents>${esc(a.text)}</contents></stamp>`;
    }
    case 'note': {
      const anchor = toPdf(g, a.x, a.y);
      const rect = rectAttr([anchor.u, anchor.v - 20, anchor.u + 20, anchor.v]);
      return `<text ${attrs({ ...common, rect, color: a.color, icon: 'Comment' })}><contents>${esc(a.text)}</contents></text>`;
    }
    case 'signature': {
      const { width: rw, height: rh } = renderedSize(g);
      const p1 = toPdf(g, a.x, a.y);
      const p2 = toPdf(g, a.x + a.w, a.y + (a.w * a.aspect * rw) / rh);
      const rect = rectAttr([
        Math.min(p1.u, p2.u),
        Math.min(p1.v, p2.v),
        Math.max(p1.u, p2.u),
        Math.max(p1.v, p2.v),
      ]);
      // No image payload in our XFDF scope — a bare stamp placeholder.
      return `<stamp ${attrs({ ...common, rect, icon: 'Draft' })}><contents>Signature</contents></stamp>`;
    }
  }
};

export const exportXfdf = (pages: Record<number, Annotation[]>, geoms: PageGeom[]): string => {
  const body: string[] = [];
  for (const [key, list] of Object.entries(pages)) {
    const page = Number(key);
    const g = geoms[page];
    if (!g) continue;
    for (const a of list) {
      const el = annotToXfdf(a, page, g);
      if (el) body.push(`    ${el}`);
    }
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">',
    '  <annots>',
    ...body,
    '  </annots>',
    '</xfdf>',
    '',
  ].join('\n');
};

// ─── Import (tolerant hand-rolled parser) ────────────────────────────────────

interface XmlNode {
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
}

const decodeEntities = (s: string): string =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X'
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[body] ?? whole;
  });

/** Strips an optional namespace prefix and lowercases. */
const localName = (raw: string): string => raw.slice(raw.indexOf(':') + 1).toLowerCase();

/** Minimal, forgiving XML parser for the XFDF subset. Returns the root
 *  element or null — never throws on junk. */
export const parseXml = (input: string): XmlNode | null => {
  let i = 0;
  const len = input.length;

  const skipMisc = () => {
    for (;;) {
      while (i < len && /\s/.test(input[i])) i += 1;
      if (input.startsWith('<?', i)) {
        const end = input.indexOf('?>', i);
        if (end < 0) return;
        i = end + 2;
      } else if (input.startsWith('<!--', i)) {
        const end = input.indexOf('-->', i);
        if (end < 0) return;
        i = end + 3;
      } else if (input.startsWith('<!', i)) {
        const end = input.indexOf('>', i);
        if (end < 0) return;
        i = end + 1;
      } else {
        return;
      }
    }
  };

  const parseElement = (): XmlNode | null => {
    if (input[i] !== '<') return null;
    i += 1;
    const nameMatch = /^[^\s/>]+/.exec(input.slice(i));
    if (!nameMatch) return null;
    const name = localName(nameMatch[0]);
    i += nameMatch[0].length;

    const attrs: Record<string, string> = {};
    for (;;) {
      while (i < len && /\s/.test(input[i])) i += 1;
      if (i >= len) return null;
      if (input.startsWith('/>', i)) {
        i += 2;
        return { name, attrs, children: [], text: '' };
      }
      if (input[i] === '>') {
        i += 1;
        break;
      }
      const attrMatch = /^([^\s=/>]+)\s*=\s*("([^"]*)"|'([^']*)')/.exec(input.slice(i));
      if (!attrMatch) {
        // Bare/broken attribute — skip a token and keep going.
        const junk = /^[^\s/>]+/.exec(input.slice(i));
        if (!junk) return null;
        i += junk[0].length;
        continue;
      }
      attrs[localName(attrMatch[1])] = decodeEntities(attrMatch[3] ?? attrMatch[4] ?? '');
      i += attrMatch[0].length;
    }

    const children: XmlNode[] = [];
    let text = '';
    for (;;) {
      if (i >= len) return { name, attrs, children, text }; // unclosed — salvage
      if (input.startsWith('</', i)) {
        const end = input.indexOf('>', i);
        if (end < 0) return { name, attrs, children, text };
        i = end + 1;
        return { name, attrs, children, text };
      }
      if (input.startsWith('<!--', i)) {
        const end = input.indexOf('-->', i);
        if (end < 0) return { name, attrs, children, text };
        i = end + 3;
        continue;
      }
      if (input[i] === '<') {
        const child = parseElement();
        if (child) children.push(child);
        else i += 1; // unparseable tag — step over the '<' and continue
        continue;
      }
      const next = input.indexOf('<', i);
      const chunk = next < 0 ? input.slice(i) : input.slice(i, next);
      text += decodeEntities(chunk);
      i = next < 0 ? len : next;
    }
  };

  skipMisc();
  return i < len && input[i] === '<' ? parseElement() : null;
};

const findDescendant = (node: XmlNode, name: string): XmlNode | null => {
  if (node.name === name) return node;
  for (const child of node.children) {
    const hit = findDescendant(child, name);
    if (hit) return hit;
  }
  return null;
};

const numList = (raw: string | undefined, sep: RegExp = /[,\s;]+/): number[] =>
  (raw ?? '')
    .trim()
    .split(sep)
    .map((t) => Number.parseFloat(t))
    .filter((v) => Number.isFinite(v));

const childText = (node: XmlNode, name: string): string => {
  const child = node.children.find((c) => c.name === name);
  return child ? child.text.trim() : '';
};

const importOne = (node: XmlNode, g: PageGeom): Annotation | null => {
  const color = /^#[0-9a-fA-F]{6}$/.test(node.attrs.color ?? '') ? node.attrs.color : '#000000';
  const id = annotationId();
  const rectNums = numList(node.attrs.rect);
  const rect = rectNums.length === 4
    ? rectFromPdf(g, rectNums as [number, number, number, number])
    : null;
  const widthFrac = (() => {
    const w = Number.parseFloat(node.attrs.width ?? '');
    return Number.isFinite(w) && w > 0 ? w / Math.max(1e-9, renderedSize(g).width) : DEFAULT_STROKE;
  })();

  switch (node.name) {
    case 'ink': {
      const inklist = node.children.find((c) => c.name === 'inklist');
      const points: Pt[] = [];
      for (const gesture of inklist?.children.filter((c) => c.name === 'gesture') ?? []) {
        const coords = numList(gesture.text);
        for (let i = 0; i + 1 < coords.length; i += 2) {
          const p = fromPdf(g, coords[i], coords[i + 1]);
          points.push({ x: p.nx, y: p.ny });
        }
      }
      if (points.length === 0) return null;
      return {
        kind: 'pen',
        id,
        points,
        dx: 0,
        dy: 0,
        color,
        strokeWidth: widthFrac,
        bounds: pointsBounds(points, widthFrac),
      };
    }
    case 'highlight': {
      const line = quadsToLine(g, numList(node.attrs.coords));
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
    case 'underline':
    case 'strikeout': {
      const line = quadsToLine(g, numList(node.attrs.coords));
      if (!line || line.points.length < 2) return null;
      const first = line.points[0];
      const last = line.points[line.points.length - 1];
      return {
        kind: node.name === 'underline' ? 'underline' : 'strike',
        id,
        x1: first.x,
        y1: first.y,
        x2: last.x,
        y2: last.y,
        color,
        strokeWidth: Math.max(line.thicknessFrac, 0.002),
      };
    }
    case 'line': {
      const start = numList(node.attrs.start);
      const end = numList(node.attrs.end);
      if (start.length !== 2 || end.length !== 2) return null;
      const p1 = fromPdf(g, start[0], start[1]);
      const p2 = fromPdf(g, end[0], end[1]);
      return { kind: 'arrow', id, x1: p1.nx, y1: p1.ny, x2: p2.nx, y2: p2.ny, color, strokeWidth: widthFrac };
    }
    case 'square':
    case 'circle': {
      if (!rect) return null;
      return { kind: node.name === 'square' ? 'rect' : 'ellipse', id, ...rect, color, strokeWidth: widthFrac };
    }
    case 'freetext': {
      if (!rect) return null;
      const sizePt = daFontSize(childText(node, 'defaultappearance') || null);
      return {
        kind: 'text',
        id,
        x: rect.x,
        y: rect.y,
        text: childText(node, 'contents'),
        color,
        fontScale: sizePt !== null ? sizePt / Math.max(1e-9, renderedSize(g).width) : DEFAULT_FONT_SCALE,
      };
    }
    case 'text': {
      if (!rect) return null;
      return { kind: 'note', id, x: rect.x, y: rect.y, text: childText(node, 'contents'), color, fontScale: DEFAULT_FONT_SCALE };
    }
    case 'stamp': {
      if (!rect) return null;
      const contents = childText(node, 'contents');
      if (!contents) return null;
      return { kind: 'stamp', id, x: rect.x, y: rect.y, text: contents, color, fontScale: DEFAULT_FONT_SCALE };
    }
    default:
      return null; // unknown element — skipped by design
  }
};

/** XFDF → model. Junk input or a missing <annots> yields null; individual
 *  unparseable annotations are skipped. Fresh ids are minted per import. */
export const importXfdf = (xml: string, geoms: PageGeom[]): Record<number, Annotation[]> | null => {
  const root = parseXml(xml);
  if (!root) return null;
  const annots = findDescendant(root, 'annots');
  if (!annots) return null;
  const out: Record<number, Annotation[]> = {};
  for (const node of annots.children) {
    const page = Number.parseInt(node.attrs.page ?? '', 10);
    const g = Number.isInteger(page) && page >= 0 ? geoms[page] : undefined;
    if (!g) continue;
    const annotation = importOne(node, g);
    if (annotation) (out[page] ??= []).push(annotation);
  }
  return out;
};
