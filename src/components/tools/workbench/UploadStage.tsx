import { forwardRef } from 'react';
import { ToolDefinition } from '@/types';
import {
  PlanAwareFileDropzone,
  PlanLimitReason,
} from '@/components/common/PlanAwareFileDropzone';
import { FileDropzoneHandle } from '@/components/common/FileDropzone';

interface UploadStageProps {
  tool: ToolDefinition;
  onFilesSelected: (files: File[]) => void;
  onLimitExceeded: (reason: PlanLimitReason, message: string) => void;
  disabled?: boolean;
}

/** First stage: a full-width, plan-aware dropzone. */
export const UploadStage = forwardRef<FileDropzoneHandle, UploadStageProps>(
  ({ tool, onFilesSelected, onLimitExceeded, disabled }, ref) => (
    <PlanAwareFileDropzone
      ref={ref}
      tool={tool}
      onFilesSelected={onFilesSelected}
      onLimitExceeded={onLimitExceeded}
      disabled={disabled}
      className="w-full"
    />
  )
);

UploadStage.displayName = 'UploadStage';
