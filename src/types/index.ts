/**
 * Core type definitions for the PDF Tools platform.
 * These types establish strict boundaries between UI state, upload state, and job state.
 */

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export type ToolId =
  // Organize PDF tools
  | 'merge'
  | 'split'
  | 'reorder'
  | 'remove-pages'
  | 'extract-pages'
  | 'scan-to-pdf'
  // Optimize PDF tools
  | 'compress'
  | 'ocr'
  | 'repair-pdf'
  // Convert From PDF tools
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-image'
  | 'pdf-to-ppt'
  | 'pdf-to-html'
  | 'pdf-to-text'
  | 'pdf-to-pdfa'
  // Convert To PDF tools
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'image-to-pdf'
  | 'powerpoint-to-pdf'
  | 'html-to-pdf'
  // Convert to LibreOffice tools
  | 'pdf-to-odt'
  | 'pdf-to-ods'
  | 'pdf-to-odp'
  | 'word-to-odt'
  | 'excel-to-ods'
  | 'powerpoint-to-odp'
  // Convert LibreOffice to PDF tools
  | 'odt-to-pdf'
  | 'ods-to-pdf'
  | 'odp-to-pdf'
  // Edit PDF tools
  | 'add-page-numbers'
  | 'edit-pdf'
  | 'sign-pdf'
  // Security tools
  | 'unlock-pdf'
  // Legacy tools
  | 'rotate'
  | 'watermark'
  | 'password-protect';

export type ToolCategory = 'merge' | 'split' | 'compress' | 'convert' | 'organize' | 'security' | 'ocr' | 'watermark' | 'edit';

/** Navigation/discovery grouping — the user-facing taxonomy (one group per tool). */
export type ToolNavGroup =
  | 'organize'
  | 'optimize'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'libreoffice'
  | 'edit'
  | 'security';

/** Identifiers for composable option panels rendered inside the tool workbench. */
export type OptionsPanelId =
  | 'split'
  | 'compress'
  | 'ocr'
  | 'rotate'
  | 'watermark'
  | 'page-selection'
  | 'reorder'
  | 'password'
  | 'unlock'
  | 'page-numbers'
  | 'scan'
  | 'convert-info';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  acceptedFileTypes: string[];
  maxFiles: number;
  minFiles: number;
  maxFileSize: number; // in bytes
  route: string;
  /** User-facing nav/discovery group. */
  navGroup: ToolNavGroup;
  /** Display label in navigation where it differs from `name` (e.g. "JPG to PDF"). */
  navLabel?: string;
  /** Search synonyms for the command palette / tool search ("combine", "join"). */
  keywords?: string[];
  /** Output format for convert tools ('docx', 'xlsx', 'png', ...). */
  outputFormat?: string;
  /** Which composable options panel the workbench renders at the configure stage. */
  optionsPanel?: OptionsPanelId;
  /** Initial option values for the workbench form. */
  defaultOptions?: Record<string, unknown>;
  /** Tool supports per-file batch jobs (compress, ocr, rotate, watermark). */
  supportsBatch?: boolean;
  /** Workbench should load the PDF page count for page-aware options. */
  needsPageCount?: boolean;
  /** Tool has a custom configure-stage body instead of a generic options panel. */
  bespoke?: 'sign-pdf' | 'edit-pdf';
  /** Label for the primary action button, given the selected file count. */
  actionLabel?: (count: number) => string;
  /** Featured on the home page grid. */
  popular?: boolean;
}

// ============================================================================
// FILE & UPLOAD STATE MACHINE
// ============================================================================

/**
 * Upload state follows a strict state machine:
 * idle → uploading → (paused | completed | failed)
 * paused → uploading
 * failed → uploading (retry)
 */
export type UploadState = 'idle' | 'uploading' | 'paused' | 'completed' | 'failed';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * A single S3 multipart-upload part. Part numbers are 1-based (S3 convention).
 * `etag` is set once the part has been PUT to its presigned URL successfully.
 */
export interface PartInfo {
  /** 1-based part number (S3 convention). */
  partNumber: number;
  start: number;
  end: number;
  /** ETag returned by storage once this part uploaded successfully. */
  etag?: string;
  /** Presigned PUT URL for this part. */
  url?: string;
  /** Epoch ms when `url` was issued (used to detect stale URLs). */
  urlIssuedAt?: number;
}

export interface FileUpload {
  id: string;
  file: File;
  state: UploadState;
  progress: UploadProgress;
  parts: PartInfo[];
  error?: string;
  uploadedAt?: Date;
  serverFileId?: string; // Upload session id returned by the backend
}

// ============================================================================
// JOB STATE MACHINE
// ============================================================================

/**
 * Job state follows a strict state machine:
 * pending → queued → processing → (completed | failed)
 * 
 * pending: Job created but not yet submitted
 * queued: Job submitted, waiting in queue
 * processing: Backend is actively processing
 * completed: Job finished successfully
 * failed: Job failed (terminal or retryable)
 */
export type JobState = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';

export interface JobProgress {
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  estimatedTimeRemaining?: number; // in seconds
}

export interface JobResult {
  downloadUrl: string;
  fileName: string;
  /** Size of the downloadable output (falls back to the input total on older backends). */
  fileSize: number;
  /** Total input size; set only when the output size is known, for showing savings. */
  originalSize?: number;
  expiresAt: Date;
}

export interface Job {
  id: string;
  toolId: ToolId;
  state: JobState;
  progress: JobProgress;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  result?: JobResult;
  error?: JobError;
  fileIds: string[];
  options: ToolOptions;
}

