import { describe, expect, it } from 'vitest';
import { jobFailureError, mapApiJob, requestFailureMessage } from '@/lib/jobMapper';
import { ApiHttpError } from '@/lib/apiClient';

const completed = { id: 'job-1', status: 'completed', fileName: 'doc.pdf' };

describe('mapApiJob result sizes', () => {
  it('prefers the output size and keeps the input as originalSize', () => {
    const job = mapApiJob({ ...completed, fileSize: 6_920_000, outputFileSize: 3_900_000 }, 'compress', [], {});
    expect(job.result?.fileSize).toBe(3_900_000);
    expect(job.result?.originalSize).toBe(6_920_000);
  });

  it('falls back to the input size when the backend sends no output size', () => {
    const job = mapApiJob({ ...completed, fileSize: 6_920_000 }, 'compress', [], {});
    expect(job.result?.fileSize).toBe(6_920_000);
    expect(job.result?.originalSize).toBeUndefined();
  });
});

describe('mapApiJob warnings', () => {
  it('maps valid metadata.warnings and drops malformed entries', () => {
    const job = mapApiJob(
      {
        ...completed,
        metadata: { warnings: [{ page: 2, code: 'glare' }, { page: 0, code: 'glare' }, { code: 'glare' }, 'x'] },
      },
      'scan-to-pdf',
      [],
      {}
    );
    expect(job.result?.warnings).toEqual([{ page: 2, code: 'glare' }]);
  });

  it('omits warnings when the job has none', () => {
    const job = mapApiJob({ ...completed, metadata: null }, 'scan-to-pdf', [], {});
    expect(job.result).not.toHaveProperty('warnings');
  });
});

describe('job failure messages', () => {
  const conversion =
    "We couldn't process this file. It may be corrupted, password-protected, or in an unsupported format. Please try a different file.";

  it('keeps the worker sentence and flags CONVERSION_FAILED for Repair', () => {
    const job = mapApiJob({ id: 'j', status: 'failed', failureReason: conversion }, 'compress', [], {});
    expect(job.error).toEqual({ code: 'CONVERSION_FAILED', message: conversion, isRetryable: true });
  });

  it('turns unlock-pdf failures into the password sentence', () => {
    expect(jobFailureError('unlock-pdf', conversion).message).toBe(
      "That password didn't unlock it — check it and try again."
    );
  });

  it('maps legacy [CODE] reasons and timeouts without the Repair flag', () => {
    const timeout = jobFailureError('compress', '[TIMEOUT] deadline exceeded');
    expect(timeout.code).toBe('FAILED');
    expect(timeout.message).toMatch(/took too long/);
  });
});

describe('requestFailureMessage', () => {
  it('prefers the backend error code', () => {
    const err = new ApiHttpError('file exceeds 50 MB', 413, 'FILE_TOO_LARGE');
    expect(requestFailureMessage(err, 'Failed to create job.')).toBe('That file is too large for this tool.');
  });

  it('keeps the friendly text when there is no code', () => {
    expect(requestFailureMessage(new Error('Network is down'), 'Failed to create job.')).toBe('Network is down');
    expect(requestFailureMessage(undefined, 'Failed to create job.')).toBe('Failed to create job.');
  });
});
