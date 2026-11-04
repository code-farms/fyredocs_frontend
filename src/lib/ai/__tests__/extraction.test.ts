// NOTE: ported from fyredocs_app/src/lib/ai/__tests__/extraction.test.ts — keep in sync.
import { describe, it, expect, vi } from 'vitest';
/// <reference types="jest" />
import {
  decodeExtraction,
  decodeExtractionBlob,
  docTypeLabel,
  encodeExtractionBlob,
  expiryWarning,
  fieldRows,
  formatAmount,
  formatIsoDate,
  formPairs,
  maskId,
} from './../extraction';

const receipt = {
  docType: 'receipt',
  confidence: 0.9,
  title: 'Big Bazaar groceries',
  fields: { merchant: 'Big Bazaar', date: '2026-03-12', total: 1250, tax: 60, currency: 'INR', category: 'groceries' },
  tables: [],
};

describe('decodeExtraction', () => {
  it('accepts a server result', () => {
    expect(decodeExtraction(receipt)).toMatchObject({ docType: 'receipt', title: 'Big Bazaar groceries' });
  });

  it('repairs bad parts instead of rejecting the whole result', () => {
    const e = decodeExtraction({ docType: 'spaceship', confidence: 7, fields: 'x', tables: 'y' });
    expect(e).toMatchObject({ docType: 'other', confidence: 0, fields: {}, tables: [] });
  });

  it('rejects non-objects', () => {
    expect(decodeExtraction(null)).toBeNull();
    expect(decodeExtraction('receipt')).toBeNull();
  });
});

describe('blob codec', () => {
  it('round-trips and refuses corrupt or future blobs', () => {
    const e = decodeExtraction(receipt)!;
    expect(decodeExtractionBlob(encodeExtractionBlob(e))).toEqual(e);
    expect(decodeExtractionBlob('{oops')).toBeNull();
    expect(decodeExtractionBlob(JSON.stringify({ v: 99, ...receipt }))).toBeNull();
  });
});

describe('display', () => {
  it('formats receipt rows in schema order with currency and dates', () => {
    const rows = fieldRows(decodeExtraction(receipt)!);
    expect(rows.map((r) => [r.label, r.value])).toEqual([
      ['Merchant', 'Big Bazaar'],
      ['Date', '12 Mar 2026'],
      ['Total', 'INR 1,250.00'],
      ['Tax', 'INR 60.00'],
      ['Category', 'Groceries'],
    ]);
  });

  it('flags ID numbers as sensitive and labels the subtype', () => {
    const id = decodeExtraction({ docType: 'id_document', subtype: 'pan', fields: { fullName: 'A', documentNumber: 'ABCDE1234F' } })!;
    expect(docTypeLabel(id)).toBe('PAN card');
    expect(fieldRows(id).find((r) => r.key === 'documentNumber')).toMatchObject({ sensitive: true });
    expect(docTypeLabel(decodeExtraction(receipt)!)).toBe('Receipt');
  });

  it('masks all but the last four, keeping separators', () => {
    expect(maskId('1234 5678 9012')).toBe('•••• •••• 9012');
    expect(maskId('ABCDE1234F')).toBe('••••••234F');
    expect(maskId('12')).toBe('12');
  });

  it('formats amounts and dates defensively', () => {
    expect(formatAmount(1234567.5, 'INR')).toBe('INR 1,234,567.50');
    expect(formatAmount(-3)).toBe('-3.00');
    expect(formatIsoDate('2026-12-01')).toBe('1 Dec 2026');
    expect(formatIsoDate('soon')).toBe('soon');
  });

  it('reads form pairs and joins list fields', () => {
    const form = decodeExtraction({ docType: 'form', fields: { fields: [{ key: 'Name', value: 'A' }, { value: 'x' }] } })!;
    expect(formPairs(form)).toEqual([{ key: 'Name', value: 'A' }]);
    const card = decodeExtraction({ docType: 'business_card', fields: { emails: ['a@x.io', 'b@x.io'] } })!;
    expect(fieldRows(card)[0]).toMatchObject({ label: 'Email', value: 'a@x.io, b@x.io' });
  });

  it('warns about IDs expiring within 60 days or already expired', () => {
    const now = new Date('2026-11-04T00:00:00Z');
    const id = (expiryDate: string) => decodeExtraction({ docType: 'id_document', fields: { expiryDate } })!;
    expect(expiryWarning(id('2026-11-20'), now)).toBe('soon');
    expect(expiryWarning(id('2026-01-01'), now)).toBe('expired');
    expect(expiryWarning(id('2028-01-01'), now)).toBeNull();
    expect(expiryWarning(decodeExtraction(receipt)!, now)).toBeNull();
  });
});
