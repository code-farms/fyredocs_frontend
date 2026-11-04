// NOTE: ported from fyredocs_app/src/lib/pdf/__tests__/pagePlan.test.ts — keep in sync.
import { describe, it, expect, vi } from 'vitest';
/**
 * Pins the page-op planner: every editor operation is a pure PageSpec[]
 * transform, and the neighbour-size oracle (NOT hardcoded A4) drives blank
 * and image inserts — including the rotated-neighbour swap.
 */

import {
  deletePage,
  duplicatePage,
  initialPlan,
  insertBlankAfter,
  insertImageAfter,
  isDirty,
  movePage,
  PAGE_SIZES,
  resolveSpecSize,
  rotatePageBy90,
  type PageSpec,
  type SrcPageSize,
} from '@/lib/pdf/pagePlan';

const SIZES: SrcPageSize[] = [
  { width: 100, height: 200, rotation: 0 },
  { width: 300, height: 400, rotation: 90 },
  { width: 500, height: 600, rotation: 0 },
];

const srcIndices = (plan: PageSpec[]) =>
  plan.map((s) => (s.kind === 'source' ? s.src : s.kind));

describe('initialPlan / isDirty', () => {
  it('one source spec per page, pristine plan is not dirty', () => {
    const plan = initialPlan(3);
    expect(srcIndices(plan)).toEqual([0, 1, 2]);
    expect(isDirty(plan, 3)).toBe(false);
  });

  it('any op makes the plan dirty', () => {
    const plan = initialPlan(3);
    expect(isDirty(movePage(plan, 0, 2), 3)).toBe(true);
    expect(isDirty(rotatePageBy90(plan, 1), 3)).toBe(true);
    expect(isDirty(deletePage(plan, 0), 3)).toBe(true);
    expect(isDirty(duplicatePage(plan, 0), 3)).toBe(true);
    expect(isDirty(insertBlankAfter(plan, 0, SIZES), 3)).toBe(true);
  });
});

describe('movePage', () => {
  it('reorders and returns a new array', () => {
    const plan = initialPlan(3);
    const next = movePage(plan, 0, 2);
    expect(srcIndices(next)).toEqual([1, 2, 0]);
    expect(srcIndices(plan)).toEqual([0, 1, 2]);
  });

  it('is identity for from===to and out-of-bounds', () => {
    const plan = initialPlan(3);
    expect(movePage(plan, 1, 1)).toBe(plan);
    expect(movePage(plan, -1, 2)).toBe(plan);
    expect(movePage(plan, 0, 5)).toBe(plan);
  });
});

describe('duplicatePage', () => {
  it('inserts an adjacent copy with a fresh id, preserving the rotate delta', () => {
    const plan = rotatePageBy90(initialPlan(2), 0);
    const next = duplicatePage(plan, 0);
    expect(srcIndices(next)).toEqual([0, 0, 1]);
    expect(next[1]).toMatchObject({ kind: 'source', src: 0, rotate: 90 });
    expect(next[1].id).not.toBe(next[0].id);
  });
});

describe('rotatePageBy90', () => {
  it('accumulates and wraps for source pages', () => {
    let plan = initialPlan(1);
    for (let i = 0; i < 3; i += 1) plan = rotatePageBy90(plan, 0);
    expect(plan[0]).toMatchObject({ rotate: 270 });
    plan = rotatePageBy90(plan, 0);
    expect(plan[0]).toMatchObject({ rotate: 0 });
  });

  it('swaps a blank page’s dimensions', () => {
    const plan = insertBlankAfter([], -1, []);
    const rotated = rotatePageBy90(plan, 0);
    expect(rotated[0]).toMatchObject({
      kind: 'blank',
      width: PAGE_SIZES.a4.height,
      height: PAGE_SIZES.a4.width,
    });
  });
});

describe('deletePage', () => {
  it('removes the page and can empty the plan', () => {
    const plan = initialPlan(2);
    expect(srcIndices(deletePage(plan, 0))).toEqual([1]);
    expect(deletePage(deletePage(plan, 0), 0)).toEqual([]);
  });
});

describe('resolveSpecSize', () => {
  it('swaps width/height for effective 90/270 (stored + delta)', () => {
    const plan = initialPlan(3);
    // Page 1 stores /Rotate 90 → already swapped with no delta.
    expect(resolveSpecSize(plan[1], SIZES)).toEqual({ width: 400, height: 300 });
    // Delta 90 on top of stored 90 → effective 180 → unswapped.
    expect(resolveSpecSize(rotatePageBy90(plan, 1)[1], SIZES)).toEqual({ width: 300, height: 400 });
    // Delta 90 on stored 0 → swapped.
    expect(resolveSpecSize(rotatePageBy90(plan, 0)[0], SIZES)).toEqual({ width: 200, height: 100 });
  });
});

describe('insertBlankAfter', () => {
  it('takes the preceding page’s size in the middle', () => {
    const next = insertBlankAfter(initialPlan(3), 2, SIZES);
    expect(next[3]).toMatchObject({ kind: 'blank', width: 500, height: 600 });
  });

  it('takes the following page’s size when inserting at the start', () => {
    const next = insertBlankAfter(initialPlan(3), -1, SIZES);
    expect(next[0]).toMatchObject({ kind: 'blank', width: 100, height: 200 });
  });

  it('a rotated neighbour yields a swapped (landscape) blank', () => {
    const next = insertBlankAfter(initialPlan(3), 1, SIZES); // page 1 stores /Rotate 90
    expect(next[2]).toMatchObject({ kind: 'blank', width: 400, height: 300 });
  });

  it('a blank/image neighbour resolves through resolveSpecSize', () => {
    const withBlank = insertBlankAfter(initialPlan(1), 0, SIZES);
    const next = insertBlankAfter(withBlank, 1, SIZES);
    expect(next[2]).toMatchObject({ kind: 'blank', width: 100, height: 200 });
  });

  it('falls back to A4 only for an empty plan', () => {
    const next = insertBlankAfter([], -1, []);
    expect(next[0]).toMatchObject({ kind: 'blank', ...PAGE_SIZES.a4 });
  });
});

describe('insertImageAfter', () => {
  it('captures the neighbour size as matchSize at insert time', () => {
    const next = insertImageAfter(initialPlan(3), 1, SIZES, {
      uri: 'file://img.jpg',
      mode: 'fill',
      pageSize: 'match',
    });
    expect(next[2]).toMatchObject({
      kind: 'image',
      uri: 'file://img.jpg',
      mode: 'fill',
      pageSize: 'match',
      matchSize: { width: 400, height: 300 },
      rotate: 0,
    });
  });
});
