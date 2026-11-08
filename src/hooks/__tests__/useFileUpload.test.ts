import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileUpload } from '../useFileUpload';
import { ToolDefinition } from '@/types';
import { versionPath } from '@/lib/apiVersion';

// ============================================================================
// Test doubles: XHR fake (presigned part PUTs) + fetch mock (JSON endpoints)
// ============================================================================

type RespondFn = (xhr: FakeXMLHttpRequest) => void;

const partNumberFromUrl = (url: string) => {
  const match = url.match(/part-(\d+)/);
  return match ? Number(match[1]) : 0;
};

/** Default behavior: report full progress, respond 200 with a quoted ETag. */
const defaultRespond: RespondFn = (xhr) => {
  const n = partNumberFromUrl(xhr.url);
  xhr.progress(xhr.bodySize());
  xhr.respond(200, `"etag-${n}"`);
};

let xhrAutoRespond = true;
let xhrRespondImpl: RespondFn = defaultRespond;

class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = [];

  method = '';
  url = '';
  body: unknown = null;
  withCredentials = false;
  status = 0;
  aborted = false;
  responded = false;

  upload: { onprogress: ((event: { loaded: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  private headers: Record<string, string> = {};

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader() {}

  getResponseHeader(name: string): string | null {
    return this.headers[name.toLowerCase()] ?? null;
  }

  send(body: unknown) {
    this.body = body;
    FakeXMLHttpRequest.instances.push(this);
    queueMicrotask(() => {
      if (!this.aborted && !this.responded && xhrAutoRespond) {
        xhrRespondImpl(this);
      }
    });
  }

  abort() {
    if (this.responded) return;
    this.aborted = true;
    this.onabort?.();
  }

  // -- test helpers ----------------------------------------------------------

  bodySize(): number {
    return this.body instanceof Blob ? this.body.size : 0;
  }

  progress(loaded: number) {
    this.upload.onprogress?.({ loaded });
  }

  respond(status: number, etag?: string | null) {
    if (this.aborted || this.responded) return;
    this.responded = true;
    this.status = status;
    if (etag != null) {
      this.headers['etag'] = etag;
    }
    this.onload?.();
  }

  fail() {
    if (this.aborted || this.responded) return;
    this.responded = true;
    this.onerror?.();
  }
}

// ---------------------------------------------------------------------------
// fetch mock for the JSON endpoints
// ---------------------------------------------------------------------------

interface RecordedFetch {
  url: string;
  method: string;
  body: unknown;
}

let fetchCalls: RecordedFetch[] = [];
let serverPartSize = 4;
let uploadCounter = 0;
let initResponder: (() => Response) | null = null;
let completeResponder: (() => Response) | null = null;

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const presignedUrl = (uploadId: string, partNumber: number, refreshed = false) =>
  `https://uploads.test/uploads/${uploadId}/part-${partNumber}${refreshed ? '?refreshed=1' : ''}`;

const makeParts = (uploadId: string, partNumbers: number[], refreshed = false) =>
  partNumbers.map((partNumber) => ({
    partNumber,
    url: presignedUrl(uploadId, partNumber, refreshed),
  }));

// Upload routes as the client actually calls them: apiClient rewrites
// /api/upload/... through versionPath (to /api/v1/... by default), so the mock
// must match the same spelling or every call falls through to "Unexpected fetch".
const UPLOAD = versionPath('/api/upload');
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PARTS_RE = new RegExp(`${escapeRe(UPLOAD)}/([^/]+)/parts(\\?.*)?$`);
const COMPLETE_RE = new RegExp(`${escapeRe(UPLOAD)}/([^/]+)/complete$`);

const installFetchMock = () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
      fetchCalls.push({ url, method, body });

      if (url.endsWith(`${UPLOAD}/init`) && method === 'POST') {
        if (initResponder) return initResponder();
        const fileSize = (body as { fileSize: number }).fileSize;
        const uploadId = `up-${++uploadCounter}`;
        const totalParts = Math.max(1, Math.ceil(fileSize / serverPartSize));
        const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);
        return jsonResponse(201, {
          success: true,
          message: 'created',
          data: {
            uploadId,
            key: `uploads/${uploadId}`,
            partSize: serverPartSize,
            totalParts,
            urlExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            parts: makeParts(uploadId, partNumbers),
          },
        });
      }

      const partsMatch = url.match(PARTS_RE);
      if (partsMatch && method === 'GET') {
        const uploadId = partsMatch[1];
        const parsed = new URL(url, 'http://localhost');
        const partNumbersParam = parsed.searchParams.get('partNumbers');
        const partNumbers = partNumbersParam
          ? partNumbersParam.split(',').map(Number)
          : [1];
        return jsonResponse(200, {
          success: true,
          message: 'ok',
          data: {
            uploadId,
            partSize: serverPartSize,
            parts: makeParts(uploadId, partNumbers, true),
          },
        });
      }

      const completeMatch = url.match(COMPLETE_RE);
      if (completeMatch && method === 'POST') {
        if (completeResponder) return completeResponder();
        return jsonResponse(200, {
          success: true,
          message: 'ok',
          data: {
            uploadId: completeMatch[1],
            fileName: 'doc.pdf',
            size: 10,
            complete: true,
          },
        });
      }

      if (method === 'DELETE' && /\/api\/upload\/[^/]+$/.test(url)) {
        return new Response(null, { status: 204 });
      }

      throw new Error(`Unexpected fetch: ${method} ${url}`);
    })
  );
};

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

