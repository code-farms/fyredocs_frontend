/**
 * Build-time feature switches. Read from Vite env at build, so changing one
 * needs a rebuild.
 *
 * `signupEnabled` only hides the signup UI; registration is actually closed by
 * auth-service's SIGNUP_ENABLED (the /auth/signup route stays public at the
 * gateway). Set both together. Anything other than the literal 'false' keeps
 * signup on, so an unset variable never silently closes registration.
 */
export const signupEnabled = import.meta.env.VITE_SIGNUP_ENABLED !== 'false';

/**
 * Mirrors the backend's `notifications` compose profile. When notification-service
 * is not running, the gateway answers /api/notifications with 502; the bell's SSE
 * stream would auto-reconnect into that forever and its 30s poll would keep
 * failing. Unmounting the bell stops both.
 */
export const notificationsEnabled = import.meta.env.VITE_NOTIFICATIONS_ENABLED !== 'false';
