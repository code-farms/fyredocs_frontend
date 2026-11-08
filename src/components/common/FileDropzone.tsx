import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { FileType, AlertCircle } from 'lucide-react';
import { ToolCategory, ToolDefinition } from '@/types';
import { cn } from '@/lib/utils';
import { ToolIcon } from '@/components/icons/ToolIcon';

export interface FileDropzoneHandle {
  /** Programmatically open the native file picker (replaces the old document.querySelector hack). */
  openFileDialog: () => void;
}

interface FileDropzoneProps {
  tool: ToolDefinition;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Effective per-file limit in bytes (plan + tool); defaults to the tool cap, if any. */
  maxFileSize?: number;
  /** Override tool.maxFiles with a plan-based limit */
  maxFiles?: number;
}

/** Static lookup — dynamic `bg-tool-${category}-light` classes don't survive Tailwind JIT. */
const CATEGORY_LIGHT_BG: Record<ToolCategory, string> = {
  merge: 'bg-tool-merge-light',
  split: 'bg-tool-split-light',
  compress: 'bg-tool-compress-light',
  convert: 'bg-tool-convert-light',
  organize: 'bg-tool-organize-light',
  security: 'bg-tool-security-light',
  ocr: 'bg-tool-ocr-light',
  watermark: 'bg-tool-watermark-light',
  edit: 'bg-tool-edit-light',
};

export const FileDropzone = forwardRef<FileDropzoneHandle, FileDropzoneProps>(
  (
    {
      tool,
      onFilesSelected,
      disabled = false,
      className,
      compact = false,
      maxFileSize,
      maxFiles,
    },
    ref
  ) => {
    const effectiveMaxFileSize = maxFileSize ?? tool.maxFileSize;
    const effectiveMaxFiles = maxFiles ?? tool.maxFiles;
    const [isDragActive, setIsDragActive] = useState(false);
    const [isDragReject, setIsDragReject] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      openFileDialog: () => inputRef.current?.click(),
    }));

    const handleDragEnter = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;

        setIsDragActive(true);

        // Check if any dragged file is invalid
        const items = Array.from(e.dataTransfer.items);
        const hasInvalidType = items.some((item) => {
          if (item.kind !== 'file') return true;
          const type = item.type;
          return !tool.acceptedFileTypes.some(
            (accepted) =>
              accepted === type ||
              (accepted.startsWith('.') &&
                type.includes(accepted.replace('.', '')))
          );
        });

        setIsDragReject(hasInvalidType);
      },
      [disabled, tool.acceptedFileTypes]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only reset if we're leaving the dropzone entirely
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;

      setIsDragActive(false);
      setIsDragReject(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragActive(false);
        setIsDragReject(false);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          onFilesSelected(files);
        }
      },
      [disabled, onFilesSelected]
    );

    const handleFileInput = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
          onFilesSelected(files);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
      },
      [onFilesSelected]
    );

    const formatFileSize = (bytes: number) => {
      if (bytes >= 1024 * 1024) {
        return `${Math.round(bytes / (1024 * 1024))}MB`;
      }
      return `${Math.round(bytes / 1024)}KB`;
    };

    return (
      <div
        className={cn(
          'dropzone relative cursor-pointer transition-all duration-200',
          isDragActive && !isDragReject && 'dropzone-active',
          isDragReject && 'dropzone-error',
          !isDragActive && !isDragReject && 'dropzone-idle hover:border-primary/50 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed',
          compact ? 'p-6' : 'p-12',
          className
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={tool.acceptedFileTypes.join(',')}
          multiple={effectiveMaxFiles > 1}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              'rounded-2xl p-4 mb-4 transition-all duration-200',
              isDragReject
                ? 'bg-destructive-subtle'
                : isDragActive
                ? 'bg-primary/10 scale-110'
                : CATEGORY_LIGHT_BG[tool.category]
            )}
          >
            {isDragReject ? (
              <AlertCircle className="w-8 h-8 text-destructive" aria-hidden />
            ) : (
              <ToolIcon icon={tool.icon} category={tool.category} size="xl" />
            )}
          </div>

          {!compact && (
            <>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isDragReject
                  ? 'Invalid file type'
                  : isDragActive
                  ? 'Drop files here'
                  : 'Drop files here or click to browse'}
              </h3>

              <p className="text-muted-foreground mb-4 max-w-md">
                {isDragReject
                  ? `Only ${tool.acceptedFileTypes.join(', ')} files are accepted`
                  : tool.description}
              </p>
            </>
          )}

          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileType className="w-4 h-4" aria-hidden />
              {tool.acceptedFileTypes
                .filter((t) => t.startsWith('.'))
                .join(', ')
                .toUpperCase() || 'PDF'}
            </span>
            <span>•</span>
            <span>
              {tool.minFiles === effectiveMaxFiles
                ? `${effectiveMaxFiles} file${effectiveMaxFiles > 1 ? 's' : ''}`
                : `${tool.minFiles}-${effectiveMaxFiles} files`}
            </span>
            {effectiveMaxFileSize !== undefined && Number.isFinite(effectiveMaxFileSize) && (
              <>
                <span>•</span>
                <span>Max {formatFileSize(effectiveMaxFileSize)} per file</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FileDropzone.displayName = 'FileDropzone';
