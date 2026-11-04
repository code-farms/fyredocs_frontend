/**
 * Thin pdf.js wrapper for the reader. pdf.js is imported lazily so it stays in
 * its own chunk (vite.config.ts "pdfjs" group) and only /reader pays for it.
 */
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

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
    // isEvalSupported: false — the production CSP has no 'unsafe-eval'
    // (deployment/caddy/Caddyfile), so pdf.js's new Function() fast path would
    // only log violations before falling back to its interpreter.
    return await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
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

/** Plain text of one page (1-based), items joined by spaces. */
export const pageText = async (doc: PDFDocumentProxy, pageNumber: number): Promise<string> => {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items
    .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

export const isRenderCancelled = (err: unknown) =>
  (err as { name?: string })?.name === 'RenderingCancelledException';
