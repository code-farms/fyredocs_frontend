/**
 * Handwriting → text through the vision model (web side of the app's
 * transcribe.ts). Pages go 2 per request — the server's image cap — and the
 * result is one text per page, in order.
 *
 * NOTE: the constants and estimate mirror fyredocs_app/src/lib/ai/transcribe.ts;
 * the app version reads pages from the device library, this one takes a renderer.
 */
import { postTranscribe } from '@/lib/aiApi';
import { OUTPUT_CAP_TOKENS } from './cost';

/** Pages per run — beyond this, pick a range; the cost would surprise. */
export const TRANSCRIBE_MAX_PAGES = 20;
/** Mirrors ai-service llm.ImageTokens: the per-image reservation. */
export const TRANSCRIBE_IMAGE_TOKENS = 1500;
const PAGES_PER_REQUEST = 2;

/** Worst-case tokens, the way the server reserves them. */
export const estimateTranscribe = (pages: number): number => {
  const requests = Math.ceil(pages / PAGES_PER_REQUEST);
  return pages * TRANSCRIBE_IMAGE_TOKENS + requests * OUTPUT_CAP_TOKENS;
};

export class TranscribeCancelled extends Error {}

/**
 * Transcribes `pages` (1-based, in order). Returns one entry per requested
 * page; a page that couldn't be rendered comes back empty.
 */
export const transcribePages = async (
  pages: number[],
  opts: {
    render: (page: number) => Promise<string | null>;
    language?: string;
    onProgress?: (done: number, total: number) => void;
    isCancelled?: () => boolean;
    send?: typeof postTranscribe;
  }
): Promise<{ page: number; text: string }[]> => {
  const send = opts.send ?? postTranscribe;
  const out: { page: number; text: string }[] = [];
  for (let i = 0; i < pages.length; i += PAGES_PER_REQUEST) {
    if (opts.isCancelled?.()) throw new TranscribeCancelled('cancelled');
    const batch = pages.slice(i, i + PAGES_PER_REQUEST);
    const rendered = await Promise.all(batch.map((p) => opts.render(p)));
    const sendable = batch.flatMap((p, k) => (rendered[k] ? [{ page: p, image: rendered[k]! }] : []));
    const texts = sendable.length ? await send({ images: sendable.map((s) => s.image), language: opts.language }) : [];
    for (const p of batch) {
      const k = sendable.findIndex((s) => s.page === p);
      out.push({ page: p, text: k >= 0 ? (texts[k] ?? '').trim() : '' });
    }
    opts.onProgress?.(Math.min(i + PAGES_PER_REQUEST, pages.length), pages.length);
  }
  return out;
};
