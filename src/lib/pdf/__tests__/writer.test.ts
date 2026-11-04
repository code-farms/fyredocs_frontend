// NOTE: ported from fyredocs_app/src/lib/pdf/__tests__/writer.test.ts — keep in sync.
import { describe, it, expect, vi } from 'vitest';
/**
 * Round-trips the Phase 14 writer (outlines.test.ts precedent): fixture PDFs
 * are BUILT in-test with distinct page sizes as order markers and reloaded
 * after applyPagePlan — no binary fixtures in the repo. The only image asset
 * is a 1×1 PNG as a base64 constant.
 */

import { degrees, PDFDocument } from 'pdf-lib';

import {
  deletePage,
  duplicatePage,
  initialPlan,
  insertBlankAfter,
  movePage,
  PAGE_SIZES,
  rotatePageBy90,
  type PageSpec,
} from '@/lib/pdf/pagePlan';
import { subsetPlan } from '@/lib/pdf/pageRange';
import {
  applyPagePlan,
  buildPdfFromImages,
  computeImagePlacement,
  extractPageRange,
  readPdfPageInfo,
  type NormalizedImage,
} from '@/lib/pdf/writer';

/** 1×1 transparent PNG. */
const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const pngImage = (): NormalizedImage => ({
  bytes: new Uint8Array(Buffer.from(PNG_1PX, 'base64')),
  format: 'png',
});

/** 3 pages with unique sizes (order markers); page 1 stores /Rotate 90. */
const buildFixture = async (): Promise<Uint8Array> => {
  const doc = await PDFDocument.create();
  doc.addPage([100, 200]);
  doc.addPage([300, 400]).setRotation(degrees(90));
  doc.addPage([500, 600]);
  return doc.save();
};

const reload = async (bytes: Uint8Array) =>
  PDFDocument.load(bytes, { updateMetadata: false });

const sizesOf = async (bytes: Uint8Array) =>
  (await reload(bytes)).getPages().map((p) => {
    const { width, height } = p.getSize();
    return [width, height];
  });

describe('readPdfPageInfo', () => {
  it('reports count, sizes, stored rotation, and encryption', async () => {
    const info = await readPdfPageInfo(await buildFixture());
    expect(info.pageCount).toBe(3);
    expect(info.sizes).toEqual([
      { width: 100, height: 200, rotation: 0 },
      { width: 300, height: 400, rotation: 90 },
      { width: 500, height: 600, rotation: 0 },
    ]);
    expect(info.encrypted).toBe(false);
  });
});

describe('applyPagePlan', () => {
  const run = async (mutate: (plan: PageSpec[]) => PageSpec[]) => {
    const src = await buildFixture();
    const { sizes } = await readPdfPageInfo(src);
    return applyPagePlan(src, mutate(initialPlan(3)), sizes);
  };

  it('identity plan round-trips page order and sizes', async () => {
    const out = await run((p) => p);
    expect(await sizesOf(out)).toEqual([
      [100, 200],
      [300, 400],
      [500, 600],
    ]);
  });

  it('reorder is reflected in the size order', async () => {
    const out = await run((p) => movePage(p, 0, 2));
    expect(await sizesOf(out)).toEqual([
      [300, 400],
      [500, 600],
      [100, 200],
    ]);
  });

  it('duplicate produces an adjacent independent copy', async () => {
    const out = await run((p) => duplicatePage(p, 0));
    expect(await sizesOf(out)).toEqual([
      [100, 200],
      [100, 200],
      [300, 400],
      [500, 600],
    ]);
  });

  it('delete removes exactly the targeted page', async () => {
    const out = await run((p) => deletePage(p, 1));
    expect(await sizesOf(out)).toEqual([
      [100, 200],
      [500, 600],
    ]);
  });

  it('rotate composes the delta over the stored /Rotate', async () => {
    const out = await run((p) => rotatePageBy90(rotatePageBy90(p, 0), 1));
    const pages = (await reload(out)).getPages();
    expect(pages[0].getRotation().angle).toBe(90); // stored 0 + 90
    expect(pages[1].getRotation().angle).toBe(180); // stored 90 + 90
    expect(pages[2].getRotation().angle).toBe(0); // untouched
  });

  it('inserts a blank sized from the neighbour', async () => {
    const src = await buildFixture();
    const { sizes } = await readPdfPageInfo(src);
    const out = await applyPagePlan(src, insertBlankAfter(initialPlan(3), 2, sizes), sizes);
    expect(await sizesOf(out)).toEqual([
      [100, 200],
      [300, 400],
      [500, 600],
      [500, 600],
    ]);
  });

  it('inserts an image page at the matched size', async () => {
    const src = await buildFixture();
    const { sizes } = await readPdfPageInfo(src);
    const plan: PageSpec[] = [
      ...initialPlan(3),
      {
        kind: 'image',
        id: 'img-1',
        uri: 'file://pic.png',
        mode: 'fit',
        pageSize: 'match',
        matchSize: { width: 100, height: 200 },
        rotate: 0,
      },
    ];
    const out = await applyPagePlan(src, plan, sizes, new Map([['file://pic.png', pngImage()]]));
    expect(await sizesOf(out)).toEqual([
      [100, 200],
      [300, 400],
      [500, 600],
      [100, 200],
    ]);
  });

  it('throws when an image spec has no normalized bytes', async () => {
    const src = await buildFixture();
    const { sizes } = await readPdfPageInfo(src);
    const plan: PageSpec[] = [
      {
        kind: 'image',
        id: 'img-1',
        uri: 'file://missing.png',
        mode: 'fit',
        pageSize: 'a4',
        matchSize: PAGE_SIZES.a4,
        rotate: 0,
      },
    ];
    await expect(applyPagePlan(src, plan, sizes)).rejects.toThrow('missing.png');
  });
});