const tool: ToolDefinition = {
  id: 'merge',
  name: 'Merge PDF',
  description: 'Merge PDFs',
  category: 'merge',
  icon: 'merge',
  acceptedFileTypes: ['.pdf', 'application/pdf'],
  maxFiles: 10,
  minFiles: 1,
  route: '/merge',
  navGroup: 'organize',
};

const makeFile = (size = 10, name = 'doc.pdf') =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });

const renderUploadHook = () => renderHook(() => useFileUpload({ tool }));

const completeCall = () => fetchCalls.find((c) => c.url.includes('/complete'));
const partsCalls = () => fetchCalls.filter((c) => c.url.includes('/parts'));

beforeEach(() => {
  fetchCalls = [];
  uploadCounter = 0;
  serverPartSize = 4;
  initResponder = null;
  completeResponder = null;
  xhrAutoRespond = true;
  xhrRespondImpl = defaultRespond;
  FakeXMLHttpRequest.instances = [];
  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
  installFetchMock();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ============================================================================
// Tests
// ============================================================================

describe('useFileUpload — multipart uploads', () => {
  it('uploads a multi-part file: init → parallel PUTs → complete with all etags', async () => {
    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]); // partSize 4 → 3 parts (4, 4, 2)
    });

    await waitFor(() => {
      expect(result.current.files[0]?.state).toBe('completed');
    });

    const file = result.current.files[0];
    expect(file.serverFileId).toBe('up-1');
    expect(file.parts).toHaveLength(3);
    expect(file.parts.map((p) => p.etag)).toEqual(['etag-1', 'etag-2', 'etag-3']);
    expect(file.progress.percentage).toBe(100);

    // Raw blobs PUT with the server's part size, no credentials.
    const puts = FakeXMLHttpRequest.instances;
    expect(puts).toHaveLength(3);
    expect(puts.every((x) => x.method === 'PUT' && x.withCredentials === false)).toBe(true);
    expect(puts.map((x) => x.bodySize()).sort()).toEqual([2, 4, 4]);

    // Complete payload carries every {partNumber, etag} (etags de-quoted).
    const complete = completeCall();
    expect(complete?.body).toEqual({
      parts: [
        { partNumber: 1, etag: 'etag-1' },
        { partNumber: 2, etag: 'etag-2' },
        { partNumber: 3, etag: 'etag-3' },
      ],
    });
    expect(result.current.canProceed).toBe(true);
  });

  it('uploads a single-part file', async () => {
    serverPartSize = 64;
    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]);
    });

    await waitFor(() => {
      expect(result.current.files[0]?.state).toBe('completed');
    });

    expect(result.current.files[0].parts).toHaveLength(1);
    expect(FakeXMLHttpRequest.instances).toHaveLength(1);
    expect(completeCall()?.body).toEqual({
      parts: [{ partNumber: 1, etag: 'etag-1' }],
    });
  });

  it('retries a failed part with backoff and still completes', async () => {
    vi.useFakeTimers();
    serverPartSize = 64; // single part keeps the timer flow simple
    let failures = 0;
    xhrRespondImpl = (xhr) => {
      if (failures < 1) {
        failures += 1;
        xhr.fail(); // network error on the first attempt
        return;
      }
      defaultRespond(xhr);
    };

    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]);
    });

    // Flush init + first (failing) PUT, then advance through the backoff
    // (≤750ms) and the throttled progress flush.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // waitFor polls on real timers — restore them or it deadlocks against
    // the still-installed fake clock.
    vi.useRealTimers();

    await waitFor(() => {
      expect(result.current.files[0]?.state).toBe('completed');
    });
    expect(failures).toBe(1);
    expect(FakeXMLHttpRequest.instances).toHaveLength(2);
  });

  it('pauses mid-flight keeping etags, then resume re-PUTs only remaining parts', async () => {
    xhrAutoRespond = false;
    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]); // 3 parts
    });

    await waitFor(() => {
      expect(FakeXMLHttpRequest.instances).toHaveLength(3);
    });

    // Part 1 finishes before the pause.
    await act(async () => {
      FakeXMLHttpRequest.instances.find((x) => x.url.includes('part-1'))!.respond(200, '"etag-1"');
    });

    await waitFor(() => {
      expect(result.current.files[0].parts.find((p) => p.partNumber === 1)?.etag).toBe('etag-1');
    });

    const fileId = result.current.files[0].id;
    act(() => {
      result.current.pauseUpload(fileId);
    });

    await waitFor(() => {
      expect(result.current.files[0].state).toBe('paused');
    });

    // In-flight parts were aborted, the finished etag is retained.
    expect(
      FakeXMLHttpRequest.instances.filter((x) => x.aborted).map((x) => partNumberFromUrl(x.url)).sort()
    ).toEqual([2, 3]);
    expect(result.current.files[0].parts.find((p) => p.partNumber === 1)?.etag).toBe('etag-1');
    expect(result.current.files[0].progress.loaded).toBe(4);

    // Resume: URLs are fresh, so no refresh call; only parts 2 and 3 re-PUT.
    xhrAutoRespond = true;
    const putsBeforeResume = FakeXMLHttpRequest.instances.length;
    act(() => {
      result.current.resumeUpload(fileId);
    });

    await waitFor(() => {
      expect(result.current.files[0].state).toBe('completed');
    });

    const resumePuts = FakeXMLHttpRequest.instances.slice(putsBeforeResume);
    expect(resumePuts.map((x) => partNumberFromUrl(x.url)).sort()).toEqual([2, 3]);
    expect(partsCalls()).toHaveLength(0);
    expect(completeCall()?.body).toEqual({
      parts: [
        { partNumber: 1, etag: 'etag-1' },
        { partNumber: 2, etag: 'etag-2' },
        { partNumber: 3, etag: 'etag-3' },
      ],
    });
  });

  it('refreshes stale part URLs on resume when urlIssuedAt is older than 25 minutes', async () => {
    let now = 1_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    xhrAutoRespond = false;
    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]); // 3 parts
    });

    await waitFor(() => {
      expect(FakeXMLHttpRequest.instances).toHaveLength(3);
    });

    await act(async () => {
      FakeXMLHttpRequest.instances.find((x) => x.url.includes('part-1'))!.respond(200, '"etag-1"');
    });
    await waitFor(() => {
      expect(result.current.files[0].parts.find((p) => p.partNumber === 1)?.etag).toBe('etag-1');
    });

    const fileId = result.current.files[0].id;
    act(() => {
      result.current.pauseUpload(fileId);
    });
    await waitFor(() => {
      expect(result.current.files[0].state).toBe('paused');
    });

    // 26 minutes later the remaining URLs are stale.
    now += 26 * 60 * 1000;

    xhrAutoRespond = true;
    const putsBeforeResume = FakeXMLHttpRequest.instances.length;
    act(() => {
      result.current.resumeUpload(fileId);
    });

    await waitFor(() => {
      expect(result.current.files[0].state).toBe('completed');
    });

    // Only the pending parts were refreshed, and the refreshed URLs were used.
    const refreshes = partsCalls();
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0].url).toContain('partNumbers=2%2C3');
    const resumePuts = FakeXMLHttpRequest.instances.slice(putsBeforeResume);
    expect(resumePuts.every((x) => x.url.includes('refreshed=1'))).toBe(true);

    nowSpy.mockRestore();
  });

  it('handles a 403 expired URL by refreshing without consuming a retry attempt', async () => {
    serverPartSize = 64; // single part
    let expiredOnce = false;
    xhrRespondImpl = (xhr) => {
      if (!expiredOnce && !xhr.url.includes('refreshed=1')) {
        expiredOnce = true;
        xhr.respond(403);
        return;
      }
      defaultRespond(xhr);
    };

    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]);
    });

    await waitFor(() => {
      expect(result.current.files[0]?.state).toBe('completed');
    });

    const refreshes = partsCalls();
    expect(refreshes).toHaveLength(1);
    expect(refreshes[0].url).toContain('partNumbers=1');
    // Second PUT used the refreshed URL — no backoff timers involved.
    expect(FakeXMLHttpRequest.instances).toHaveLength(2);
    expect(FakeXMLHttpRequest.instances[1].url).toContain('refreshed=1');
  });

  it('fails with the server message on init 413, and retryUpload re-inits from scratch', async () => {
    initResponder = () =>
      jsonResponse(413, {
        success: false,
        message: 'too large',
        error: { code: 'FILE_TOO_LARGE', details: 'File exceeds your plan limit of 50MB.' },
      });

    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]);
    });

    await waitFor(() => {
      expect(result.current.files[0]?.state).toBe('failed');
    });
    expect(result.current.files[0].error).toBe('File exceeds your plan limit of 50MB.');
    expect(result.current.files[0].serverFileId).toBeUndefined();

    // Retry after the limit goes away: a fresh init is issued and the upload completes.
    initResponder = null;
    const fileId = result.current.files[0].id;
    act(() => {
      result.current.retryUpload(fileId);
    });

    await waitFor(() => {
      expect(result.current.files[0].state).toBe('completed');
    });

    const initCalls = fetchCalls.filter((c) => c.url.endsWith(`${UPLOAD}/init`));
    expect(initCalls).toHaveLength(2);
    expect(result.current.files[0].serverFileId).toBe('up-1');
  });

  it('fails with a configuration hint when the ETag header is missing', async () => {
    serverPartSize = 64;
    xhrRespondImpl = (xhr) => {
      xhr.respond(200, null); // 200 OK but no ETag exposed
    };

    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]);
    });

    await waitFor(() => {
      expect(result.current.files[0]?.state).toBe('failed');
    });
    expect(result.current.files[0].error).toMatch(/ETag/);
    expect(result.current.files[0].error).toMatch(/misconfigur/i);
    expect(completeCall()).toBeUndefined();
  });

  it('fires an abort DELETE when removing a file with an upload session', async () => {
    const { result } = renderUploadHook();

    act(() => {
      result.current.addFiles([makeFile(10)]);
    });

    await waitFor(() => {
      expect(result.current.files[0]?.state).toBe('completed');
    });

    const fileId = result.current.files[0].id;
    await act(async () => {
      result.current.removeFile(fileId);
    });

    expect(result.current.files).toHaveLength(0);
    await waitFor(() => {
      const deletes = fetchCalls.filter((c) => c.method === 'DELETE');
      expect(deletes).toHaveLength(1);
      expect(deletes[0].url).toContain(`${UPLOAD}/up-1`);
    });
  });
});

