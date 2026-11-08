import { useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { usePlans } from '@/hooks/usePlans';
import { resolvePlanLimits, type PlanLimits } from '@/lib/uploadLimits';

/**
 * The current user's effective upload limits: their own `planLimits`, else
 * the /auth/plans row for their plan, else the static guest fallback.
 * See lib/uploadLimits.ts.
 */
export const useUploadLimits = (): PlanLimits => {
  const { plan, planLimits } = useAuth();
  const { data: plans } = usePlans();
  return useMemo(
    () => resolvePlanLimits({ userLimits: planLimits, plans, planName: plan }),
    [plan, planLimits, plans]
  );
};
