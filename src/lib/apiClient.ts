import { versionPath } from '@/lib/apiVersion';
import { createSseParser } from '@/lib/sse';

type ApiRequestOptions = RequestInit & {
  skipRefresh?: boolean;
};

/**
 * Error thrown for non-2xx API responses. Carries the HTTP status so callers
 * can branch on it (e.g. 404 = upload session expired) while remaining a
 * plain Error for existing `error.message` consumers.
 */
export class ApiHttpError extends Error {
  status: number;
  /** The envelope's `error.code` (e.g. FILE_TOO_LARGE), when the body had one. */
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.code = code;
  }
}


/**
 * API origin from VITE_API_BASE_URL, or "" for same-origin requests. Empty is
 * the normal production case: Caddy serves the app and proxies /api on one
 * origin, which keeps cookies first-party. A cross-origin value is a
 * development convenience and requires the gateway's CORS allowlist to permit it
 * WITH credentials.
 */
const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return envUrl.trim().length > 0 ? envUrl : '';
};

/** Strip a trailing slash so joining with a leading-slash path cannot double it. */
const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/** Merge headers with overrides winning, via Headers so names stay case-insensitive. */
const mergeHeaders = (source?: HeadersInit, overrides?: HeadersInit) => {
  const headers = new Headers(source);
  if (overrides) {
    const overrideHeaders = new Headers(overrides);
    overrideHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
};

/**
 * Resolve a call-site path to a full URL, passing absolute URLs through
 * untouched. This is the single point where legacy paths are rewritten onto the
 * gateway's /api/v1 root, so call sites keep the short spelling.
 */
export const buildApiUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Call sites use the legacy spelling (/api/jobs, /auth/login); versionPath
  // rewrites it onto the gateway's canonical /api/v1 root here, at the single
  // point where a URL is built.
  const normalizedPath = versionPath(path.startsWith('/') ? path : `/${path}`);
  return `${normalizeBaseUrl(getBaseUrl())}${normalizedPath}`;
};

/**
 * Normalize any backend error response into one message plus the envelope's
 * `error.code` when present (the code drives lib/jobErrors.ts sentences).
 *
 * This is layer 1 of the app's error pipeline, and the reason it looks
 * repetitive is that the backend genuinely emits four shapes — the standard
 * { error: { code, details } } envelope, an { error: { message } } variant, a
 * bare string error, and a top-level { message }. Each branch exists because a
 * real endpoint produces it; deleting one silently degrades those errors to
 * "Request failed with 500".
 *
 * The message here is still technical. Layer 2 is ApiHttpError (adds status and code so
 * callers can branch — 404 on an upload means the session expired). Layer 3 is
 * friendlyError() in lib/friendlyError.ts, which is what maps this to prose fit
 * for a user and strips tool names like pdfcpu or ghostscript. Never render this
 * string directly in the UI.
 */
const parseError = async (response: Response): Promise<{ message: string; code?: string }> => {
  const contentType = response.headers.get('content-type') ?? '';
  let message = response.statusText || `Request failed with ${response.status}`;
  let code: string | undefined;

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null);
    if (typeof data?.error?.code === 'string' && data.error.code) {
      code = data.error.code;
    }
    // Handle API error format: { error: { code: string, details: string }, message: string }
    if (data?.error?.details) {
      message = data.error.details;
    } else if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.error && typeof data.error === 'string') {
      message = data.error;
    } else if (data?.message) {
      message = data.message;
    }
  } else {
    const text = await response.text().catch(() => '');
    if (text) {
      message = text;
    }
  }

  return { message, code };
};

const httpError = async (response: Response) => {
  const { message, code } = await parseError(response);
  return new ApiHttpError(message, response.status, code);
};

/** Wrap HeadersInit in a Headers instance so downstream mutation is safe. */
const buildHeaders = (headers?: HeadersInit): Headers => {
  return new Headers(headers);
};

/**
 * Single-flight lock for token refresh.
 *
 * Module-level on purpose. A page typically fires several requests at once, so
 * an expiring access token produces several simultaneous 401s. Without this
 * lock each would POST /auth/refresh independently — and because refresh
 * rotates the refresh token server-side, the later calls would present an
 * already-rotated token, be treated as reuse, and log the user out. Sharing one
 * in-flight promise means N concurrent 401s cause exactly one refresh.
 *
 * Cleared in .finally() rather than after the await so a failed refresh does not
 * wedge every later request on a permanently rejected promise.
 */
