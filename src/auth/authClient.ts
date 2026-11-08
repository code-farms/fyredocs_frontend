import { AuthError, parseAuthError } from '@/auth/authErrors';
import { versionPath } from '@/lib/apiVersion';
import { parsePlanLimits, type PlanLimits } from '@/lib/uploadLimits';

/**
 * Transport for the auth endpoints. Session semantics — HttpOnly cookies, the
 * refresh schedule, the unauthorized event — are documented once in
 * src/auth/authContext.tsx; this file only performs the calls.
 *
 * These use fetch directly rather than lib/apiClient.ts on purpose: apiClient
 * retries a 401 through the shared refresh lock, and routing /auth/refresh
 * through that would be self-referential. Errors are normalized to AuthError
 * here instead of ApiHttpError for the same reason.
 */
export type AuthUser = {
  id: string;
  email?: string;
  fullName?: string;
  country?: string;
  phone?: string;
  image?: string;
  role?: string;
  scope?: string[] | string;
  /** The user's plan ("guest" | "free" | "pro"). */
  planName?: string;
  /** Server-enforced upload limits for the user's plan. */
  planLimits?: PlanLimits;
  [key: string]: unknown;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthSignupCredentials = AuthCredentials & {
  fullName: string;
  country: string;
  phone?: string;
  image?: string;
};

type AuthResponse = Record<string, unknown> | null;

const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';
  return envUrl.trim();
};

const normalizeBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

const buildAuthUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // See apiVersion.ts: /auth/* is served under /api/v1/auth/* too, and the
  // rewrite happens once, here.
  const normalizedPath = versionPath(path.startsWith('/') ? path : `/${path}`);
  return `${normalizeBaseUrl(getBaseUrl())}${normalizedPath}`;
};

const parseResponseBody = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => '');
  return text ? { message: text } : null;
};

const normalizeUser = (data: AuthResponse): AuthUser | null => {
  if (!data || typeof data !== 'object') return null;

  const nested = data.data as Record<string, unknown> | undefined;

  const raw =
    (nested?.user as Record<string, unknown> | undefined) ??
    (nested?.profile as Record<string, unknown> | undefined) ??
    (data.user as Record<string, unknown> | undefined) ??
    (data.profile as Record<string, unknown> | undefined) ??
    (typeof nested === 'object' && nested !== null ? nested : null) ??
    data;
  if (!raw || typeof raw !== 'object') return null;

  const id = (raw.id ?? raw.userId ?? raw.sub) as string | number | undefined;

  if (!id) return null;

  return {
    ...raw,
    id: String(id),
    email: raw.email as string | undefined,
    fullName: raw.fullName as string | undefined,
    country: raw.country as string | undefined,
    phone: raw.phone as string | undefined,
    image: raw.image as string | undefined,
    role: raw.role as string | undefined,
    scope: raw.scope as string[] | string | undefined,
    planName: typeof raw.planName === 'string' ? raw.planName : undefined,
    planLimits: parsePlanLimits(raw.planLimits) ?? undefined,
  };
};

const extractAccessExpiresAt = (data: AuthResponse): number | null => {
  if (!data || typeof data !== 'object') return null;
  const nested = data.data as Record<string, unknown> | undefined;
  const ms = (nested?.accessExpiresAt ?? data.accessExpiresAt) as number | undefined;
  return typeof ms === 'number' && ms > 0 ? ms : null;
};

const authRequest = async (
  path: string,
  options: RequestInit = {}
) => {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildAuthUrl(path), {
    credentials: 'include', // Always include cookies for authentication
    ...options,
    headers,
    signal: options.signal ?? AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw await parseAuthError(response);
  }

  return parseResponseBody(response);
};

export const login = async (credentials: AuthCredentials) => {
  const data = await authRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const user = normalizeUser(data);
  if (!user) {
    throw new AuthError('SERVER_ERROR', 'Invalid user data returned from server.');
  }

  const accessExpiresAt = extractAccessExpiresAt(data);
  return { user, accessExpiresAt };
};

export const signup = async (credentials: AuthSignupCredentials) => {
  const data = await authRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const user = normalizeUser(data);
  if (!user) {
    throw new AuthError('SERVER_ERROR', 'Invalid user data returned from server.');
  }

  const accessExpiresAt = extractAccessExpiresAt(data);
  return { user, accessExpiresAt };
};

export const getProfile = async () => {
  const data = await authRequest('/auth/profile', { method: 'GET' });
  const user = normalizeUser(data);
  if (!user) {
    throw new AuthError('SERVER_ERROR', 'Invalid profile response.');
  }
  return user;
};

export const getMe = async () => {
  const data = await authRequest('/auth/me', { method: 'GET' });
  const user = normalizeUser(data);
  if (!user) {
    throw new AuthError('SERVER_ERROR', 'Invalid user response.');
  }
  return user;
};

export const refreshSession = async (): Promise<{ user: AuthUser; accessExpiresAt: number | null } | null> => {
  const data = await authRequest('/auth/refresh', { method: 'POST' });
  const user = normalizeUser(data);
  if (!user) return null;
  return { user, accessExpiresAt: extractAccessExpiresAt(data) };
};

export const logout = async () => {
  // Server will clear the cookies
  await authRequest('/auth/logout', { method: 'POST' });
};
