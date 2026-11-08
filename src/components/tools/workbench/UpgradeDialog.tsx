import { Link } from 'react-router-dom';
import { Sparkles, Check, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/useAuth';
import { usePlan, type Plan } from '@/hooks/usePlans';
import { useUploadLimits } from '@/hooks/useUploadLimits';
import { PlanLimitReason } from '@/components/common/PlanAwareFileDropzone';
import { isTopPlan, type PlanLimits } from '@/lib/uploadLimits';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: PlanLimitReason;
  /** The exact limit that was hit (from lib/uploadLimits.ts checkSelection). */
  message?: string;
}

const REASON_COPY: Record<PlanLimitReason, string> = {
  fileCount: 'You have reached the maximum number of files per job for your current plan.',
  fileSize: 'One of your files exceeds the maximum file size for your current plan.',
  jobTotal: 'Your files together exceed the maximum total size per job for your current plan.',
};

/** The plan value that `reason` is about, for comparing against the next tier. */
const limitFor = (reason: PlanLimitReason, p: Pick<PlanLimits, 'maxFileSizeMb' | 'maxFilesPerJob'> & { maxJobInputMb?: number }) =>
  reason === 'fileCount' ? p.maxFilesPerJob : reason === 'fileSize' ? p.maxFileSizeMb : p.maxJobInputMb;

/**
 * Shown when a file selection violates the user's plan limits.
 * Guests are nudged to a free account and free users to Pro — but only when
 * the next plan actually raises the limit that was hit. On the top plan (or
 * when the next plan has the same limit) it says this is the maximum instead.
 */
export const UpgradeDialog = ({ open, onOpenChange, reason = 'fileSize', message }: UpgradeDialogProps) => {
  const { plan } = useAuth();
  const limits = useUploadLimits();
  const { plan: freePlan } = usePlan('free');
  const { plan: proPlan } = usePlan('pro');
  const isGuest = plan.toLowerCase() === 'guest';
  const nextPlan: Plan | undefined = isTopPlan(plan) ? undefined : isGuest ? freePlan : proPlan;

  const current = limitFor(reason, limits);
  const next = nextPlan ? limitFor(reason, nextPlan) : undefined;
  // Unknown next-plan data (plans still loading) keeps the upgrade nudge.
  const canUpgrade = !isTopPlan(plan) && (next === undefined || current === undefined || next > current);

  const description = message ?? REASON_COPY[reason];

  if (!canUpgrade) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" aria-hidden />
              Upload limit reached
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <p className="text-body-sm text-muted-foreground">
            {isTopPlan(plan)
              ? 'This is the maximum for your plan.'
              : 'This is the maximum on every plan.'}{' '}
            {reason === 'fileSize'
              ? 'Try compressing or splitting the file first.'
              : 'Split the files across separate jobs.'}
          </p>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const highlight = isGuest ? freePlan : proPlan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            {isGuest ? 'Create a free account' : 'Upgrade to Pro'}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-body-sm">
          {highlight && (
            <>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden />
                Files up to {highlight.maxFileSizeMb}MB
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden />
                Up to {highlight.maxFilesPerJob} files per job
              </li>
              {highlight.maxJobInputMb !== undefined && (
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" aria-hidden />
                  Up to {highlight.maxJobInputMb}MB in total per job
                </li>
              )}
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" aria-hidden />
                Files kept for {highlight.retentionDays} {highlight.retentionDays === 1 ? 'day' : 'days'}
              </li>
            </>
          )}
          {isGuest && (
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" aria-hidden />
              Free forever — no credit card required
            </li>
          )}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button asChild variant="gradient">
            <Link to={isGuest ? '/signup' : '/pricing'}>
              {isGuest ? 'Create a free account' : 'Upgrade to Pro'}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
