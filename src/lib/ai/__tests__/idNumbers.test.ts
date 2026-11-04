// NOTE: ported from fyredocs_app/src/lib/ai/__tests__/idNumbers.test.ts — keep in sync.
import { describe, it, expect, vi } from 'vitest';
/// <reference types="jest" />
import { checkIdNumber, verhoeffValid } from './../idNumbers';

describe('verhoeffValid', () => {
  it('accepts the classic test vectors and rejects single-digit errors', () => {
    expect(verhoeffValid('2363')).toBe(true);
    expect(verhoeffValid('2364')).toBe(false);
    expect(verhoeffValid('12a')).toBe(false);
  });
});

describe('checkIdNumber', () => {
  // A structurally valid Aadhaar-format number (passes Verhoeff); not a real person's.
  const aadhaar = '2345 6789 0124';
  it('Aadhaar: 12 digits, valid check digit, no leading 0/1', () => {
    expect(verhoeffValid(aadhaar.replace(/\s/g, ''))).toBe(true);
    expect(checkIdNumber('aadhaar', aadhaar)).toBe('valid');
    expect(checkIdNumber('aadhaar', '2345 6789 0125')).toBe('invalid');
    expect(checkIdNumber('aadhaar', '1345 6789 0124')).toBe('invalid');
    expect(checkIdNumber('aadhaar', '2345 6789')).toBe('invalid');
  });

  it('PAN: AAAPA9999A with a known holder-type letter', () => {
    expect(checkIdNumber('pan', 'abcpe1234f')).toBe('valid');
    expect(checkIdNumber('pan', 'ABCXE1234F')).toBe('invalid');
    expect(checkIdNumber('pan', 'ABCPE12345')).toBe('invalid');
  });

  it('voter ID and Indian passport formats', () => {
    expect(checkIdNumber('voter_id', 'ABC1234567')).toBe('valid');
    expect(checkIdNumber('voter_id', 'AB12345678')).toBe('invalid');
    expect(checkIdNumber('passport', 'K1234567')).toBe('valid');
    expect(checkIdNumber('passport', '123456789')).toBeNull();
  });

  it('makes no claim for formats without a stable public structure', () => {
    expect(checkIdNumber('driver_license', 'MH12 20110012345')).toBeNull();
    expect(checkIdNumber(undefined, 'x')).toBeNull();
  });
});
