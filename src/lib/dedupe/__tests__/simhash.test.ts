// NOTE: ported from fyredocs_app/src/lib/dedupe/__tests__/simhash.test.ts — keep in sync.
import { describe, it, expect } from 'vitest';
/// <reference types="jest" />
import { hamming, isNearDuplicate, simhash, tokenize } from '@/lib/dedupe/simhash';

const lease = `This lease agreement is made between the landlord and the tenant for the property at
14 Park Street Kolkata. The monthly rent is 25000 rupees payable on the first day of each month.
The tenant shall pay a security deposit of 75000 rupees refundable at the end of the term. The lease
begins on 1 April 2026 and ends on 31 March 2027 unless terminated earlier with thirty days notice
in writing by either party. Utilities are the responsibility of the tenant.`;

describe('simhash', () => {
  it('is deterministic and 16 hex chars', () => {
    const h = simhash(lease);
    expect(h).toMatch(/^[0-9a-f]{16}$/);
    expect(simhash(lease)).toBe(h);
  });

  it('keeps an OCR-noisy re-scan within the near-duplicate band', () => {
    const rescan = lease.replace('Kolkata.', 'Kolkata,').replace('rupees payable', 'rupees  payable').replace('Utilities', 'Utilites');
    expect(isNearDuplicate(simhash(lease), simhash(rescan))).toBe(true);
  });

  it('separates a different document', () => {
    const other = `Invoice number 4471 from Acme Supplies to Northwind Traders for office chairs and desks.
      Quantity twelve chairs at 4500 each and four desks at 12000 each, subtotal 102000, GST at eighteen
      percent 18360, total payable 120360 within thirty days of the invoice date. Bank transfer details
      are printed below along with the GSTIN of both parties and the place of supply which is Maharashtra.`;
    expect(hamming(simhash(lease)!, simhash(other)!)).toBeGreaterThan(10);
  });

  it('refuses to fingerprint short text', () => {
    expect(simhash('Scan Nov 4 page one')).toBeNull();
    expect(isNearDuplicate(null, null)).toBe(false);
  });

  it('tokenizes unicode words and digits', () => {
    expect(tokenize('Total: ₹1,250 — नमस्ते!')).toEqual(['total', '1', '250', 'नमस्ते']);
  });
});