export interface JobError {
  code: string;
  message: string;
  isRetryable: boolean;
  details?: Record<string, unknown>;
}

// ============================================================================
// TOOL-SPECIFIC OPTIONS
// ============================================================================

export interface MergeOptions {
  order: string[]; // File IDs in desired order
}

export interface SplitOptions {
  mode?: 'all' | 'range' | 'extract' | 'equal';
  range?: string; // e.g., "1-3,5,7-9"
  span?: number; // pages per chunk for "extract" mode
}

export interface CompressOptions {
  quality: 'low' | 'medium' | 'high' | 'extreme';
}

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageData?: string;
  position: 'center' | 'diagonal' | 'tiled';
  opacity: number;
  fontSize?: number;
  scale?: number;
  color?: string;
}

export interface PdfPermissions {
  allowPrint: boolean;
  allowCopy: boolean;
  allowModify: boolean;
  allowAnnotate: boolean;
  allowAssemble: boolean;
}

export type PdfEncryption = 'aes-256' | 'aes-128' | 'rc4-128';

export interface PasswordProtectOptions {
  /** Open password; may be empty when ownerPassword is set. */
  password: string;
  confirmPassword?: string;
  /** Permissions password; empty or equal to `password` means "same as open". */
  ownerPassword?: string;
  permissions?: PdfPermissions;
  encryption?: PdfEncryption;
}

export interface OcrOptions {
  language: string;
  dpi?: string; // e.g., "150", "300", "400", "600"
}

export interface RotateOptions {
  rotation: 90 | 180 | 270;
  applyToPages?: string;
}

export interface ReorderOptions {
  order: string; // Comma-separated page numbers, e.g., "3,1,2,5,4"
}

export interface ConvertOptions {
  format: 'docx' | 'xlsx' | 'png' | 'jpg' | 'pdf' | 'pptx' | 'html' | 'txt' | 'odt' | 'ods' | 'odp';
  quality?: 'low' | 'medium' | 'high';
}

export interface RemovePagesOptions {
  pages: string; // Comma-separated page numbers or ranges, e.g., "2,4,6-8"
}

export interface ExtractPagesOptions {
  pages: string; // Comma-separated page numbers or ranges, e.g., "1,3,5-7"
}

export interface ScanToPdfOptions {
  ocr?: boolean; // Apply OCR to make text searchable
  language?: string; // OCR language code
}

export interface UnlockPdfOptions {
  password: string;
}

export interface AddPageNumbersOptions {
  position: string;
  startNumber: number;
  fontSize: number;
  format: string;
}

export interface SignPdfOptions {
  page: number;
  position: string;
  signatureData: string;
}

export interface EditPdfOptions {
  annotations: Array<{
    type: 'text';
    content: string;
    page: number;
    position: string;
    fontSize: number;
  }>;
}

export type ToolOptions =
  | MergeOptions
  | SplitOptions
  | CompressOptions
  | WatermarkOptions
  | PasswordProtectOptions
  | OcrOptions
  | RotateOptions
  | ReorderOptions
  | ConvertOptions
  | RemovePagesOptions
  | ExtractPagesOptions
  | ScanToPdfOptions
  | UnlockPdfOptions
  | AddPageNumbersOptions
  | SignPdfOptions
  | EditPdfOptions
  | Record<string, never>; // Empty options for simple tools

// ============================================================================
// UI STATE
// ============================================================================

export interface DropzoneState {
  isDragActive: boolean;
  isDragReject: boolean;
}

export interface FileListState {
  selectedFileIds: string[];
  sortOrder: 'custom' | 'name' | 'size' | 'date';
}

export interface ToolPageState {
  currentStep: 'upload' | 'configure' | 'processing' | 'complete';
  files: FileUpload[];
  job: Job | null;
  dropzone: DropzoneState;
  fileList: FileListState;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// API ABSTRACTIONS
// ============================================================================

/**
 * These interfaces define the SHAPE of backend interactions
 * without specifying concrete endpoints or schemas.
 * The actual implementation will be injected via services.
 */

export interface UploadService {
  initUpload(file: File): Promise<{
    uploadId: string;
    key: string;
    partSize: number;
    totalParts: number;
    parts: { partNumber: number; url: string }[];
  }>;
  refreshPartUrls(
    uploadId: string,
    partNumbers: number[]
  ): Promise<{ parts: { partNumber: number; url: string }[] }>;
  putPart(url: string, blob: Blob): Promise<string>; // resolves the part ETag
  completeUpload(uploadId: string, parts: { partNumber: number; etag: string }[]): Promise<void>;
  abortUpload(uploadId: string): void;
}

export interface JobService {
  createJob(toolId: ToolId, fileIds: string[], options: ToolOptions): Promise<{ jobId: string }>;
  getJobStatus(jobId: string): Promise<Job>;
  cancelJob(jobId: string): Promise<void>;
  retryJob(jobId: string): Promise<{ jobId: string }>;
}

// ============================================================================
// NEW API RESPONSE TYPES
// ============================================================================

/**
 * Standard error response format from API
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Auth response format
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    country: string;
    image?: string;
    role: string;
  };
}

/**
 * Job creation response
 */
export interface JobCreateResponse {
  jobID: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

/**
 * Job status response
 */
export interface JobStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  toolType: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    originalFilename?: string;
    outputFilename?: string;
    fileSize?: number;
    progress?: number;
    [key: string]: unknown;
  };
}

/**
 * Jobs list response
 */
export interface JobsListResponse {
  jobs: JobStatusResponse[];
  total: number;
  limit: number;
  offset: number;
}
