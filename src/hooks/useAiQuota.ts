// NOTE: ported from fyredocs_app/src/hooks/useAiQuota.ts — keep in sync.
import { useQuery } from '@tanstack/react-query';

import { getAiQuota } from '@/lib/aiApi';

/** The caller's AI quota (Phase 23). Signed-in only; a failure leaves it
 *  undefined, which the cost check treats as "unknown — let the server
 *  decide" rather than blocking. Invalidate ['ai', 'quota'] after a run. */
export const useAiQuota = (enabled: boolean) =>
  useQuery({
    queryKey: ['ai', 'quota'],
    queryFn: getAiQuota,
    enabled,
    staleTime: 60_000,
    retry: false,
  });
