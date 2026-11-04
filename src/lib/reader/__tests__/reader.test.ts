import { describe, expect, it } from 'vitest';
import {
  isPdfName,
  pageAt,
  pageOffsets,
  libraryDocOf,
  readerHref,
  readerSourceFromParams,
  renderWindow,
  stepZoom,
  themeFilter,
} from '@/lib/reader/reader';

describe('reader logic', () => {
  it('steps zoom through the fixed stops and clamps at the ends', () => {
    expect(stepZoom(1, 1)).toBe(1.25);
    expect(stepZoom(1, -1)).toBe(0.75);
    expect(stepZoom(3, 1)).toBe(3);
    expect(stepZoom(0.5, -1)).toBe(0.5);
  });

  it('keeps a bounded render window around the current page', () => {
    expect([...renderWindow(1, 1000)]).toEqual([1, 2, 3]);
    expect([...renderWindow(500, 1000)]).toEqual([498, 499, 500, 501, 502]);
    expect([...renderWindow(1000, 1000)]).toEqual([998, 999, 1000]);
    expect(renderWindow(5, 0).size).toBe(0);
  });

  it('maps a scroll position to the page being read', () => {
    const offsets = pageOffsets([100, 200, 100], 10);
    expect(offsets).toEqual([10, 120, 330]);
    expect(pageAt(offsets, 0)).toBe(1);
    expect(pageAt(offsets, 119)).toBe(1);
    expect(pageAt(offsets, 120)).toBe(2);
    expect(pageAt(offsets, 10_000)).toBe(3);
    expect(pageAt([], 50)).toBe(1);
  });

  it('round-trips reader URLs for jobs and documents', () => {
    const job = { kind: 'job', toolId: 'compress', jobId: 'j1' } as const;
    const doc = { kind: 'doc', id: 'd1', orgId: 'o1' } as const;
    for (const source of [job, doc]) {
      const url = new URL(readerHref(source), 'http://x');
      expect(url.pathname).toBe('/reader');
      expect(readerSourceFromParams(url.searchParams)).toEqual(source);
    }
    expect(readerSourceFromParams(new URLSearchParams(''))).toBeNull();
    expect(readerSourceFromParams(new URLSearchParams('job=j1'))).toBeNull();
  });

  it('recognises PDFs and themes the page only', () => {
    expect(isPdfName('a.PDF')).toBe(true);
    expect(isPdfName('scan', 'application/pdf')).toBe(true);
    expect(isPdfName('a.docx')).toBe(false);
    expect(themeFilter('light')).toBeUndefined();
    expect(themeFilter('night')).toMatch(/invert/);
    expect(themeFilter('sepia')).toMatch(/sepia/);
  });
});

describe('library document sources', () => {
  it('carries the library id through job sources and back', () => {
    const job = { kind: 'job', toolId: 'compress', jobId: 'j1', docId: 'd1', orgId: 'o1' } as const;
    const url = new URL(readerHref(job), 'http://x');
    expect(readerSourceFromParams(url.searchParams)).toEqual(job);
    expect(libraryDocOf(job)).toEqual({ id: 'd1', orgId: 'o1' });
    expect(libraryDocOf({ kind: 'doc', id: 'd2' })).toEqual({ id: 'd2' });
    expect(libraryDocOf({ kind: 'job', toolId: 'compress', jobId: 'j2' })).toBeNull();
    expect(libraryDocOf(null)).toBeNull();
  });
});
