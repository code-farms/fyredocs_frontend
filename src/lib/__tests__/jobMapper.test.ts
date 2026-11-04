import { describe, expect, it } from 'vitest';
import { mapApiJob } from '@/lib/jobMapper';

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
