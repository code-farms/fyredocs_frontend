/**
 * Re-open, export and import reader markup (web side of the app's Phase 15
 * exportFile / import flow).
 *
 * Re-open reads back ONLY our own annotations (/FyreAnnot, lossless) — the
 * same rule as the app's editor (pdfAnnotsRead includeForeign: false): the
 * writer replaces only /FyreAnnot dicts on save, so seeding reverse-mapped
 * foreign annotations would duplicate them. They stay in the file as-is.
 */
import { PDFDocument } from 'pdf-lib';
import { parseDocument, serializeDocument } from './annotationsJson';
import { readAnnotationsFromPdf } from './pdfAnnotsRead';
import type { Annotation } from './model';
import { pageGeometries } from './pageSpace';
import { exportXfdf, importXfdf } from './xfdf';

const load = (bytes: Uint8Array) => PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });

/** Fyredocs annotations saved in the PDF, by 0-based page; {} when none or unreadable. */
export const readOwnAnnotations = async (bytes: Uint8Array): Promise<Record<number, Annotation[]>> => {
  try {
    return await readAnnotationsFromPdf(bytes, { includeForeign: false });
  } catch {
    return {};
  }
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
