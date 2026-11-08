import { useState, useCallback, useRef, useEffect } from 'react';
import { FileUpload, UploadState, PartInfo, ToolDefinition, ValidationResult } from '@/types';
import { ApiHttpError } from '@/lib/apiClient';
import {
  initUpload,
  refreshPartUrls,
  completeUpload,
  abortUpload,
  putPart,
  PutPartError,
} from '@/lib/uploadClient';
import { friendlyError } from '@/lib/friendlyError';
import {
  GUEST_FALLBACK_LIMITS,
  checkSelection,
  effectiveLimits,
  type PlanLimits,
  type UploadLimitReason,
} from '@/lib/uploadLimits';

const LIMIT_ERROR_CODES: Record<UploadLimitReason, string> = {
  fileCount: 'MAX_FILES_EXCEEDED',
  fileSize: 'FILE_TOO_LARGE',
  jobTotal: 'JOB_TOO_LARGE',
};

/**
 * File uploads via S3-presigned multipart. Parts are PUT straight to storage in
 * parallel; the backend only ever sees the init, refresh, and complete JSON calls,
 * so file bytes never traverse the API.
 *
 * The constants below are each documented individually. What follows is how they
 * interact, which is the part that is easy to break.
 *
 * TWO INDEPENDENT RETRY BUDGETS. A part has MAX_PART_ATTEMPTS for genuine
 * failures and a SEPARATE MAX_EXPIRED_REFRESHES budget for 403-expired-URL
 * cycles. Keeping them apart is deliberate: a presigned URL expiring is not the
 * part failing, and charging it against the failure budget would abort a slow
 * upload of a large file purely for taking too long. Merging them reintroduces
 * that bug. Both are capped, because an expiry that re-presigns to another
 * immediately-expired URL would otherwise loop forever.
 *
 * TWO LAYERS OF EXPIRY DEFENCE. URL_MAX_AGE_MS (25 min, under the server's ~30
 * min) refreshes proactively before reuse, so a resumed upload does not spend its
 * first request discovering the URLs are dead. The 403 path is the reactive
 * backstop for URLs that expired mid-flight anyway. Neither alone is sufficient.
 *
 * PART SIZE IS DECIDED TWICE. Parts are sliced with PROVISIONAL_PART_SIZE so the
 * UI can show a part count immediately, then RE-SLICED once init returns the
 * server's authoritative partSize. Uploading with the provisional size would
 * produce parts the server refuses to assemble. Any state derived from the part
 * list must therefore tolerate being rebuilt after init.
 *
 * PROGRESS IS THROTTLED AND ESTIMATED. Per-part XHR progress events fire far
 * faster than React should re-render, so flushes are throttled to
 * PROGRESS_FLUSH_MS and in-flight bytes are tracked alongside completed ones —
 * without the in-flight portion, a PART_CONCURRENCY of 4 makes the bar advance in
 * visible jumps as each part lands.
 *
 * PAUSE AND ABORT ARE THE SAME MECHANISM. Both reject with a DOMException named
 * AbortError, distinguished only by intent: pause keeps the collected ETags so
 * resume re-PUTs only the outstanding parts, whereas abort discards the session.
 * Treating an AbortError as a failure would surface a user-initiated pause as an
 * upload error.
 */

/** Provisional client-side part size — re-sliced with the server's partSize after init. */
const PROVISIONAL_PART_SIZE = 8 * 1024 * 1024; // 8 MiB

/** Number of parts uploaded in parallel per file. */
const PART_CONCURRENCY = 4;

/** Max attempts per part (excluding URL-expiry refreshes). */
const MAX_PART_ATTEMPTS = 3;

/** Cap on consecutive 403 → refresh cycles per part (guards against loops). */
const MAX_EXPIRED_REFRESHES = 3;

/** Presigned URLs older than this are refreshed before reuse (server expiry ~30min). */
const URL_MAX_AGE_MS = 25 * 60 * 1000;

/** Progress state flushes are throttled to roughly this interval. */
const PROGRESS_FLUSH_MS = 150;

