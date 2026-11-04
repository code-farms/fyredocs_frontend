/**
 * Runs AI extraction in the browser (web side of the app's extractRun.ts):
 * page text + up to one page image → POST /api/ai/extract → validated
 * Extraction. Nothing is stored — the web has no local library database, so
 * the result lives as long as the reader panel.
 */
import { postExtract } from '@/lib/aiApi';
import { decodeExtraction, type Extraction } from './extraction';
import type { AiPage } from './provider';

export class ExtractionError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

/** Sends text + images, validates the reply (same messages as the app). */
export const requestExtraction = async (pages: AiPage[], images: string[]): Promise<Extraction> => {
  if (pages.length === 0 && images.length === 0) {
    throw new ExtractionError('AI_NO_INPUT', 'This document has no text or pages to read.');
  }
  const result = decodeExtraction(await postExtract({ pages, images }));
  if (!result) throw new ExtractionError('AI_UNAVAILABLE', 'The AI service returned an unreadable answer.');
  return result;
};
