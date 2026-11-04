/**
 * Thin pdf.js wrapper for the reader. pdf.js is imported lazily so it stays in
 * its own chunk (vite.config.ts "pdfjs" group) and only /reader pays for it.
 */
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { textLayerFrom, type PageTextLayer, type RawTextItem } from './textItems';
import { decodePermissionBits, type PdfPermissions } from './permissions';

export type { PDFDocumentProxy };

/** Why a document could not be opened; drives the reader's error copy. */
export type PdfOpenFailure = 'password' | 'invalid' | 'failed';

export class PdfOpenError extends Error {
  constructor(readonly reason: PdfOpenFailure, message: string) {
    super(message);
    this.name = 'PdfOpenError';
  }
}

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/** Loads pdf.js once and points it at its worker (a separate ?url asset). */
const loadPdfjs = () => {
  pdfjsPromise ??= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return pdfjsPromise;
};

/**
 * Opens a PDF from bytes. pdf.js transfers the buffer to its worker, so the
 * caller's copy is detached afterwards — pass a copy if the bytes are reused.
 */
export const openPdf = async (data: Uint8Array): Promise<PDFDocumentProxy> => {
  const pdfjs = await loadPdfjs();
  try {
    return await pdfjs.getDocument({ data }).promise;
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'PasswordException') {
      throw new PdfOpenError('password', 'This PDF is password-protected.');
    }
    if (name === 'InvalidPDFException') {
      throw new PdfOpenError('invalid', 'This file is not a valid PDF, or it is damaged.');
    }
    throw new PdfOpenError('failed', "The PDF couldn't be opened.");
  }
};

/**
 * Renders one page (1-based) into a canvas at `scale` CSS px per PDF point,
 * multiplied by devicePixelRatio for sharp output. Returns the task so a
 * scrolled-away page can be cancelled; a cancelled render rejects with
 * RenderingCancelledException, which callers ignore.
 */
export const renderPage = async (
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<RenderTask> => {
  const page = await doc.getPage(pageNumber);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const viewport = page.getViewport({ scale: scale * dpr });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
  canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
  return page.render({ canvas, viewport });
};

/** Page size in PDF points (rotation applied), for placeholders before render. */
export const pageSize = async (doc: PDFDocumentProxy, pageNumber: number) => {
  const page = await doc.getPage(pageNumber);
  const { width, height } = page.getViewport({ scale: 1 });
  return { width, height };
};

/**
 * Text of one page (1-based) plus per-item geometry, joined by oracleMath's
 * rule — search counts and highlight rects both index into this one string.
 */
export const pageTextLayer = async (doc: PDFDocumentProxy, pageNumber: number): Promise<PageTextLayer> => {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const raw = content.items.filter((item): item is typeof item & RawTextItem => 'str' in item);
  return textLayerFrom(raw, viewport.transform, viewport.width, viewport.height);
};

export interface OutlineEntry {
  title: string;
  /** 0 = top level. */
  depth: number;
  /** 1-based target page; null when the destination can't be resolved. */
  page: number | null;
}

/** Most outlines are short; this bounds pathological or cyclic ones. */
const MAX_OUTLINE_ENTRIES = 500;

type OutlineNode = { title: string; dest: unknown; items?: OutlineNode[] };

const destPage = async (doc: PDFDocumentProxy, dest: unknown): Promise<number | null> => {
  try {
    const explicit = typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(explicit) || explicit.length === 0) return null;
    const target = explicit[0];
    if (typeof target === 'number') return target + 1;
    if (target && typeof target === 'object') return (await doc.getPageIndex(target as never)) + 1;
    return null;
  } catch {
    return null;
  }
};

/** The document outline ("bookmarks" in desktop readers), first `maxDepth` levels. */
export const readOutline = async (doc: PDFDocumentProxy, maxDepth = 2): Promise<OutlineEntry[]> => {
  let roots: OutlineNode[] | null;
  try {
    roots = (await doc.getOutline()) as OutlineNode[] | null;
  } catch {
    return [];
  }
  const out: OutlineEntry[] = [];
  const walk = async (nodes: OutlineNode[], depth: number) => {
    for (const node of nodes) {
      if (out.length >= MAX_OUTLINE_ENTRIES) return;
      out.push({ title: node.title?.trim() || 'Untitled', depth, page: await destPage(doc, node.dest) });
      if (depth + 1 < maxDepth && node.items?.length) await walk(node.items, depth + 1);
    }
  };
  if (roots) await walk(roots, 0);
  return out;
};

/** Stable per-file id from pdf.js (the /ID entry, or a hash of the bytes). */
export const docFingerprint = (doc: PDFDocumentProxy): string => doc.fingerprints[0] ?? '';

export const isRenderCancelled = (err: unknown) =>
  (err as { name?: string })?.name === 'RenderingCancelledException';

/**
 * The document's advisory permissions, or null when nothing is restricted
 * (unencrypted / no /P). pdf.js returns the granted flags, which OR back into
 * the /P bits the ported decodePermissionBits reads. Fail-open: any error
 * reads as unrestricted — a broken probe must never lock a user out.
 */
export const readPermissions = async (doc: PDFDocumentProxy): Promise<PdfPermissions | null> => {
  try {
    // pdf.js 6 returns a Set of granted flags (older versions: an array).
    const flags = await doc.getPermissions();
    return flags ? decodePermissionBits(Array.from(flags).reduce((p, f) => p | f, 0)) : null;
  } catch {
    return null;
  }
};

/** Releases a document and its worker-side resources (pdf.js 6: via the loading task). */
export const closePdf = (doc: PDFDocumentProxy): Promise<void> => doc.loadingTask.destroy();
