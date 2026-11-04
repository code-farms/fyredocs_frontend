// NOTE: ported from fyredocs_app/src/lib/annotate/__tests__/pdfAnnots.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach } from 'vitest';
/**
 * Round-trips the hand-built /Annot writer (writer.test.ts style: fixtures
 * BUILT in-test, no binary fixtures; the only image is a 1×1 PNG constant).
 * Pins the standard fields Acrobat reads (Subtype/Rect/InkList/L/QuadPoints),
 * the /AP appearance streams' Resources (the Multiply ExtGState on
 * highlight, the Font on FreeText, the image XObject on signatures), the
 * /FyreAnnot lossless key, replace semantics, and the blur/redact refusal.
 */

import { degrees, PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFString } from 'pdf-lib';

import {
  appendAnnotationsToPdf,
  FYRE_ANNOT_KEY,
  hexToRgb01,
  removeFyreAnnotations,
  winAnsiSanitize,
} from '@/lib/annotate/pdfAnnots';
import type { Annotation } from '@/lib/annotate/model';

const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const SIG_BYTES = new Uint8Array(Buffer.from(PNG_1PX, 'base64'));

const buildFixture = async (): Promise<PDFDocument> => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 600]);
  doc.addPage([400, 600]).setRotation(degrees(90));
  return doc;
};

const PEN: Annotation = {
  kind: 'pen',
  id: 'pen-1',
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.2, y: 0.15 },
  ],
  dx: 0.01,
  dy: 0,
  color: '#D43C3C',
  strokeWidth: 0.006,
  bounds: { x: 0.1, y: 0.1, w: 0.11, h: 0.06 },
};

const HIGHLIGHT: Annotation = {
  kind: 'highlight',
  id: 'hl-1',
  points: [
    { x: 0.3, y: 0.3 },
    { x: 0.5, y: 0.3 },
  ],
  dx: 0,
  dy: 0,
  color: '#F2C53D',
  strokeWidth: 0.035,
  bounds: { x: 0.28, y: 0.28, w: 0.24, h: 0.04 },
};

const ARROW: Annotation = {
  kind: 'arrow',
  id: 'arrow-1',
  x1: 0.1,
  y1: 0.6,
  x2: 0.4,
  y2: 0.7,
  color: '#000000',
  strokeWidth: 0.006,
};

const BOX: Annotation = { kind: 'rect', id: 'rect-1', x: 0.1, y: 0.2, w: 0.3, h: 0.1, color: '#3C7DD4', strokeWidth: 0.006 };
const TEXT: Annotation = { kind: 'text', id: 'text-1', x: 0.2, y: 0.2, text: 'Hello', color: '#000000', fontScale: 0.035 };
const NOTE: Annotation = { kind: 'note', id: 'note-1', x: 0.5, y: 0.5, text: 'A note', color: '#000000', fontScale: 0.035 };
const STAMP: Annotation = { kind: 'stamp', id: 'stamp-1', x: 0.3, y: 0.8, text: 'APPROVED', color: '#D43C3C', fontScale: 0.035 };
const SIG: Annotation = { kind: 'signature', id: 'sig-1', x: 0.1, y: 0.85, w: 0.3, aspect: 0.4, sigRelPath: 'signatures/s1.png' };

const assets = { signatures: new Map([['signatures/s1.png', SIG_BYTES]]) };

const annotDicts = async (doc: PDFDocument, page = 0): Promise<PDFDict[]> => {
  const bytes = await doc.save();
  const reloaded = await PDFDocument.load(bytes, { updateMetadata: false });
  const annots = reloaded.getPages()[page].node.Annots();
  if (!annots) return [];
  const out: PDFDict[] = [];
  for (let i = 0; i < annots.size(); i += 1) {
    const dict = reloaded.context.lookupMaybe(annots.get(i), PDFDict);
    if (dict) out.push(dict);
  }
  return out;
};

const get = (dict: PDFDict, key: string) => dict.get(PDFName.of(key));
const nums = (dict: PDFDict, key: string): number[] =>
  (get(dict, key) as PDFArray).asArray().map((n) => Number((n as PDFNumber).asNumber()));
const nameOf = (dict: PDFDict, key: string): string =>
  (get(dict, key) as PDFName).decodeText();

