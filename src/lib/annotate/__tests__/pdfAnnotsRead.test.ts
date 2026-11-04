// NOTE: ported from fyredocs_app/src/lib/annotate/__tests__/pdfAnnotsRead.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach } from 'vitest';
/**
 * Pins the /Annots → model reader: lossless write→read round-trips via the
 * /FyreAnnot key (including rotated pages), the standard-field reverse
 * approximation once that key is stripped, and the skip rules for
 * non-markup annotation types.
 */

import { degrees, PDFDict, PDFDocument, PDFName } from 'pdf-lib';

import { appendAnnotationsToPdf, FYRE_ANNOT_KEY } from '@/lib/annotate/pdfAnnots';
import { readAnnotationsFromPdf } from '@/lib/annotate/pdfAnnotsRead';
import type { Annotation, PathAnnotation } from '@/lib/annotate/model';

const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const assets = { signatures: new Map([['signatures/s1.png', new Uint8Array(Buffer.from(PNG_1PX, 'base64'))]]) };

const buildFixture = async (): Promise<PDFDocument> => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 600]);
  doc.addPage([400, 600]).setRotation(degrees(90));
  return doc;
};

const ALL: Annotation[] = [
  {
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
  },
  { kind: 'underline', id: 'ul-1', x1: 0.1, y1: 0.5, x2: 0.4, y2: 0.5, color: '#000000', strokeWidth: 0.004 },
  { kind: 'arrow', id: 'ar-1', x1: 0.1, y1: 0.6, x2: 0.4, y2: 0.7, color: '#3C7DD4', strokeWidth: 0.006 },
  { kind: 'ellipse', id: 'el-1', x: 0.4, y: 0.4, w: 0.2, h: 0.2, color: '#3C7DD4', strokeWidth: 0.006 },
  { kind: 'text', id: 'tx-1', x: 0.2, y: 0.2, text: 'Hello', color: '#000000', fontScale: 0.035 },
  { kind: 'note', id: 'nt-1', x: 0.5, y: 0.5, text: 'A note', color: '#000000', fontScale: 0.035 },
  { kind: 'stamp', id: 'st-1', x: 0.3, y: 0.8, text: 'APPROVED', color: '#D43C3C', fontScale: 0.035 },
  { kind: 'signature', id: 'sg-1', x: 0.1, y: 0.85, w: 0.3, aspect: 0.4, sigRelPath: 'signatures/s1.png' },
];

describe('lossless round-trip via /FyreAnnot', () => {
  it('write → save → read returns the exact model, both pages', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: ALL, 1: [ALL[0], ALL[3]] }, assets);
    const back = await readAnnotationsFromPdf(await doc.save());
    expect(back[0]).toEqual(ALL);
    expect(back[1]).toEqual([ALL[0], ALL[3]]);
  });
});

describe('reverse approximation without /FyreAnnot', () => {
  const stripFyre = (doc: PDFDocument) => {
    for (const page of doc.getPages()) {
      const annots = page.node.Annots();
      if (!annots) continue;
      for (let i = 0; i < annots.size(); i += 1) {
        const dict = doc.context.lookupMaybe(annots.get(i), PDFDict);
        dict?.delete(PDFName.of(FYRE_ANNOT_KEY));
      }
    }
  };

  it('reconstructs pen/line/box/text kinds from standard fields', async () => {
    const doc = await buildFixture();
    await appendAnnotationsToPdf(doc, { 0: ALL }, assets);
    stripFyre(doc);
    const back = await readAnnotationsFromPdf(await doc.save());
    const kinds = back[0].map((a) => a.kind);
    // Signature is an image-only /Stamp — skipped without the lossless key.
    expect(kinds).toEqual(['pen', 'underline', 'arrow', 'ellipse', 'text', 'note', 'stamp']);

    const pen = back[0][0] as PathAnnotation;
    // Reverse-mapped points fold dx/dy in (the writer offset them).
    expect(pen.points[0].x).toBeCloseTo(0.11, 6);
    expect(pen.points[0].y).toBeCloseTo(0.1, 6);
    expect(pen.color).toBe('#d43c3c');
    expect(pen.strokeWidth).toBeCloseTo(0.006, 6);

    const arrow = back[0][2];
    if (arrow.kind !== 'arrow') throw new Error('expected arrow');
    expect(arrow.x1).toBeCloseTo(0.1, 6);
    expect(arrow.y2).toBeCloseTo(0.7, 6);

    const text = back[0][4];
    if (text.kind !== 'text') throw new Error('expected text');
    expect(text.text).toBe('Hello');
    expect(text.fontScale).toBeCloseTo(0.035, 6);
  });

  it('reconstructs boxes on rotated pages', async () => {
    const doc = await buildFixture();
    const box: Annotation = { kind: 'rect', id: 'r1', x: 0.1, y: 0.2, w: 0.3, h: 0.1, color: '#3C7DD4', strokeWidth: 0.006 };
    await appendAnnotationsToPdf(doc, { 1: [box] });
    stripFyre(doc);
    const back = await readAnnotationsFromPdf(await doc.save());
    const got = back[1][0];
    if (got.kind !== 'rect') throw new Error('expected rect');
    // Rect was stroke-padded by half a width on write; the reverse map
    // returns the padded box — close, not exact (approximation by design).
    expect(got.x).toBeCloseTo(0.1, 2);
    expect(got.y).toBeCloseTo(0.2, 2);
    expect(got.w).toBeCloseTo(0.3, 1);
    expect(got.h).toBeCloseTo(0.1, 1);
  });
});

describe('skip rules', () => {
  it('ignores Link/Popup/Widget and malformed dicts', async () => {
    const doc = await buildFixture();
    const page = doc.getPages()[0];
    page.node.normalize();
    const annots = page.node.normalizedEntries().Annots;
    annots.push(doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 9, 9] })));
    annots.push(doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Popup', Rect: [0, 0, 9, 9] })));
    annots.push(doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Square' }))); // no Rect
    const back = await readAnnotationsFromPdf(await doc.save());
    expect(back).toEqual({});
  });

  it('throws on unparseable documents (callers decide the fallback)', async () => {
    await expect(readAnnotationsFromPdf(new Uint8Array([1, 2, 3]))).rejects.toThrow();
  });
});
