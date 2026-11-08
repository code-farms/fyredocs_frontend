import { useCallback, useMemo, useRef, useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UploadCloud } from 'lucide-react';
import { ToolDefinition, ToolOptions } from '@/types';
import { useFileUpload } from '@/hooks/useFileUpload';
import { LOCAL_TOOLS, LocalToolError, localBlocker, runLocalTool, type LocalResult } from '@/lib/localTools';
import { LocalModeToggle } from './LocalModeToggle';
import { LocalResultCard } from './LocalResultCard';
import { useJob } from '@/hooks/useJob';
import { useBatchJob } from '@/hooks/useBatchJob';
import { usePdfPageCount } from '@/hooks/usePdfPageCount';
import { toast } from '@/lib/toast';
import { BatchProgress } from '@/components/common/BatchProgress';
import { FileDropzoneHandle } from '@/components/common/FileDropzone';
import { PlanLimitReason } from '@/components/common/PlanAwareFileDropzone';
import { useUploadLimits } from '@/hooks/useUploadLimits';
import { checkSelection } from '@/lib/uploadLimits';
import { AnimatedSwitch } from '@/components/ui/animated';
import { PANEL_SCHEMAS, PANEL_DEFAULTS, OptionsFormValues } from '../options';
import { ToolStepper, WorkbenchStage } from './ToolStepper';
import { UploadStage } from './UploadStage';
import { ConfigureStage } from './ConfigureStage';
import { ProcessingStage } from './ProcessingStage';
import { ResultStage } from './ResultStage';
import { StickyActionBar } from './StickyActionBar';
import { UpgradeDialog } from './UpgradeDialog';
import { useGlobalDropTarget } from './useGlobalDropTarget';
import { buildOptions } from './buildOptions';

interface ToolWorkbenchProps {
  tool: ToolDefinition;
}

/**
 * Generic tool workbench: Upload → Configure → Process → Download for every
 * tool in the registry. Composes the existing upload/job hooks unchanged;
 * options panels and bespoke bodies plug in via src/config/tools.ts.
 */
/**
 * The shared shell every tool page renders inside: file selection, options,
 * submission, progress, and result.
 *
 * Stage is DERIVED from upload and job state rather than held in a state machine.
 * That is a deliberate choice — with a separate stage variable, every async
 * transition would need to keep two sources of truth in step, and the failure mode
 * is a UI stuck in a stage its data no longer supports. Deriving it means the
 * stage cannot disagree with reality.
 *
 * Retry drops all the way back to file selection rather than resubmitting. Upload
 * sessions are single-use server-side, so the previously uploaded object has
 * already been consumed and a resubmit would fail on a session that no longer
 * exists.
 */
