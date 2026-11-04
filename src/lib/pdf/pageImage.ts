/**
 * PDF page → JPEG data URL for the AI vision inputs (extract, transcribe).
 * The browser counterpart of the app's pdf/imageInput.ts + raster: rendered
 * through pdf.js into an offscreen canvas.
 *
 * NOTE: limits mirror ai-service (handlers/extract.go): at most 1.5 MB
 * decoded per image, and the app's AI_IMAGE_MAX_EDGE of 1600 px.
 */
import { renderPage, type PDFDocumentProxy } from './pdfjs';

export const AI_IMAGE_MAX_EDGE = 1600;
export const AI_IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;

/** Scale that fits a w×h page (PDF points) into `maxEdge` px on its long side. */
export const fitScale = (w: number, h: number, maxEdge = AI_IMAGE_MAX_EDGE): number =>
  w > 0 && h > 0 ? maxEdge / Math.max(w, h) : 1;

/** Decoded size of a base64 data URL. */
export const dataUrlBytes = (url: string): number => {
  const b64 = url.slice(url.indexOf(',') + 1);
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
};

/** Quality/edge steps tried in order until the image fits the server's cap. */
const ATTEMPTS = [
  { edge: AI_IMAGE_MAX_EDGE, quality: 0.85 },
  { edge: AI_IMAGE_MAX_EDGE, quality: 0.7 },
  { edge: 1200, quality: 0.7 },
] as const;

/**
 * A page (1-based) as an AI-sized JPEG, or null when it can't be produced.
 * Best-effort by contract: callers degrade to text-only input on null.
 */
export const pageImageForAi = async (doc: PDFDocumentProxy, pageNumber: number): Promise<string | null> => {
  try {
    const page = await doc.getPage(pageNumber);
    const { width, height } = page.getViewport({ scale: 1 });
    for (const { edge, quality } of ATTEMPTS) {
      const canvas = document.createElement('canvas');
      // renderPage multiplies by devicePixelRatio; divide it back out so the
      // pixel size is exactly what we asked for.
      const dpr = window.devicePixelRatio || 1;
      const task = await renderPage(doc, pageNumber, canvas, fitScale(width, height, edge) / dpr);
      await task.promise;
      const url = canvas.toDataURL('image/jpeg', quality);
      canvas.width = canvas.height = 0;
      if (url.startsWith('data:image/jpeg') && dataUrlBytes(url) <= AI_IMAGE_MAX_BYTES) return url;
    }
  } catch {
    // Text-only is the honest degrade.
  }
  return null;
};
