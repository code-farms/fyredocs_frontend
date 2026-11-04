// NOTE: ported from fyredocs_app/src/lib/pdf/__tests__/fonts.test.ts — keep in sync.
import { describe, it, expect } from 'vitest';
/**
 * Pins the non-embedded font detector (Phase 19): standard-14 fonts never
 * warn (their substitution is by design), a non-standard font without a
 * font program does, an embedded one doesn't, and garbage bytes are silent
 * — the warning is a bonus, never a gate.
 */

import { PDFDocument, PDFName, StandardFonts } from 'pdf-lib';

import { hasNonEmbeddedFonts } from '@/lib/pdf/fonts';

/** Registers a font dict (optionally with a descriptor / font file). */
const addFontDict = (
  doc: PDFDocument,
  baseFont: string,
  opts: { descriptor?: boolean; fontFileKey?: string } = {}
) => {
  const ctx = doc.context;
  let descriptorRef;
  if (opts.descriptor) {
    const descriptor = ctx.obj({ Type: 'FontDescriptor', FontName: baseFont });
    if (opts.fontFileKey) {
      const stream = ctx.flateStream(new Uint8Array([1, 2, 3]));
      descriptor.set(PDFName.of(opts.fontFileKey), ctx.register(stream));
    }
    descriptorRef = ctx.register(descriptor);
  }
  const font = ctx.obj({
    Type: 'Font',
    Subtype: 'TrueType',
    BaseFont: baseFont,
    ...(descriptorRef ? { FontDescriptor: descriptorRef } : {}),
  });
  ctx.register(font);
};

describe('hasNonEmbeddedFonts', () => {
  it('standard-14 usage never warns', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    const helv = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText('hello', { x: 10, y: 10, size: 12, font: helv });
    expect(await hasNonEmbeddedFonts(await doc.save())).toBe(false);
  });

  it('a non-standard font without a font program warns', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    addFontDict(doc, 'FakeSans-Regular', { descriptor: true });
    expect(await hasNonEmbeddedFonts(await doc.save())).toBe(true);
  });

  it('a non-standard font WITHOUT even a descriptor warns', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    addFontDict(doc, 'FakeSans-Regular');
    expect(await hasNonEmbeddedFonts(await doc.save())).toBe(true);
  });

  it('an embedded font program (FontFile2) does not warn', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    addFontDict(doc, 'FakeSans-Regular', { descriptor: true, fontFileKey: 'FontFile2' });
    expect(await hasNonEmbeddedFonts(await doc.save())).toBe(false);
  });

  it('subset tags strip before the standard-14 check', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    addFontDict(doc, 'ABCDEF+Helvetica', { descriptor: true });
    expect(await hasNonEmbeddedFonts(await doc.save())).toBe(false);
  });

  it('garbage bytes are silent — never fatal', async () => {
    expect(await hasNonEmbeddedFonts(new Uint8Array([1, 2, 3]))).toBe(false);
  });
});
