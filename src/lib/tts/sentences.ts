// NOTE: ported from fyredocs_app/src/lib/tts/sentences.ts — keep in sync.
/**
 * Sentence segmentation for read-aloud (Phase 13). PURE — no native imports,
 * fully unit-tested. Feeds the TTS queue from the stored OCR text
 * (`document_text`, \f page separators — the same, and only, text source as
 * in-document search). Sentence boundaries here ARE the pause granularity:
 * Android cannot pause the engine, so "resume" re-speaks from the current
 * sentence (or sub-chunk of an over-long one).
 */

import { splitPages } from '@/lib/docSearch';

export interface TtsPosition {
  page: number;
  sentence: number;
}

/** Sentence-ending punctuation run followed by whitespace or end-of-text.
 *  Requiring the whitespace makes decimals ("3.14") free non-boundaries. */
const BOUNDARY = /[.!?…]+(?=\s|$)/g;

/** Dotted tokens whose trailing period is not a sentence end. Stored as
 *  lowercased letters with inner dots removed ("e.g." → "eg"). "no" is
 *  special-cased: it only abbreviates before a number ("No. 5"). */
const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'prof',
  'sr',
  'jr',
  'st',
  'vs',
  'etc',
  'cf',
  'eg',
  'ie',
  'fig',
  'inc',
  'ltd',
  'approx',
]);

/** Is the '.' at `punctIndex` an abbreviation/initial rather than a sentence
 *  end? Only consulted for a single-period boundary. */
const isAbbreviation = (text: string, punctIndex: number, end: number): boolean => {
  const tail = /([A-Za-z]+(?:\.[A-Za-z]+)*)$/.exec(text.slice(0, punctIndex))?.[1];
  if (!tail) return false;
  const normalized = tail.toLowerCase().replace(/\./g, '');
  if (normalized === 'no') {
    // "No. 5" is an abbreviation; "the answer is no." is a sentence end.
    return /^\d/.test(text.slice(end).trimStart());
  }
  // Single-letter initials ("J. Smith") — and via the dotted-tail capture,
  // the inner periods of "e.g." / "i.e." never reach here as single letters.
  if (tail.length === 1) return true;
  return ABBREVIATIONS.has(normalized);
};

/**
 * Splits one page of OCR text into speakable sentences. Paragraph breaks
 * (blank lines) are forced boundaries; within a paragraph, OCR's hard
 * line-wraps are collapsed to spaces before segmenting. Empty page → `[]`.
 */
export const splitSentences = (pageText: string): string[] => {
  const out: string[] = [];
  for (const para of pageText.split(/\n\s*\n+/)) {
    const text = para.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    let start = 0;
    BOUNDARY.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = BOUNDARY.exec(text)) !== null) {
      const end = m.index + m[0].length;
      if (m[0] === '.' && isAbbreviation(text, m.index, end)) continue;
      const sentence = text.slice(start, end).trim();
      if (sentence) out.push(sentence);
      start = end;
    }
    const tail = text.slice(start).trim();
    if (tail) out.push(tail);
  }
  return out;
};

/**
 * Splits an over-long sentence into utterances the engine accepts (Android
 * rejects ~4000+ chars). Prefers the last clause punctuation before the
 * limit, then the last space, then a hard cut. No chunk exceeds `maxLen`.
 */
export const chunkForSpeech = (sentence: string, maxLen: number): string[] => {
  const trimmed = sentence.trim();
  if (!trimmed) return [];
  if (maxLen <= 0 || trimmed.length <= maxLen) return [trimmed];
  const chunks: string[] = [];
  let rest = trimmed;
  while (rest.length > maxLen) {
    const window = rest.slice(0, maxLen);
    const clause = /^[\s\S]*[,;:—–](?=\s)/.exec(window);
    let cut = clause ? clause[0].length : window.lastIndexOf(' ');
    if (cut <= 0) cut = maxLen; // one giant token — hard cut
    const piece = rest.slice(0, cut).trim();
    if (piece) chunks.push(piece);
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
};

/** Per-page sentence lists for a whole document's stored text. */
export const pageSentences = (content: string): string[][] =>
  splitPages(content).map(splitSentences);

/** The position after `pos`: next sentence on the page, else the first
 *  sentence of the next NON-EMPTY page, else `null` (end of document). */
export const nextPosition = (pages: string[][], pos: TtsPosition): TtsPosition | null => {
  if (pos.sentence + 1 < (pages[pos.page]?.length ?? 0)) {
    return { page: pos.page, sentence: pos.sentence + 1 };
  }
  for (let page = pos.page + 1; page < pages.length; page += 1) {
    if (pages[page].length > 0) return { page, sentence: 0 };
  }
  return null;
};

/** First readable position at-or-after `fromPage` (a tapped page may be an
 *  empty OCR page), else `null`. */
export const firstReadablePosition = (pages: string[][], fromPage: number): TtsPosition | null => {
  for (let page = Math.max(0, fromPage); page < pages.length; page += 1) {
    if (pages[page].length > 0) return { page, sentence: 0 };
  }
  return null;
};
