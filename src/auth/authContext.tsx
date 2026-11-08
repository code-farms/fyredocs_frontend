/* eslint-disable react-refresh/only-export-components */
/**
 * Session state for the whole app. This is the authoritative description of the
 * auth model; other auth files carry a pointer here rather than repeating it.
 *
 * The token is never visible to JavaScript. Both the access and refresh tokens
 * are HttpOnly cookies, so nothing in this file can read, decode, or inspect
 * them — an XSS bug cannot exfiltrate a session. Everything below follows from
 * that constraint:
 *
 * - Expiry comes from `accessExpiresAt`, a timestamp the server puts in the
 *   response BODY, because the token itself is unreadable. jwtUtils.decodeJwt
 *   exists for display only and must never be treated as authoritative.
 * - A refresh is scheduled 2 minutes before expiry rather than reacting to a
 *   401, so a user mid-action is not interrupted by a failed request.
 * - `visibilitychange` re-checks on tab wake. setTimeout does not fire reliably
 *   in a backgrounded tab, so a timer set an hour ago may be arbitrarily late;
 *   on wake we refresh immediately if within a minute of expiry, otherwise
 *   reschedule against the real clock.
 * - The `fyredocs:unauthorized` window event is the inbound channel from
 *   lib/apiClient.ts. An event rather than a direct call keeps apiClient
 *   independent of the React tree, at the cost of the coupling being invisible
 *   to the type system — if you rename that event, grep for it.
 *
 * Bootstrap is a deliberate ladder: getMe, then refresh if that fails, then give
 * up and clear. A returning user with an expired access token but a live refresh
 * token must land authenticated, which one getMe call alone cannot achieve.
 */
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthCredentials,
  AuthSignupCredentials,
  AuthUser,
  getMe,
  login,
  logout,
  refreshSession,
  signup,
} from '@/auth/authClient';
import { flush, track } from '@/lib/activity';
import { ACTIVITY_EVENTS } from '@/lib/activityEvents';
import type { PlanLimits } from '@/lib/uploadLimits';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  role: string | null;
  plan: string;
  /**
   * The signed-in user's server-provided upload limits, or null (guest, or a
   * backend that omits them). Use hooks/useUploadLimits for the effective
   * limits, which also fall back to /auth/plans.
   */
  planLimits: PlanLimits | null;
  login: (credentials: AuthCredentials) => Promise<AuthUser | null>;
  signup: (credentials: AuthSignupCredentials) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