let refreshPromise: Promise<boolean> | null = null;

/**
 * POST /auth/refresh, reporting success as a boolean.
 *
 * Never throws: a network failure is indistinguishable from a rejected refresh
 * as far as the caller's decision goes, and an exception here would escape the
 * shared promise and reject every waiting request with the wrong error.
 */
const attemptRefresh = async (): Promise<boolean> => {
  try {
    const res = await fetch(buildApiUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
};

/** Joins the in-flight refresh, or starts one (see refreshPromise). */
const refreshOnce = (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = attemptRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

/**
 * Fetch wrapper carrying the app's auth and error conventions.
 *
 * Auth is cookie-based: credentials are always included and no Authorization
 * header is set, because the access token is an HttpOnly cookie that JavaScript
 * cannot read. That is also why nothing here decodes a token to check expiry.
 *
 * On 401 it refreshes once through the shared lock and retries. The retry passes
 * skipRefresh, which is the recursion guard — without it a request that 401s
 * again after a successful refresh would recurse until the stack blew.
 *
 * Both 401 and 403 dispatch the `fyredocs:unauthorized` window event. Using an
 * event rather than calling into auth state keeps this module free of a
 * dependency on the React tree; authContext listens and clears the session. 403
 * is included because the backend returns it for a revoked or downgraded
 * session, which is indistinguishable from a logout from the client's side.
 *
 * Returns: parsed JSON for a JSON response, raw text otherwise, and undefined
 * for 204 — cast to T because a caller expecting a body from a 204 endpoint is a
 * type-level mistake, not a runtime one.
 *
 * Throws ApiHttpError for every non-2xx response.
 */
export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { skipRefresh, ...fetchOptions } = options;
  const headers = buildHeaders(fetchOptions.headers);

  const response = await fetch(buildApiUrl(path), {
    credentials: 'include', // Always include cookies
    ...fetchOptions,
    headers,
  });

  // On 401: try to refresh the access token, then retry the original request
  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
    window.dispatchEvent(new CustomEvent('fyredocs:unauthorized'));
    throw await httpError(response);
  }

  // 403 = forbidden (not an expired token issue)
  if (response.status === 403 && !skipRefresh) {
    window.dispatchEvent(new CustomEvent('fyredocs:unauthorized'));
    throw await httpError(response);
  }

  if (!response.ok) {
    throw await httpError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  const text = await response.text();
  return text as unknown as T;
};

/**
 * apiRequest with a JSON Content-Type, set only when the caller has not already
 * chosen one — so a caller sending FormData or a specific content type is not
 * overridden.
 */
export const apiJson = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const headers = mergeHeaders(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return apiRequest<T>(path, {
    ...options,
    headers,
  });
};

/**
 * POST that consumes a Server-Sent Events response (the ai-service op stream).
 * Each `data:` frame is JSON-parsed and handed to `onEvent`; a malformed frame
 * is dropped, never fatal. A non-SSE 2xx (a proxy that buffered, or the
 * server's JSON fallback) is delivered as one event. Auth semantics match
 * apiRequest: one shared refresh on 401, then the unauthorized event.
 *
 * NOTE: mirrors apiStream in fyredocs_app/src/api/client.ts, which needs
 * expo/fetch for streaming; the browser's fetch streams natively.
 */
export const apiStream = async (
  path: string,
  body: unknown,
  onEvent: (event: unknown) => void,
  signal?: AbortSignal,
  skipRefresh = false
): Promise<void> => {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });

  if (response.status === 401 && !skipRefresh) {
    if (await refreshOnce()) return apiStream(path, body, onEvent, signal, true);
    window.dispatchEvent(new CustomEvent('fyredocs:unauthorized'));
    throw await httpError(response);
  }
  if (!response.ok) throw await httpError(response);

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    onEvent(await response.json());
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createSseParser((data) => {
    try {
      onEvent(JSON.parse(data));
    } catch {
      // a malformed frame is dropped, never fatal to the stream
    }
  });
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.end();
};
