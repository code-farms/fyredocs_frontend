import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/lib/apiClient';

/** Runtime feature flags; a missing key means off. */
export type FeatureFlags = Record<string, boolean>;

/**
 * Reads the gateway's FEATURE_FLAGS_JSON via GET /api/config/flags (public,
 * cached 5 min server-side). Non-boolean values are dropped so a typo such as
 * "true" (string) can never switch a feature on by accident.
 */
export const fetchFlags = async (): Promise<FeatureFlags> => {
  const res = await apiJson<{ data?: { flags?: Record<string, unknown> } }>('/api/config/flags', { skipRefresh: true });
  const raw = res?.data?.flags ?? {};
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === 'boolean')) as FeatureFlags;
};

/**
 * Fail-closed: while loading, or if the gateway is unreachable, every flag
 * reads as off — a broken flags endpoint must never expose an unfinished feature.
 */
export const useFlags = (): FeatureFlags => {
  const { data } = useQuery({ queryKey: ['feature-flags'], queryFn: fetchFlags, staleTime: 5 * 60 * 1000, retry: false });
  return data ?? {};
};
