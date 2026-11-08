/**
 * The single client-side upload limit check. Every path that adds files to a
 * job (dropzone, file picker, page-wide drop, useFileUpload) goes through
 * checkSelection so the client rejects exactly what the backend would:
 *
 * - per file: min(plan maxFileSizeMb, plan maxJobInputMb, tool cap if any)
 *   → backend 413 FILE_TOO_LARGE
 * - files per job: min(plan maxFilesPerJob, tool.maxFiles)
 *   → backend 400 TOO_MANY_FILES
 * - total bytes per job (existing + new): plan maxJobInputMb
 *   → backend 413 JOB_TOO_LARGE
 *
 * Plan limits come from the server (the user's `planLimits`, else the
 * /auth/plans row for their plan). GUEST_FALLBACK_LIMITS exists only so a
 * guest is never "unlimited" before /auth/plans has loaded.
 */
import type { ToolDefinition } from '@/types';

export const MB = 1024 * 1024;

export type PlanLimits = {
  name: string;
  maxFileSizeMb: number;
  maxFilesPerJob: number;
  maxJobInputMb: number;
  retentionDays: number;
};

/** Used only until /auth/plans loads. Mirrors the guest row in the DB. */
export const GUEST_FALLBACK_LIMITS: PlanLimits = {
  name: 'guest',
  maxFileSizeMb: 20,
  maxFilesPerJob: 5,
  maxJobInputMb: 100,
  retentionDays: 0,
};

export type UploadLimitReason = 'fileSize' | 'fileCount' | 'jobTotal';

export type SelectionCheck =
  | { ok: true }
  | { ok: false; reason: UploadLimitReason; message: string };

type SizedFile = { size: number; name?: string };
type LimitTool = Pick<ToolDefinition, 'maxFiles' | 'maxFileSize'>;

export type EffectiveLimits = {
  /** Bytes allowed for a single file. */
  maxFileSize: number;
  /** Files allowed in one job. */
  maxFiles: number;
  /** Bytes allowed across all files of one job. */
  maxJobInput: number;
};

/** Combines plan and tool limits; the tighter one always wins. */
export const effectiveLimits = (limits: PlanLimits, tool: LimitTool): EffectiveLimits => {
  const planJobBytes = limits.maxJobInputMb * MB;
  const perFile = Math.min(limits.maxFileSizeMb * MB, planJobBytes, tool.maxFileSize ?? Infinity);
  return {
    maxFileSize: perFile,
    maxFiles: Math.min(limits.maxFilesPerJob, tool.maxFiles),
    maxJobInput: planJobBytes,
  };
};

/** "20 MB", "1.5 MB" — limits are whole MB in practice. */
export const formatMb = (bytes: number): string => {
  const mb = bytes / MB;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
};

/**
 * Validates adding `files` to a job that already holds `existingFiles`.
 * Checks count, then per-file size, then the job total, and reports the
 * first violation.
 */
export const checkSelection = ({
  files,
  existingFiles = [],
  limits,
  tool,
}: {
  files: SizedFile[];
  existingFiles?: SizedFile[];
  limits: PlanLimits;
  tool: LimitTool;
}): SelectionCheck => {
  const eff = effectiveLimits(limits, tool);

  const totalCount = existingFiles.length + files.length;
  if (totalCount > eff.maxFiles) {
    return {
      ok: false,
      reason: 'fileCount',
      message: `You can add up to ${eff.maxFiles} file${eff.maxFiles === 1 ? '' : 's'} per job. You selected ${totalCount}.`,
    };
  }

  const oversized = files.find((f) => f.size > eff.maxFileSize);
  if (oversized) {
    const label = oversized.name ? `"${oversized.name}" (${formatMb(oversized.size)})` : `A file (${formatMb(oversized.size)})`;
    return {
      ok: false,
      reason: 'fileSize',
      message: `${label} is over the ${formatMb(eff.maxFileSize)} per-file limit.`,
    };
  }

  const totalBytes = [...existingFiles, ...files].reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > eff.maxJobInput) {
    return {
      ok: false,
      reason: 'jobTotal',
      message: `These files add up to ${formatMb(totalBytes)}, over the ${formatMb(eff.maxJobInput)} total per job.`,
    };
  }

  return { ok: true };
};

const isPositiveNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Parses a server `planLimits` object; null unless every size/count field is usable. */
export const parsePlanLimits = (raw: unknown): PlanLimits | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!isPositiveNumber(r.maxFileSizeMb) || !isPositiveNumber(r.maxFilesPerJob) || !isPositiveNumber(r.maxJobInputMb)) {
    return null;
  }
  return {
    name: typeof r.name === 'string' ? r.name : '',
    maxFileSizeMb: r.maxFileSizeMb,
    maxFilesPerJob: r.maxFilesPerJob,
    maxJobInputMb: r.maxJobInputMb,
    retentionDays: typeof r.retentionDays === 'number' ? r.retentionDays : 0,
  };
};

type PlanRow = {
  name: string;
  maxFileSizeMb: number;
  maxFilesPerJob: number;
  maxJobInputMb?: number;
  retentionDays: number;
};

/**
 * Effective plan limits: the user's own `planLimits` → the /auth/plans row for
 * their plan → the static guest fallback. Never "no limit": with no server
 * data at all a signed-in user also gets the guest fallback (the most
 * conservative values) until either source arrives.
 */
export const resolvePlanLimits = ({
  userLimits,
  plans,
  planName,
}: {
  userLimits?: PlanLimits | null;
  plans?: PlanRow[];
  planName: string;
}): PlanLimits => {
  if (userLimits) return userLimits;
  const row = plans?.find((p) => p.name?.toLowerCase() === planName.toLowerCase());
  if (row) {
    const parsed = parsePlanLimits({
      ...row,
      // Older backends omit maxJobInputMb; the per-file × count product is
      // then the loosest total the other two limits already allow.
      maxJobInputMb: row.maxJobInputMb ?? row.maxFileSizeMb * row.maxFilesPerJob,
    });
    if (parsed) return parsed;
  }
  return GUEST_FALLBACK_LIMITS;
};

/** True when no plan above this one exists (pro is the top tier). */
export const isTopPlan = (planName: string): boolean => planName.toLowerCase() === 'pro';
