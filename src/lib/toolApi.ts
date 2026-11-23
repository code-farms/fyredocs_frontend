import { ToolId } from '@/types';

type ToolApiConfig = {
  basePath: string;
  tool: string;
};

const TOOL_API_CONFIG: Record<ToolId, ToolApiConfig> = {
  // Organize PDF tools (fast pdfcpu-based manipulation)
  merge: { basePath: '/api/organize-pdf', tool: 'merge-pdf' },
  split: { basePath: '/api/organize-pdf', tool: 'split-pdf' },
  reorder: { basePath: '/api/organize-pdf', tool: 'organize-pdf' },
  'remove-pages': { basePath: '/api/organize-pdf', tool: 'remove-pages' },
  'extract-pages': { basePath: '/api/organize-pdf', tool: 'extract-pages' },
  'scan-to-pdf': { basePath: '/api/organize-pdf', tool: 'scan-to-pdf' },
  rotate: { basePath: '/api/organize-pdf', tool: 'rotate-pdf' },
  watermark: { basePath: '/api/organize-pdf', tool: 'watermark-pdf' },
  'password-protect': { basePath: '/api/organize-pdf', tool: 'protect-pdf' },
  'unlock-pdf': { basePath: '/api/organize-pdf', tool: 'unlock-pdf' },
  'sign-pdf': { basePath: '/api/organize-pdf', tool: 'sign-pdf' },
  'edit-pdf': { basePath: '/api/organize-pdf', tool: 'edit-pdf' },
  'add-page-numbers': { basePath: '/api/organize-pdf', tool: 'add-page-numbers' },

  // Optimize PDF tools (heavy Ghostscript/Tesseract processing)
  compress: { basePath: '/api/optimize-pdf', tool: 'compress-pdf' },
  ocr: { basePath: '/api/optimize-pdf', tool: 'ocr-pdf' },
  'repair-pdf': { basePath: '/api/optimize-pdf', tool: 'repair-pdf' },

  // Convert From PDF tools (PDF → other formats)
  'pdf-to-word': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-word' },
  'pdf-to-excel': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-excel' },
  'pdf-to-image': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-image' },
  // Same backend tool as pdf-to-image; normalizeOptions sends { format: 'jpg' }.
  'pdf-to-jpg': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-image' },
  'pdf-to-ppt': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-ppt' },
  'pdf-to-html': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-html' },
  'pdf-to-text': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-text' },
  'pdf-to-pdfa': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-pdfa' },

  // Convert to LibreOffice tools (PDF → ODF)
  'pdf-to-odt': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-odt' },
  'pdf-to-ods': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-ods' },
  'pdf-to-odp': { basePath: '/api/convert-from-pdf', tool: 'pdf-to-odp' },

  // Convert to LibreOffice tools (Office → ODF)
  'word-to-odt': { basePath: '/api/convert-to-pdf', tool: 'word-to-odt' },
  'excel-to-ods': { basePath: '/api/convert-to-pdf', tool: 'excel-to-ods' },
  'powerpoint-to-odp': { basePath: '/api/convert-to-pdf', tool: 'powerpoint-to-odp' },

  // Convert LibreOffice to PDF tools (ODF → PDF)
  'odt-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'odt-to-pdf' },
  'ods-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'ods-to-pdf' },
  'odp-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'odp-to-pdf' },

  // Convert To PDF tools (office/image → PDF, LibreOffice-heavy)
  'word-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'word-to-pdf' },
  'excel-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'excel-to-pdf' },
  'image-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'image-to-pdf' },
  'powerpoint-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'powerpoint-to-pdf' },
  'html-to-pdf': { basePath: '/api/convert-to-pdf', tool: 'html-to-pdf' },
};

export const getToolApiConfig = (toolId: ToolId) => TOOL_API_CONFIG[toolId];

/**
 * Reverse lookup: backend tool name ('merge-pdf') → frontend ToolId ('merge').
 * When two ToolIds share a backend tool (pdf-to-image / pdf-to-jpg), the
 * first one listed wins, so job history keeps showing the original tool.
 */
const API_NAME_TO_TOOL_ID: Record<string, ToolId> = {};
for (const [id, cfg] of Object.entries(TOOL_API_CONFIG) as [ToolId, ToolApiConfig][]) {
  API_NAME_TO_TOOL_ID[cfg.tool] ??= id;
}

export const getToolIdByApiName = (apiTool: string): ToolId | undefined =>
  API_NAME_TO_TOOL_ID[apiTool];

export const buildJobPath = (toolId: ToolId, jobId?: string) => {
  const { basePath, tool } = getToolApiConfig(toolId);
  return jobId ? `${basePath}/${tool}/${jobId}` : `${basePath}/${tool}`;
};

export const buildDownloadPath = (toolId: ToolId, jobId: string) =>
  `${buildJobPath(toolId, jobId)}/download`;
