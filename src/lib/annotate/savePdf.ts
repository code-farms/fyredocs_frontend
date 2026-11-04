/**
 * Writes reader markup into the PDF as real /Annot objects with appearance
 * streams (the app's non-destructive "Annotate" save): the text layer stays,
 * other viewers show and can edit the marks, and re-saving replaces our own
 * annotations without touching anyone else's.
 */
import { EncryptedPDFError, PDFDocument } from 'pdf-lib';
import type { Annotation } from './model';
import { appendAnnotationsToPdf } from './pdfAnnots';
import { signatureAssets } from './webSignatures';

export class AnnotateSaveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnnotateSaveError';
  }
}

export const saveAnnotatedPdf = async (bytes: Uint8Array, pages: Record<number, Annotation[]>): Promise<Uint8Array> => {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (err instanceof EncryptedPDFError) {
      // Re-saving through pdf-lib would silently drop the encryption.
      throw new AnnotateSaveError("This PDF is password-protected, so markup can't be saved into it. Unlock it first.");
    }
    throw new AnnotateSaveError("This PDF couldn't be read for saving — try Repair PDF first.");
  }
  const { signatures, missing } = signatureAssets(pages);
  if (missing > 0) {
    // Saving would drop it: the writer replaces every Fyredocs annotation.
    throw new AnnotateSaveError(
      "This PDF has a signature placed in the Fyredocs app that this browser can't re-save. Remove it here or keep editing in the app."
    );
  }
  try {
    await appendAnnotationsToPdf(doc, pages, { signatures });
  } catch (err) {
    throw new AnnotateSaveError(err instanceof Error ? err.message : "The markup couldn't be written.");
  }
  return doc.save();
};
