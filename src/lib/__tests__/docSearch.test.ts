// NOTE: ported from fyredocs_app/src/lib/__tests__/docSearch.test.ts — keep in sync.
import { describe, it, expect } from 'vitest';
/**
 * Pins in-document search over \f-separated page text: per-page counts, the
 * case/whole-word toggles, and regex-special query safety.
 */

import {
  escapeRegExp,
  findMatches,
  PAGE_A11Y_TEXT_CAP,
  pageA11yLabel,
  searchDocument,
  splitPages,
} from '@/lib/docSearch';

const DOC = 'The cat sat.\fA CAT and a catalog.\fno felines here\fcat';

describe('splitPages', () => {
  it('splits on form feeds, preserving empty pages', () => {
    expect(splitPages('a\f\fb')).toEqual(['a', '', 'b']);
    expect(splitPages('solo')).toEqual(['solo']);
  });
});

describe('searchDocument', () => {
  it('counts case-insensitive substrings per page by default', () => {
    const r = searchDocument(DOC, 'cat');
    expect(r.total).toBe(4);
    expect(r.pages).toEqual([
      { page: 0, count: 1 },
      { page: 1, count: 2 }, // CAT + catalog
      { page: 3, count: 1 },
    ]);
  });

  it('case-sensitive toggle drops the uppercase match', () => {
    const r = searchDocument(DOC, 'cat', { caseSensitive: true });
    expect(r.total).toBe(3); // cat, catalog, cat
    expect(r.pages.map((p) => p.page)).toEqual([0, 1, 3]);
  });

  it('whole-word toggle drops the catalog match', () => {
    const r = searchDocument(DOC, 'cat', { wholeWord: true });
    expect(r.total).toBe(3); // cat, CAT, cat
    expect(r.pages).toEqual([
      { page: 0, count: 1 },
      { page: 1, count: 1 },
      { page: 3, count: 1 },
    ]);
  });

  it('whole-word + case-sensitive compose', () => {
    const r = searchDocument(DOC, 'cat', { wholeWord: true, caseSensitive: true });
    expect(r.total).toBe(2);
  });

  it('regex-special characters search literally', () => {
    const r = searchDocument('price is $5.00 (sale)\ftotal: $5.00', '$5.00');
    expect(r.total).toBe(2);
    expect(searchDocument('a(b)c', '(b)').total).toBe(1);
  });

  it('empty query or empty text yields nothing', () => {
    expect(searchDocument(DOC, '   ')).toEqual({ total: 0, pages: [] });
    expect(searchDocument('', 'cat')).toEqual({ total: 0, pages: [] });
  });
});

describe('findMatches (Phase 12 highlight offsets)', () => {
  it('returns every character range, in order', () => {
    const text = 'the cat sat on the catalog';
    expect(findMatches(text, 'cat')).toEqual([
      { start: 4, end: 7 },
      { start: 19, end: 22 },
    ]);
  });

  it('agrees with searchDocument on counts (it IS the counter now)', () => {
    for (const opts of [
      {},
      { caseSensitive: true },
      { wholeWord: true },
      { caseSensitive: true, wholeWord: true },
    ]) {
      const viaSearch = searchDocument(DOC, 'cat', opts).total;
      const viaMatches = splitPages(DOC).reduce(
        (n, page) => n + findMatches(page, 'cat', opts).length,
        0
      );
      expect(viaMatches).toBe(viaSearch);
    }
  });

  it('is case-insensitive by default with offsets into the ORIGINAL string', () => {
    const [m] = findMatches('A CAT.', 'cat');
    expect(m).toEqual({ start: 2, end: 5 });
  });

  it('whole-word anchors at word boundaries', () => {
    expect(findMatches('cat catalog cat', 'cat', { wholeWord: true })).toEqual([
      { start: 0, end: 3 },
      { start: 12, end: 15 },
    ]);
  });

  it('does not overlap matches (advance past the previous end)', () => {
    expect(findMatches('aaaa', 'aa')).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ]);
  });

  it('empty query or text yields nothing', () => {
    expect(findMatches('', 'cat')).toEqual([]);
    expect(findMatches('text', '  ')).toEqual([]);
  });
});

describe('escapeRegExp', () => {
  it('escapes every regex metacharacter', () => {
    expect(new RegExp(escapeRegExp('a.b*c?[]$^(){}|\\')).test('a.b*c?[]$^(){}|\\')).toBe(true);
  });
});

describe('pageA11yLabel (Phase 21 — the spoken page)', () => {
  const pages = splitPages(DOC);

  it('says the page position and the stored page text', () => {
    expect(pageA11yLabel(0, 4, pages)).toBe('Page 1 of 4. The cat sat.');
    expect(pageA11yLabel(3, 4, pages)).toBe('Page 4 of 4. cat');
  });

  it('says missing text honestly', () => {
    expect(pageA11yLabel(0, 4, [])).toBe('Page 1 of 4. No text extracted.');
    expect(pageA11yLabel(1, 3, ['text', '   '])).toBe('Page 2 of 3. No text extracted.');
  });

  it('clamps when OCR page splits drift below the rendered page count', () => {
    // 4 rendered pages, only 2 text pages — the last cells speak the last text page.
    expect(pageA11yLabel(3, 4, ['one', 'two'])).toBe('Page 4 of 4. two');
  });

  it('truncates long pages at a word boundary with an ellipsis', () => {
    const longText = Array(120).fill('word').join(' '); // 599 chars
    const label = pageA11yLabel(0, 1, [longText]);
    expect(label.length).toBeLessThanOrEqual(PAGE_A11Y_TEXT_CAP + 'Page 1 of 1. '.length + 1);
    expect(label.endsWith('…')).toBe(true);
    expect(label).not.toMatch(/wor…$/); // never cut mid-word
  });
});
