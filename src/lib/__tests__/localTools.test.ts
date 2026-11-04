import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { localBlocker, LocalToolError, pageOrderList, runLocalTool, serverPageList } from '@/lib/localTools';

/** A PDF whose page i (1-based) is (100+i) points wide, so order is checkable. */
const pdfFile = async (pages: number, name = 'doc.pdf') => {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pages; i++) doc.addPage([100 + i, 200]);
  return new File([(await doc.save()) as BlobPart], name, { type: 'application/pdf' });
};
const widths = async (bytes: Uint8Array) =>
  (await PDFDocument.load(bytes)).getPages().map((p) => p.getWidth() - 100);
const rotations = async (bytes: Uint8Array) => (await PDFDocument.load(bytes)).getPages().map((p) => p.getRotation().angle);

const PNG_1x1 = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0)
);

describe('page lists', () => {
  it('reads selections like the server: lenient, de-duplicated, sorted', () => {
    expect(serverPageList('5,1-3,3,x,9-2,40', 10)).toEqual([1, 2, 3, 5]);
    expect(serverPageList('all', 3)).toEqual([1, 2, 3]);
    expect(serverPageList('', 2)).toEqual([1, 2]);
  });

  it('keeps the typed order (and repeats) for reorder', () => {
    expect(pageOrderList('3,1,2-1,2, 5', 4)).toEqual([3, 1, 2]);
    expect(pageOrderList('2-3,1,1', 3)).toEqual([2, 3, 1, 1]);
  });
});

describe('runLocalTool', () => {
  it('rotates odd pages only', async () => {
    const out = await runLocalTool('rotate', [await pdfFile(4)], { rotation: 90, applyToPages: 'odd' } as never);
    expect(await rotations(out.bytes)).toEqual([90, 0, 90, 0]);
    expect(out.fileName).toBe('doc-rotated.pdf');
  });

  it('reorders in the typed order', async () => {
    const out = await runLocalTool('reorder', [await pdfFile(4)], { order: '4,1,3,2' } as never);
    expect(await widths(out.bytes)).toEqual([4, 1, 3, 2]);
  });

  it('removes and extracts pages', async () => {
    const removed = await runLocalTool('remove-pages', [await pdfFile(5)], { pages: '2,4-5' } as never);
    expect(await widths(removed.bytes)).toEqual([1, 3]);
    const extracted = await runLocalTool('extract-pages', [await pdfFile(5)], { pages: '5,2' } as never);
    expect(await widths(extracted.bytes)).toEqual([2, 5]);
  });

  it('refuses removing every page or naming none', async () => {
    await expect(runLocalTool('remove-pages', [await pdfFile(2)], { pages: '1-2' } as never)).rejects.toThrow(/every page/);
    await expect(runLocalTool('extract-pages', [await pdfFile(2)], { pages: '9' } as never)).rejects.toThrow(/has 2 pages/);
  });

  it('merges files in list order', async () => {
    const out = await runLocalTool('merge', [await pdfFile(2, 'a.pdf'), await pdfFile(1, 'b.pdf')], {} as never);
    expect(await widths(out.bytes)).toEqual([1, 2, 1]);
    expect(out.fileName).toBe('a-merged.pdf');
  });

  it('builds a PDF from images', async () => {
    const png = new File([PNG_1x1 as BlobPart], 'photo.png', { type: 'image/png' });
    const out = await runLocalTool('image-to-pdf', [png, png], {} as never);
    expect((await PDFDocument.load(out.bytes)).getPageCount()).toBe(2);
    expect(out.fileName).toBe('photo-and-more.pdf');
  });

  it('explains unreadable input', async () => {
    const junk = new File([new Uint8Array([1, 2, 3]) as BlobPart], 'bad.pdf', { type: 'application/pdf' });
    await expect(runLocalTool('rotate', [junk], { rotation: 90 } as never)).rejects.toBeInstanceOf(LocalToolError);
  });
});

describe('localBlocker', () => {
  it('blocks extra files, oversize input and server-only tools', async () => {
    const f = await pdfFile(1);
    expect(localBlocker('rotate', [f, f])).toMatch(/one PDF at a time/);
    expect(localBlocker('merge', [f, f])).toBeNull();
    const big = new File([new Uint8Array(1)], 'big.pdf');
    Object.defineProperty(big, 'size', { value: 26 * 1024 * 1024 });
    expect(localBlocker('extract-pages', [big])).toMatch(/limited to 25 MB/);
    expect(localBlocker('compress', [f])).toMatch(/server only/);
  });
});
