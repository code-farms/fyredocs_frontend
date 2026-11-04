// NOTE: ported from fyredocs_app/src/lib/pdf/pageRange.ts — keep in sync.
/**
 * Page-range parsing for on-device share/print (Phase 6). PURE — no pdf-lib,
 * no expo, no React (the `pagePlan.ts` kind of module).
 *
 * Syntax deliberately mirrors the BACKEND's page-selection string
 * ("2,4,6-8", used by remove-pages / extract-pages / split) so users meet one
 * syntax across the app — the difference is that here it is parsed on-device
 * against a known page count instead of shipped off as an opaque string.
 *
 * Two decisions that look like bugs but are not:
 *
 * 1. Results are SORTED and DE-DUPLICATED. `applyPagePlan` faithfully honours
 *    both order and duplicates, so "3,1,1" would otherwise emit a silently
 *    REORDERED 3-page document. Reordering and duplicating pages is the page
 *    editor's job (/library/edit-pages); "pick pages to share" must come out in
 *    document order. Dedup also makes indices.length equal the output page
 *    count, which is what "N pages selected" promises the user.
 * 2. Out-of-range input is REJECTED, never clamped. Clamping turns a typo into
 *    a plausible-but-wrong document that then gets shared or printed. The
 *    "All pages" scope already exists for the clamped intent.
 */

import type { PageSpec } from './pagePlan';

export type PageRangeErrorCode = 'empty' | 'syntax' | 'out-of-range' | 'reverse-range';

export type PageRangeParse =
  | { ok: true; indices: number[] }
  | { ok: false; code: PageRangeErrorCode; message: string; token?: string };

/** Page numbers longer than this are rejected before expansion — "1-99999999"
 *  must never allocate an array on a keystroke. */
const MAX_DIGITS = 7;

const SYNTAX_HINT = 'Use page numbers like 2, 4, 6-8.';

const fail = (code: PageRangeErrorCode, message: string, token?: string): PageRangeParse => ({
  ok: false,
  code,
  message,
  ...(token === undefined ? {} : { token }),
});

const pagesWord = (n: number): string => `${n} ${n === 1 ? 'page' : 'pages'}`;

/**
 * Normalizes before tokenizing. The dash pass is load-bearing: iOS smart
 * punctuation rewrites a typed hyphen as an en dash, so a correctly-typed
 * "6-8" arrives as "6–8" and would otherwise be a syntax error.
 */
const normalize = (input: string): string =>
  input
    .trim()
    // U+2010..U+2015 hyphen/figure/en/em dash + horizontal bar, U+2212 minus,
    // U+FF0D fullwidth hyphen.
    .replace(/[‐-―−－]/g, '-')
    .replace(/\s*-\s*/g, '-');

const RANGE_RE = /^(\d*)-(\d*)$/;

export const parsePageRange = (input: string, pageCount: number): PageRangeParse => {
  const text = normalize(input);
  if (text.length === 0) return fail('empty', 'Enter pages like 2, 4, 6-8.');

  const outOfRange = (token?: string): PageRangeParse =>
    fail('out-of-range', `This document has ${pagesWord(pageCount)}.`, token);

  if (pageCount <= 0) return outOfRange();

  const all = (): PageRangeParse => ({
    ok: true,
    indices: Array.from({ length: pageCount }, (_, i) => i),
  });

  // Accepted only as the ENTIRE input — "all,2" is a syntax error rather than
  // a precedence rule nobody asked for.
  const lower = text.toLowerCase();
  if (lower === 'all' || lower === '*') return all();

  // Empty tokens are dropped, not rejected: live validation must not flash red
  // while the user is midway through typing "2,".
  const tokens = text.split(/[,\s]+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return fail('empty', 'Enter pages like 2, 4, 6-8.');

  const seen = new Set<number>();
  for (const token of tokens) {
    let start: number;
    let end: number;

    if (/^\d+$/.test(token)) {
      if (token.length > MAX_DIGITS) return outOfRange(token);
      start = Number(token);
      end = start;
    } else {
      const m = RANGE_RE.exec(token);
      // A bare "-" carries no page number at all.
      if (!m || (m[1] === '' && m[2] === '')) return fail('syntax', SYNTAX_HINT, token);
      if (m[1].length > MAX_DIGITS || m[2].length > MAX_DIGITS) return outOfRange(token);
      // Open-ended forms match every desktop print dialog: "8-" is 8→last,
      // "-3" is first→3.
      start = m[1] === '' ? 1 : Number(m[1]);
      end = m[2] === '' ? pageCount : Number(m[2]);
    }

    if (start < 1 || end < 1 || start > pageCount || end > pageCount) return outOfRange(token);
    if (start > end) {
      return fail('reverse-range', 'Ranges must go forwards, like 6-8.', token);
    }
    for (let p = start; p <= end; p += 1) seen.add(p - 1);
  }

  return { ok: true, indices: [...seen].sort((a, b) => a - b) };
};

/** Inverse of the parser, for filenames and summaries: [0,1,2,6] → "1-3, 7".
 *  Sorts and de-dupes defensively so it round-trips through parsePageRange. */
export const formatPageRange = (indices: number[]): string => {
  const pages = [...new Set(indices)].sort((a, b) => a - b).map((i) => i + 1);
  if (pages.length === 0) return '';

  const parts: string[] = [];
  let runStart = pages[0];
  let prev = pages[0];

  const flush = () => parts.push(runStart === prev ? `${runStart}` : `${runStart}-${prev}`);

  for (let i = 1; i < pages.length; i += 1) {
    if (pages[i] === prev + 1) {
      prev = pages[i];
      continue;
    }
    flush();
    runStart = pages[i];
    prev = pages[i];
  }
  flush();
  return parts.join(', ');
};

/** One pluralization site, shared by every scope in the sheet. */
export const describeSelection = (count: number): string => `${pagesWord(count)} selected`;

/**
 * The chosen pages as a plan for `applyPagePlan` — i.e. `initialPlan(pageCount)`
 * restricted to `indices`, in the CALLER's order (the parser has already sorted
 * them). `rotate: 0` means applyPagePlan never calls setRotation, so each
 * source page's stored /Rotate survives into the subset untouched.
 */
export const subsetPlan = (pageCount: number, indices: number[]): PageSpec[] => {
  if (indices.length === 0) throw new Error('subsetPlan: no pages selected');
  return indices.map((src) => {
    if (!Number.isInteger(src) || src < 0 || src >= pageCount) {
      throw new Error(`subsetPlan: page index ${src} is outside 0..${pageCount - 1}`);
    }
    // Same id scheme as initialPlan — these are the same source pages.
    return { kind: 'source' as const, id: `src-${src}`, src, rotate: 0 as const };
  });
};
