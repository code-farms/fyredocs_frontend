// NOTE: ported from fyredocs_app/src/lib/export/__tests__/export.test.ts — keep in sync.
import { describe, it, expect, vi } from 'vitest';
/// <reference types="jest" />
import { decodeExtraction } from '@/lib/ai/extraction';
import { expenseRows, expenseTotals } from '@/lib/ai/expenses';

import { csvCell, safeFileStem, toCsv } from './../csv';
import { buildVCard, contactFromFields, escapeVCard, foldLine } from './../vcard';

describe('csv', () => {
  it('quotes per RFC 4180', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(12.5)).toBe('12.5');
  });

  it('neutralises spreadsheet formulas but keeps negative numbers', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(csvCell('+1 555')).toBe("'+1 555");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('-12.50')).toBe('-12.50');
    expect(csvCell('-cmd')).toBe("'-cmd");
  });

  it('builds a BOM-prefixed CRLF document', () => {
    expect(toCsv([['a', 'b'], ['1', '2']])).toBe('\uFEFFa,b\r\n1,2\r\n');
  });

  it('makes filename-safe stems', () => {
    expect(safeFileStem('Big Bazaar / March*2026')).toBe('Big-Bazaar-March-2026');
    expect(safeFileStem('///')).toBe('export');
    // Combining marks are part of the word (Devanagari vowel signs).
    expect(safeFileStem('नमस्ते रसीद')).toBe('नमस्ते-रसीद');
  });
});

describe('vcard', () => {
  it('builds a 3.0 card with escaped, structured fields', () => {
    const v = buildVCard({ name: 'Asha Rao', company: 'Acme; Inc', emails: ['a@acme.io'], phones: ['+919876543210'], website: 'https://acme.io' });
    expect(v).toContain('BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Asha Rao\r\nN:Rao;Asha;;;\r\nORG:Acme\\; Inc');
    expect(v).toContain('EMAIL;TYPE=INTERNET:a@acme.io');
    expect(v).toContain('TEL;TYPE=WORK,VOICE:+919876543210');
    expect(v.endsWith('END:VCARD\r\n')).toBe(true);
  });

  it('falls back to the company, then a placeholder, for FN', () => {
    expect(buildVCard({ company: 'Acme' })).toContain('FN:Acme');
    expect(buildVCard({})).toContain('FN:Contact');
  });

  it('escapes and folds long lines at 75 octets, multi-byte safe', () => {
    expect(escapeVCard('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    const folded = foldLine(`ADR:${'अ'.repeat(40)}`);
    for (const line of folded.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.split('\r\n').slice(1).every((l) => l.startsWith(' '))).toBe(true);
  });

  it('reads business card extraction fields', () => {
    expect(contactFromFields({ name: 'A', emails: ['x@y.io', 3], website: '' })).toEqual({
      name: 'A',
      jobTitle: undefined,
      company: undefined,
      emails: ['x@y.io'],
      phones: [],
      website: undefined,
      address: undefined,
    });
  });
});

describe('expenses', () => {
  const r = (name: string, fields: object) => ({ name, extraction: decodeExtraction({ docType: 'receipt', fields })! });
  const receipts = [
    r('B', { date: '2026-03-12', merchant: 'Cafe', total: 250, tax: 12.5, currency: 'INR', category: 'food' }),
    r('A', { date: '2026-03-01', merchant: 'Fuel', total: 1000, currency: 'INR', category: 'fuel' }),
    r('C', { merchant: 'Hotel', total: 90, currency: 'USD' }),
    r('D', { merchant: 'Unknown' }),
  ];

  it('sorts by date, undated last, and keeps rows without totals', () => {
    const rows = expenseRows(receipts);
    expect(rows[0][0]).toBe('Date');
    expect(rows.slice(1).map((x) => x[6])).toEqual(['A', 'B', 'C', 'D']);
    expect(rows[2]).toEqual(['2026-03-12', 'Cafe', 'food', '250.00', '12.50', 'INR', 'B']);
    expect(rows[4][3]).toBe('');
  });

  it('totals per currency, never across currencies', () => {
    expect(expenseTotals(receipts)).toEqual([
      { currency: 'INR', total: 1250, count: 2 },
      { currency: 'USD', total: 90, count: 1 },
    ]);
  });
});