/** Resolves the /AP /N stream's dict on the ORIGINAL doc's context. */
const apDict = (doc: PDFDocument, dict: PDFDict): PDFDict => {
  const ap = get(dict, 'AP') as PDFDict;
  const stream = doc.context.lookup((ap.get(PDFName.of('N')) as PDFRef)) as PDFRawStream;
  return stream.dict;
};

describe('appendAnnotationsToPdf', () => {
  it('writes pen as /Ink with InkList in PDF user space', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: [PEN] });
    const [dict] = await annotDicts(doc);
    expect(nameOf(dict, 'Subtype')).toBe('Ink');
    const ink = (get(dict, 'InkList') as PDFArray).asArray()[0] as PDFArray;
    const coords = ink.asArray().map((n) => (n as PDFNumber).asNumber());
    expect(coords[0]).toBeCloseTo(44); // (0.1+0.01)*400
    expect(coords[1]).toBeCloseTo(540); // 600 − 0.1*600
    expect(coords[2]).toBeCloseTo(84);
    expect(coords[3]).toBeCloseTo(510);
    const penRect = nums(dict, 'Rect');
    [40, 504, 84, 540].forEach((v, i) => expect(penRect[i]).toBeCloseTo(v, 6));
    expect((get(dict, 'F') as PDFNumber).asNumber()).toBe(4);
    expect(get(dict, 'NM')).toBeDefined();
    expect(get(dict, FYRE_ANNOT_KEY)).toBeDefined();
  });

  it('writes highlight with QuadPoints and a Multiply/0.4 ExtGState in the AP', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: [HIGHLIGHT] });
    const annots = doc.getPages()[0].node.Annots()!;
    const dict = doc.context.lookup(annots.get(0), PDFDict);
    expect(nums(dict, 'QuadPoints')).toHaveLength(8);
    const ap = apDict(doc, dict);
    const resources = ap.get(PDFName.of('Resources')) as PDFDict;
    const gs0 = (resources.get(PDFName.of('ExtGState')) as PDFDict).get(PDFName.of('GS0'));
    const gsDict = doc.context.lookupMaybe(gs0, PDFDict) ?? (gs0 as PDFDict);
    expect((gsDict.get(PDFName.of('BM')) as PDFName).decodeText()).toBe('Multiply');
    expect((gsDict.get(PDFName.of('ca')) as PDFNumber).asNumber()).toBeCloseTo(0.4);
    // BBox must not be pdf-lib's zero default.
    const bbox = (ap.get(PDFName.of('BBox')) as PDFArray).asArray().map((n) => (n as PDFNumber).asNumber());
    expect(bbox[2]).toBeGreaterThan(0);
    expect(bbox[3]).toBeGreaterThan(0);
  });

  it('writes arrow as /Line with /L and an OpenArrow ending', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: [ARROW] });
    const [dict] = await annotDicts(doc);
    expect(nameOf(dict, 'Subtype')).toBe('Line');
    const l = nums(dict, 'L');
    expect(l[0]).toBeCloseTo(40); // 0.1*400
    expect(l[1]).toBeCloseTo(240); // 600 − 0.6*600
    const le = (get(dict, 'LE') as PDFArray).asArray().map((n) => (n as PDFName).decodeText());
    expect(le).toEqual(['None', 'OpenArrow']);
  });

  it('writes rect as /Square with a stroke-padded Rect and BS width', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: [BOX] });
    const [dict] = await annotDicts(doc);
    expect(nameOf(dict, 'Subtype')).toBe('Square');
    const bs = get(dict, 'BS') as PDFDict;
    expect((bs.get(PDFName.of('W')) as PDFNumber).asNumber()).toBeCloseTo(2.4); // 0.006*400
    const rect = nums(dict, 'Rect');
    expect(rect[0]).toBeCloseTo(40 - 1.2);
    expect(rect[2]).toBeCloseTo(160 + 1.2);
  });

  it('writes text as /FreeText with /DA and Helvetica in the AP resources', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: [TEXT] });
    const annots = doc.getPages()[0].node.Annots()!;
    const dict = doc.context.lookup(annots.get(0), PDFDict);
    expect(nameOf(dict, 'Subtype')).toBe('FreeText');
    expect((get(dict, 'DA') as PDFString).asString()).toContain('/Helv');
    const resources = apDict(doc, dict).get(PDFName.of('Resources')) as PDFDict;
    expect((resources.get(PDFName.of('Font')) as PDFDict).get(PDFName.of('Helv'))).toBeDefined();
    expect((get(dict, 'Contents') as PDFHexString).decodeText()).toBe('Hello');
  });

  it('writes note as a /Text comment and stamp as /Stamp with contents', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: [NOTE, STAMP] });
    const dicts = await annotDicts(doc);
    expect(nameOf(dicts[0], 'Subtype')).toBe('Text');
    expect(nameOf(dicts[0], 'Name')).toBe('Comment');
    expect(nameOf(dicts[1], 'Subtype')).toBe('Stamp');
    expect((get(dicts[1], 'Contents') as PDFHexString).decodeText()).toBe('APPROVED');
  });

  it('writes signature as an image-XObject stamp', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: [SIG] }, assets);
    const annots = doc.getPages()[0].node.Annots()!;
    const dict = doc.context.lookup(annots.get(0), PDFDict);
    expect(nameOf(dict, 'Subtype')).toBe('Stamp');
    const resources = apDict(doc, dict).get(PDFName.of('Resources')) as PDFDict;
    expect((resources.get(PDFName.of('XObject')) as PDFDict).get(PDFName.of('Im0'))).toBeDefined();
  });

  it('places boxes correctly on a rotated page', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 1: [BOX] });
    const [dict] = await annotDicts(doc, 1);
    // Page 1: 400×600 MediaBox, /Rotate 90 → rendered 600×400. Model rect
    // (0.1,0.2,0.3,0.1): corners (0.1,0.2)/(0.4,0.3) map via (a,b)=(dy,dx)
    // to (80,60)/(120,240); stroke pad = 0.006*600/2 = 1.8.
    const rect = nums(dict, 'Rect');
    [80 - 1.8, 60 - 1.8, 120 + 1.8, 240 + 1.8].forEach((v, i) =>
      expect(rect[i]).toBeCloseTo(v, 6)
    );
  });

  it('replace semantics: re-appending does not duplicate; foreign annots survive', async () => {
    const doc = await buildFixture();
    const page = doc.getPages()[0];
    // A foreign Link annotation, hand-inserted.
    const link = doc.context.register(
      doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10] })
    );
    page.node.normalize();
    page.node.normalizedEntries().Annots.push(link);

    await appendAnnotationsToPdf(doc, { 0: [PEN, BOX] });
    await appendAnnotationsToPdf(doc, { 0: [PEN, BOX] });
    const dicts = await annotDicts(doc);
    expect(dicts).toHaveLength(3); // link + pen + rect, not 5
    expect(nameOf(dicts[0], 'Subtype')).toBe('Link');
  });

  it('removeFyreAnnotations strips only ours', async () => {
    const doc = await buildFixture();
    const page = doc.getPages()[0];
    const link = doc.context.register(
      doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10] })
    );
    page.node.normalize();
    page.node.normalizedEntries().Annots.push(link);
    await appendAnnotationsToPdf(doc, { 0: [PEN] });
    removeFyreAnnotations(doc);
    const dicts = await annotDicts(doc);
    expect(dicts).toHaveLength(1);
    expect(nameOf(dicts[0], 'Subtype')).toBe('Link');
  });

  it('refuses blur/redact — flatten-only by design', async () => {
    const doc = await buildFixture();
    const blur: Annotation = { kind: 'blur', id: 'b1', x: 0.1, y: 0.1, w: 0.2, h: 0.1 };
    await expect(appendAnnotationsToPdf(doc, { 0: [blur] })).rejects.toThrow(/flatten/i);
  });

  it('throws when a signature has no bytes', async () => {
    const doc = await buildFixture();
    await expect(appendAnnotationsToPdf(doc, { 0: [SIG] })).rejects.toThrow(/signature/i);
  });
});

describe('helpers', () => {
  it('hexToRgb01 parses long/short/garbage', () => {
    expect(hexToRgb01('#ff0000')).toEqual([1, 0, 0]);
    expect(hexToRgb01('#0f0')).toEqual([0, 1, 0]);
    expect(hexToRgb01('teal')).toEqual([0, 0, 0]);
  });

  it('winAnsiSanitize keeps CP1252, replaces the rest', () => {
    expect(winAnsiSanitize('Hello — “quoted” • café €5')).toBe('Hello — “quoted” • café €5');
    expect(winAnsiSanitize('日本語 ok')).toBe('??? ok');
  });
});
