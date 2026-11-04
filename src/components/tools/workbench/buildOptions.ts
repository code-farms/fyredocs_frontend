import { ToolDefinition, ToolOptions, ConvertOptions, PdfEncryption } from '@/types';
import { OptionsFormValues } from '../options/types';

/**
 * Build the options payload `createJob`/`startBatch` expects from the
 * workbench form values. Shapes mirror exactly what the legacy per-tool
 * components sent — `normalizeOptions()` in useJob remains the final
 * contract with the backend.
 */
export const buildOptions = (
  tool: ToolDefinition,
  values: OptionsFormValues,
  fileIds: string[]
): ToolOptions => {
  // Merge sends the upload order (MergeTool sent { order: uploadIds }).
  if (tool.id === 'merge') {
    return { order: fileIds };
  }

  // Convert tools: ConvertTool sent { format, quality: 'high' }.
  if (tool.optionsPanel === 'convert-info' && tool.outputFormat) {
    return {
      format: tool.outputFormat as ConvertOptions['format'],
      quality: 'high',
    } as ConvertOptions;
  }

  switch (tool.optionsPanel) {
    case 'split': {
      const mode = values.mode as 'all' | 'range' | 'extract' | 'equal';
      const range = typeof values.range === 'string' ? values.range.trim() : '';
      return {
        mode,
        range,
        ...(mode === 'extract' || mode === 'equal' ? { span: Number(values.span) } : {}),
      } as ToolOptions;
    }

    case 'watermark': {
      const type = values.type as 'text' | 'image';
      // Match the legacy WatermarkTool payload: inapplicable fields are
      // undefined so they are dropped by JSON.stringify (single + batch jobs).
      return {
        type,
        text: type === 'text' ? (values.text as string) : undefined,
        imageData: type === 'image' ? (values.imageData as string) : undefined,
        position: values.position as 'center' | 'diagonal' | 'tiled',
        opacity: Number(values.opacity),
        fontSize: type === 'text' ? Number(values.fontSize) : undefined,
        scale: type === 'image' ? Number(values.scale) : undefined,
        color: type === 'text' ? (values.color as string) : undefined,
      } as ToolOptions;
    }

    case 'ocr': {
      const dpi = typeof values.dpi === 'string' ? values.dpi : '';
      return {
        language: values.language as string,
        ...(dpi ? { dpi } : {}),
      } as ToolOptions;
    }

    case 'scan': {
      const ocr = Boolean(values.ocr);
      // ScanToPdfTool sent { ocr, language: ocr ? language : undefined }.
      return {
        ocr,
        language: ocr ? (values.language as string) : undefined,
      } as ToolOptions;
    }

    case 'rotate':
      return {
        rotation: Number(values.rotation),
        applyToPages: values.applyToPages as string,
      } as ToolOptions;

    case 'compress':
      return { quality: values.quality as string } as ToolOptions;

    case 'page-selection':
      return { pages: (values.pages as string).trim() } as ToolOptions;

    case 'reorder':
      return { order: (values.order as string).trim() } as ToolOptions;

    case 'password':
      return {
        password: values.password as string,
        confirmPassword: values.confirmPassword as string,
        ownerPassword: values.ownerPassword as string,
        permissions: {
          allowPrint: Boolean(values.allowPrint),
          allowCopy: Boolean(values.allowCopy),
          allowModify: Boolean(values.allowModify),
          allowAnnotate: Boolean(values.allowAnnotate),
          allowAssemble: Boolean(values.allowAssemble),
        },
        encryption: values.encryption as PdfEncryption,
      } as ToolOptions;

    case 'unlock':
      return { password: values.password as string } as ToolOptions;

    case 'page-numbers':
      return {
        position: values.position as string,
        startNumber: Number(values.startNumber),
        fontSize: Number(values.fontSize),
        format: values.format as string,
      } as ToolOptions;

    default:
      // Tools with no options panel (e.g. repair-pdf) send empty options.
      return {} as ToolOptions;
  }
};
