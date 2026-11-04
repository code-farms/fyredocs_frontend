import { describe, expect, it, vi } from 'vitest';
import { estimateTranscribe, TranscribeCancelled, transcribePages } from '@/lib/ai/transcribe';
import { requestExtraction, ExtractionError } from '@/lib/ai/extractRun';

vi.mock('@/lib/aiApi', () => ({
  postExtract: vi.fn(async () => ({ docType: 'receipt', confidence: 0.9, title: 'Cafe', fields: { merchant: 'Cafe', total: 120 }, tables: [] })),
  postTranscribe: vi.fn(),
}));

describe('transcribePages', () => {
  it('sends two pages per request and keeps unrenderable pages empty', async () => {
    const send = vi.fn(async ({ images }: { images: string[] }) => images.map((i) => `text of ${i}`));
    const progress = vi.fn();
    const out = await transcribePages([1, 2, 3], {
      render: async (p) => (p === 2 ? null : `img${p}`),
      send,
      language: 'hin',
      onProgress: progress,
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(1, { images: ['img1'], language: 'hin' });
    expect(out).toEqual([
      { page: 1, text: 'text of img1' },
      { page: 2, text: '' },
      { page: 3, text: 'text of img3' },
    ]);
    expect(progress).toHaveBeenLastCalledWith(3, 3);
  });

  it('stops between requests when cancelled', async () => {
    let n = 0;
    await expect(
      transcribePages([1, 2, 3], { render: async () => 'x', send: async () => ['t'], isCancelled: () => n++ > 0 })
    ).rejects.toBeInstanceOf(TranscribeCancelled);
  });

  it('estimates like the server reserves', () => {
    expect(estimateTranscribe(3)).toBe(3 * 1500 + 2 * 4096);
  });
});

describe('requestExtraction', () => {
  it('validates the reply', async () => {
    await expect(requestExtraction([{ index: 0, text: 'Cafe 120' }], [])).resolves.toMatchObject({ docType: 'receipt' });
  });

  it('refuses a document with neither text nor images', async () => {
    await expect(requestExtraction([], [])).rejects.toBeInstanceOf(ExtractionError);
  });
});
