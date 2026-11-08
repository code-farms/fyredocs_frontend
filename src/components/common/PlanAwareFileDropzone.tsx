import { forwardRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ToolDefinition } from '@/types';
import { FileDropzone, FileDropzoneHandle } from '@/components/common/FileDropzone';
import { useAuth } from '@/auth/useAuth';
import { usePlan } from '@/hooks/usePlans';
import { useUploadLimits } from '@/hooks/useUploadLimits';
import { checkSelection, effectiveLimits, isTopPlan, type UploadLimitReason } from '@/lib/uploadLimits';
import { toast } from '@/lib/toast';

export type PlanLimitReason = UploadLimitReason;

interface PlanAwareFileDropzoneProps {
  tool: ToolDefinition;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Files already in the job — needed for the file-count and total-size limits. */
  currentFiles?: { size: number }[];
  /**
   * Called when the selection violates the user's effective limits (plan and
   * tool, see lib/uploadLimits.ts). The violating selection is NOT forwarded.
   * Without a handler the message is shown as a toast.
   */
  onLimitExceeded?: (reason: PlanLimitReason, message: string) => void;
}

const NO_FILES: { size: number }[] = [];

/**
 * Drop-in replacement for FileDropzone that enforces and displays the current
 * user's plan-based limits (per-file size, files per job, total per job)
 * before anything is uploaded.
 *
 * Exposes `openFileDialog()` via ref for "Add more files" actions.
 */
export const PlanAwareFileDropzone = forwardRef<FileDropzoneHandle, PlanAwareFileDropzoneProps>(
  (
    {
      tool,
      onFilesSelected,
      disabled = false,
      className,
      compact = false,
      currentFiles = NO_FILES,
      onLimitExceeded,
    },
    ref
  ) => {
    const { plan } = useAuth();
    const limits = useUploadLimits();
    const { plan: freePlan } = usePlan('free');
    const { plan: proPlan } = usePlan('pro');
    const effective = effectiveLimits(limits, tool);

    const handleFilesSelected = useCallback(
      (files: File[]) => {
        const check = checkSelection({ files, existingFiles: currentFiles, limits, tool });
        if (check.ok === false) {
          if (onLimitExceeded) onLimitExceeded(check.reason, check.message);
          else toast.error(check.message);
          return;
        }
        onFilesSelected(files);
      },
      [currentFiles, limits, onFilesSelected, onLimitExceeded, tool]
    );

    return (
      <div className="space-y-2">
        <FileDropzone
          ref={ref}
          tool={tool}
          onFilesSelected={handleFilesSelected}
          disabled={disabled}
          className={className}
          compact={compact}
          maxFileSize={effective.maxFileSize}
          maxFiles={effective.maxFiles}
        />
        {!isTopPlan(plan) && (
          <p className="text-xs text-center text-muted-foreground">
            {plan === 'guest' ? (
              <>
                <Link to="/signup" className="underline hover:text-foreground">
                  Sign up free
                </Link>
                {freePlan
                  ? ` for ${freePlan.maxFileSizeMb}MB uploads & ${freePlan.maxFilesPerJob}-file jobs. `
                  : '. '}
                <Link to="/pricing" className="underline hover:text-foreground">
                  Upgrade to Pro
                </Link>
                {proPlan ? ` for ${proPlan.maxFileSizeMb}MB.` : '.'}
              </>
            ) : (
              <>
                <Link to="/pricing" className="underline hover:text-foreground">
                  Upgrade to Pro
                </Link>
                {proPlan
                  ? ` for ${proPlan.maxFileSizeMb}MB files & ${proPlan.maxFilesPerJob} files per job.`
                  : '.'}
              </>
            )}
          </p>
        )}
      </div>
    );
  }
);

PlanAwareFileDropzone.displayName = 'PlanAwareFileDropzone';
