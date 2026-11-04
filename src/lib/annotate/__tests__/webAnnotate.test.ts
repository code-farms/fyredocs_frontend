import { beforeEach, describe, expect, it } from 'vitest';
import { PDFArray, PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { DRAFTS_KEY, loadDrafts, markupCount, MAX_DRAFT_DOCS, saveDrafts } from '@/lib/annotate/webDrafts';
import { AnnotateSaveError, saveAnnotatedPdf } from '@/lib/annotate/savePdf';
import type { Annotation } from '@/lib/annotate/model';

const pen: Annotation = {
  id: 'p1',
  kind: 'pen',
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.3, y: 0.2 },
  ],
  dx: 0,
  dy: 0,
  color: '#d43c3c',
  strokeWidth: 0.006,
  bounds: { x: 0.097, y: 0.097, w: 0.206, h: 0.106 },
};
const text: Annotation = { id: 't1', kind: 'text', x: 0.2, y: 0.5, text: 'Check this', color: '#111111', fontScale: 0.035 };

describe('webDrafts', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a draft and removes it when emptied', () => {
    saveDrafts('fp', { 0: [pen], 2: [text] });
    expect(loadDrafts('fp')).toEqual({ 0: [pen], 2: [text] });
    expect(markupCount(loadDrafts('fp'))).toBe(2);
    saveDrafts('fp', { 0: [] });
    expect(loadDrafts('fp')).toEqual({});
    expect(JSON.parse(localStorage.getItem(DRAFTS_KEY)!)).not.toHaveProperty('fp');
  });

  it('keeps only the most recent documents', () => {
    for (let i = 0; i < MAX_DRAFT_DOCS + 3; i++) saveDrafts(`doc-${i}`, { 0: [pen] });
    expect(Object.keys(JSON.parse(localStorage.getItem(DRAFTS_KEY)!))).toHaveLength(MAX_DRAFT_DOCS);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem(DRAFTS_KEY, '{bad');
    expect(loadDrafts('fp')).toEqual({});
  });
});

describe('saveAnnotatedPdf', () => {
  const blankPdf = async (pages = 2) => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pages; i++) doc.addPage([600, 800]);
    return doc.save();
  };
  const annotsOn = async (bytes: Uint8Array, page: number) => {
    const doc = await PDFDocument.load(bytes);
    const annots = doc.getPages()[page].node.lookupMaybe(PDFName.of('Annots'), PDFArray);
    return annots ? annots.asArray().map((ref) => doc.context.lookup(ref, PDFDict)) : [];
  };

  it('writes real /Annot objects with appearance streams on the right pages', async () => {
    const out = await saveAnnotatedPdf(await blankPdf(), { 0: [pen], 1: [text] });
    const first = await annotsOn(out, 0);
    const second = await annotsOn(out, 1);
    expect(first).toHaveLength(1);
    expect(first[0].get(PDFName.of('Subtype'))?.toString()).toBe('/Ink');
    expect(first[0].get(PDFName.of('AP'))).toBeDefined();
    expect(second[0].get(PDFName.of('Subtype'))?.toString()).toBe('/FreeText');
  });

  it('replaces its own marks on re-save instead of duplicating them', async () => {
    const once = await saveAnnotatedPdf(await blankPdf(1), { 0: [pen] });
    const twice = await saveAnnotatedPdf(once, { 0: [pen, text] });
    expect(await annotsOn(twice, 0)).toHaveLength(2);
  });

  it('refuses unreadable input and flatten-only marks with a sentence', async () => {
    await expect(saveAnnotatedPdf(new Uint8Array([1, 2, 3]), { 0: [pen] })).rejects.toBeInstanceOf(AnnotateSaveError);
    const redact: Annotation = { id: 'r', kind: 'redact', x: 0, y: 0, w: 0.1, h: 0.1 };
    await expect(saveAnnotatedPdf(await blankPdf(1), { 0: [redact] })).rejects.toThrow(/flatten/i);
  });
});
