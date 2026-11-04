import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadReaderState,
  MAX_DOCS,
  removeBookmark,
  renameBookmark,
  saveLastPage,
  STORE_KEY,
  toggleBookmark,
} from '@/lib/reader/readerStore';

describe('readerStore', () => {
  beforeEach(() => localStorage.clear());

  it('remembers the last page per document', () => {
    expect(loadReaderState('a').lastPage).toBe(1);
    saveLastPage('a', 14);
    saveLastPage('b', 3);
    expect(loadReaderState('a').lastPage).toBe(14);
    expect(loadReaderState('b').lastPage).toBe(3);
  });

  it('toggles, renames and removes bookmarks, kept in page order', () => {
    toggleBookmark('a', 9);
    expect(toggleBookmark('a', 2).map((b) => b.page)).toEqual([2, 9]);
    expect(renameBookmark('a', 9, '  Chapter 3  ')[1].label).toBe('Chapter 3');
    expect(renameBookmark('a', 9, '   ')[1].label).toBe('Page 9');
    expect(toggleBookmark('a', 2).map((b) => b.page)).toEqual([9]);
    expect(removeBookmark('a', 9)).toEqual([]);
  });

  it('caps the number of remembered documents', () => {
    vi.useFakeTimers();
    for (let i = 0; i < MAX_DOCS + 5; i++) {
      vi.setSystemTime(1000 + i);
      saveLastPage(`doc-${i}`, 2);
    }
    vi.useRealTimers();
    const stored = JSON.parse(localStorage.getItem(STORE_KEY)!);
    expect(Object.keys(stored)).toHaveLength(MAX_DOCS);
    expect(stored['doc-0']).toBeUndefined();
    expect(stored[`doc-${MAX_DOCS + 4}`]).toBeDefined();
  });

  it('survives corrupt or blocked storage', () => {
    localStorage.setItem(STORE_KEY, '{not json');
    expect(loadReaderState('a').bookmarks).toEqual([]);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => toggleBookmark('a', 1)).not.toThrow();
    spy.mockRestore();
  });

  it('ignores an empty fingerprint', () => {
    toggleBookmark('', 4);
    expect(localStorage.getItem(STORE_KEY)).toBeNull();
  });
});
