// NOTE: ported from fyredocs_app/src/lib/jobErrors.ts — keep in sync.
/**
 * Backend job failure → one human sentence (Phase 19). PURE — no imports,
 * fully tested. Before this, every failure surfaced whatever raw string the
 * worker happened to throw ("missing password option") or a generic toast.
 *
 * Resolution order: known error CODE → known REASON pattern → the reason
 * verbatim when it already reads like a sentence → the generic fallback.
 *
 * NOTE: the backend's error-code literal migration is still pending
 * (TODO.md "Backend deferred tech debt") — it will collapse INVALID_BODY /
 * INVALID_REQUEST into INVALID_INPUT and rename auth codes. This table
 * accepts BOTH literal generations for the same sentence, so the migration
 * can land server-side without breaking the app. Keep the pairs when adding
 * entries.
 *
 * Security posture carried from the backend: password failures NEVER
 * distinguish "wrong password" from "not encrypted" — decryptPDF takes the
 * same line, and a differentiating message would help guessing.
 */

const PASSWORD_SENTENCE =
  "That password didn't unlock it — check it and try again.";

/**
 * The worker's fixed failure sentences — NOTE: mirrors friendlyMessage in
 * fyredocs_backend/<worker service>/internal/worker/worker.go. A worker failure_reason is
 * ALWAYS one of these, so they pass through verbatim: running them through
 * REASON_PATTERNS turned every conversion failure into the password sentence,
 * because CONVERSION_FAILED's copy mentions "password-protected".
 */
const BACKEND_CONVERSION_FAILED =
  "We couldn't process this file. It may be corrupted, password-protected, or in an unsupported format. Please try a different file.";
const BACKEND_SENTENCES = new Set([
  BACKEND_CONVERSION_FAILED,
  'This file took too long to process. Please try again, or use a smaller file.',
  "This operation isn't supported for this file.",
  'Something went wrong while processing your file. Please try again.',
]);

/** Tools whose CONVERSION_FAILED is, in practice, a password that didn't work. */
const PASSWORD_TOOLS = new Set(['unlock-pdf']);

/** True when the worker reported a generic processing failure (not a timeout). */
export const isConversionFailure = (reason: string | undefined): boolean =>
  reason?.trim() === BACKEND_CONVERSION_FAILED;

/** Code → sentence. Old + new literals deliberately share entries. */
const CODE_SENTENCES: Record<string, string> = {
  INVALID_INPUT: 'The request was invalid — check the options and try again.',
  INVALID_BODY: 'The request was invalid — check the options and try again.',
  INVALID_REQUEST: 'The request was invalid — check the options and try again.',
  INVALID_OPTIONS: 'One of the options was rejected — review them and try again.',
  FILE_TOO_LARGE: 'That file is too large for this tool.',
  TOO_MANY_FILES: 'Too many files for one job — split them up and try again.',
  NOT_FOUND: "The job or file couldn't be found — it may have expired.",
  UPSTREAM_UNAVAILABLE: 'A processing service is unreachable right now — try again in a moment.',
  SERVICE_UNAVAILABLE: 'A processing service is unreachable right now — try again in a moment.',
  RATE_LIMIT_EXCEEDED: "You're going a bit fast — wait a moment and try again.",
  AUTH_UNAUTHORIZED: 'You need to sign in again to do that.',
  UNAUTHORIZED: 'You need to sign in again to do that.',
  AUTH_TOKEN_EXPIRED: 'Your session expired — sign in again.',
  // useJob's own client-side failure codes.
  POLLING_FAILED: 'Lost track of the job — check your connection and try again.',
  CREATE_FAILED: "The job couldn't be started — check your connection and try again.",
  // Phase 23's AI service — distinct sentences, ready before the surface
  // exists (Phase 19 item: never a generic toast for these).
  AI_UNAVAILABLE: 'The AI service is unavailable right now — everything else keeps working.',
  AI_QUOTA_EXCEEDED: "You've used this period's AI quota — it resets automatically.",
  AI_REQUEST_TOO_LARGE: 'That document is too large for an AI request — try fewer pages.',
  // Normally invisible: the backend adapter resends the pages on its own.
  AI_DOCUMENT_EXPIRED: 'The AI session for this document expired — try again.',
};

/** Reason-substring patterns, checked in order. */
const REASON_PATTERNS: [RegExp, string][] = [
  [/password|encrypt|decrypt/i, PASSWORD_SENTENCE],
  [/corrupt|truncat|parse|malformed|damaged/i, 'The file appears to be corrupt or truncated — try the Repair PDF tool.'],
  [/missing .* option|requires options/i, 'A required option was missing — review the settings and try again.'],
  [/too large|size limit/i, 'That file is too large for this tool.'],
  [/timeout|timed out/i, 'The job took too long and was stopped — try again, or with a smaller file.'],
];

/** True when the reason looks like intentional prose, not an error dump. */
const readsLikeASentence = (reason: string): boolean =>
  reason.length >= 15 &&
  reason.length <= 200 &&
  /^[A-Z]/.test(reason) &&
  !/[{}<>\\]|error:|exception|goroutine|\bnil\b/i.test(reason);

export const humanizeJobFailure = (
  code: string | undefined,
  reason: string | undefined,
  toolId?: string
): string => {
  const known = code ? CODE_SENTENCES[code.toUpperCase()] : undefined;
  if (known) return known;
  if (reason) {
    const trimmed = reason.trim();
    if (BACKEND_SENTENCES.has(trimmed)) {
      return trimmed === BACKEND_CONVERSION_FAILED && toolId && PASSWORD_TOOLS.has(toolId)
        ? PASSWORD_SENTENCE
        : trimmed;
    }
    for (const [pattern, sentence] of REASON_PATTERNS) {
      if (pattern.test(reason)) return sentence;
    }
    if (readsLikeASentence(reason)) return reason;
  }
  return 'The job failed to complete — try again.';
};
