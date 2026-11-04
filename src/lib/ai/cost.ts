// NOTE: ported from fyredocs_app/src/lib/ai/cost.ts — keep in sync.
/**
 * Pre-run cost check (Phase 23 §2). PURE. The server reserves each call's
 * worst case — estimated input plus the output cap — so the app estimates
 * the same way: a run the ledger would refuse is blocked here with the
 * reset date, instead of failing after the user waited. Large runs ask
 * first; small ones just go.
 */

import type { AiRequest } from './provider';
import { estimateRequestTokens } from './request';

/** Mirrors ai-service AI_MAX_OUTPUT_TOKENS' default. */
export const OUTPUT_CAP_TOKENS = 4096;
/** Above this, confirm before spending. ~a 25-page document. */
export const LARGE_RUN_TOKENS = 30_000;

export interface QuotaSnapshot {
  remainingTokens: number;
  limitTokens: number;
  resetsAt: string;
}

export type CostCheck =
  | { kind: 'ok'; estimate: number }
  | { kind: 'confirm'; estimate: number; remaining?: number }
  | { kind: 'insufficient'; estimate: number; remaining: number; resetsAt: string };

/** Worst-case tokens for one or more calls (map-reduce makes several). */
export const estimateRun = (requests: AiRequest[]): number =>
  requests.reduce((sum, r) => sum + estimateRequestTokens(r) + OUTPUT_CAP_TOKENS, 0);

/** Quota unknown (fetch failed, offline) never blocks: the server is the
 *  real gate and will answer AI_QUOTA_EXCEEDED itself. */
export const checkCost = (estimate: number, quota?: QuotaSnapshot | null, calls = 1): CostCheck => {
  if (quota && estimate > quota.remainingTokens) {
    return { kind: 'insufficient', estimate, remaining: quota.remainingTokens, resetsAt: quota.resetsAt };
  }
  if (estimate > LARGE_RUN_TOKENS || calls > 1) return { kind: 'confirm', estimate, remaining: quota?.remainingTokens };
  return { kind: 'ok', estimate };
};

/** "12k" / "850" — tokens are an abstract unit; round for humans. */
export const formatTokens = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
