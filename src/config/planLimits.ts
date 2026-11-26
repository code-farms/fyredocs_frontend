/**
 * Plan limit fallbacks: the ONE place in the web app that holds plan numbers.
 *
 * The live limits are the `subscription_plans` rows, read from /auth/plans (and
 * the user's own `planLimits` from /auth/me). They can change in the database
 * at any time without a deploy. These values are shown only until that data
 * loads, or if it cannot be loaded. The guest row is also the conservative
 * default for every upload check before then.
 *
 * Same numbers as the backend's shared/config/plan_limits.go.
 */
export const PLAN_LIMIT_FALLBACKS = {
  guest: { maxFileSizeMb: 20, maxFilesPerJob: 5, maxJobInputMb: 100, maxOcrPages: 10, retentionDays: 0 },
  free: { maxFileSizeMb: 50, maxFilesPerJob: 10, maxJobInputMb: 300, maxOcrPages: 30, retentionDays: 7 },
  pro: { maxFileSizeMb: 300, maxFilesPerJob: 50, maxJobInputMb: 300, maxOcrPages: 200, retentionDays: 30 },
} as const;
