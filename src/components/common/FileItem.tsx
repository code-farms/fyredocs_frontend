import { ReactNode } from 'react';
import { FileUpload } from '@/types';
import {
  File,
  X,
  Pause,
  Play,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { waitingLabel } from '@/lib/queueLabel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileItemProps {
  file: FileUpload;
  index: number;
  onRemove: () => void;
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showReorder?: boolean;
  /** Slot for a dnd-kit drag handle (rendered before the reorder buttons). */
  dragHandle?: ReactNode;
  /** Show a 1-based position badge (e.g. merge order). */
  showOrdinal?: boolean;
  /** Set on an idle file queued behind another upload: the name of the file ahead. */
  waitingAfter?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
};

const stateIcons = {
  idle: <Clock className="w-4 h-4 text-muted-foreground" aria-hidden />,
  uploading: <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden />,
  paused: <Pause className="w-4 h-4 text-muted-foreground" aria-hidden />,
  completed: <CheckCircle2 className="w-4 h-4 text-success" aria-hidden />,
  failed: <AlertCircle className="w-4 h-4 text-destructive" aria-hidden />,
};

export const FileItem = ({
  file,
  index,
  onRemove,
  onRetry,
  onPause,
  onResume,
  onMoveUp,
  onMoveDown,
  showReorder = false,
  dragHandle,
  showOrdinal = false,
  waitingAfter,
}: FileItemProps) => {
  const { state, progress, error } = file;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors',
        state === 'failed' && 'border-destructive/50 bg-destructive-subtle/50',
        state === 'completed' && 'border-success/30 bg-success-subtle/50',
        state === 'uploading' && 'border-primary/30'
      )}
    >
      {/* Drag handle (dnd-kit) */}
      {dragHandle}

      {/* Reorder buttons (keyboard/mouse fallback) */}
      {showReorder && (
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label="Move file up"
          >
            <ChevronUp className="h-3 w-3" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label="Move file down"
          >
            <ChevronDown className="h-3 w-3" aria-hidden />
          </Button>
        </div>
      )}

      {/* Ordinal badge / file icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
        {showOrdinal ? (
          <span className="text-body-sm font-semibold text-muted-foreground">{index + 1}</span>
        ) : (
          <File className="w-5 h-5 text-muted-foreground" aria-hidden />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{file.file.name}</span>
          {stateIcons[state]}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.file.size)}
          </span>

          {state === 'uploading' && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-primary font-medium">
                Uploading · {progress.percentage}%
              </span>
            </>
          )}

          {state === 'idle' && waitingAfter !== undefined && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium">{waitingLabel(waitingAfter)}</span>
            </>
          )}

          {state === 'paused' && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium">Paused</span>
            </>
          )}

          {state === 'failed' && error && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-destructive">{error}</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {state === 'uploading' && (
          <Progress value={progress.percentage} className="h-1 mt-2" />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {state === 'uploading' && onPause && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPause} aria-label="Pause upload">
            <Pause className="h-4 w-4" aria-hidden />
          </Button>
        )}

        {state === 'paused' && onResume && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onResume} aria-label="Resume upload">
            <Play className="h-4 w-4" aria-hidden />
          </Button>
        )}

        {state === 'failed' && onRetry && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRetry} aria-label="Retry upload">
            <RotateCcw className="h-4 w-4" aria-hidden />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
};
