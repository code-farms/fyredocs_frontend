// NOTE: ported from fyredocs_app/src/lib/tts/__tests__/sentences.test.ts — keep in sync.
import { describe, it, expect } from 'vitest';
/**
 * Pins the read-aloud segmentation contract: sentence boundaries (these ARE
 * Android's pause/resume granularity), the over-length chunker, page mapping
 * over \f-separated OCR text, and the auto-advance/end-of-document walk.
 */

import {
  chunkForSpeech,
  firstReadablePosition,
  nextPosition,
  pageSentences,
  splitSentences,
} from '@/lib/tts/sentences';

describe('splitSentences', () => {
  it('splits on . ! ? and ellipsis', () => {
    expect(splitSentences('One. Two! Three? Four… Five')).toEqual([
      'One.',
      'Two!',
      'Three?',
      'Four…',
      'Five',
    ]);
  });

  it('keeps a trailing unterminated fragment', () => {
    expect(splitSentences('Done. and then')).toEqual(['Done.', 'and then']);
  });

  it('does not split on title abbreviations', () => {
    expect(splitSentences('Dr. Smith arrived. He sat.')).toEqual(['Dr. Smith arrived.', 'He sat.']);
    expect(splitSentences('See Fig. 3 for details.')).toEqual(['See Fig. 3 for details.']);
  });

  it('does not split on e.g. / i.e. or single-letter initials', () => {
    expect(splitSentences('Fruit, e.g. apples, is good.')).toEqual([
      'Fruit, e.g. apples, is good.',
    ]);
    expect(splitSentences('J. Smith wrote it.')).toEqual(['J. Smith wrote it.']);
  });

  it('treats "No." as an abbreviation only before a number', () => {
    expect(splitSentences('See No. 5 below.')).toEqual(['See No. 5 below.']);
    expect(splitSentences('The answer is no. Next question.')).toEqual([
      'The answer is no.',
      'Next question.',
    ]);
  });

  it('does not split on decimals', () => {
    expect(splitSentences('Pi is 3.14 exactly. Next.')).toEqual(['Pi is 3.14 exactly.', 'Next.']);
  });

  it('treats an ellipsis run as one boundary', () => {
    expect(splitSentences('Wait... okay.')).toEqual(['Wait...', 'okay.']);
  });

  it('collapses OCR hard line-wraps inside a paragraph', () => {
    expect(splitSentences('line one\nline two.')).toEqual(['line one line two.']);
  });

  it('forces a boundary at paragraph breaks even without punctuation', () => {
    expect(splitSentences('Heading\n\nBody text.')).toEqual(['Heading', 'Body text.']);
  });

  it('returns [] for empty or whitespace-only pages', () => {
    expect(splitSentences('')).toEqual([]);
    expect(splitSentences('  \n \n ')).toEqual([]);
  });
});

describe('chunkForSpeech', () => {
  it('passes short sentences through untouched', () => {
    expect(chunkForSpeech('Short one.', 100)).toEqual(['Short one.']);
  });

  it('drops empty input', () => {
    expect(chunkForSpeech('   ', 100)).toEqual([]);
  });

  it('prefers a clause boundary over a word boundary', () => {
    const chunks = chunkForSpeech('aaa bbb ccc, ddd eee fff', 15);
    expect(chunks[0]).toBe('aaa bbb ccc,');
    expect(chunks.every((c) => c.length <= 15)).toBe(true);
  });

  it('falls back to the last space', () => {
    const chunks = chunkForSpeech('alpha beta gamma delta', 12);
    expect(chunks[0]).toBe('alpha beta');
    expect(chunks.every((c) => c.length <= 12)).toBe(true);
  });

  it('hard-cuts a single token longer than the limit', () => {
    const chunks = chunkForSpeech('x'.repeat(25), 10);
    expect(chunks).toEqual(['x'.repeat(10), 'x'.repeat(10), 'x'.repeat(5)]);
  });

  it('never exceeds the limit and never loses words', () => {
    const sentence = Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');
    const chunks = chunkForSpeech(sentence, 80);
    expect(chunks.every((c) => c.length <= 80)).toBe(true);
    expect(chunks.join(' ')).toBe(sentence);
  });
});

describe('pageSentences', () => {
  it('maps \\f-separated pages, preserving empty ones', () => {
    expect(pageSentences('One. Two.\f\fThree.')).toEqual([['One.', 'Two.'], [], ['Three.']]);
  });
});

describe('nextPosition', () => {
  const pages = [['a', 'b'], [], ['c']];

  it('advances within a page', () => {
    expect(nextPosition(pages, { page: 0, sentence: 0 })).toEqual({ page: 0, sentence: 1 });
  });

  it('hops to the next non-empty page at a page end', () => {
    expect(nextPosition(pages, { page: 0, sentence: 1 })).toEqual({ page: 2, sentence: 0 });
  });

  it('returns null at the end of the document', () => {
    expect(nextPosition(pages, { page: 2, sentence: 0 })).toBeNull();
  });
});

describe('firstReadablePosition', () => {
  const pages = [[], ['a'], []];

  it('skips empty pages forward from the tap target', () => {
    expect(firstReadablePosition(pages, 0)).toEqual({ page: 1, sentence: 0 });
    expect(firstReadablePosition(pages, 1)).toEqual({ page: 1, sentence: 0 });
  });

  it('returns null when nothing readable remains', () => {
    expect(firstReadablePosition(pages, 2)).toBeNull();
  });
});
