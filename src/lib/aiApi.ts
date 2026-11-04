// NOTE: ported from fyredocs_app/src/api/aiApi.ts — keep in sync.
import { apiJson } from '@/lib/apiClient';

/** GET /api/ai/quota — the caller's AI token quota for this UTC month. */
export interface AiQuota {
  plan: string;
  period: string;
  limitTokens: number;
  usedTokens: number;
  reservedTokens: number;
  remainingTokens: number;
  resetsAt: string;
}

export const getAiQuota = async (): Promise<AiQuota> => {
  const res = await apiJson<{ data: AiQuota }>('/api/ai/quota');
  return res.data;
};

/** POST /api/ai/extract — classify + title + typed fields + tables. The
 *  result is decoded/validated by src/lib/ai/extraction.ts before use. */
export const postExtract = async (body: { pages: { index: number; text: string }[]; images: string[] }): Promise<unknown> => {
  const res = await apiJson<{ data: unknown }>('/api/ai/extract', { method: 'POST', body: JSON.stringify(body) });
  return res.data;
};

/** POST /api/ai/transcribe — handwriting OCR: 1–2 page images → one verbatim
 *  text per image. Needs a vision model server-side (503 otherwise). */
export const postTranscribe = async (body: { images: string[]; language?: string }): Promise<string[]> => {
  const res = await apiJson<{ data: { pages?: unknown } }>('/api/ai/transcribe', { method: 'POST', body: JSON.stringify(body) });
  const pages = res.data?.pages;
  return Array.isArray(pages) ? pages.map((p) => (typeof p === 'string' ? p : '')) : [];
};
