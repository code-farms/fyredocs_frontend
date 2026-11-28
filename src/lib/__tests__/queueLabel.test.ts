import { describe, expect, it } from 'vitest';
import { aheadInQueue, waitingLabel } from '@/lib/queueLabel';

describe('waitingLabel', () => {
  it('names the part for split OCR parts', () => {
    expect(waitingLabel('scan (part 1 of 2).pdf')).toBe('Waiting — starts after part 1');
  });
  it('names the previous file otherwise', () => {
    expect(waitingLabel('invoice.pdf')).toBe('Waiting — starts after invoice.pdf');
  });
  it('has a fallback without a previous file', () => {
    expect(waitingLabel()).toBe('Starting…');
  });
});

describe('aheadInQueue', () => {
  const parts = (states: string[]) => states.map((state, i) => ({ name: `scan (part ${i + 1} of 6).pdf`, state }));

  it('names the row just ahead while the queue runs in order', () => {
    const rows = parts(['completed', 'processing', 'pending', 'pending', 'pending', 'pending']);
    expect(waitingLabel(aheadInQueue(rows, 5))).toBe('Waiting — starts after part 5');
    expect(waitingLabel(aheadInQueue(rows, 2))).toBe('Waiting — starts after part 2');
  });

  it('skips failed and finished rows', () => {
    const rows = parts(['completed', 'completed', 'completed', 'processing', 'failed', 'pending']);
    expect(waitingLabel(aheadInQueue(rows, 5))).toBe('Waiting — starts after part 4');
    const uploads = [
      { name: 'a.pdf', state: 'uploading' },
      { name: 'b.pdf', state: 'failed' },
      { name: 'c.pdf', state: 'idle' },
    ];
    expect(aheadInQueue(uploads, 2)).toBe('a.pdf');
  });
});
