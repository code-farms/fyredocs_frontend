// NOTE: ported from fyredocs_app/src/lib/docSearch.ts — keep in sync.
/**
 * In-document search (Phase 12). PURE — searches the stored text
 * (`document_text.content`, OCR or text-layer), whose pages are
 * form-feed-separated, so page mapping is free. Counts and page navigation
 * come from the stored text; on-page highlight GEOMETRY comes from re-running
 * `findMatches` against the pdf.js oracle's own page text (pageHighlights.ts)
 * — the two corpora differ in hyphenation/whitespace/reading order, so an
 * offset from one must never index into the other.
 */

export interface DocSearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

export interface DocSearchResult {
  total: number;
  /** Pages (0-indexed) containing matches, ascending, with per-page counts. */
  pages: { page: number; count: number }[];
}

export const splitPages = (content: string): string[] => content.split('\f');

/** Cap for a page's spoken text — a whole page as one label is unusable. */
export const PAGE_A11Y_TEXT_CAP = 400;

/**
 * Accessibility label for a viewer page cell (Phase 21). Page bitmaps are
 * Skia canvases — opaque to screen readers — so the stored text layer is
 * what gets announced: "Page N of M." plus the page's text, truncated at a
 * word boundary. OCR page splits can drift from the rendered page count
 * (the ViewerSearchBar caveat), so the index clamps; missing text is said
 * honestly rather than silently.
 */
export const pageA11yLabel = (index: number, pageCount: number, pages: string[]): string => {
  const head = `Page ${index + 1} of ${pageCount}.`;
  const text = pages.length > 0 ? (pages[Math.min(index, pages.length - 1)] ?? '').trim() : '';
  if (!text) return `${head} No text extracted.`;
  if (text.length <= PAGE_A11Y_TEXT_CAP) return `${head} ${text}`;
  const cut = text.slice(0, PAGE_A11Y_TEXT_CAP);
  const atWord = cut.lastIndexOf(' ') > PAGE_A11Y_TEXT_CAP / 2 ? cut.slice(0, cut.lastIndexOf(' ')) : cut;
  return `${head} ${atWord}…`;
};

export const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface DocMatch {
  /** Character offsets into the SAME string that was searched. */
  start: number;
  end: number;
}

/**
 * Every match's character range (Phase 12's on-page highlights). The counts
 * in `searchDocument` were always computed from these offsets and then
 * thrown away — this exposes them. NOTE: offsets are only meaningful against
 * the exact string searched; never map an offset from the stored OCR blob
 * onto pdf.js item geometry (the two texts differ in hyphenation, whitespace
 * and reading order).
 */
export const findMatches = (
  haystack: string,
  query: string,
  opts: DocSearchOptions = {}
): DocMatch[] => {
  const needle = query.trim();
  if (!needle || !haystack) return [];
  const out: DocMatch[] = [];
  if (opts.wholeWord) {
    const flags = opts.caseSensitive ? 'g' : 'gi';
    const re = new RegExp(`\\b${escapeRegExp(needle)}\\b`, flags);
    for (const m of haystack.matchAll(re)) {
      out.push({ start: m.index, end: m.index + m[0].length });
    }
    return out;
  }
  const h = opts.caseSensitive ? haystack : haystack.toLowerCase();
  const q = opts.caseSensitive ? needle : needle.toLowerCase();
  let idx = h.indexOf(q);
  while (idx !== -1) {
    out.push({ start: idx, end: idx + q.length });
    idx = h.indexOf(q, idx + q.length);
  }
  return out;
};

const countIn = (haystack: string, query: string, opts: DocSearchOptions): number =>
  findMatches(haystack, query, opts).length;

export const searchDocument = (
  content: string,
  query: string,
  opts: DocSearchOptions = {}
): DocSearchResult => {
  const needle = query.trim();
  if (!needle || !content) return { total: 0, pages: [] };
  const pages: DocSearchResult['pages'] = [];
  let total = 0;
  splitPages(content).forEach((pageText, page) => {
    const count = countIn(pageText, needle, opts);
    if (count > 0) {
      pages.push({ page, count });
      total += count;
    }
  });
  return { total, pages };
};
