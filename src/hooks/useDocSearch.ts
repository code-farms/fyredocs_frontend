import { useEffect, useState } from 'react';
import { findMatches, type DocSearchOptions } from '@/lib/docSearch';
import type { PageTextLayer } from '@/lib/pdf/textItems';

export interface DocSearchState {
  status: 'idle' | 'searching' | 'done';
  /** Pages (1-based) with matches, ascending. */
  hits: { page: number; count: number }[];
  total: number;
  /** Pages scanned so far. */
  scanned: number;
}

const IDLE: DocSearchState = { status: 'idle', hits: [], total: 0, scanned: 0 };
const DEBOUNCE_MS = 250;
/** Publish partial results every N pages so counts grow while a long file is scanned. */
const PUBLISH_EVERY = 10;

/**
 * Searches page by page through `getLayer` (cached text layers), so results
 * for the first pages appear before a 1000-page file is fully scanned. A new
 * query or option cancels the running scan.
 */
export const useDocSearch = (
  pageCount: number,
  getLayer: (page: number) => Promise<PageTextLayer>,
  query: string,
  opts: DocSearchOptions
): DocSearchState => {
  const [state, setState] = useState<DocSearchState>(IDLE);
  const { caseSensitive, wholeWord } = opts;

  useEffect(() => {
    const needle = query.trim();
    if (!needle || pageCount < 1) {
      setState(IDLE);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const hits: DocSearchState['hits'] = [];
      let total = 0;
      setState({ status: 'searching', hits: [], total: 0, scanned: 0 });
      for (let page = 1; page <= pageCount; page++) {
        let text = '';
        try {
          text = (await getLayer(page)).text;
        } catch {
          // An unreadable page just has no matches.
        }
        if (cancelled) return;
        const count = findMatches(text, needle, { caseSensitive, wholeWord }).length;
        if (count > 0) {
          hits.push({ page, count });
          total += count;
        }
        if (page % PUBLISH_EVERY === 0 && page < pageCount) {
          setState({ status: 'searching', hits: hits.slice(), total, scanned: page });
        }
      }
      setState({ status: 'done', hits, total, scanned: pageCount });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pageCount, getLayer, query, caseSensitive, wholeWord]);

  return state;
};

/** Global match index → its page and the index within that page. */
export const locateMatch = (hits: DocSearchState['hits'], index: number): { page: number; inPage: number } | null => {
  let remaining = index;
  for (const h of hits) {
    if (remaining < h.count) return { page: h.page, inPage: remaining };
    remaining -= h.count;
  }
  return null;
};
