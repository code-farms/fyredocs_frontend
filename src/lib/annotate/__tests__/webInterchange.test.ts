import { beforeEach, describe, expect, it } from 'vitest';
import { PDFDocument, PDFName } from 'pdf-lib';
import { exportAnnotationsJson, exportAnnotationsXfdf, importAnnotations, readOwnAnnotations } from '@/lib/annotate/webInterchange';
import { saveAnnotatedPdf } from '@/lib/annotate/savePdf';
import { signatureAssets, signatureUrl, storeSignature } from '@/lib/annotate/webSignatures';
import type { Annotation } from '@/lib/annotate/model';

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const box: Annotation = { id: 'b1', kind: 'rect', x: 0.1, y: 0.2, w: 0.3, h: 0.1, color: '#2f6fd4', strokeWidth: 0.006 };
const note: Annotation = { id: 'n1', kind: 'note', x: 0.5, y: 0.5, text: 'Check clause 4', color: '#111111', fontScale: 0.035 };

const blankPdf = async (pages = 2) => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([600, 800]);
  return doc.save();
};

/** Adds an Acrobat-style Square annotation with no /FyreAnnot. */
const withForeignAnnot = async (bytes: Uint8Array) => {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPages()[0];
  const annot = doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Square', Rect: [10, 10, 100, 100] }));
  page.node.set(PDFName.of('Annots'), doc.context.obj([annot]));
  return doc.save();
};

describe('webInterchange', () => {
  beforeEach(() => localStorage.clear());

  it('re-opens exactly the marks a save wrote', async () => {
    const saved = await saveAnnotatedPdf(await blankPdf(), { 0: [box], 1: [note] });
    expect(await readOwnAnnotations(saved)).toEqual({ 0: [box], 1: [note] });
  });

  it("leaves other apps' annotations out of the editable markup", async () => {
    expect(await readOwnAnnotations(await withForeignAnnot(await blankPdf()))).toEqual({});
    expect(await readOwnAnnotations(new Uint8Array([1, 2]))).toEqual({});
  });

  it('round-trips JSON and keeps only pages that exist', async () => {
    const bytes = await blankPdf(1);
    const json = exportAnnotationsJson({ 0: [box], 5: [note] });
    expect(await importAnnotations(json, bytes)).toEqual({ 0: [box] });
  });

  it('round-trips XFDF through PDF coordinates', async () => {
    const bytes = await blankPdf(1);
    const xfdf = await exportAnnotationsXfdf(bytes, { 0: [box] });
    expect(xfdf).toContain('<square');
    const back = await importAnnotations(xfdf, bytes);
    expect(back?.[0][0]).toMatchObject({ kind: 'rect', x: expect.closeTo(0.1, 3), y: expect.closeTo(0.2, 3), w: expect.closeTo(0.3, 3) });
  });

  it('rejects files that are neither format', async () => {
    expect(await importAnnotations('hello', await blankPdf(1))).toBeNull();
  });
});

describe('web signatures', () => {
  beforeEach(() => localStorage.clear());

  it('stores signatures and saves them into the PDF as a stamp', async () => {
    const rel = storeSignature(PNG);
    expect(signatureUrl(rel)).toBe(PNG);
    const sig: Annotation = { id: 's1', kind: 'signature', x: 0.6, y: 0.8, w: 0.3, aspect: 0.4, sigRelPath: rel };
    expect(signatureAssets({ 0: [sig] }).signatures.get(rel)).toBeInstanceOf(Uint8Array);
    const saved = await saveAnnotatedPdf(await blankPdf(1), { 0: [sig] });
    expect(await readOwnAnnotations(saved)).toEqual({ 0: [sig] });
  });

  it('refuses to re-save a signature it has no image for', async () => {
    const appSig: Annotation = { id: 's2', kind: 'signature', x: 0.1, y: 0.1, w: 0.3, aspect: 0.4, sigRelPath: 'signatures/abc.png' };
    expect(signatureAssets({ 0: [appSig] }).missing).toBe(1);
    await expect(saveAnnotatedPdf(await blankPdf(1), { 0: [appSig] })).rejects.toThrow(/signature placed in the Fyredocs app/);
  });
});