const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createParts = (fileSize: number, partSize: number): PartInfo[] => {
  const size = partSize > 0 ? partSize : PROVISIONAL_PART_SIZE;
  const totalParts = Math.max(1, Math.ceil(fileSize / size));
  const parts: PartInfo[] = [];

  for (let i = 0; i < totalParts; i++) {
    parts.push({
      partNumber: i + 1,
      start: i * size,
      end: Math.min((i + 1) * size, fileSize),
    });
  }

  return parts;
};

const abortError = () => new DOMException('The upload was aborted.', 'AbortError');

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';

const calculateProgress = (
  file: FileUpload,
  parts: PartInfo[],
  inFlightBytes?: Map<number, number>
) => {
  let loaded = parts.reduce(
    (total, part) => total + (part.etag ? part.end - part.start : 0),
    0
  );
  if (inFlightBytes) {
    inFlightBytes.forEach((bytes) => {
      loaded += bytes;
    });
  }

  const total = file.file.size;
  loaded = Math.min(loaded, total);
  return {
    loaded,
    total,
    percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
  };
};

interface UseFileUploadOptions {
  tool: ToolDefinition;
  onValidationError?: (errors: string[]) => void;
  /**
   * Keep added files in the browser instead of auto-uploading them ("Process
   * in browser"). Turning it off later starts the uploads of any idle files.
   */
  deferUpload?: boolean;
  /**
   * The user's effective plan limits (hooks/useUploadLimits). Defaults to the
   * guest fallback so the hook is never unlimited.
   */
  limits?: PlanLimits;
}

interface UseFileUploadReturn {
  files: FileUpload[];
  addFiles: (newFiles: File[]) => ValidationResult;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  startUpload: (fileId: string) => void;
  pauseUpload: (fileId: string) => void;
  resumeUpload: (fileId: string) => void;
  retryUpload: (fileId: string) => void;
  cancelUpload: (fileId: string) => void;
  updateProgress: (fileId: string, loaded: number, total: number) => void;
  setUploadState: (fileId: string, state: UploadState, error?: string) => void;
  setServerFileId: (fileId: string, serverFileId: string) => void;
  isUploading: boolean;
  uploadedCount: number;
  totalCount: number;
  canProceed: boolean;
}

