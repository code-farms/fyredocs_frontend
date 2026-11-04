import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { locateMatch, useDocSearch } from '@/hooks/useDocSearch';

const pages = ['The cat sat', 'no match here', 'cat and Cat and category'];
const getLayer = async (p: number) => ({ text: pages[p - 1], offsets: [], items: [] });

describe('useDocSearch', () => {
  it('counts matches per page with the toggles', async () => {
    const { result, rerender } = renderHook(
      ({ q, ws }) => useDocSearch(3, getLayer, q, { wholeWord: ws }),
      { initialProps: { q: 'cat', ws: false } }
    );
    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.hits).toEqual([
      { page: 1, count: 1 },
      { page: 3, count: 3 },
    ]);
    rerender({ q: 'cat', ws: true });
    await waitFor(() => expect(result.current.total).toBe(3));
  });

  it('is idle for an empty query and survives unreadable pages', async () => {
    const { result } = renderHook(() => useDocSearch(3, getLayer, '  ', {}));
    expect(result.current.status).toBe('idle');
    const failing = vi.fn(async (p: number) => {
      if (p === 2) throw new Error('bad page');
      return getLayer(p);
    });
    const r2 = renderHook(() => useDocSearch(3, failing, 'cat', {}));
    await waitFor(() => expect(r2.result.current.status).toBe('done'));
    expect(r2.result.current.total).toBe(4);
  });

  it('locates a global match index', () => {
    const hits = [
      { page: 2, count: 2 },
      { page: 5, count: 1 },
    ];
    expect(locateMatch(hits, 0)).toEqual({ page: 2, inPage: 0 });
    expect(locateMatch(hits, 2)).toEqual({ page: 5, inPage: 0 });
    expect(locateMatch(hits, 3)).toBeNull();
  });
});
