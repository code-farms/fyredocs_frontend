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