export const ToolWorkbench = ({ tool }: ToolWorkbenchProps) => {
  const [batchMode, setBatchMode] = useState(false);
  // "Process in browser" (lib/localTools.ts) — opt-in, page tools only.
  const localEligible = LOCAL_TOOLS.has(tool.id) && !tool.bespoke;
  const [localMode, setLocalMode] = useState(false);
  const [localOutcome, setLocalOutcome] = useState<{ result?: LocalResult; error?: string } | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const [upgradeDialog, setUpgradeDialog] = useState<{
    open: boolean;
    reason?: PlanLimitReason;
    message?: string;
  }>({
    open: false,
  });
  const limits = useUploadLimits();
  const dropzoneRef = useRef<FileDropzoneHandle>(null);

  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    reorderFiles,
    isUploading,
    canProceed,
    pauseUpload,
    resumeUpload,
    retryUpload: retryFileUpload,
  } = useFileUpload({
    tool,
    deferUpload: localMode,
    limits,
    onValidationError: (errors) => {
      errors.forEach((error) => toast.error(error));
    },
  });

  const { job, createJob, cancelJob, resetJob } = useJob({
    onComplete: () => {
      // The document library is populated server-side: document-service consumes
      // the job-completion event and finalizes a document for signed-in users.
      toast.success(`${tool.name} completed successfully!`);
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const {
    batchJobs,
    startBatch,
    cancelBatch,
    resetBatch,
    isProcessing: isBatchProcessing,
    completedCount,
    failedCount,
    totalCount,
    overallProgress,
  } = useBatchJob({
    onAllComplete: (jobs) => {
      const successful = jobs.filter((j) => j.status === 'completed').length;
      const failed = jobs.filter((j) => j.status === 'failed').length;
      if (failed === 0) {
        toast.success(`All ${successful} files processed successfully!`);
      } else {
        toast.warning(`${successful} files processed, ${failed} failed`);
      }
    },
  });

  const { pageCount, readPageCount, reset: resetPageCount } = usePdfPageCount();

  // Options form — panel schema + registry defaults.
  const panelId = tool.optionsPanel;
  const schema = useMemo(() => (panelId ? PANEL_SCHEMAS[panelId] : z.object({})), [panelId]);
  const defaultValues = useMemo<OptionsFormValues>(
    () => ({
      ...(panelId ? PANEL_DEFAULTS[panelId] : {}),
      ...(tool.defaultOptions ?? {}),
    }),
    [panelId, tool.defaultOptions]
  );

  const form = useForm<OptionsFormValues>({
    resolver: zodResolver(schema) as Resolver<OptionsFormValues>,
    defaultValues,
    mode: 'onChange',
  });

  // Derived stage — no extra state machine.
  const showBatch = batchMode && batchJobs.length > 0;
  const stage: WorkbenchStage = job
    ? job.state === 'completed'
      ? 'done'
      : job.state === 'failed'
      ? 'error'
      : 'processing'
    : showBatch
    ? 'processing'
    : files.length === 0
    ? 'upload'
    : 'configure';

  const handleFilesSelected = useCallback(
    (selectedFiles: File[]) => {
      const result = addFiles(selectedFiles);
      if (result.isValid && tool.needsPageCount && selectedFiles.length > 0) {
        void readPageCount(selectedFiles[0]);
      }
    },
    [addFiles, readPageCount, tool.needsPageCount]
  );

  const handleLimitExceeded = useCallback((reason: PlanLimitReason, message: string) => {
    setUpgradeDialog({ open: true, reason, message });
  }, []);

  // The page-wide drop bypasses PlanAwareFileDropzone, so it runs the same
  // limit check itself before anything reaches addFiles / the uploader.
  const handleGlobalDrop = useCallback(
    (droppedFiles: File[]) => {
      const check = checkSelection({
        files: droppedFiles,
        existingFiles: files.map((f) => f.file),
        limits,
        tool,
      });
      if (check.ok === false) {
        handleLimitExceeded(check.reason, check.message);
        return;
      }
      handleFilesSelected(droppedFiles);
    },
    [files, handleFilesSelected, handleLimitExceeded, limits, tool]
  );

  // Page-level drag-anywhere during upload/configure.
  const { isDraggingOver } = useGlobalDropTarget(
    stage === 'upload' || stage === 'configure',
    handleGlobalDrop
  );

  const collectUploadedFiles = useCallback(() => {
    const uploaded = files
      .filter((f) => f.state === 'completed' && f.serverFileId)
      .map((f) => ({ id: f.id, name: f.file.name, serverFileId: f.serverFileId! }));

    if (files.length === 0) {
      toast.error('Please add files first');
      return null;
    }
    if (files.length < tool.minFiles) {
      toast.error(`Please add at least ${tool.minFiles} file${tool.minFiles > 1 ? 's' : ''}`);
      return null;
    }
    if (isUploading || uploaded.length !== files.length) {
      toast.error('Please wait for all uploads to finish');
      return null;
    }
    return uploaded;
  }, [files, isUploading, tool.minFiles]);

  /** Browser run: same options as the server path, a Blob instead of a job. */
  const runLocally = useCallback(async () => {
    const inputs = files.map((f) => f.file);
    const blocker = localBlocker(tool.id, inputs);
    if (blocker) {
      toast.error(blocker);
      return;
    }
    setLocalBusy(true);
    try {
      const options = buildOptions(tool, form.getValues(), files.map((f) => f.id));
      setLocalOutcome({ result: await runLocalTool(tool.id, inputs, options) });
    } catch (err) {
      setLocalOutcome({
        error: err instanceof LocalToolError ? err.message : "The browser couldn't process this file — try the server instead.",
      });
    } finally {
      setLocalBusy(false);
    }
  }, [files, form, tool]);

  /** Generic submit: validate form → guard uploads → build options → createJob/startBatch. */
  const handleSubmit = useCallback(async () => {
    if (panelId) {
      const valid = await form.trigger();
      if (!valid) return;
    }

    if (localEligible && localMode) {
      await runLocally();
      return;
    }

    const uploaded = collectUploadedFiles();
    if (!uploaded) return;

    const fileIds = uploaded.map((f) => f.serverFileId);
    const options = buildOptions(tool, form.getValues(), fileIds);

    if (tool.supportsBatch && batchMode && uploaded.length > 1) {
      startBatch(tool.id, uploaded, options);
    } else {
      createJob(tool.id, fileIds, options);
    }
  }, [batchMode, collectUploadedFiles, createJob, form, localEligible, localMode, panelId, runLocally, startBatch, tool]);

  /** Bespoke bodies build their own options and delegate the job creation here. */
  const handleBespokeSubmit = useCallback(
    (options: ToolOptions) => {
      const uploaded = collectUploadedFiles();
      if (!uploaded) return;
      createJob(tool.id, uploaded.map((f) => f.serverFileId), options);
    },
    [collectUploadedFiles, createJob, tool.id]
  );

  const handleStartOver = useCallback(() => {
    setLocalOutcome(null);
    resetJob();
    resetBatch();
    clearFiles();
    resetPageCount();
    setBatchMode(false);
    form.reset(defaultValues);
  }, [clearFiles, defaultValues, form, resetBatch, resetJob, resetPageCount]);

  // Uploads are single-use server-side, so a failed job cannot be re-run with the
  // same upload IDs. Clearing the files drops the stage back to the file upload UI
  // (dropzone) so the user re-selects and re-runs. Selected options and batch mode
  // are preserved (unlike "Start over"). Used for both single and batch retries.
  const handleRetry = useCallback(() => {
    resetJob();
    resetBatch();
    clearFiles();
    resetPageCount();
  }, [resetJob, resetBatch, clearFiles, resetPageCount]);

  const handleDownloadAll = useCallback(() => {
    batchJobs
      .filter((bj) => bj.status === 'completed' && bj.job?.result?.downloadUrl)
      .forEach((bj) => {
        window.open(bj.job?.result?.downloadUrl, '_blank');
      });
  }, [batchJobs]);

  const actionLabel =
    tool.actionLabel?.(files.length) ??
    (files.length > 1 ? `Process ${files.length} files` : `Process file`);

  const hasConfigure = Boolean(tool.optionsPanel || tool.bespoke);
  const viewKey = localOutcome ? 'local' : showBatch ? 'batch' : job ? 'job' : stage === 'upload' ? 'upload' : 'configure';
  const localToggle = localEligible && (
    <LocalModeToggle
      checked={localMode}
      disabled={localBusy}
      onChange={(on) => {
        setLocalMode(on);
        if (on) setBatchMode(false);
      }}
    />
  );

  return (
    <div className="relative">
      <ToolStepper stage={stage} hasConfigure={hasConfigure} />

      <AnimatedSwitch switchKey={viewKey}>
        {localOutcome ? (
          <LocalResultCard
            result={localOutcome.result}
            error={localOutcome.error}
            onStartOver={handleStartOver}
            onUseServer={() => {
              // Files are still here; switching off starts their uploads.
              setLocalMode(false);
              setLocalOutcome(null);
            }}
          />
        ) : showBatch ? (
          <BatchProgress
            batchJobs={batchJobs}
            isProcessing={isBatchProcessing}
            completedCount={completedCount}
            failedCount={failedCount}
            totalCount={totalCount}
            overallProgress={overallProgress}
            onCancel={cancelBatch}
            onRetryFailed={handleRetry}
            onDownloadAll={handleDownloadAll}
            onReset={handleStartOver}
          />
        ) : job ? (
          stage === 'processing' ? (
            <ProcessingStage job={job} onCancel={cancelJob} />
          ) : (
            <ResultStage tool={tool} job={job} onStartOver={handleStartOver} onRetry={handleRetry} />
          )
        ) : stage === 'upload' ? (
          <div className="space-y-4">
          {localToggle}
          <UploadStage
            ref={dropzoneRef}
            tool={tool}
            onFilesSelected={handleFilesSelected}
            onLimitExceeded={handleLimitExceeded}
            disabled={isUploading}
          />
          </div>
        ) : (
          <div className="space-y-6 pb-24 sm:pb-0">
            {localToggle}
            <ConfigureStage
              tool={tool}
              files={files}
              form={form}
              pageCount={pageCount}
              dropzoneRef={dropzoneRef}
              onFilesSelected={handleFilesSelected}
              onLimitExceeded={handleLimitExceeded}
              onRemoveFile={removeFile}
              onRetryFile={retryFileUpload}
              onPauseFile={pauseUpload}
              onResumeFile={resumeUpload}
              onReorderFiles={reorderFiles}
              onClearFiles={handleStartOver}
              batchMode={batchMode && !localMode}
              onBatchModeChange={setBatchMode}
              canSubmit={canProceed}
              onBespokeSubmit={handleBespokeSubmit}
            />

            {/* Bespoke bodies render their own primary CTA. */}
            {!tool.bespoke && (
              <StickyActionBar
                primaryLabel={localBusy ? 'Processing in browser…' : actionLabel}
                onPrimary={() => void handleSubmit()}
                primaryDisabled={!canProceed || localBusy}
                hint={localMode ? 'Processed in your browser — nothing is uploaded' : isUploading ? 'Uploading…' : undefined}
              />
            )}
          </div>
        )}
      </AnimatedSwitch>

      {/* Drag-anywhere overlay */}
      {isDraggingOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card px-12 py-10 shadow-lg">
            <UploadCloud className="h-10 w-10 text-primary" aria-hidden />
            <p className="text-h4 font-semibold">Drop files to add</p>
          </div>
        </div>
      )}

      <UpgradeDialog
        open={upgradeDialog.open}
        onOpenChange={(open) => setUpgradeDialog((prev) => ({ ...prev, open }))}
        reason={upgradeDialog.reason}
        message={upgradeDialog.message}
      />
    </div>
  );
};
