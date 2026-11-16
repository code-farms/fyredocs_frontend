import { describe, expect, it } from 'vitest';
import { warningMessages } from '@/lib/jobWarnings';

describe('warningMessages', () => {
  it('names a single glare page', () => {
    expect(warningMessages([{ page: 3, code: 'glare' }])).toEqual([
      'Glare covered text on page 3 — reshoot at a slight angle to avoid the reflection.',
    ]);
  });

  it('lists several pages once each, in order', () => {
    expect(
      warningMessages([
        { page: 6, code: 'glare' },
        { page: 1, code: 'glare' },
        { page: 4, code: 'glare' },
        { page: 1, code: 'glare' },
      ])
    ).toEqual(['Glare covered text on pages 1, 4 and 6 — reshoot at a slight angle to avoid the reflection.']);
  });

  it('shows document-wide text warnings once each', () => {
    expect(
      warningMessages([
        { code: 'text-not-searchable' },
        { code: 'text-not-searchable' },
        { code: 'text-kept-light-compression' },
      ])
    ).toEqual([
      "This file looks right, but its text may not be searchable or copyable (this happens with some Hindi and other non-Latin fonts).",
      'We used lighter compression to keep this document’s text searchable, so the file is less compressed than usual.',
    ]);
  });

  it('ignores unknown codes and empty input', () => {
    expect(warningMessages([{ page: 1, code: 'mystery' }])).toEqual([]);
    expect(warningMessages()).toEqual([]);
  });
});
