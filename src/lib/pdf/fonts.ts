// NOTE: ported from fyredocs_app/src/lib/pdf/fonts.ts — keep in sync.
/**
 * Non-embedded font detection (Phase 19). PURE pdf-lib, Node-testable.
 * Native renderers substitute missing fonts silently — the page renders,
 * but text can look subtly wrong. This check powers a one-time,
 * non-blocking warning in the viewer; it must NEVER fail a document
 * (any parse problem returns false — the warning is a bonus, not a gate).
 */

import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';

/** The standard-14 base fonts every conforming reader must supply — their
 *  substitution is by design, not a document defect. */
const STANDARD_14 = new Set([
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
  'Symbol',
  'ZapfDingbats',
]);

/** Embedded subsets carry an "ABCDEF+" tag before the family name. */
const stripSubsetTag = (name: string): string => name.replace(/^[A-Z]{6}\+/, '');

const nameOf = (dict: PDFDict, key: string): string => {
  const value = dict.get(PDFName.of(key));
  return value instanceof PDFName ? value.decodeText() : '';
};

/**
 * True when the document uses a non-standard font whose program is not
 * embedded (FontDescriptor lacks FontFile/FontFile2/FontFile3). Type0
 * parents delegate to their descendant CID fonts (also /Type /Font, so the
 * walk visits them); Type3 fonts inline their glyph procedures.
 */
export const hasNonEmbeddedFonts = async (bytes: Uint8Array | string): Promise<boolean> => {
  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFDict)) continue;
      if (nameOf(obj, 'Type') !== 'Font') continue;
      const subtype = nameOf(obj, 'Subtype');
      if (subtype === 'Type0' || subtype === 'Type3') continue;
      const baseFont = stripSubsetTag(nameOf(obj, 'BaseFont'));
      if (!baseFont || STANDARD_14.has(baseFont)) continue;
      const descriptor = doc.context.lookupMaybe(obj.get(PDFName.of('FontDescriptor')), PDFDict);
      if (!descriptor) return true; // non-standard font, nothing to embed from
      const embedded = ['FontFile', 'FontFile2', 'FontFile3'].some(
        (key) => descriptor.get(PDFName.of(key)) !== undefined
      );
      if (!embedded) return true;
    }
    return false;
  } catch {
    return false;
  }
};
