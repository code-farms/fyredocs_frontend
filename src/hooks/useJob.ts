/**
 * Single-file job lifecycle: submit, track to completion, expose download.
 *
 * This file is the authoritative description of the SSE + polling contract, which
 * three hooks in this app implement independently (this one, useBatchJob, and
 * useNotifications). Read this before touching either of the others.
 *
 * TRANSPORT. Progress arrives over an EventSource stream, with timer polling as
 * the fallback. Two transports exist because SSE is blocked by some corporate
 * proxies and dropped by others mid-stream, and a job that silently stops
 * reporting looks identical to a hung backend. Polling is not a redundant
 * belt — it is the only thing that makes progress reliable off the happy path.
 *
 * `sseRef.current === null` IS THE INTENTIONAL-CLOSE SENTINEL. The `done`
 * handler and stopPolling both null the ref before closing, and onerror returns
 * early when it is already null. Without that, every normal completion would fire
 * onerror as the connection tears down and start a polling loop for a job that
 * has already finished. Any new close path must null the ref first.
 *
 * MONOTONIC PROGRESS. Progress is clamped to never decrease, in both the polling
 * and the SSE handler. The two transports interleave: a poll issued before an SSE
 * event can land after it, carrying a stale lower percentage, and a progress bar
 * that jumps backwards reads as a bug. `maxProgressRef` is reset to 0 on failure
 * so a retry starts clean. The clamp is duplicated rather than extracted because
 * the two sites operate on different shapes — a whole mapped job versus a raw
 * event — and unifying them would need a shared intermediate for no real gain.
 *
 * RELATIONSHIP TO useBatchJob. useBatchJob is a near-duplicate of this machinery
 * fanned across N files, and the two have diverged: this hook refetches the full
 * job after SSE completion to pick up output file metadata, and files results
 * into an org workspace. A fix applied here very likely needs applying there too;
 * nothing enforces that. Extracting a shared hook is tracked as follow-up work,
 * not attempted here.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Job, JobState, PasswordProtectOptions, ScanToPdfOptions, SplitOptions, WatermarkOptions, ToolId, ToolOptions } from '@/types';
import { apiJson, apiRequest, buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath, buildJobPath } from '@/lib/toolApi';
import { setGuestToken } from '@/lib/guestToken';
import { ApiJob, jobFailureError, mapApiJob, mapStatus, requestFailureMessage } from '@/lib/jobMapper';
import { setJobWorkspaceHint } from '@/lib/documentsApi';
import { getActiveOrgId } from '@/components/app/ActiveOrgContext';
import { track } from '@/lib/activity';
import { ACTIVITY_EVENTS, ActivityStatus } from '@/lib/activityEvents';

interface UseJobOptions {
  pollingInterval?: number;
  maxPollingAttempts?: number;
  onComplete?: (job: Job) => void;
  onError?: (error: string) => void;
}

interface UseJobReturn {
  job: Job | null;
  createJob: (toolId: ToolId, fileIds: string[], options: ToolOptions) => void;
  cancelJob: () => void;
  retryJob: () => void;
  resetJob: () => void;
  isPolling: boolean;
}

/**
 * Translate UI option objects into the exact payload each backend tool expects.
 *
 * This is the client half of an untyped cross-repo contract. The backend accepts
 * free-form JSON per tool (see job-service/handlers/tool_options.go), so nothing
 * checks that what this produces matches what the worker reads — a renamed field
 * fails at processing time, not at compile time.
 *
 * Two consumers depend on this beyond the callers here:
 *   - src/components/tools/options/schemas.ts validates the UI shape BEFORE this
 *     runs, and its header names this function explicitly. Adding a field means
 *     touching both.
 *   - fyredocs_app has its own divergent copy of this switch.
 *
 * Returns undefined for absent options so the request omits the key entirely
 * rather than sending null, which some tools would reject.
 */
