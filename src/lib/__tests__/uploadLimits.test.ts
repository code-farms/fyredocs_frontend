import { describe, it, expect } from 'vitest';
import {
  GUEST_FALLBACK_LIMITS,
  MB,
  checkSelection,
  effectiveLimits,
  parsePlanLimits,
  resolvePlanLimits,
  type PlanLimits,
} from '@/lib/uploadLimits';

const GUEST: PlanLimits = { name: 'guest', maxFileSizeMb: 20, maxFilesPerJob: 5, maxJobInputMb: 100, retentionDays: 0 };
const FREE: PlanLimits = { name: 'free', maxFileSizeMb: 50, maxFilesPerJob: 10, maxJobInputMb: 300, retentionDays: 7 };
const PRO: PlanLimits = { name: 'pro', maxFileSizeMb: 300, maxFilesPerJob: 50, maxJobInputMb: 300, retentionDays: 30 };

const PDF_TOOL = { maxFiles: 20 }; // no tool size cap
const IMAGE_TOOL = { maxFiles: 20, maxFileSize: 20 * MB };
const SINGLE_TOOL = { maxFiles: 1 };

const f = (mb: number, name = 'a.pdf') => ({ size: Math.round(mb * MB), name });
const many = (n: number, mb: number) => Array.from({ length: n }, (_, i) => f(mb, `f${i}.pdf`));

describe('checkSelection', () => {
  it.each([
    // [label, limits, tool, files, existing, expected reason or ok]
    ['guest: 20 MB exactly is allowed', GUEST, PDF_TOOL, [f(20)], [], 'ok'],
    ['guest: just over 20 MB is rejected', GUEST, PDF_TOOL, [{ size: 20 * MB + 1 }], [], 'fileSize'],
    ['free: 50 MB exactly is allowed', FREE, PDF_TOOL, [f(50)], [], 'ok'],
    ['free: 51 MB is rejected', FREE, PDF_TOOL, [f(51)], [], 'fileSize'],
    ['pro: 300 MB exactly is allowed', PRO, PDF_TOOL, [f(300)], [], 'ok'],
    ['pro: 301 MB is rejected', PRO, PDF_TOOL, [f(301)], [], 'fileSize'],
    ['image tool caps pro at 20 MB', PRO, IMAGE_TOOL, [f(21)], [], 'fileSize'],
    ['image tool allows exactly 20 MB', PRO, IMAGE_TOOL, [f(20)], [], 'ok'],
    ['guest: 5 files allowed', GUEST, PDF_TOOL, many(5, 1), [], 'ok'],
    ['guest: 6th file rejected (count includes existing)', GUEST, PDF_TOOL, many(1, 1), many(5, 1), 'fileCount'],
    ['tool maxFiles beats a bigger plan count', PRO, SINGLE_TOOL, many(2, 1), [], 'fileCount'],
    ['guest: total exactly 100 MB allowed', GUEST, PDF_TOOL, many(5, 20), [], 'ok'],
    ['free: total exactly 300 MB allowed', FREE, PDF_TOOL, many(6, 50), [], 'ok'],
    ['free: total over 300 MB rejected', FREE, PDF_TOOL, [f(10)], many(6, 50), 'jobTotal'],
    ['pro: two 200 MB files exceed 300 MB total', PRO, PDF_TOOL, many(2, 200), [], 'jobTotal'],
  ])('%s', (_label, limits, tool, files, existing, expected) => {
    const result = checkSelection({ files, existingFiles: existing, limits, tool });
    if (expected === 'ok') {
      expect(result).toEqual({ ok: true });
    } else {
      expect(result).toMatchObject({ ok: false, reason: expected });
    }
  });

  it('names the exact per-file limit in MB', () => {
    const result = checkSelection({ files: [f(60, 'big.pdf')], limits: FREE, tool: PDF_TOOL });
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining('50 MB per-file limit') });
    expect(result).toMatchObject({ message: expect.stringContaining('"big.pdf"') });
  });

  it('names the exact total limit in MB', () => {
    const result = checkSelection({ files: many(2, 200), limits: PRO, tool: PDF_TOOL });
    expect(result).toMatchObject({ message: expect.stringContaining('300 MB total per job') });
  });

  it('names the exact file count', () => {
    const result = checkSelection({ files: many(6, 1), limits: GUEST, tool: PDF_TOOL });
    expect(result).toMatchObject({ message: expect.stringContaining('up to 5 files per job') });
  });

  it('caps the per-file limit at the job total', () => {
    const odd: PlanLimits = { ...PRO, maxFileSizeMb: 500, maxJobInputMb: 300 };
    expect(effectiveLimits(odd, PDF_TOOL).maxFileSize).toBe(300 * MB);
  });
});

describe('resolvePlanLimits', () => {
  const plans = [
    { name: 'guest', maxFileSizeMb: 20, maxFilesPerJob: 5, maxJobInputMb: 100, retentionDays: 0 },
    { name: 'free', maxFileSizeMb: 50, maxFilesPerJob: 10, maxJobInputMb: 300, retentionDays: 7 },
  ];

  it("prefers the user's own planLimits", () => {
    expect(resolvePlanLimits({ userLimits: PRO, plans, planName: 'free' })).toBe(PRO);
  });

  it('falls back to the /auth/plans row for the plan name', () => {
    expect(resolvePlanLimits({ plans, planName: 'Free' })).toMatchObject({ maxFileSizeMb: 50, maxJobInputMb: 300 });
  });

  it('uses the static guest fallback before plans load', () => {
    expect(resolvePlanLimits({ planName: 'guest' })).toEqual(GUEST_FALLBACK_LIMITS);
    expect(GUEST_FALLBACK_LIMITS).toMatchObject({ maxFileSizeMb: 20, maxFilesPerJob: 5, maxJobInputMb: 100 });
  });

  it('is never unlimited, even for a signed-in user with no data', () => {
    expect(resolvePlanLimits({ planName: 'pro', plans: [] })).toEqual(GUEST_FALLBACK_LIMITS);
  });
});

describe('parsePlanLimits', () => {
  it('accepts the server shape', () => {
    expect(parsePlanLimits({ ...FREE })).toEqual(FREE);
  });

  it.each([null, 'x', {}, { ...FREE, maxJobInputMb: undefined }, { ...FREE, maxFileSizeMb: 0 }])(
    'rejects %j',
    (raw) => {
      expect(parsePlanLimits(raw)).toBeNull();
    }
  );
});
