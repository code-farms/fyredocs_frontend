/**
 * Re-open, export and import reader markup (web side of the app's Phase 15
 * exportFile / import flow).
 *
 * Re-open reads back ONLY our own annotations (/FyreAnnot, lossless). The
 * app also reverse-maps foreign annotations (Acrobat's etc.) into editable
 * marks, but the writer only replaces /FyreAnnot ones on save, so those
 * approximations would be written next to the untouched originals — a
 * duplicate of every foreign mark. Foreign annotations simply stay in the
 * file here.
 */
import { PDFDict, PDFDocument, PDFHexString, PDFName, PDFString } from 'pdf-lib';
import { parseAnnotation, parseDocument, serializeDocument } from './annotationsJson';
import type { Annotation } from './model';
import { pageGeometries } from './pageSpace';
import { FYRE_ANNOT_KEY } from './pdfAnnots';
import { exportXfdf, importXfdf } from './xfdf';

const load = (bytes: Uint8Array) => PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });

/** Fyredocs annotations saved in the PDF, by 0-based page; {} when none or unreadable. */
export const readOwnAnnotations = async (bytes: Uint8Array): Promise<Record<number, Annotation[]>> => {
  let doc: PDFDocument;
  try {
    doc = await load(bytes);
  } catch {
    return {};
  }
  const out: Record<number, Annotation[]> = {};
  doc.getPages().forEach((page, index) => {
    const annots = page.node.Annots();
    if (!annots) return;
    for (let i = 0; i < annots.size(); i++) {
      try {
        const raw = doc.context.lookupMaybe(annots.get(i), PDFDict)?.get(PDFName.of(FYRE_ANNOT_KEY));
        const json = raw instanceof PDFString || raw instanceof PDFHexString ? raw.decodeText() : null;
        const parsed = json ? parseAnnotation(json) : null;
        if (parsed) (out[index] ??= []).push(parsed);
      } catch {
        // One malformed annotation must not sink the page.
      }
    }
  });
  return out;
};

export const exportAnnotationsJson = (pages: Record<number, Annotation[]>): string => serializeDocument(pages);

export const exportAnnotationsXfdf = async (bytes: Uint8Array, pages: Record<number, Annotation[]>): Promise<string> =>
  exportXfdf(pages, pageGeometries(await load(bytes)));

/**
 * XFDF (starts with '<') or our JSON → markup, restricted to pages that
 * exist in this PDF. Null when the file isn't either format.
 */
export const importAnnotations = async (
  text: string,
  bytes: Uint8Array
): Promise<Record<number, Annotation[]> | null> => {
  const geoms = pageGeometries(await load(bytes));
  const parsed = text.trimStart().startsWith('<') ? importXfdf(text, geoms) : parseDocument(text);
  if (!parsed) return null;
  return Object.fromEntries(Object.entries(parsed).filter(([page, list]) => Number(page) < geoms.length && list.length > 0));
};
