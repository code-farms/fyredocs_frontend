import { Suspense, ComponentType, RefObject, useMemo } from 'react';
import { lazyWithReload } from '@/lib/lazyWithReload';
import { UseFormReturn } from 'react-hook-form';
import { Trash2, Plus } from 'lucide-react';
import { FileUpload, ToolDefinition, ToolOptions } from '@/types';
import { Button } from '@/components/ui/button';
import { FileList } from '@/components/common/FileList';
import {
  PlanAwareFileDropzone,
  PlanLimitReason,
} from '@/components/common/PlanAwareFileDropzone';
import { FileDropzoneHandle } from '@/components/common/FileDropzone';
import { BatchModeToggle } from '@/components/common/BatchModeToggle';
import { Spinner } from '@/components/common/LoadingState';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { OPTIONS_PANELS, OptionsFormValues } from '../options';
import { BespokeConfigureProps } from '../bespoke/types';
import { PlanLimitBanner } from './PlanLimitBanner';

// Lazy bespoke bodies — keeps the canvas/annotation code out of the main chunk.
const SignPdfConfigure = lazyWithReload(() => import('../bespoke/SignPdfConfigure'));
const EditPdfConfigure = lazyWithReload(() => import('../bespoke/EditPdfConfigure'));

const BESPOKE_BODIES: Record<'sign-pdf' | 'edit-pdf', ComponentType<BespokeConfigureProps>> = {
  'sign-pdf': SignPdfConfigure,
  'edit-pdf': EditPdfConfigure,
};

interface ConfigureStageProps {
  tool: ToolDefinition;
  files: FileUpload[];
  form: UseFormReturn<OptionsFormValues>;
  pageCount: number | null;
  dropzoneRef: RefObject<FileDropzoneHandle>;
  onFilesSelected: (files: File[]) => void;
  onLimitExceeded: (reason: PlanLimitReason, message: string) => void;
  onRemoveFile: (fileId: string) => void;
  onRetryFile: (fileId: string) => void;
  onPauseFile: (fileId: string) => void;
  onResumeFile: (fileId: string) => void;
  onReorderFiles: (fromIndex: number, toIndex: number) => void;
  onClearFiles: () => void;
  batchMode: boolean;
  onBatchModeChange: (enabled: boolean) => void;
  canSubmit: boolean;
  onBespokeSubmit: (options: ToolOptions) => void;
}

/**
 * Stacked configure stage: file management on top (file cards + plan info in a
 * single row), options/bespoke body full-width below.
 */
export const ConfigureStage = ({
  tool,
  files,
  form,
  pageCount,
  dropzoneRef,
  onFilesSelected,
  onLimitExceeded,
  onRemoveFile,
  onRetryFile,
  onPauseFile,
  onResumeFile,
  onReorderFiles,
  onClearFiles,
  batchMode,
  onBatchModeChange,
  canSubmit,
  onBespokeSubmit,
}: ConfigureStageProps) => {
  const Panel = tool.optionsPanel ? OPTIONS_PANELS[tool.optionsPanel] : null;
  const Bespoke = tool.bespoke ? BESPOKE_BODIES[tool.bespoke] : null;
  const hasRightColumn = Boolean(Panel || Bespoke);

  const allowMoreFiles = tool.maxFiles > 1;
  const currentFiles = useMemo(() => files.map((f) => f.file), [files]);
  const orderMatters = tool.id === 'merge' || tool.id === 'scan-to-pdf';

  const fileList = (
    <FileList
      files={files}
      onRemove={onRemoveFile}
      onRetry={onRetryFile}
      onPause={onPauseFile}
      onResume={onResumeFile}
      onReorder={allowMoreFiles ? onReorderFiles : undefined}
      showReorder={allowMoreFiles && files.length > 1}
      showOrdinals={orderMatters}
    />
  );

  const filesColumn = (
    <div className="space-y-4">
      {allowMoreFiles ? (
        <PlanAwareFileDropzone
          ref={dropzoneRef}
          tool={tool}
          onFilesSelected={onFilesSelected}
          onLimitExceeded={onLimitExceeded}
          currentFiles={currentFiles}
          compact
        />
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ToolIcon icon={tool.icon} category={tool.category} size="md" />
          <span className="font-medium">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center gap-1">
          {allowMoreFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dropzoneRef.current?.openFileDialog()}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Add more
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFiles}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            {allowMoreFiles ? 'Clear all' : 'Choose different file'}
          </Button>
        </div>
      </div>

      <div className="grid items-stretch gap-4 sm:grid-cols-2">
        {fileList}
        <PlanLimitBanner tool={tool} files={files} className="h-full" />
      </div>

      {orderMatters && files.length > 1 && (
        <p className="text-center text-body-sm text-muted-foreground">
          Drag files to reorder. The output will follow this order.
        </p>
      )}

      {tool.supportsBatch && (
        <BatchModeToggle
          enabled={batchMode}
          onToggle={onBatchModeChange}
          fileCount={files.length}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {filesColumn}
      {hasRightColumn && (
        <div className="min-w-0">
          {Bespoke ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center rounded-xl border bg-card p-12">
                  <Spinner size="lg" />
                </div>
              }
            >
              <Bespoke tool={tool} files={files} canSubmit={canSubmit} onSubmit={onBespokeSubmit} />
            </Suspense>
          ) : Panel ? (
            <Panel tool={tool} form={form} files={files} pageCount={pageCount} />
          ) : null}
        </div>
      )}
    </div>
  );
};