export const useFileUpload = ({
  tool,
  onValidationError,
  deferUpload = false,
  limits = GUEST_FALLBACK_LIMITS,
}: UseFileUploadOptions): UseFileUploadReturn => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const uploadControllers = useRef<Map<string, AbortController>>(new Map());
  const filesRef = useRef<FileUpload[]>([]);
  /** In-flight (not yet ETag'd) bytes per file → per part. */
  const inFlightBytes = useRef<Map<string, Map<number, number>>>(new Map());
  /** Pending throttled progress flush timers per file. */
  const progressTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const clearProgressTracking = useCallback((fileId: string) => {
    inFlightBytes.current.delete(fileId);
    const timer = progressTimers.current.get(fileId);
    if (timer) {
      clearTimeout(timer);
      progressTimers.current.delete(fileId);
    }
  }, []);

  useEffect(() => {
    const controllers = uploadControllers.current;
    const timers = progressTimers.current;
    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const setUploadState = useCallback((fileId: string, state: UploadState, error?: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              state,
              error,
              uploadedAt: state === 'completed' ? new Date() : f.uploadedAt,
            }
          : f
      )
    );
  }, []);

  const setServerFileId = useCallback((fileId: string, serverFileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, serverFileId } : f
      )
    );
  }, []);

  /** Sync a working parts snapshot (and recomputed progress) into state. */
  const commitParts = useCallback((fileId: string, parts: PartInfo[]) => {
    const snapshot = parts.map((part) => ({ ...part }));
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              parts: snapshot,
              progress: calculateProgress(file, snapshot, inFlightBytes.current.get(fileId)),
            }
          : file
      )
    );
  }, []);

  /** Flush etag'd + in-flight bytes into the file's progress state. */
  const flushProgress = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              progress: calculateProgress(file, file.parts, inFlightBytes.current.get(fileId)),
            }
          : file
      )
    );
  }, []);

  /** Record in-flight bytes for a part; flushes to state throttled (~150ms). */
  const reportPartProgress = useCallback(
    (fileId: string, partNumber: number, loaded: number) => {
      let fileMap = inFlightBytes.current.get(fileId);
      if (!fileMap) {
        fileMap = new Map();
        inFlightBytes.current.set(fileId, fileMap);
      }
      fileMap.set(partNumber, loaded);

      if (!progressTimers.current.has(fileId)) {
        progressTimers.current.set(
          fileId,
          setTimeout(() => {
            progressTimers.current.delete(fileId);
            flushProgress(fileId);
          }, PROGRESS_FLUSH_MS)
        );
      }
    },
    [flushProgress]
  );

  const clearPartProgress = useCallback((fileId: string, partNumber: number) => {
    inFlightBytes.current.get(fileId)?.delete(partNumber);
  }, []);

  const uploadFile = useCallback(
    async (fileId: string, controller: AbortController) => {
      const file = filesRef.current.find((item) => item.id === fileId);
      if (!file) return;

      const fileBlob = file.file;
      // Authoritative working copy — state updates are for UI only.
      let workingParts: PartInfo[] = file.parts.map((part) => ({ ...part }));
      let uploadId = file.serverFileId;

      const commit = () => commitParts(fileId, workingParts);

      const refreshSinglePartUrl = async (part: PartInfo) => {
        const refreshed = await refreshPartUrls(uploadId!, [part.partNumber], controller.signal);
        const fresh = refreshed.parts.find((p) => p.partNumber === part.partNumber);
        if (!fresh) {
          throw new Error(`No refreshed URL returned for part ${part.partNumber}.`);
        }
        part.url = fresh.url;
        part.urlIssuedAt = Date.now();
        commit();
      };

      const uploadPartWithRetry = async (part: PartInfo) => {
        let attempt = 0;
        let expiredRefreshes = 0;

        for (;;) {
          if (controller.signal.aborted) throw abortError();

          try {
            if (!part.url) {
              await refreshSinglePartUrl(part);
            }
            const blob = fileBlob.slice(part.start, part.end);
            const partBytes = part.end - part.start;
            const etag = await putPart(part.url!, blob, {
              signal: controller.signal,
              onProgress: (loaded) =>
                reportPartProgress(fileId, part.partNumber, Math.min(loaded, partBytes)),
            });

            part.etag = etag;
            clearPartProgress(fileId, part.partNumber);
            commit();
            return;
          } catch (error) {
            clearPartProgress(fileId, part.partNumber);
            if (isAbortError(error)) throw error;

            if (error instanceof PutPartError) {
              // Expired presigned URL → refresh without consuming an attempt.
              if (error.kind === 'expired' && expiredRefreshes < MAX_EXPIRED_REFRESHES) {
                expiredRefreshes += 1;
                await refreshSinglePartUrl(part);
                continue;
              }
              // Missing ETag is a configuration problem — retrying won't help.
              if (error.kind === 'no-etag') throw error;
            }

            attempt += 1;
            if (attempt >= MAX_PART_ATTEMPTS) throw error;

            const backoff = 500 * 2 ** (attempt - 1) + Math.random() * 250;
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(() => {
                controller.signal.removeEventListener('abort', onAbort);
                resolve();
              }, backoff);
              const onAbort = () => {
                clearTimeout(timer);
                reject(abortError());
              };
              controller.signal.addEventListener('abort', onAbort);
            });
          }
        }
      };

      try {
        if (!uploadId) {
          const init = await initUpload(fileBlob, controller.signal);
          uploadId = init.uploadId;

          // Re-slice with the server's authoritative part size (no bytes sent yet).
          const issuedAt = Date.now();
          const urlByPart = new Map(
            (init.parts ?? []).map((p) => [p.partNumber, p.url])
          );
          workingParts = createParts(fileBlob.size, init.partSize).map((part) => {
            const url = urlByPart.get(part.partNumber);
            return url ? { ...part, url, urlIssuedAt: issuedAt } : part;
          });

          setServerFileId(fileId, uploadId);
          commit();
        } else {
          // Resume: refresh URLs that are missing or stale before re-PUTting.
          const now = Date.now();
          const staleNumbers = workingParts
            .filter(
              (part) =>
                !part.etag &&
                (!part.url || !part.urlIssuedAt || now - part.urlIssuedAt >= URL_MAX_AGE_MS)
            )
            .map((part) => part.partNumber);

          if (staleNumbers.length > 0) {
            const refreshed = await refreshPartUrls(uploadId, staleNumbers, controller.signal);
            const issuedAt = Date.now();
            const urlByPart = new Map(refreshed.parts.map((p) => [p.partNumber, p.url]));
            workingParts = workingParts.map((part) => {
              const url = urlByPart.get(part.partNumber);
              return url ? { ...part, url, urlIssuedAt: issuedAt } : part;
            });
            commit();
          }
        }

        // Worker pool over pending (un-ETag'd) parts.
        const pendingParts = workingParts.filter((part) => !part.etag);
        let nextIndex = 0;
        const worker = async (): Promise<void> => {
          for (;;) {
            if (controller.signal.aborted) throw abortError();
            const index = nextIndex++;
            if (index >= pendingParts.length) return;
            await uploadPartWithRetry(pendingParts[index]);
          }
        };
        await Promise.all(
          Array.from({ length: Math.min(PART_CONCURRENCY, pendingParts.length) }, () => worker())
        );

        try {
          await completeUpload(
            uploadId,
            workingParts.map((part) => ({ partNumber: part.partNumber, etag: part.etag! })),
            controller.signal
          );
        } catch (error) {
          if (
            error instanceof ApiHttpError &&
            (error.status === 404 || error.status === 409)
          ) {
            // Session expired/conflicted server-side — reset for a clean retry.
            clearProgressTracking(fileId);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      state: 'failed' as UploadState,
                      error: error.message || 'Upload session expired. Retry to upload again.',
                      serverFileId: undefined,
                      parts: createParts(f.file.size, PROVISIONAL_PART_SIZE),
                      progress: { loaded: 0, total: f.file.size, percentage: 0 },
                    }
                  : f
              )
            );
            return;
          }
          throw error;
        }

        setUploadState(fileId, 'completed');
      } catch (error) {
        clearProgressTracking(fileId);
        if (isAbortError(error)) {
          setUploadState(fileId, 'paused');
          return;
        }
        // Stop sibling part uploads still in flight for this file.
        controller.abort();
        const message =
          friendlyError(error instanceof Error ? error.message : undefined) ?? 'Upload failed';
        setUploadState(fileId, 'failed', message);
        // Keep accumulated ETags in state for a resume-style retry.
        commit();
      } finally {
        uploadControllers.current.delete(fileId);
      }
    },
    [
      clearPartProgress,
      clearProgressTracking,
      commitParts,
      reportPartProgress,
      setServerFileId,
      setUploadState,
    ]
  );

  const validateFiles = useCallback(
    (newFiles: File[]): ValidationResult => {
      const errors: { field: string; message: string; code: string }[] = [];

      // Plan + tool limits: file count, per-file size, total per job.
      const limitCheck = checkSelection({
        files: newFiles,
        existingFiles: files.map((f) => f.file),
        limits,
        tool,
      });
      if (limitCheck.ok === false) {
        errors.push({
          field: 'files',
          message: limitCheck.message,
          code: LIMIT_ERROR_CODES[limitCheck.reason],
        });
      }

      // Validate each file
      newFiles.forEach((file, index) => {
        // Check file type
        const isValidType = tool.acceptedFileTypes.some((type) => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type === type;
        });

        if (!isValidType) {
          errors.push({
            field: `file-${index}`,
            message: `"${file.name}" is not a valid file type. Accepted types: ${tool.acceptedFileTypes.join(', ')}`,
            code: 'INVALID_FILE_TYPE',
          });
        }

        // Check for duplicates
        const isDuplicate = files.some(
          (existing) => existing.file.name === file.name && existing.file.size === file.size
        );
        if (isDuplicate) {
          errors.push({
            field: `file-${index}`,
            message: `"${file.name}" has already been added.`,
            code: 'DUPLICATE_FILE',
          });
        }
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
    [files, limits, tool]
  );

  const addFiles = useCallback(
    (newFiles: File[]): ValidationResult => {
      const validation = validateFiles(newFiles);

      if (validation.isValid) {
        const fileUploads: FileUpload[] = newFiles.map((file) => ({
          id: generateId(),
          file,
          state: 'idle' as UploadState,
          progress: { loaded: 0, total: file.size, percentage: 0 },
          parts: createParts(file.size, PROVISIONAL_PART_SIZE),
        }));

        setFiles((prev) => [...prev, ...fileUploads]);
      } else if (onValidationError) {
        onValidationError(validation.errors.map((e) => e.message));
      }

      return validation;
    },
    [validateFiles, onValidationError]
  );

  const removeFile = useCallback((fileId: string) => {
    // Cancel any ongoing upload
    const controller = uploadControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      uploadControllers.current.delete(fileId);
    }
    clearProgressTracking(fileId);

    const file = filesRef.current.find((f) => f.id === fileId);
    if (file?.serverFileId) {
      abortUpload(file.serverFileId);
    }

    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, [clearProgressTracking]);

  const clearFiles = useCallback(() => {
    // Cancel all ongoing uploads
    uploadControllers.current.forEach((controller) => controller.abort());
    uploadControllers.current.clear();

    filesRef.current.forEach((file) => {
      clearProgressTracking(file.id);
      if (file.serverFileId) {
        abortUpload(file.serverFileId);
      }
    });

    setFiles([]);
  }, [clearProgressTracking]);

  const reorderFiles = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const [removed] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, removed);
      return newFiles;
    });
  }, []);

  const startUpload = useCallback((fileId: string) => {
    const file = filesRef.current.find((item) => item.id === fileId);
    if (!file || file.state === 'uploading' || file.state === 'completed') {
      return;
    }
    if (uploadControllers.current.has(fileId)) {
      return;
    }
    const controller = new AbortController();
    uploadControllers.current.set(fileId, controller);

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, state: 'uploading' as UploadState, error: undefined }
          : f
      )
    );
    void uploadFile(fileId, controller);
  }, [uploadFile]);

  const pauseUpload = useCallback((fileId: string) => {
    const controller = uploadControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      uploadControllers.current.delete(fileId);
    }
    clearProgressTracking(fileId);

    // Keep ETag'd parts; recompute progress without in-flight bytes.
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              state: 'paused' as UploadState,
              progress: calculateProgress(f, f.parts),
            }
          : f
      )
    );
  }, [clearProgressTracking]);

  const resumeUpload = useCallback((fileId: string) => {
    startUpload(fileId);
  }, [startUpload]);

  const retryUpload = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;

        // Init succeeded earlier: keep the session + ETag'd parts and resume.
        if (f.serverFileId) {
          return { ...f, state: 'idle' as UploadState, error: undefined };
        }

        // Init-stage failure: full reset.
        return {
          ...f,
          state: 'idle' as UploadState,
          error: undefined,
          progress: { loaded: 0, total: f.file.size, percentage: 0 },
          parts: createParts(f.file.size, PROVISIONAL_PART_SIZE),
          serverFileId: undefined,
        };
      })
    );
  }, []);

  const cancelUpload = useCallback((fileId: string) => {
    removeFile(fileId);
  }, [removeFile]);

  const updateProgress = useCallback((fileId: string, loaded: number, total: number) => {
    const safeTotal = total > 0 ? total : 1;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              progress: {
                loaded,
                total,
                percentage: Math.round((loaded / safeTotal) * 100),
              },
            }
          : f
      )
    );
  }, []);

  const isUploading = files.some((f) => f.state === 'uploading');
  const uploadedCount = files.filter((f) => f.state === 'completed').length;
  const totalCount = files.length;
  const canProceed =
    files.length >= tool.minFiles &&
    files.length <= effectiveLimits(limits, tool).maxFiles &&
    (deferUpload || files.every((f) => f.state === 'completed' && Boolean(f.serverFileId)));

  useEffect(() => {
    if (deferUpload) return;
    files
      .filter((file) => file.state === 'idle')
      .forEach((file) => {
        startUpload(file.id);
      });
  }, [files, startUpload, deferUpload]);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    reorderFiles,
    startUpload,
    pauseUpload,
    resumeUpload,
    retryUpload,
    cancelUpload,
    updateProgress,
    setUploadState,
    setServerFileId,
    isUploading,
    uploadedCount,
    totalCount,
    canProceed,
  };
};