/** Undefined default so useAuth can detect a missing provider instead of silently reporting a logged-out user. */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Owns session state and the refresh lifecycle. Mounted once, above the router. */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>('guest');
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Refs, not state: neither value should trigger a re-render, and the
  // visibilitychange handler needs to read the current expiry without being
  // re-subscribed every time it changes.
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessExpiresAtRef = useRef<number | null>(null);

  /** Cancels any pending refresh. Called before scheduling a new one so two timers can never race. */
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /**
   * Arms a refresh 2 minutes before expiry, using the server-supplied timestamp
   * (the cookie is HttpOnly and unreadable — see the file header).
   *
   * Called with no argument to re-arm from the last known expiry, which is what
   * the tab-wake path uses after clock drift. A delay already in the past is
   * ignored rather than fired immediately: that case means the token has
   * effectively expired, and the 401 path handles it with the shared refresh lock
   * instead of racing a second refresh from here.
   *
   * A failed refresh is swallowed on purpose. There is nothing useful to do at
   * this point — the next API call's 401 will drive recovery — and surfacing an
   * error from a background timer would produce a toast the user cannot act on.
   */
  const scheduleTokenRefresh = useCallback(
    (expiresAtMs?: number | null) => {
      clearRefreshTimer();

      const expiryMs = expiresAtMs ?? accessExpiresAtRef.current;
      if (!expiryMs) return;

      accessExpiresAtRef.current = expiryMs;

      const refreshAt = expiryMs - 2 * 60 * 1000; // 2 minutes before expiry
      const delay = refreshAt - Date.now();

      if (delay <= 0) return; // already past refresh window

      refreshTimerRef.current = setTimeout(async () => {
        try {
          const result = await refreshSession();
          if (result) {
            setUser(result.user);
            setRole(result.user.role ?? null);
            setPlan(result.user.planName ?? 'free');
            setPlanLimits(result.user.planLimits ?? null);
            setIsAuthenticated(true);
            scheduleTokenRefresh(result.accessExpiresAt);
          }
        } catch {
          // refresh failed — user will get 401 on next API call
        }
      }, delay);
    },
    [clearRefreshTimer]
  );

  /** Applies a fresh session to state and re-arms the refresh timer. Single path in, so a login, signup, refresh, and bootstrap cannot drift. */
  const hydrateAuth = useCallback(
    (me: AuthUser, accessExpiresAt?: number | null) => {
      setUser(me);
      setRole(me.role ?? null);
      setPlan(me.planName ?? 'free');
      setPlanLimits(me.planLimits ?? null);
      setIsAuthenticated(true);
      scheduleTokenRefresh(accessExpiresAt);
    },
    [scheduleTokenRefresh]
  );

  /** Resets to the anonymous state. Clearing the timer here matters: a surviving timer would refresh a session the user just ended. */
  const clearAuth = useCallback(() => {
    setUser(null);
    setRole(null);
    setPlan('guest');
    setPlanLimits(null);
    setIsAuthenticated(false);
    clearRefreshTimer();
  }, [clearRefreshTimer]);

  // Inbound channel from lib/apiClient.ts: any 401 or 403 anywhere in the app
  // clears state and routes to sign-in. See the file header for why this is an
  // event and not a direct call.
  useEffect(() => {
    const handler = () => {
      clearAuth();
      navigate('/signin', { replace: true });
    };
    window.addEventListener('fyredocs:unauthorized', handler);
    return () => window.removeEventListener('fyredocs:unauthorized', handler);
  }, [navigate, clearAuth]);

  /**
   * Resolves the session from cookies: getMe, then refresh on failure, then give
   * up. The nested catch is the middle rung — a user whose access token expired
   * while the tab was closed must still come back authenticated, which getMe
   * alone cannot do.
   */
  const syncUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await getMe();
      hydrateAuth(me);
    } catch {
      // Access token may be expired — try refreshing before giving up
      try {
        const result = await refreshSession();
        if (result) {
          hydrateAuth(result.user, result.accessExpiresAt);
          return;
        }
      } catch {
        // refresh also failed — session is truly gone
      }
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [hydrateAuth, clearAuth]);

  useEffect(() => {
    void syncUser();
  }, [syncUser]);

  // Tab wake. Timers are unreliable in a backgrounded tab, so on becoming
  // visible we compare against the real clock: refresh now if inside the 1-minute
  // margin, otherwise just re-arm the timer, which may have drifted badly.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        const expiryMs = accessExpiresAtRef.current;
        if (!expiryMs) {
          // No known expiry — try to refresh
          void syncUser();
          return;
        }
        if (Date.now() >= expiryMs - 60 * 1000) {
          // Token expired or expiring within 1 minute — refresh now
          refreshSession()
            .then((result) => {
              if (result) {
                hydrateAuth(result.user, result.accessExpiresAt);
              }
            })
            .catch(() => {
              // Will be handled by next API call's 401 flow
            });
        } else {
          // Token still valid — reschedule refresh timer (may have drifted while backgrounded)
          scheduleTokenRefresh();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, syncUser, hydrateAuth, scheduleTokenRefresh]);

  /** Signs in. Falls back to syncUser when the response omits a user, so a shape change downgrades to an extra request rather than a broken session. */
  const handleLogin = useCallback(
    async (credentials: AuthCredentials) => {
      // Failures are tracked without credentials or error detail — a login
      // error message can echo the typed email, which must not be persisted.
      try {
        const response = await login(credentials);
        track({ eventType: ACTIVITY_EVENTS.authLogin });
        if (response.user) {
          hydrateAuth(response.user, response.accessExpiresAt);
          return response.user;
        }
        await syncUser();
        return null;
      } catch (error) {
        track({ eventType: ACTIVITY_EVENTS.authLogin, status: 'failed' });
        throw error;
      }
    },
    [syncUser, hydrateAuth]
  );

  /** Signs up and treats the result as a login — signup returns an authenticated session. */
  const handleSignup = useCallback(
    async (credentials: AuthSignupCredentials) => {
      try {
        const response = await signup(credentials);
        track({ eventType: ACTIVITY_EVENTS.authSignup });
        if (response.user) {
          hydrateAuth(response.user, response.accessExpiresAt);
          return response.user;
        }
        await syncUser();
        return null;
      } catch (error) {
        track({ eventType: ACTIVITY_EVENTS.authSignup, status: 'failed' });
        throw error;
      }
    },
    [syncUser, hydrateAuth]
  );

  /** Signs out, clearing local state in `finally` so a failed server call still ends the local session — leaving the UI logged-in after a logout click would be worse than a stale server session. */
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    // Track before the session cookie dies, then flush: after logout the
    // event would be attributed to a guest (or lost with the tab).
    track({ eventType: ACTIVITY_EVENTS.authLogout });
    void flush();
    try {
      await logout();
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      role,
      plan,
      planLimits,
      login: handleLogin,
      signup: handleSignup,
      logout: handleLogout,
    }),
    [handleLogin, handleLogout, handleSignup, isAuthenticated, isLoading, role, user, plan, planLimits]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
