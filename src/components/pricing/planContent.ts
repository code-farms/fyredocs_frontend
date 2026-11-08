import type { Plan } from '@/hooks/usePlans';

/**
 * Static marketing copy + fallback limits for the three real plan tiers served
 * by `/auth/plans` (guest / free / pro). The fallbacks are only used while the
 * plans query is loading or if it errors; live API values (the DB — the single
 * source of truth) always win once available.
 */

export type PlanTierId = 'guest' | 'free' | 'pro';

export interface PlanLimits {
  maxFileSizeMb: number;
  maxFilesPerJob: number;
  maxJobInputMb: number;
  retentionDays: number;
}

export interface PlanTierContent {
  id: PlanTierId;
  name: string;
  tagline: string;
  price: string;
  period: string;
  /** Qualitative feature bullets (limits are rendered separately from data). */
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  /** Marks the tier as not yet purchasable — renders a disabled "Coming soon" CTA. */
  comingSoon?: boolean;
  /** Used while loading or when the plans request fails. */
  fallbackLimits: PlanLimits;
}

/**
 * Canonical retention copy — reuse this sentence anywhere retention is
 * explained so the claim stays consistent across the site.
 */
export const RETENTION_SENTENCE =
  'File retention is plan-based: guest files are deleted as soon as processing finishes (0-day retention), Free accounts keep results for 7 days, and Pro keeps them for 30 days — after that, everything is deleted automatically.';

export const PLAN_TIERS: PlanTierContent[] = [
  {
    id: 'guest',
    name: 'Guest',
    tagline: 'No account, no sign-up — just use the tools.',
    price: '$0',
    period: 'no account needed',
    features: [
      'Access to every tool',
      'No sign-up required',
      'Files deleted right after processing',
      'Encrypted in transit (HTTPS)',
    ],
    cta: { label: 'Use tools now', href: '/all-tools' },
    fallbackLimits: { maxFileSizeMb: 20, maxFilesPerJob: 5, maxJobInputMb: 100, retentionDays: 0 },
  },
  {
    id: 'free',
    name: 'Free',
    tagline: 'A free account with bigger limits and job history.',
    price: '$0',
    period: 'forever',
    features: [
      'Everything in Guest',
      'Job history and re-downloads',
      'Results kept for 7 days',
      'Resumable chunked uploads',
    ],
    cta: { label: 'Create free account', href: '/signup' },
    fallbackLimits: { maxFileSizeMb: 50, maxFilesPerJob: 10, maxJobInputMb: 300, retentionDays: 7 },
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Heavy-duty limits for serious document work.',
    price: 'Paid',
    period: 'upgrade anytime',
    features: [
      'Everything in Free',
      'Large files up to 300 MB',
      'Up to 50 files per job',
      'Results kept for 30 days',
    ],
    cta: { label: 'Get Pro', href: '/signup?plan=pro' },
    highlighted: true,
    comingSoon: true,
    fallbackLimits: { maxFileSizeMb: 300, maxFilesPerJob: 50, maxJobInputMb: 300, retentionDays: 30 },
  },
];

/** Resolve live limits for a tier from the `/auth/plans` payload, falling back to static values. */
export const resolvePlanLimits = (tier: PlanTierContent, plans?: Plan[]): PlanLimits => {
  const live = plans?.find((p) => p.name?.toLowerCase() === tier.id);
  if (!live) return tier.fallbackLimits;
  return {
    maxFileSizeMb: live.maxFileSizeMb ?? tier.fallbackLimits.maxFileSizeMb,
    maxFilesPerJob: live.maxFilesPerJob ?? tier.fallbackLimits.maxFilesPerJob,
    maxJobInputMb: live.maxJobInputMb ?? tier.fallbackLimits.maxJobInputMb,
    retentionDays: live.retentionDays ?? tier.fallbackLimits.retentionDays,
  };
};

export const formatFileSize = (mb: number): string =>
  mb >= 1000 ? `${mb / 1000} GB` : `${mb} MB`;

export const formatRetention = (days: number): string =>
  days <= 0 ? 'Deleted after processing' : `${days} days`;