describe('buildPdfFromImages', () => {
  it('fixed page sizes and forced orientation', async () => {
    const out = await buildPdfFromImages([pngImage(), pngImage()], {
      pageSize: 'legal',
      margin: 'none',
      orientation: 'landscape',
    });
    expect(await sizesOf(out)).toEqual([
      [1008, 612],
      [1008, 612],
    ]);
  });

  it('auto page size follows the image aspect with an A4-long edge', async () => {
    const out = await buildPdfFromImages([pngImage()], {
      pageSize: 'auto',
      margin: 'large', // must be ignored on auto
      orientation: 'auto',
    });
    // 1×1 image → square page at the A4 long edge.
    expect(await sizesOf(out)).toEqual([[841.89, 841.89]]);
  });

  it('reports per-image progress', async () => {
    const seen: number[] = [];
    await buildPdfFromImages(
      [pngImage(), pngImage(), pngImage()],
      { pageSize: 'a4', margin: 'none', orientation: 'portrait' },
      (done) => seen.push(done)
    );
    expect(seen).toEqual([1, 2, 3]);
  });
});

describe('computeImagePlacement', () => {
  it('fit letterboxes and centers inside the margin box', () => {
    const p = computeImagePlacement(1000, 500, {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 'normal',
      mode: 'fit',
    });
    expect(p.pageWidth).toBeCloseTo(841.89);
    expect(p.pageHeight).toBeCloseTo(595.28);
    const box = { w: p.pageWidth - 72, h: p.pageHeight - 72 };
    expect(p.drawWidth).toBeLessThanOrEqual(box.w + 1e-6);
    expect(p.drawHeight).toBeLessThanOrEqual(box.h + 1e-6);
    // Centered: symmetric slack on the non-limiting axis.
    expect(p.x - 36).toBeCloseTo(p.pageWidth - 36 - (p.x + p.drawWidth));
    expect(p.y - 36).toBeCloseTo(p.pageHeight - 36 - (p.y + p.drawHeight));
  });

  it('fill covers the content box', () => {
    const p = computeImagePlacement(100, 400, {
      pageSize: 'letter',
      orientation: 'portrait',
      margin: 'none',
      mode: 'fill',
    });
    expect(p.drawWidth).toBeGreaterThanOrEqual(p.pageWidth - 1e-6);
    expect(p.drawHeight).toBeGreaterThanOrEqual(p.pageHeight - 1e-6);
  });

  it('orientation auto follows the image on fixed sizes', () => {
    const wide = computeImagePlacement(200, 100, {
      pageSize: 'a4',
      orientation: 'auto',
      margin: 'none',
      mode: 'fit',
    });
    expect(wide.pageWidth).toBeGreaterThan(wide.pageHeight);
    const tall = computeImagePlacement(100, 200, {
      pageSize: 'a4',
      orientation: 'auto',
      margin: 'none',
      mode: 'fit',
    });
    expect(tall.pageHeight).toBeGreaterThan(tall.pageWidth);
  });

  it('match uses the captured size verbatim, ignoring orientation', () => {
    const p = computeImagePlacement(200, 100, {
      pageSize: 'match',
      matchSize: { width: 300, height: 500 },
      orientation: 'auto',
      margin: 'none',
      mode: 'fit',
    });
    expect([p.pageWidth, p.pageHeight]).toEqual([300, 500]);
  });
});

describe('extractPageRange (Phase 17 chunked extraction)', () => {
  it('copies exactly [start, end) with sizes as order markers', async () => {
    const src = await buildFixture();
    const out = await extractPageRange(src, 1, 3);
    expect(await sizesOf(out)).toEqual([
      [300, 400],
      [500, 600],
    ]);
  });

  it('clamps out-of-range bounds', async () => {
    const src = await buildFixture();
    expect(await sizesOf(await extractPageRange(src, 2, 99))).toEqual([[500, 600]]);
    expect(await sizesOf(await extractPageRange(src, -5, 1))).toEqual([[100, 200]]);
  });
});

describe('subsetPlan + applyPagePlan (Phase 6 share/print a page range)', () => {
  const subset = async (indices: number[]) => {
    const src = await buildFixture();
    const info = await readPdfPageInfo(src);
    return applyPagePlan(src, subsetPlan(info.pageCount, indices), info.sizes);
  };

  it('extracts a NON-CONTIGUOUS selection — what extractPageRange cannot do', async () => {
    expect(await sizesOf(await subset([0, 2]))).toEqual([
      [100, 200],
      [500, 600],
    ]);
  });

  it('handles a single page and the whole document', async () => {
    expect(await sizesOf(await subset([1]))).toEqual([[300, 400]]);
    expect(await sizesOf(await subset([0, 1, 2]))).toHaveLength(3);
  });

  it("preserves each page's stored /Rotate (rotate: 0 means no setRotation call)", async () => {
    const out = await reload(await subset([2, 1]));
    // Fixture page 1 carries /Rotate 90; page 2 carries none.
    expect(out.getPages().map((p) => p.getRotation().angle)).toEqual([0, 90]);
  });

  it('refuses to build an empty or out-of-bounds document', async () => {
    await expect(subset([])).rejects.toThrow();
    await expect(subset([3])).rejects.toThrow();
  });
});