describe('useFileUpload — plan limits', () => {
  const MB = 1024 * 1024;
  const limits = { name: 'free', maxFileSizeMb: 50, maxFilesPerJob: 10, maxJobInputMb: 300, retentionDays: 7 };
  const sized = (bytes: number, name: string) => {
    const file = new File(['x'], name, { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: bytes });
    return file;
  };

  it.each([
    ['FILE_TOO_LARGE', [sized(51 * MB, 'big.pdf')], /50 MB per-file limit/],
    ['MAX_FILES_EXCEEDED', Array.from({ length: 11 }, (_, i) => sized(1, `f${i}.pdf`)), /up to 10 files/],
    ['JOB_TOO_LARGE', Array.from({ length: 7 }, (_, i) => sized(50 * MB, `f${i}.pdf`)), /300 MB total per job/],
  ])('rejects with %s before any upload request', (code, files, message) => {
    const onValidationError = vi.fn();
    const { result } = renderHook(() => useFileUpload({ tool, limits, deferUpload: true, onValidationError }));

    let validation: ReturnType<typeof result.current.addFiles> | undefined;
    act(() => {
      validation = result.current.addFiles(files);
    });

    expect(validation?.isValid).toBe(false);
    expect(validation?.errors[0]).toMatchObject({ code, message: expect.stringMatching(message) });
    expect(onValidationError).toHaveBeenCalled();
    expect(result.current.files).toHaveLength(0);
    expect(fetchCalls).toHaveLength(0);
  });

  it('accepts a file exactly at the limit', () => {
    const { result } = renderHook(() => useFileUpload({ tool, limits, deferUpload: true }));
    act(() => {
      result.current.addFiles([sized(50 * MB, 'edge.pdf')]);
    });
    expect(result.current.files).toHaveLength(1);
  });
});
