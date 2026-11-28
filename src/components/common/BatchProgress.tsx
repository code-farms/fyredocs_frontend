import { BatchJob } from '@/hooks/useBatchJob';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Download,
  RefreshCw,
  X,
  FileText,
  Package,
  Combine,
} from 'lucide-react';
import { AnimatePresence, FadeIn, m } from '@/components/ui/animated';
import { WAITING_ON_SERVER_LABEL, aheadInQueue, waitingLabel } from '@/lib/queueLabel';

interface BatchProgressProps {
  batchJobs: BatchJob[];
  isProcessing: boolean;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  overallProgress: number;
  onCancel: () => void;
  onRetryFailed: () => void;
  /** Retries one failed row (its file is uploaded again, then processed). */
  onRetryRow?: (batchId: string) => void;
  onDownloadAll: () => void;
  onReset: () => void;
  /**
   * Set when the batch is the parts of one split scan: shows "Download as one
   * PDF" once every part completed. `merging` disables it while it runs.
   */
  onMerge?: () => void;
  merging?: boolean;
  className?: string;
}

const StatusIcon = ({ status }: { status: BatchJob['status'] }) => {
  const iconMap = {
    completed: <CheckCircle2 className="w-4 h-4 text-success" />,
    failed: <XCircle className="w-4 h-4 text-destructive" />,
    processing: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
    pending: <Clock className="w-4 h-4 text-muted-foreground" />,
  };

  return (
    <AnimatePresence mode="wait">
      <m.span
        key={status}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15 }}
        className="inline-flex"
      >
        {iconMap[status] ?? iconMap.pending}
      </m.span>
    </AnimatePresence>
  );
};

export const BatchProgress = ({
  batchJobs,
  isProcessing,
  completedCount,
  failedCount,
  totalCount,
  overallProgress,
  onCancel,
  onRetryFailed,
  onRetryRow,
  onDownloadAll,
  onReset,
  onMerge,
  merging = false,
  className,
}: BatchProgressProps) => {
  const allComplete = completedCount + failedCount === totalCount && totalCount > 0;
  const hasFailures = failedCount > 0;
  const hasSuccesses = completedCount > 0;
  // Jobs run one at a time: the row being processed is the user's position.
  const runningIndex = batchJobs.findIndex((bj) => bj.status === 'processing');
  const position = runningIndex >= 0 ? runningIndex + 1 : Math.min(completedCount + failedCount + 1, totalCount);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Progress Card */}
      <div className="p-6 rounded-xl border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">
              {isProcessing
                ? `Processing ${position} of ${totalCount}…`
                : allComplete
                ? hasFailures
                  ? 'Batch completed with errors'
                  : 'All files processed!'
                : 'Batch Processing'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} completed
              {failedCount > 0 && ` • ${failedCount} failed`}
            </p>
          </div>
          <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
        </div>

        <Progress value={overallProgress} className="h-2 mb-4" />

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-muted-foreground">{totalCount}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-3 rounded-lg bg-success-subtle">
            <div className="text-2xl font-bold text-success">{completedCount}</div>
            <div className="text-xs text-success-subtle-foreground">Completed</div>
          </div>
          <div className="p-3 rounded-lg bg-destructive-subtle">
            <div className="text-2xl font-bold text-destructive">{failedCount}</div>
            <div className="text-xs text-destructive-subtle-foreground">Failed</div>
          </div>
        </div>
      </div>

      {/* Individual Files */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground mb-3">Files</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {batchJobs.map((batchJob, index) => (
            <div
              key={batchJob.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                batchJob.status === 'completed' && 'bg-success-subtle/50 border-success/20',
                batchJob.status === 'failed' && 'bg-destructive-subtle/50 border-destructive/20',
                batchJob.status === 'processing' && 'bg-primary/5 border-primary/20',
                batchJob.status === 'pending' && 'bg-muted/30'
              )}
            >
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{batchJob.fileName}</p>
                {batchJob.status === 'processing' && batchJob.job && (
                  <div className="mt-1">
                    <Progress value={batchJob.job.progress.percentage} className="h-1" />
                  </div>
                )}
                {batchJob.note && <p className="text-xs text-primary mt-1">{batchJob.note}</p>}
                {batchJob.status === 'pending' && isProcessing && !batchJob.note && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {batchJob.waitingOnServer ? WAITING_ON_SERVER_LABEL : waitingLabel(aheadInQueue(batchJobs.map((bj) => ({ name: bj.fileName, state: bj.status })), index))}
                  </p>
                )}
                {batchJob.status === 'failed' && batchJob.error && (
                  <p className="text-xs text-destructive mt-1">{batchJob.error}</p>
                )}
              </div>
              <StatusIcon status={batchJob.status} />
              {batchJob.status === 'failed' && !isProcessing && onRetryRow && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={`Retry ${batchJob.fileName}`}
                  onClick={() => onRetryRow(batchJob.id)}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              <AnimatePresence>
                {batchJob.status === 'completed' && batchJob.job?.result?.downloadUrl && (
                  <FadeIn motionKey={`dl-${batchJob.id}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(batchJob.job?.result?.downloadUrl, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </FadeIn>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <FadeIn motionKey="cancel-actions">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel All
              </Button>
            </div>
          </FadeIn>
        ) : (
          <FadeIn motionKey="complete-actions">
            {onMerge && allComplete && !hasFailures && (
              <Button className="mb-3 w-full" onClick={onMerge} disabled={merging}>
                {merging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Combine className="w-4 h-4 mr-2" />}
                {merging ? 'Merging…' : 'Download as one PDF'}
              </Button>
            )}
            <div className="flex gap-3">
              {hasFailures && (
                <Button variant="outline" className="flex-1" onClick={onRetryFailed}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Failed ({failedCount})
                </Button>
              )}
              {hasSuccesses && (
                <Button className="flex-1" variant={onMerge ? 'outline' : 'default'} onClick={onDownloadAll}>
                  <Download className="w-4 h-4 mr-2" />
                  Download All ({completedCount})
                </Button>
              )}
            </div>
          </FadeIn>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {allComplete && (
          <FadeIn motionKey="reset-btn" slide>
            <Button variant="ghost" className="w-full" onClick={onReset}>
              Start over with new files
            </Button>
          </FadeIn>
        )}
      </AnimatePresence>
    </div>
  );
};