export const normalizeOptions = (toolId: ToolId, options: ToolOptions) => {
  if (!options) return undefined;

  switch (toolId) {
    case 'split': {
      const opts = options as SplitOptions;
      if (opts.mode === 'range') {
        const range = opts.range?.trim();
        if (!range) {
          throw new Error('Page range is required for split.');
        }
        return { mode: 'range', range };
      }
      if (opts.mode === 'extract') {
        const span = opts.span;
        if (!span || span < 1) {
          throw new Error('Page count per chunk is required for extract.');
        }
        return { mode: 'extract', range: String(span) };
      }
      if (opts.mode === 'equal') {
        const span = opts.span;
        if (!span || span < 2) {
          throw new Error('Number of parts is required for equal split.');
        }
        return { mode: 'equal', range: String(span) };
      }
      return { mode: 'all', range: 'all' };
    }
    case 'reorder': {
      const order = (options as { order?: string }).order?.trim();
      if (!order) {
        throw new Error('Page order is required for reorder.');
      }
      return { order };
    }
    case 'remove-pages':
    case 'extract-pages': {
      const pages = (options as { pages?: string }).pages?.trim();
      if (!pages) {
        throw new Error('Page selection is required.');
      }
      return { pages };
    }
    case 'compress': {
      const quality = (options as { quality?: string }).quality || 'ebook';
      return { quality };
    }
    case 'ocr': {
      const opts = options as { language?: string; dpi?: string };
      return {
        language: opts.language || 'eng',
        ...(opts.dpi ? { dpi: opts.dpi } : {}),
      };
    }
    case 'scan-to-pdf': {
      const opts = options as ScanToPdfOptions;
      const out = {
        ...(opts.ocr ? { ocr: true, ...(opts.language ? { language: opts.language } : {}) } : {}),
        ...(opts.pageSize && opts.pageSize !== 'auto' ? { pageSize: opts.pageSize } : {}),
        ...(opts.pages?.length ? { pages: opts.pages } : {}),
      };
      // Nothing chosen → no options key at all, as before.
      return Object.keys(out).length ? out : undefined;
    }
    case 'password-protect': {
      // The backend rejects mixing the legacy `password` with userPassword/
      // ownerPassword, so exactly one shape is sent: legacy (open = owner) unless
      // a distinct permissions password was given.
      const opts = options as Partial<PasswordProtectOptions>;
      const open = opts.password ?? '';
      const owner = opts.ownerPassword ?? '';
      if (!open && !owner) {
        throw new Error('Password is required.');
      }
      const extras = {
        ...(opts.permissions ? { permissions: opts.permissions } : {}),
        ...(opts.encryption ? { encryption: opts.encryption } : {}),
      };
      if (!owner || owner === open) {
        return { password: open, ...extras };
      }
      return { ...(open ? { userPassword: open } : {}), ownerPassword: owner, ...extras };
    }
    case 'rotate': {
      const opts = options as { rotation?: number; applyToPages?: string };
      if (!opts.rotation) {
        throw new Error('Rotation angle is required.');
      }
      return { rotation: opts.rotation, applyToPages: opts.applyToPages || 'all' };
    }
    case 'watermark': {
      const opts = options as WatermarkOptions;
      if (opts.type === 'text' && !opts.text?.trim()) {
        throw new Error('Watermark text is required.');
      }
      if (opts.type === 'image' && !opts.imageData) {
        throw new Error('Watermark image is required.');
      }
      return {
        type: opts.type,
        ...(opts.type === 'text' ? { text: opts.text, fontSize: opts.fontSize, color: opts.color } : {}),
        ...(opts.type === 'image' ? { imageData: opts.imageData, scale: opts.scale } : {}),
        position: opts.position,
        opacity: opts.opacity,
      };
    }
    // Tools with no options
    case 'merge':
    case 'repair-pdf':
    case 'pdf-to-word':
    case 'pdf-to-excel':
    case 'pdf-to-image':
    case 'pdf-to-ppt':
    case 'pdf-to-html':
    case 'pdf-to-text':
    case 'pdf-to-pdfa':
    case 'word-to-pdf':
    case 'excel-to-pdf':
    case 'image-to-pdf':
    case 'powerpoint-to-pdf':
    case 'html-to-pdf':
      return undefined;
    default:
      return options as Record<string, unknown>;
  }
};

