import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { firstPagesForOcr, mergeOcrParts, planOcrParts, splitBlocker, splitForOcr } from '@/lib/ocrSplit';
import { GUEST_FALLBACK_LIMITS, MB, type PlanLimits } from '@/lib/uploadLimits';
import { PLAN_LIMIT_FALLBACKS } from '@/config/planLimits';

/** A PDF whose page i (1-based) is (100+i) points wide, so order is checkable. */
const pdfFile = async (pages: number, name = 'scan.pdf') => {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pages; i++) doc.addPage([100 + i, 200]);
  return new File([(await doc.save()) as BlobPart], name, { type: 'application/pdf' });
};
const widths = async (file: File) =>
  (await PDFDocument.load(new Uint8Array(await file.arrayBuffer()))).getPages().map((p) => p.getWidth() - 100);

const guest: PlanLimits = GUEST_FALLBACK_LIMITS;
const free: PlanLimits = { name: 'free', ...PLAN_LIMIT_FALLBACKS.free };
const ocrTool = { maxFiles: 5 };

describe('planOcrParts', () => {
  it('splits into the fewest, most even parts that fit', () => {
    expect(planOcrParts(12, 10)).toEqual([
      { from: 1, to: 6 },
      { from: 7, to: 12 },
    ]);
    expect(planOcrParts(25, 10)).toEqual([
      { from: 1, to: 9 },
      { from: 10, to: 18 },
      { from: 19, to: 25 },
    ]);
    expect(planOcrParts(31, 30)).toEqual([
      { from: 1, to: 16 },
      { from: 17, to: 31 },
    ]);
  });

  it('keeps a scan within the limit whole, and ignores bad input', () => {
    expect(planOcrParts(10, 10)).toEqual([{ from: 1, to: 10 }]);
    expect(planOcrParts(0, 10)).toEqual([]);
    expect(planOcrParts(5, 0)).toEqual([]);
  });

  it('never makes a part over the limit', () => {
    for (let pages = 1; pages <= 120; pages++) {
      const parts = planOcrParts(pages, 10);
      expect(parts.every((p) => p.to - p.from + 1 <= 10)).toBe(true);
      expect(parts[parts.length - 1].to).toBe(pages);
    }
  });
});

describe('splitBlocker', () => {
  const small = new File([new Uint8Array(10)], 'scan.pdf');

  it('allows a split that fits the plan', () => {
    expect(splitBlocker(small, planOcrParts(12, guest.maxOcrPages), guest, ocrTool)).toBeNull();
  });

  it('blocks more parts than files per job, counting files already added', () => {
    expect(splitBlocker(small, planOcrParts(60, 10), guest, ocrTool)).toMatch(/6 parts/);
    expect(splitBlocker(small, planOcrParts(12, 10), guest, ocrTool, 4)).toMatch(/up to 5 files/);
  });

  it('blocks files the browser writer cannot handle', () => {
    const big = new File([new Uint8Array(26 * MB)], 'big.pdf');
    expect(splitBlocker(big, planOcrParts(40, 30), free, ocrTool)).toMatch(/25 MB/);
  });
});

describe('split, first pages and merge', () => {
  it('splits in order with numbered names, and merges back to the original', async () => {
    const scan = await pdfFile(12);
    const parts = await splitForOcr(scan, planOcrParts(12, 10));
    expect(parts.map((p) => p.name)).toEqual(['scan (part 1 of 2).pdf', 'scan (part 2 of 2).pdf']);
    expect(await widths(parts[0])).toEqual([1, 2, 3, 4, 5, 6]);
    expect(await widths(parts[1])).toEqual([7, 8, 9, 10, 11, 12]);

    const merged = await mergeOcrParts(parts, 'scan');
    expect(merged.name).toBe('scan (OCR).pdf');
    expect(await widths(merged)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('keeps only the first n pages', async () => {
    const first = await firstPagesForOcr(await pdfFile(12), 10);
    expect(first.name).toBe('scan (pages 1-10).pdf');
    expect(await widths(first)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
