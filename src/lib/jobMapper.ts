import { Job, JobError, JobState, JobWarning, ToolId, ToolOptions } from '@/types';
import { ApiHttpError, buildApiUrl } from '@/lib/apiClient';
import { humanizeJobFailure, isConversionFailure } from '@/lib/jobErrors';
import { buildDownloadPath } from '@/lib/toolApi';
import { friendlyError } from '@/lib/friendlyError';

/**
 * The backend-to-frontend job boundary. Every job the UI renders passes through
 * here, so this is the one place a backend payload change has to be absorbed.
 *
 * Fields are accepted in two casings (`id` and `ID`, `status` and `Status`, ...)
 * because Go's encoding/json emits the exported field name when a struct has no
 * json tag, and not every payload on this path is fully tagged. Tolerating both is
 * cheaper and safer than depending on which endpoint produced the object.
 *
 * Queued and pending both map to "Processing" on purpose: the queue is a backend
 * implementation detail, and telling a user their job is "queued" invites the
 * question of how long, which the UI cannot answer. Mirrored in
 * fyredocs_app/src/lib/jobMapper.ts.
 *
 * Consumed by useJob and useBatchJob (live) and useJobHistory (My Files).
 */

/** Backend job payload as received. Everything optional — see the dual-casing note above. */
export interface ApiJob {
  id?: string;
  ID?: string;
  status?: string;
  Status?: string;
  progress?: number | string;
  Progress?: number | string;
  fileName?: string;
  FileName?: string;
  outputFileName?: string;
  OutputFileName?: string;
  /** Total INPUT size in bytes. */
  fileSize?: number | string;
  FileSize?: number | string;
  /** Output size in bytes; sent by the single-job endpoint once completed. */
  outputFileSize?: number | string;
  OutputFileSize?: number | string;
  failureReason?: string;
  FailureReason?: string;
  toolType?: string;
  ToolType?: string;
  createdAt?: string;
  CreatedAt?: string;
  updatedAt?: string;
  UpdatedAt?: string;
  completedAt?: string | null;
  CompletedAt?: string | null;
  expiresAt?: string | null;
  ExpiresAt?: string | null;
  /** Worker metadata (job-service models.Job.Metadata); list endpoints may omit it. */
  metadata?: { warnings?: unknown } | null;
}

/** Valid `{page, code}` entries from metadata.warnings; anything malformed is dropped. */
export const parseWarnings = (raw: unknown): JobWarning[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((w) => {
    const page = Number((w as { page?: unknown })?.page);
    const code = (w as { code?: unknown })?.code;
    return Number.isInteger(page) && page > 0 && typeof code === 'string' ? [{ page, code }] : [];
  });
};

/**
 * A worker failure as the UI shows it. friendlyError first (legacy "[CODE] x"
 * rows, technical strings), then jobErrors for the per-tool sentence — e.g.
 * unlock-pdf's generic failure reads as the password sentence. The code is
 * CONVERSION_FAILED when the worker said "may be corrupted…", which is what
 * ResultStage keys its Repair PDF suggestion on.
 */
export const jobFailureError = (toolId: ToolId, reason: string | undefined | null): JobError => {
  const clean = friendlyError(reason);
  return {
    code: isConversionFailure(clean) ? 'CONVERSION_FAILED' : 'FAILED',
    message: humanizeJobFailure(undefined, clean, toolId),
    isRetryable: true,
  };
};

/**
 * Message for a failed API call around a job (create, poll). A backend
 * error.code wins (FILE_TOO_LARGE, RATE_LIMIT_EXCEEDED…); without one the
 * existing friendlyError text stays, so network failures read as before.
 */
export const requestFailureMessage = (error: unknown, fallback: string): string => {
  const raw = error instanceof Error ? error.message : undefined;
  const code = error instanceof ApiHttpError ? error.code : undefined;
  if (code) return humanizeJobFailure(code, friendlyError(raw));
  return friendlyError(raw) ?? fallback;
};