export const useJob = ({
  pollingInterval = 2000,
  maxPollingAttempts = 300,
  onComplete,
  onError,
}: UseJobOptions = {}): UseJobReturn => {
  const [job, setJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const attemptsRef = useRef(0);
  const lastJobRef = useRef<{
    toolId: ToolId;
    fileIds: string[];
    options: ToolOptions;
  } | null>(null);
  const maxProgressRef = useRef(0);
  const sseTerminalRef = useRef(false);
  // A job's terminal activity event must fire exactly once, but terminal
  // state can be observed twice (SSE delivers it, then the polling fallback
  // re-fetches it). This ref remembers which job already got its event.
  const trackedTerminalRef = useRef<string | null>(null);

  const trackTerminal = useCallback(
    (
      jobId: string,
      toolId: ToolId,
      status: Extract<ActivityStatus, 'success' | 'failed' | 'cancelled'>,
      extra?: { failureReason?: string; errorCode?: string }
    ) => {
      if (trackedTerminalRef.current === jobId) return;
      trackedTerminalRef.current = jobId;
      const eventType =
        status === 'success'
          ? ACTIVITY_EVENTS.jobCompleted
          : status === 'cancelled'
          ? ACTIVITY_EVENTS.jobCancelled
          : ACTIVITY_EVENTS.jobFailed;
      track({ eventType, status, toolId, correlationId: jobId, ...extra });
    },
    []
  );

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setIsPolling(false);
    attemptsRef.current = 0;
  }, []);

  const startPolling = useCallback(
    (toolId: ToolId, jobId: string, fileIds: string[], options: ToolOptions) => {
      stopPolling();
      setIsPolling(true);

      const poll = async () => {
        try {
          const apiResponse = await apiRequest<{ data: ApiJob }>(buildJobPath(toolId, jobId));
          const mappedJob = mapApiJob(apiResponse.data, toolId, fileIds, options);

          // Clamp progress upward — see the file header. A poll can carry a
          // value older than an SSE event that already landed.
          if (mappedJob.state === 'failed') {
            maxProgressRef.current = 0;
          } else if (mappedJob.progress.percentage < maxProgressRef.current) {
            mappedJob.progress.percentage = maxProgressRef.current;
          } else {
            maxProgressRef.current = mappedJob.progress.percentage;
          }

          setJob(mappedJob);

          if (mappedJob.state === 'completed') {
            stopPolling();
            trackTerminal(jobId, toolId, 'success');
            onComplete?.(mappedJob);
            return;
          }

          if (mappedJob.state === 'failed') {
            stopPolling();
            trackTerminal(jobId, toolId, 'failed', {
              failureReason: mappedJob.error?.message,
            });
            onError?.(mappedJob.error?.message ?? 'The job failed to complete.');
            return;
          }

          attemptsRef.current = 0;
        } catch (error) {
          attemptsRef.current += 1;
          if (attemptsRef.current >= maxPollingAttempts) {
            const message = requestFailureMessage(error, 'Failed to poll job status.');
            setJob((prev) =>
              prev
                ? {
                    ...prev,
                    state: 'failed',
                    error: {
                      code: 'POLLING_FAILED',
                      message,
                      isRetryable: true,
                    },
                  }
                : prev
            );
            stopPolling();
            trackTerminal(jobId, toolId, 'failed', {
              failureReason: message,
              errorCode: 'POLLING_FAILED',
            });
            onError?.(message);
            return;
          }
        }

        pollingTimerRef.current = setTimeout(poll, pollingInterval);
      };

      void poll();
    },
    [maxPollingAttempts, onComplete, onError, pollingInterval, stopPolling, trackTerminal]
  );

  const startSSE = useCallback(
    (toolId: ToolId, jobId: string, fileIds: string[], options: ToolOptions) => {
      stopPolling();
      sseTerminalRef.current = false;
      setIsPolling(true);

      const url = buildApiUrl(`/api/jobs/${jobId}/events`);
      const es = new EventSource(url, { withCredentials: true });
      sseRef.current = es;

      es.addEventListener('job-update', async (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as {
            jobId: string;
            status: string;
            progress: number;
            toolType: string;
            fileSize?: number;
            failureReason?: string;
          };

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

          const status = eventToStatus(data.status);
          const state = mapStatus(status);
          const progress = data.progress ?? 0;

          setJob((prev) => {
            if (!prev) return prev;

            // Same upward clamp as the polling path, on the raw event shape.
            let pct = progress;
            if (state === 'failed') {
              maxProgressRef.current = 0;
            } else if (pct < maxProgressRef.current) {
              pct = maxProgressRef.current;
            } else {
              maxProgressRef.current = pct;
            }

            const totalSteps = 3;
            const completedSteps =
              state === 'completed'
                ? totalSteps
                : pct > 0
                ? Math.max(1, Math.floor((pct / 100) * totalSteps))
                : prev.progress.completedSteps;
            // Queued/pending read as "Processing" — the queue is a backend detail.
            const currentStep =
              state === 'completed' ? 'Completed' : state === 'failed' ? 'Failed' : 'Processing';

            const downloadUrl = buildApiUrl(buildDownloadPath(toolId, prev.id));

            return {
              ...prev,
              state,
              progress: {
                currentStep,
                totalSteps,
                completedSteps,
                percentage: state === 'completed' ? 100 : pct,
              },
              updatedAt: new Date(),
              completedAt: state === 'completed' ? new Date() : prev.completedAt,
              result:
                state === 'completed'
                  ? {
                      downloadUrl,
                      fileName: prev.result?.fileName ?? 'output.pdf',
                      fileSize: data.fileSize || prev.result?.fileSize || 0,
                      expiresAt: prev.result?.expiresAt ?? new Date(),
                    }
                  : prev.result,
              error: state === 'failed' ? jobFailureError(toolId, data.failureReason) : prev.error,
            };
          });

          if (status === 'completed') {
            sseTerminalRef.current = true;
            maxProgressRef.current = 0;
            stopPolling();
            trackTerminal(jobId, toolId, 'success');
            // Fetch full job data to get file metadata (size, name)
            try {
              const apiResponse = await apiRequest<{ data: ApiJob }>(buildJobPath(toolId, jobId));
              const finalJob = mapApiJob(apiResponse.data, toolId, fileIds, options);
              setJob(finalJob);
              onComplete?.(finalJob);
            } catch {
              // Fallback: use the SSE-derived state
              setJob((prev) => {
                if (prev) onComplete?.(prev);
                return prev;
              });
            }
            return;
          }

          if (status === 'failed') {
            sseTerminalRef.current = true;
            stopPolling();
            const message = jobFailureError(toolId, data.failureReason).message;
            trackTerminal(jobId, toolId, 'failed', { failureReason: message });
            onError?.(message);
            return;
          }
        } catch {
          // Ignore malformed SSE data
        }
      });

      es.addEventListener('done', () => {
        // Stream closed by server — job is in a terminal state.
        // Final state was already handled by the job-update listener above.
        if (sseRef.current) {
          sseRef.current.close();
          sseRef.current = null;
        }
      });

      es.onerror = () => {
        // If sseRef is already null, the connection was intentionally closed
        // by the `done` handler or `stopPolling()` — don't fall back to polling.
        if (!sseRef.current) return;
        sseRef.current.close();
        sseRef.current = null;
        if (!sseTerminalRef.current) {
          startPolling(toolId, jobId, fileIds, options);
        }
      };
    },
    [onComplete, onError, startPolling, stopPolling, trackTerminal]
  );

  const createJob = useCallback(
    (toolId: ToolId, fileIds: string[], options: ToolOptions) => {
      stopPolling();
      maxProgressRef.current = 0;
      const normalizedIds = fileIds.filter(Boolean);

      if (normalizedIds.length === 0) {
        onError?.('No uploaded files available.');
        return;
      }

      lastJobRef.current = { toolId, fileIds: normalizedIds, options };

      const pendingJob: Job = {
        id: `job-${Date.now()}`,
        toolId,
        state: 'pending',
        progress: {
          currentStep: 'Submitting job',
          totalSteps: 3,
          completedSteps: 0,
          percentage: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        fileIds: normalizedIds,
        options,
      };

      setJob(pendingJob);
      setIsPolling(true);

      void (async () => {
        try {
          const payload: {
            uploadId?: string;
            uploadIds?: string[];
            options?: Record<string, unknown>;
          } = normalizedIds.length > 1 ? { uploadIds: normalizedIds } : { uploadId: normalizedIds[0] };

          const normalizedOptions = normalizeOptions(toolId, options);
          if (normalizedOptions && Object.keys(normalizedOptions).length > 0) {
            payload.options = normalizedOptions;
          }

          const apiResponse = await apiJson<{ data: ApiJob & { guestToken?: string } }>(buildJobPath(toolId), {
            method: 'POST',
            body: JSON.stringify(payload),
          });

          if (apiResponse.data.guestToken) {
            setGuestToken(apiResponse.data.guestToken);
          }

          const mappedJob = mapApiJob(apiResponse.data, toolId, normalizedIds, options);
          trackedTerminalRef.current = null;
          track({
            eventType: ACTIVITY_EVENTS.jobStarted,
            status: 'started',
            toolId,
            correlationId: mappedJob.id,
            metadata: { fileCount: normalizedIds.length },
          });
          setJob(mappedJob);
          // If a workspace is active, file the finalized document into that org.
          const activeOrg = getActiveOrgId();
          if (activeOrg) void setJobWorkspaceHint(mappedJob.id, activeOrg);
          startSSE(toolId, mappedJob.id, normalizedIds, options);
        } catch (error) {
          const message = requestFailureMessage(error, 'Failed to create job.');
          // No server job id exists on a create failure, so no correlationId.
          track({
            eventType: ACTIVITY_EVENTS.jobFailed,
            status: 'failed',
            toolId,
            failureReason: message,
            errorCode: 'CREATE_FAILED',
          });
          setJob({
            ...pendingJob,
            state: 'failed',
            error: {
              code: 'CREATE_FAILED',
              message,
              isRetryable: true,
            },
          });
          setIsPolling(false);
          onError?.(message);
        }
      })();
    },
    [onError, startSSE, stopPolling]
  );

  const cancelJob = useCallback(() => {
    if (!job) return;
    stopPolling();
    trackTerminal(job.id, job.toolId, 'cancelled');
    void apiRequest(buildJobPath(job.toolId, job.id), { method: 'DELETE' }).catch(() => undefined);
    setJob({
      ...job,
      state: 'failed',
      error: {
        code: 'CANCELLED',
        message: 'Job was cancelled by user',
        isRetryable: true,
      },
    });
  }, [job, stopPolling, trackTerminal]);

  const retryJob = useCallback(() => {
    if (lastJobRef.current) {
      createJob(
        lastJobRef.current.toolId,
        lastJobRef.current.fileIds,
        lastJobRef.current.options
      );
    }
  }, [createJob]);

  const resetJob = useCallback(() => {
    stopPolling();
    maxProgressRef.current = 0;
    setJob(null);
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    job,
    createJob,
    cancelJob,
    retryJob,
    resetJob,
    isPolling,
  };
};
