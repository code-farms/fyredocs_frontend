// NOTE: ported from fyredocs_app/src/lib/__tests__/jobErrors.test.ts — keep in sync.
import { describe, it, expect } from 'vitest';
/**
 * Pins the failure → sentence mapping (Phase 19): both generations of
 * backend code literals resolve identically (the pending migration must not
 * break the app), password reasons never leak whether the file was
 * encrypted, the AI trio stays distinct, and raw error dumps never reach
 * the user verbatim.
 */

import { humanizeJobFailure, isConversionFailure } from '@/lib/jobErrors';

describe('code table', () => {
  it('maps old and new literals to the same sentence', () => {
    const canonical = humanizeJobFailure('INVALID_INPUT', undefined);
    expect(humanizeJobFailure('INVALID_BODY', undefined)).toBe(canonical);
    expect(humanizeJobFailure('INVALID_REQUEST', undefined)).toBe(canonical);
    expect(humanizeJobFailure('UNAUTHORIZED', undefined)).toBe(
      humanizeJobFailure('AUTH_UNAUTHORIZED', undefined)
    );
  });

  it('is case-insensitive on codes and beats the reason', () => {
    expect(humanizeJobFailure('file_too_large', 'goroutine panic: xyz')).toBe(
      'That file is too large for this tool.'
    );
  });

  it('maps JOB_TOO_LARGE to a total-per-job sentence', () => {
    expect(humanizeJobFailure('JOB_TOO_LARGE', undefined)).toMatch(/total size limit per job/);
  });

  it('keeps the AI trio distinct — never a generic toast', () => {
    const trio = [
      humanizeJobFailure('AI_UNAVAILABLE', undefined),
      humanizeJobFailure('AI_QUOTA_EXCEEDED', undefined),
      humanizeJobFailure('AI_REQUEST_TOO_LARGE', undefined),
    ];
    expect(new Set(trio).size).toBe(3);
    for (const sentence of trio) {
      expect(sentence).not.toMatch(/failed to complete/);
    }
  });
});

describe('reason patterns', () => {
  it('password-ish reasons all get the SAME non-distinguishing sentence', () => {
    const a = humanizeJobFailure(undefined, 'missing password option for decryption');
    const b = humanizeJobFailure(undefined, 'pdfcpu: this file is not encrypted');
    const c = humanizeJobFailure(undefined, 'invalid password');
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).not.toMatch(/wrong/i);
    expect(a).not.toMatch(/not encrypted/i);
  });

  it('corrupt-ish reasons point at Repair PDF', () => {
    expect(humanizeJobFailure(undefined, 'failed to parse xref table')).toMatch(/Repair PDF/);
    expect(humanizeJobFailure(undefined, 'file is truncated')).toMatch(/Repair PDF/);
  });

  it('unknown codes fall through to the reason patterns', () => {
    expect(humanizeJobFailure('SOME_FUTURE_CODE', 'operation timed out')).toMatch(/took too long/);
  });
});

describe('fallbacks', () => {
  it('passes through reasons that read like sentences', () => {
    const prose = 'This PDF uses a feature the converter does not support yet.';
    expect(humanizeJobFailure(undefined, prose)).toBe(prose);
  });

  it('never shows raw error dumps', () => {
    for (const dump of [
      'goroutine 12 [running]: main.process(0xc0000)',
      'Error: ENOENT {code: -2}',
      'x',
    ]) {
      expect(humanizeJobFailure(undefined, dump)).toBe('The job failed to complete — try again.');
    }
  });

  it('generic when nothing is known', () => {
    expect(humanizeJobFailure(undefined, undefined)).toBe('The job failed to complete — try again.');
  });
});

describe('backend worker sentences', () => {
  const conversion =
    "We couldn't process this file. It may be corrupted, password-protected, or in an unsupported format. Please try a different file.";

  it('pass through verbatim instead of matching the password pattern', () => {
    expect(humanizeJobFailure('FAILED', conversion, 'word-to-pdf')).toBe(conversion);
    expect(humanizeJobFailure(undefined, conversion)).toBe(conversion);
  });

  it('become the password sentence only for unlock-pdf', () => {
    expect(humanizeJobFailure(undefined, conversion, 'unlock-pdf')).toBe(
      humanizeJobFailure(undefined, 'invalid password')
    );
  });

  it('flags conversion failures (not timeouts) for the Repair suggestion', () => {
    expect(isConversionFailure(conversion)).toBe(true);
    expect(isConversionFailure('This file took too long to process. Please try again, or use a smaller file.')).toBe(false);
    expect(isConversionFailure(undefined)).toBe(false);
  });
});
