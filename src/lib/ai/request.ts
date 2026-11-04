// NOTE: ported from fyredocs_app/src/lib/ai/request.ts — keep in sync.
/**
 * AI request assembly (Phase 23). PURE. Turns stored document text
 * (`document_text.content`, form-feed-separated pages) into the page list an
 * AiRequest carries, and enforces the page budget BEFORE anything is sent —
 * the rule is "no silent truncation": over budget, the caller must pick a
 * range or opt into a chunked run explicitly.
 *
 * Prompt TEMPLATES are not here — they are server-owned (ai-service). What
 * the app owns is which pages go, in what shape, and what it will cost.
 */

import { AI_MAX_PAGES } from '@/lib/budgets';
import { splitPages } from '@/lib/docSearch';

import type { AiOp, AiPage, AiRequest, AiTurn } from './provider';

/** Pages from stored text. `indices` (0-based) selects a subset; blank pages
 *  are dropped — they cost tokens and carry nothing. Out-of-range indices
 *  are ignored (OCR page splits can drift from the rendered page count). */
export const selectPages = (content: string, indices?: number[]): AiPage[] => {
  const all = splitPages(content);
  const wanted = indices ? [...new Set(indices)].sort((a, b) => a - b) : all.map((_, i) => i);
  const out: AiPage[] = [];
  for (const index of wanted) {
    const text = (all[index] ?? '').trim();
    if (index >= 0 && index < all.length && text) out.push({ index, text });
  }
  return out;
};

/** ~4 characters per token — the usual English heuristic. An estimate for
 *  the pre-run sheet, never a bill: the server's usage numbers are truth. */
export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export const estimateRequestTokens = (request: AiRequest): number => {
  let chars = 0;
  for (const page of request.pages) chars += page.text.length + 12;
  chars += request.question?.length ?? 0;
  chars += request.passage?.length ?? 0;
  for (const turn of request.history ?? []) chars += turn.text.length;
  return Math.ceil(chars / 4);
};

export type BudgetCheck =
  | { ok: true }
  | { ok: false; overBy: number; suggestRange: { start: number; end: number } };

/** Page-count gate. Over budget suggests the first in-budget window
 *  starting at `fromPage` (the viewer's current page, 0-based). */
export const checkBudget = (pageCount: number, fromPage = 0, max = AI_MAX_PAGES): BudgetCheck => {
  if (pageCount <= max) return { ok: true };
  const start = Math.max(0, Math.min(fromPage, pageCount - max));
  return { ok: false, overBy: pageCount - max, suggestRange: { start, end: start + max - 1 } };
};

/** Split pages into contiguous chunks of at most `maxPages` for an explicit
 *  map-reduce summary (summarize each chunk, then summarize the summaries). */
export const chunkForMapReduce = (pages: AiPage[], maxPages = AI_MAX_PAGES): AiPage[][] => {
  if (maxPages < 1) throw new Error('maxPages must be >= 1');
  const chunks: AiPage[][] = [];
  for (let i = 0; i < pages.length; i += maxPages) chunks.push(pages.slice(i, i + maxPages));
  return chunks;
};

/** Reduce step input: each chunk summary becomes a pseudo-page tagged with
 *  the chunk's first real page, so citations still point somewhere real. */
export const summariesAsPages = (chunks: AiPage[][], summaries: string[]): AiPage[] =>
  summaries.map((text, i) => ({ index: chunks[i]?.[0]?.index ?? i, text }));

export interface AiRequestInput {
  question?: string;
  history?: AiTurn[];
  targetLang?: string;
  passage?: string;
}

export class AiRequestError extends Error {
  readonly code = 'AI_INVALID_REQUEST';
}

/** Validate op-specific inputs and build the wire request. */
export const buildAiRequest = (op: AiOp, pages: AiPage[], input: AiRequestInput = {}): AiRequest => {
  if (pages.length === 0 && op !== 'rewrite') throw new AiRequestError('No text to send — extract text first.');
  const request: AiRequest = { op, pages };
  if (op === 'ask') {
    const question = input.question?.trim();
    if (!question) throw new AiRequestError('Ask needs a question.');
    request.question = question;
    if (input.history?.length) request.history = input.history;
  }
  if (op === 'translate') {
    const lang = input.targetLang?.trim();
    if (!lang) throw new AiRequestError('Translate needs a target language.');
    request.targetLang = lang;
  }
  if (op === 'rewrite') {
    const passage = input.passage?.trim();
    if (!passage) throw new AiRequestError('Rewrite needs a passage.');
    request.passage = passage;
  }
  return request;
};

/** Server limits for Ask history (ai-service internal/ops). */
export const MAX_HISTORY_TURNS = 20;
export const MAX_TURN_CHARS = 8000;

/** Fit chat history to the server's limits instead of letting a long
 *  conversation start failing with 413: keep the most recent turns, start
 *  on a user turn so roles still alternate, and clip any turn over the
 *  per-turn cap (long answers keep their beginning, which carries the gist). */
export const trimHistory = (history: AiTurn[], maxTurns = MAX_HISTORY_TURNS, maxChars = MAX_TURN_CHARS): AiTurn[] => {
  let kept = history.slice(-maxTurns);
  while (kept.length > 0 && kept[0].role !== 'user') kept = kept.slice(1);
  return kept.map((t) => (t.text.length > maxChars ? { ...t, text: `${t.text.slice(0, maxChars - 1)}…` } : t));
};