export const parseDate = (value: unknown, fallback: Date) => {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }
  if (value instanceof Date) {
    return value;
  }
  return fallback;
};

export const parseFileSize = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const match = value.trim().toUpperCase().match(/([\d.]+)\s*(B|KB|MB|GB)/);
  if (!match) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  return Math.round(amount * (multipliers[unit] ?? 1));
};

export const mapStatus = (status?: string): JobState => {
  switch (status?.toLowerCase()) {
    case 'queued':
      return 'queued';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
};

/**
 * Maps a job state to its user-facing display status. The backend queue is an
 * implementation detail: pending/queued jobs are presented as "processing".
 */
export const displayJobStatus = (
  state: JobState,
): 'processing' | 'completed' | 'failed' => {
  switch (state) {
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'processing';
  }
};

export const parseProgress = (value: unknown, state: JobState) => {
  if (typeof value === 'number') {
    return Math.min(100, Math.max(0, value));
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace('%', '').trim());
    if (!Number.isNaN(parsed)) {
      return Math.min(100, Math.max(0, parsed));
    }
  }
  return state === 'completed' ? 100 : 0;
};

export const mapApiJob = (
  apiJob: ApiJob,
  toolId: ToolId,
  fileIds: string[],
  options: ToolOptions
): Job => {
  const fallbackTime = new Date();
  const id = apiJob.id ?? apiJob.ID ?? `job-${Date.now()}`;
  const status = apiJob.status ?? apiJob.Status ?? 'queued';
  const state = mapStatus(status);
  const progressValue = parseProgress(apiJob.progress ?? apiJob.Progress, state);
  const totalSteps = 3;
  const completedSteps =
    state === 'completed'
      ? totalSteps
      : progressValue > 0
      ? Math.max(1, Math.floor((progressValue / 100) * totalSteps))
      : 0;
  // User-facing label: queued/pending are backend implementation details —
  // anything in flight reads as "Processing".
  const currentStep =
    state === 'completed' ? 'Completed' : state === 'failed' ? 'Failed' : 'Processing';

  const fileName = apiJob.outputFileName ?? apiJob.OutputFileName ?? apiJob.fileName ?? apiJob.FileName ?? 'output.pdf';
  // fileSize is the INPUT total; prefer the real output size so the result
  // card shows what the download will be. Keep the input as originalSize only
  // when both are known, so the UI can show savings (e.g. after compression).
  const inputSize = parseFileSize(apiJob.fileSize ?? apiJob.FileSize);
  const outputSize = parseFileSize(apiJob.outputFileSize ?? apiJob.OutputFileSize);
  const fileSize = outputSize > 0 ? outputSize : inputSize;
  const originalSize = outputSize > 0 && inputSize > 0 ? inputSize : undefined;
  const downloadUrl = buildApiUrl(buildDownloadPath(toolId, id));

  const createdAt = parseDate(apiJob.createdAt ?? apiJob.CreatedAt, fallbackTime);
  const updatedAt = parseDate(apiJob.updatedAt ?? apiJob.UpdatedAt, fallbackTime);
  const completedAt =
    state === 'completed'
      ? parseDate(apiJob.completedAt ?? apiJob.CompletedAt, updatedAt)
      : undefined;
  const expiresAt = parseDate(apiJob.expiresAt ?? apiJob.ExpiresAt, updatedAt);
  const warnings = parseWarnings(apiJob.metadata?.warnings);

  return {
    id,
    toolId,
    state,
    progress: {
      currentStep,
      totalSteps,
      completedSteps,
      percentage: state === 'completed' ? 100 : progressValue,
    },
    createdAt,
    updatedAt,
    completedAt,
    result:
      state === 'completed'
        ? {
            downloadUrl,
            fileName,
            fileSize,
            originalSize,
            expiresAt,
            ...(warnings.length ? { warnings } : {}),
          }
        : undefined,
    error: state === 'failed' ? jobFailureError(toolId, apiJob.failureReason ?? apiJob.FailureReason) : undefined,
    fileIds,
    options,
  };
};
