// NOTE: ported from fyredocs_app/src/lib/pdf/permissions.ts — keep in sync.
/**
 * PDF permission-bit reading (Phase 16). PURE pdf-lib, no expo imports —
 * Node-testable. The encrypt dict's /P value carries the advisory PDF
 * Table 22 access permissions; the app honours them on open (Print, Share
 * as images, Copy text) with an explanation rather than a silently greyed
 * button. pdf-lib exposes no permissions accessor, so this reads the
 * trailer's /Encrypt dictionary directly.
 */

import { PDFDict, PDFDocument, PDFName, PDFNumber } from 'pdf-lib';

export interface PdfPermissions {
  print: boolean;
  copy: boolean;
  modify: boolean;
  annotate: boolean;
  assemble: boolean;
}

/**
 * Decodes a /P value (PDF 32000-1 Table 22; bits are 1-indexed in the spec).
 * Producers store /P as a signed 32-bit int with the high reserved bits set,
 * so values are usually negative — the `| 0` coercion makes the bit tests
 * exact for both int16- and int32-flavoured producers.
 */
export const decodePermissionBits = (p: number): PdfPermissions => {
  const bits = p | 0;
  const has = (mask: number) => (bits & mask) !== 0;
  return {
    // bit 3 (rev2 print) or bit 12 (rev3+ print)
    print: has(1 << 2) || has(1 << 11),
    // bit 5 (extract) or bit 10 (rev3 extract)
    copy: has(1 << 4) || has(1 << 9),
    // bit 4 (modify contents)
    modify: has(1 << 3),
    // bit 6 (annotate/fill) or bit 9 (rev3 fill)
    annotate: has(1 << 5) || has(1 << 8),
    // bit 11 (assemble)
    assemble: has(1 << 10),
  };
};

/**
 * Permissions of a document, or null when there is nothing to enforce
 * (unencrypted, or an encrypt dict without /P). Throws on unparseable bytes
 * — callers decide the fail-open posture.
 */
export const readPdfPermissions = async (
  bytes: Uint8Array | string
): Promise<PdfPermissions | null> => {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  if (!doc.isEncrypted) return null;
  const encrypt = doc.context.lookupMaybe(doc.context.trailerInfo.Encrypt, PDFDict);
  const p = encrypt?.lookupMaybe(PDFName.of('P'), PDFNumber)?.asNumber();
  if (p == null) return null;
  return decodePermissionBits(p);
};
