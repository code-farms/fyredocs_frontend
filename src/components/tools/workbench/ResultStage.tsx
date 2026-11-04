import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Download, RotateCcw, ArrowRight, TriangleAlert, Wrench } from 'lucide-react';
import { Job, ToolDefinition } from '@/types';
import { warningMessages } from '@/lib/jobWarnings';
import { isPdfName, readerHref } from '@/lib/reader/reader';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { Text } from '@/components/ui/typography';
import { getToolsByNavGroup, toolNavName } from '@/config/navigation';
import { getToolById } from '@/config/tools';
import { cn } from '@/lib/utils';

interface ResultStageProps {
  tool: ToolDefinition;
  job: Job;
  onStartOver: () => void;
  onRetry: () => void;
  className?: string;
}

const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

/** Whole-percent reduction from original to output; null unless at least 1% smaller. */
const savingsPercent = (originalSize: number | undefined, fileSize: number): number | null => {
  if (!originalSize || fileSize <= 0 || fileSize >= originalSize) return null;
  const pct = Math.round((1 - fileSize / originalSize) * 100);
  return pct >= 1 ? pct : null;
};

/** "Available for N more days/hours" from job.result.expiresAt; null when unknown/expired. */
const retentionCopy = (expiresAt: Date): string | null => {
  const ms = expiresAt.getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 60 * 1000) return null;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `Available for ${days} more ${days === 1 ? 'day' : 'days'}`;
  }
  if (hours >= 1) {
    return `Available for ${hours} more ${hours === 1 ? 'hour' : 'hours'}`;
  }
  const minutes = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `Available for ${minutes} more ${minutes === 1 ? 'minute' : 'minutes'}`;
};

/** Tools that never get the Repair suggestion: repair itself, and unlock, whose failure is the password. */
const NO_REPAIR_HINT = new Set(['repair-pdf', 'unlock-pdf']);

/** A generic processing failure on a PDF input may be a damaged file — Repair PDF is worth a try. */
const suggestsRepair = (tool: ToolDefinition, job: Job) =>
  job.error?.code === 'CONVERSION_FAILED' &&
  !NO_REPAIR_HINT.has(tool.id) &&
  tool.acceptedFileTypes.some((t) => t === '.pdf' || t === 'application/pdf');

export const ResultStage = ({ tool, job, onStartOver, onRetry, className }: ResultStageProps) => {
  // Failure → ErrorState with retry when retryable.
  if (job.state === 'failed') {
    return (
      <div className={cn('rounded-xl border bg-card', className)}>
        <ErrorState
          title="Processing failed"
          description={job.error?.message ?? 'The job failed to complete.'}
          onRetry={job.error?.isRetryable ? onRetry : undefined}
          retryLabel="Retry"
        />
        <div className="space-y-2 px-6 pb-6">
          {suggestsRepair(tool, job) && (
            <Button variant="outline" className="w-full" asChild>
              <Link to={getToolById('repair-pdf')?.route ?? '/repair-pdf'}>
                <Wrench aria-hidden />
                Try Repair PDF on this file
              </Link>
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={onStartOver}>
            <RotateCcw aria-hidden />
            Start over with new files
          </Button>
        </div>
      </div>
    );
  }

  const result = job.result;
  if (!result) return null;

  const handleDownload = () => {
    if (!result.downloadUrl) return;
    const a = document.createElement('a');
    a.href = result.downloadUrl;
    a.download = result.fileName || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const retention = retentionCopy(result.expiresAt);
  const notes = warningMessages(result.warnings);
  const savings = savingsPercent(result.originalSize, result.fileSize);
  const nextTools = getToolsByNavGroup(tool.navGroup)
    .filter((t) => t.id !== tool.id)
    .slice(0, 3);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Success card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle">
            <CheckCircle2 className="h-6 w-6 text-success" aria-hidden />
          </div>
          <div>
            <h3 className="text-h4 font-semibold">All done!</h3>
            <Text variant="body-sm" tone="muted">
              Your file is ready to download.
            </Text>
          </div>
        </div>

        <div className="rounded-lg border border-success/20 bg-success-subtle/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{result.fileName}</p>
              <Text variant="body-sm" tone="muted" as="span">
                {savings !== null && result.originalSize ? (
                  <>
                    {formatFileSize(result.originalSize)} → {formatFileSize(result.fileSize)} ·{' '}
                    <span className="font-medium text-success">{savings}% smaller</span>
                  </>
                ) : (
                  formatFileSize(result.fileSize)
                )}
                {retention && ` · ${retention}`}
              </Text>
            </div>
            <Button variant="gradient" size="lg" onClick={handleDownload} className="shrink-0">
              <Download aria-hidden />
              Download
            </Button>
          </div>
        </div>

        {notes.map((note) => (
          <div
            key={note}
            role="status"
            className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-subtle p-3 text-warning-subtle-foreground"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <Text variant="body-sm" as="span">
              {note}
            </Text>
          </div>
        ))}

        {isPdfName(result.fileName) && (
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to={readerHref({ kind: 'job', toolId: job.toolId, jobId: job.id })}>
              <BookOpen aria-hidden />
              Open in reader
            </Link>
          </Button>
        )}

        <Button variant="outline" className="mt-4 w-full" onClick={onStartOver}>
          <RotateCcw aria-hidden />
          Start over
        </Button>
      </div>

      {/* Try next */}
      {nextTools.length > 0 && (
        <div>
          <Text variant="overline" tone="muted" className="mb-3">
            Try next
          </Text>
          <div className="grid gap-3 sm:grid-cols-3">
            {nextTools.map((next) => (
              <Link
                key={next.id}
                to={next.route}
                className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <ToolIcon icon={next.icon} category={next.category} size="md" />
                <span className="flex-1 truncate text-body-sm font-medium">{toolNavName(next)}</span>
                <ArrowRight
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
