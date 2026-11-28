/**
 * Multi-file job tracking: one job per file, aggregated into a single progress
 * view.
 *
 * A NEAR-DUPLICATE OF useJob, AND DIVERGED FROM IT. The SSE + polling contract,
 * the `sseRef === null` intentional-close sentinel, and the monotonic-progress
 * clamp are all documented in src/hooks/useJob.ts — read that file first; this one
 * deliberately does not restate them.
 *
 * Where it differs, and why the divergence matters:
 *   - Per-file state. Each file gets its own job, its own stream, and its own
 *     clamp, so one failure must not stall or reset the others. Aggregate progress
 *     is derived from the set rather than tracked directly.
 *   - No post-completion refetch. useJob re-fetches the full job after SSE
 *     completion to pick up output file metadata; this hook does not, so batch
 *     results carry less metadata.
 *   - No org workspace filing. useJob files results into the active org
 *     workspace; batch results are not filed.
 *
 * Those gaps are divergence, not design. A fix to the job lifecycle almost always
 * needs applying in both files, and nothing enforces that — extracting a shared
 * hook is tracked follow-up work.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Job, ToolId, ToolOptions } from '@/types';
import { ApiHttpError, apiJson, apiRequest, buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath, buildJobPath } from '@/lib/toolApi';
import { setGuestToken } from '@/lib/guestToken';
import { ApiJob, mapApiJob, mapStatus } from '@/lib/jobMapper';
import { track } from '@/lib/activity';
import { ACTIVITY_EVENTS, ActivityStatus } from '@/lib/activityEvents';

/** One file's slot in a batch: its identity plus the job tracking it. */
export interface BatchJob {
  id: string;
  fileName: string;
  fileId: string;
  job: Job | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  /** True while the server reports another job of this user still running (JOB_IN_PROGRESS retry). */
  waitingOnServer?: boolean;
  /** The workbench file (useFileUpload id) this row was made from; used to upload it again on retry. */
  localFileId?: string;
  /** Short status shown under the name, e.g. "Uploading again…" during a retry. */
  note?: string;
}

interface UseBatchJobOptions {
  pollingInterval?: number;
  maxPollingAttempts?: number;
  onAllComplete?: (jobs: BatchJob[]) => void;
  onJobComplete?: (job: BatchJob) => void;
  onJobError?: (job: BatchJob, error: string) => void;
}

interface UseBatchJobReturn {
  batchJobs: BatchJob[];
  startBatch: (
    toolId: ToolId,
    files: Array<{ id: string; name: string; serverFileId: string }>,
    options: ToolOptions
  ) => void;
  cancelBatch: () => void;
  /** Runs a row again with a freshly uploaded file; resolves when the row finishes. */
  rerunJob: (batchId: string, serverFileId: string) => Promise<void>;
  /** Patches one row (status / note / error), e.g. while its file uploads again. */
  markRow: (batchId: string, patch: Partial<Pick<BatchJob, 'status' | 'note' | 'error'>>) => void;
  resetBatch: () => void;
  isProcessing: boolean;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  overallProgress: number;
}

/**
 * The server runs one job per user at a time (job-service answers a second
 * create with 429 JOB_IN_PROGRESS), so a batch submits its files one after
 * another. A JOB_IN_PROGRESS (say, a job from another tab) is retried after a
 * short wait instead of failing the file.
 */
const JOB_IN_PROGRESS = 'JOB_IN_PROGRESS';
const BUSY_RETRY_MS = 3000;
const BUSY_MAX_RETRIES = 100; // ~5 minutes of waiting for the other job

const isTerminal = (status: BatchJob['status']) => status === 'completed' || status === 'failed';

export const useBatchJob = ({
  pollingInterval = 2000,
  maxPollingAttempts = 300,
  onAllComplete,
  onJobComplete,
  onJobError,
}: UseBatchJobOptions = {}): UseBatchJobReturn => {
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const batchJobsRef = useRef<BatchJob[]>([]);
  useEffect(() => {
    batchJobsRef.current = batchJobs;
  }, [batchJobs]);
  const pollingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const sseConnectionsRef = useRef<Map<string, EventSource>>(new Map());
  const sseTerminalJobsRef = useRef<Set<string>>(new Set());
  // NOTE: mirrors trackedTerminalRef in useJob.ts — SSE and the polling
  // fallback can both observe the same terminal state, but each server job
  // must emit exactly one terminal activity event. Keyed by server jobId.
  const trackedTerminalJobsRef = useRef<Set<string>>(new Set());

  const trackBatchTerminal = useCallback(
    (
      jobId: string,
      toolId: ToolId,
      status: Extract<ActivityStatus, 'success' | 'failed' | 'cancelled'>,
      extra?: { failureReason?: string; errorCode?: string }
    ) => {
      if (trackedTerminalJobsRef.current.has(jobId)) return;
      trackedTerminalJobsRef.current.add(jobId);
      const eventType =
        status === 'success'
          ? ACTIVITY_EVENTS.jobCompleted
          : status === 'cancelled'
          ? ACTIVITY_EVENTS.jobCancelled
          : ACTIVITY_EVENTS.jobFailed;
      track({
        eventType,
        status,
        toolId,
        correlationId: jobId,
        metadata: { batch: true },
        ...extra,
      });
    },
    []
  );
  const attemptsRef = useRef<Map<string, number>>(new Map());
  const lastBatchRef = useRef<{
    toolId: ToolId;
    files: Array<{ id: string; name: string; serverFileId: string }>;
    options: ToolOptions;
  } | null>(null);
  // Sequential runs: each file's slot resolves its waiter when it turns
  // completed/failed; bumping runIdRef stops a running loop (cancel/reset/new run).
  const terminalWaitersRef = useRef<Map<string, () => void>>(new Map());
  // Rows cancelled while their create request was in flight: when it returns,
  // the job is not tracked, so the row stays cancelled (retry can run it again).
  const cancelledRowsRef = useRef<Set<string>>(new Set());
  const runIdRef = useRef(0);

  useEffect(() => {
    batchJobs.forEach((bj) => {
      const resolve = terminalWaitersRef.current.get(bj.id);
      if (resolve && isTerminal(bj.status)) {
        terminalWaitersRef.current.delete(bj.id);
        resolve();
      }
    });
  }, [batchJobs]);

  const stopPolling = useCallback((batchId?: string) => {
    if (batchId) {
      const timer = pollingTimersRef.current.get(batchId);
      if (timer) {
        clearTimeout(timer);
        pollingTimersRef.current.delete(batchId);
      }
      const es = sseConnectionsRef.current.get(batchId);
      if (es) {
        es.close();
        sseConnectionsRef.current.delete(batchId);
      }
      attemptsRef.current.delete(batchId);
    } else {
      pollingTimersRef.current.forEach((timer) => clearTimeout(timer));
      pollingTimersRef.current.clear();
      sseConnectionsRef.current.forEach((es) => es.close());
      sseConnectionsRef.current.clear();
      attemptsRef.current.clear();
    }
  }, []);

  const checkAllComplete = useCallback(() => {
    setBatchJobs((current) => {
      const allDone = current.every(
        (bj) => bj.status === 'completed' || bj.status === 'failed'
      );
      if (allDone && current.length > 0) {
        setIsProcessing(false);
        onAllComplete?.(current);
      }
      return current;
    });
  }, [onAllComplete]);

  const startPolling = useCallback(
    (batchId: string, toolId: ToolId, jobId: string, fileId: string, options: ToolOptions) => {
      const poll = async () => {
        try {
          const apiResponse = await apiRequest<{ data: ApiJob }>(buildJobPath(toolId, jobId));
          const mappedJob = mapApiJob(apiResponse.data, toolId, [fileId], options);

          setBatchJobs((prev) =>
            prev.map((bj) =>
              bj.id === batchId
                ? {
                    ...bj,
                    job: mappedJob,
                    status:
                      mappedJob.state === 'completed'
                        ? 'completed'
                        : mappedJob.state === 'failed'
                        ? 'failed'
                        : 'processing',
                    error: mappedJob.error?.message,
                  }
                : bj
            )
          );

          if (mappedJob.state === 'completed') {
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'success');
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobComplete?.({ ...updated, job: mappedJob, status: 'completed' });
              return prev;
            });
            checkAllComplete();
            return;
          }

          if (mappedJob.state === 'failed') {
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'failed', {
              failureReason: mappedJob.error?.message,
            });
            const errorMsg = mappedJob.error?.message ?? 'Job failed';
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobError?.({ ...updated, job: mappedJob, status: 'failed' }, errorMsg);
              return prev;
            });
            checkAllComplete();
            return;
          }

          attemptsRef.current.set(batchId, 0);
        } catch (error) {
          const currentAttempts = (attemptsRef.current.get(batchId) ?? 0) + 1;
          attemptsRef.current.set(batchId, currentAttempts);

          if (currentAttempts >= maxPollingAttempts) {
            const message = error instanceof Error ? error.message : 'Polling failed';
            trackBatchTerminal(jobId, toolId, 'failed', {
              failureReason: message,
              errorCode: 'POLLING_FAILED',
            });
            setBatchJobs((prev) =>
              prev.map((bj) =>
                bj.id === batchId
                  ? { ...bj, status: 'failed', error: message }
                  : bj
              )
            );
            stopPolling(batchId);
            checkAllComplete();
            return;
          }
        }

        pollingTimersRef.current.set(batchId, setTimeout(poll, pollingInterval));
      };

      void poll();
    },
    [checkAllComplete, maxPollingAttempts, onJobComplete, onJobError, pollingInterval, stopPolling, trackBatchTerminal]
  );

  const startSSEForJob = useCallback(
    (batchId: string, toolId: ToolId, jobId: string, fileId: string, options: ToolOptions) => {
      const url = buildApiUrl(`/api/jobs/${jobId}/events`);
      const es = new EventSource(url, { withCredentials: true });
      sseConnectionsRef.current.set(batchId, es);

      const eventToStatus = (eventType: string): string => {
        switch (eventType) {
          case 'JobCompleted':
            return 'completed';
          case 'JobFailed':
            return 'failed';
          case 'JobQueued':
            return 'queued';
          default:
            return 'processing';
        }
      };

      es.addEventListener('job-update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as {
            jobId: string;
            status: string;
            progress: number;
            toolType: string;
            fileSize?: number;
          };

          const status = eventToStatus(data.status);
          const state = mapStatus(status);
          const progress = data.progress ?? 0;

          setBatchJobs((prev) =>
            prev.map((bj) => {
              if (bj.id !== batchId) return bj;
              const prevJob = bj.job;
              if (!prevJob) return bj;

              const pct = state === 'completed' ? 100 : progress;
              const totalSteps = 3;
              const completedSteps =
                state === 'completed'
                  ? totalSteps
                  : pct > 0
                  ? Math.max(1, Math.floor((pct / 100) * totalSteps))
                  : prevJob.progress.completedSteps;

              return {
                ...bj,
                job: {
                  ...prevJob,
                  state,
                  progress: {
                    ...prevJob.progress,
                    completedSteps,
                    percentage: pct,
                    currentStep: state === 'completed' ? 'Completed' : state === 'failed' ? 'Failed' : 'Processing',
                  },
                  updatedAt: new Date(),
                  // SSE carries no result; without a download URL the row's
                  // download button, "Download All" and merge had nothing to use.
                  result:
                    state === 'completed'
                      ? {
                          downloadUrl: buildApiUrl(buildDownloadPath(toolId, prevJob.id)),
                          fileName: prevJob.result?.fileName ?? 'output.pdf',
                          fileSize: data.fileSize || prevJob.result?.fileSize || 0,
                          expiresAt: prevJob.result?.expiresAt ?? new Date(),
                        }
                      : prevJob.result,
                },
                status: state === 'completed' ? 'completed' : state === 'failed' ? 'failed' : 'processing',
                error: state === 'failed' ? 'The job failed to complete.' : bj.error,
              };
            })
          );

          if (status === 'completed') {
            sseTerminalJobsRef.current.add(batchId);
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'success');
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobComplete?.({ ...updated, status: 'completed' });
              return prev;
            });
            checkAllComplete();
            return;
          }

          if (status === 'failed') {
            sseTerminalJobsRef.current.add(batchId);
            stopPolling(batchId);
            trackBatchTerminal(jobId, toolId, 'failed', {
              failureReason: 'The job failed to complete.',
            });
            const errorMsg = 'The job failed to complete.';
            setBatchJobs((prev) => {
              const updated = prev.find((bj) => bj.id === batchId);
              if (updated) onJobError?.({ ...updated, status: 'failed' }, errorMsg);
              return prev;
            });
            checkAllComplete();
            return;
          }
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('done', () => {
        const conn = sseConnectionsRef.current.get(batchId);
        if (conn) {
          conn.close();
          sseConnectionsRef.current.delete(batchId);
        }
      });

      es.onerror = () => {
        // If connection was already cleaned up by `done` handler or `stopPolling`, don't poll.
        if (!sseConnectionsRef.current.has(batchId)) return;
        const conn = sseConnectionsRef.current.get(batchId);
        if (conn) {
          conn.close();
          sseConnectionsRef.current.delete(batchId);
        }
        if (!sseTerminalJobsRef.current.has(batchId)) {
          startPolling(batchId, toolId, jobId, fileId, options);
        }
      };
    },
    [checkAllComplete, onJobComplete, onJobError, startPolling, stopPolling, trackBatchTerminal]
  );

  const processFile = useCallback(
    async (
      batchId: string,
      toolId: ToolId,
      fileId: string,
      serverFileId: string,
      options: ToolOptions
    ) => {
      try {
        const payload: { uploadId: string; options?: Record<string, unknown> } = {
          uploadId: serverFileId,
        };

        if (options && Object.keys(options).length > 0) {
          payload.options = options as Record<string, unknown>;
        }

        const create = () =>
          apiJson<{ data: ApiJob & { guestToken?: string } }>(buildJobPath(toolId), {
            method: 'POST',
            body: JSON.stringify(payload),
          });
        let apiResponse: Awaited<ReturnType<typeof create>> | undefined;
        for (let attempt = 0; !apiResponse; attempt++) {
          try {
            apiResponse = await create();
          } catch (err) {
            const busy = err instanceof ApiHttpError && err.code === JOB_IN_PROGRESS;
            if (!busy || attempt >= BUSY_MAX_RETRIES) throw err;
            setBatchJobs((prev) => prev.map((bj) => (bj.id === batchId ? { ...bj, waitingOnServer: true } : bj)));
            await new Promise((resolve) => setTimeout(resolve, BUSY_RETRY_MS));
            if (cancelledRowsRef.current.has(batchId)) return;
          }
        }

        if (apiResponse.data.guestToken) {
          setGuestToken(apiResponse.data.guestToken);
        }

        const mappedJob = mapApiJob(apiResponse.data, toolId, [serverFileId], options);
        if (cancelledRowsRef.current.has(batchId)) return;
        track({
          eventType: ACTIVITY_EVENTS.jobStarted,
          status: 'started',
          toolId,
          correlationId: mappedJob.id,
          metadata: { batch: true },
        });

        setBatchJobs((prev) =>
          prev.map((bj) =>
            bj.id === batchId
              ? { ...bj, job: mappedJob, status: 'processing', waitingOnServer: false }
              : bj
          )
        );

        startSSEForJob(batchId, toolId, mappedJob.id, serverFileId, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create job';
        // No server job id exists on a create failure, so no correlationId.
        track({
          eventType: ACTIVITY_EVENTS.jobFailed,
          status: 'failed',
          toolId,
          failureReason: message,
          errorCode: 'CREATE_FAILED',
          metadata: { batch: true },
        });
        setBatchJobs((prev) =>
          prev.map((bj) =>
            bj.id === batchId
              ? { ...bj, status: 'failed', error: message }
              : bj
          )
        );
        checkAllComplete();
      }
    },
    [checkAllComplete, startSSEForJob]
  );

  /** Submits the files one at a time: the next job is created only after the previous one finished. */
  const runSequentially = useCallback(
    async (
      items: Array<{ batchId: string; file: { id: string; serverFileId: string } }>,
      toolId: ToolId,
      options: ToolOptions
    ) => {
      const runId = ++runIdRef.current;
      for (const { batchId, file } of items) {
        if (runIdRef.current !== runId) return;
        const done = new Promise<void>((resolve) => terminalWaitersRef.current.set(batchId, resolve));
        await processFile(batchId, toolId, file.id, file.serverFileId, options);
        await done;
      }
    },
    [processFile]
  );

  const startBatch = useCallback(
    (
      toolId: ToolId,
      files: Array<{ id: string; name: string; serverFileId: string }>,
      options: ToolOptions
    ) => {
      stopPolling();
      lastBatchRef.current = { toolId, files, options };

      const initialBatchJobs: BatchJob[] = files.map((file) => ({
        id: `batch-${file.id}-${Date.now()}`,
        fileName: file.name,
        fileId: file.serverFileId,
        localFileId: file.id,
        job: null,
        status: 'pending',
      }));

      setBatchJobs(initialBatchJobs);
      setIsProcessing(true);

      void runSequentially(
        initialBatchJobs.map((batchJob, index) => ({ batchId: batchJob.id, file: files[index] })),
        toolId,
        options
      );
    },
    [runSequentially, stopPolling]
  );

  const cancelBatch = useCallback(() => {
    runIdRef.current++;
    batchJobsRef.current
      .filter((bj) => bj.status === 'processing' || bj.status === 'pending')
      .forEach((bj) => cancelledRowsRef.current.add(bj.id));
    stopPolling();
    setBatchJobs((prev) =>
      prev.map((bj) =>
        bj.status === 'processing' || bj.status === 'pending'
          ? { ...bj, status: 'failed', error: 'Cancelled by user' }
          : bj
      )
    );
    setIsProcessing(false);
  }, [stopPolling]);

  const markRow = useCallback((batchId: string, patch: Partial<Pick<BatchJob, 'status' | 'note' | 'error'>>) => {
    setBatchJobs((prev) => prev.map((bj) => (bj.id === batchId ? { ...bj, ...patch } : bj)));
    if (patch.status === 'pending') {
      cancelledRowsRef.current.delete(batchId);
      setIsProcessing(true);
    }
  }, []);

  const rerunJob = useCallback(
    async (batchId: string, serverFileId: string) => {
      const last = lastBatchRef.current;
      if (!last) return;
      const row = batchJobsRef.current.find((bj) => bj.id === batchId);
      if (!row) return;
      const file = { id: row.localFileId ?? batchId, serverFileId };
      cancelledRowsRef.current.delete(batchId);
      lastBatchRef.current = {
        ...last,
        files: last.files.map((f) => (f.id === row.localFileId ? { ...f, serverFileId } : f)),
      };
      setBatchJobs((prev) =>
        prev.map((bj) =>
          bj.id === batchId
            ? { ...bj, fileId: serverFileId, status: 'pending', job: null, error: undefined, note: undefined }
            : bj
        )
      );
      setIsProcessing(true);
      await runSequentially([{ batchId, file }], last.toolId, last.options);
    },
    [runSequentially]
  );

  const resetBatch = useCallback(() => {
    runIdRef.current++;
    terminalWaitersRef.current.clear();
    cancelledRowsRef.current.clear();
    stopPolling();
    setBatchJobs([]);
    setIsProcessing(false);
    lastBatchRef.current = null;
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const completedCount = batchJobs.filter((bj) => bj.status === 'completed').length;
  const failedCount = batchJobs.filter((bj) => bj.status === 'failed').length;
  const totalCount = batchJobs.length;

  const overallProgress =
    totalCount > 0
      ? Math.round(
          batchJobs.reduce((sum, bj) => {
            if (bj.status === 'completed') return sum + 100;
            if (bj.status === 'failed') return sum + 100;
            return sum + (bj.job?.progress.percentage ?? 0);
          }, 0) / totalCount
        )
      : 0;

  return {
    batchJobs,
    startBatch,
    cancelBatch,
    rerunJob,
    markRow,
    resetBatch,
    isProcessing,
    completedCount,
    failedCount,
    totalCount,
    overallProgress,
  };
};
