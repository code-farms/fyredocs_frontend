import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { ToolWorkbench } from '../ToolWorkbench';
import { TOOLS } from '@/config/tools';
import { FileUpload, ToolId } from '@/types';

const createJobMock = vi.fn();

const makeUploadedFile = (name = 'document.pdf', serverFileId = 'srv-1'): FileUpload => ({
  id: `file-${serverFileId}`,
  file: new File(['%PDF-1.4'], name, { type: 'application/pdf' }),
  state: 'completed',
  progress: { loaded: 8, total: 8, percentage: 100 },
  parts: [],
  serverFileId,
});

let mockFiles: FileUpload[] = [];

vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: () => ({
    files: mockFiles,
    addFiles: vi.fn(() => ({ isValid: true, errors: [] })),
    removeFile: vi.fn(),
    clearFiles: vi.fn(),
    reorderFiles: vi.fn(),
    startUpload: vi.fn(),
    pauseUpload: vi.fn(),
    resumeUpload: vi.fn(),
    retryUpload: vi.fn(),
    cancelUpload: vi.fn(),
    updateProgress: vi.fn(),
    setUploadState: vi.fn(),
    setServerFileId: vi.fn(),
    isUploading: false,
    uploadedCount: mockFiles.length,
    totalCount: mockFiles.length,
    canProceed: mockFiles.length > 0,
  }),
}));

vi.mock('@/hooks/useJob', () => ({
  useJob: () => ({
    job: null,
    createJob: createJobMock,
    cancelJob: vi.fn(),
    retryJob: vi.fn(),
    resetJob: vi.fn(),
    isPolling: false,
  }),
  normalizeOptions: vi.fn(),
}));

vi.mock('@/hooks/useBatchJob', () => ({
  useBatchJob: () => ({
    batchJobs: [],
    startBatch: vi.fn(),
    cancelBatch: vi.fn(),
    retryFailed: vi.fn(),
    resetBatch: vi.fn(),
    isProcessing: false,
    completedCount: 0,
    failedCount: 0,
    totalCount: 0,
    overallProgress: 0,
  }),
}));

vi.mock('@/hooks/usePdfPageCount', () => ({
  usePdfPageCount: () => ({
    pageCount: null,
    isLoading: false,
    readPageCount: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePlans', () => ({
  usePlans: () => ({ data: [], isLoading: false }),
  usePlan: () => ({ plan: undefined, isLoading: false }),
}));

const renderWorkbench = (toolId: ToolId) =>
  render(<ToolWorkbench tool={TOOLS[toolId]} />);

beforeEach(() => {
  createJobMock.mockClear();
  mockFiles = [];
});

describe('ToolWorkbench — convert tools', () => {
  it('renders the upload stage for pdf-to-word with no files', () => {
    renderWorkbench('pdf-to-word');
    expect(screen.getByText(/Drop files here or click to browse/i)).toBeInTheDocument();
  });

  it('submits the legacy ConvertTool payload shape on the happy path', async () => {
    mockFiles = [makeUploadedFile()];
    const user = userEvent.setup();
    renderWorkbench('pdf-to-word');

    // Configure stage shows the convert info strip.
    expect(screen.getByText(/\.DOCX/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Process file/i }));

    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledWith('pdf-to-word', ['srv-1'], {
        format: 'docx',
        quality: 'high',
      });
    });
  });

  it('renders other convert tools through the same workbench', () => {
    mockFiles = [makeUploadedFile()];
    renderWorkbench('pdf-to-ppt');
    expect(screen.getByText(/\.PPTX/i)).toBeInTheDocument();
  });
});

describe('ToolWorkbench — page selection validation', () => {
  it('blocks submit and shows a validation error when pages are empty', async () => {
    mockFiles = [makeUploadedFile()];
    const user = userEvent.setup();
    renderWorkbench('remove-pages');

    await user.click(screen.getByRole('button', { name: /Remove Pages/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please enter page numbers/i)).toBeInTheDocument();
    });
    expect(createJobMock).not.toHaveBeenCalled();
  });

  it('submits { pages } once the field is filled', async () => {
    mockFiles = [makeUploadedFile()];
    const user = userEvent.setup();
    renderWorkbench('extract-pages');

    await user.type(screen.getByPlaceholderText('e.g., 2,4,6-8'), '1,3-5');
    await user.click(screen.getByRole('button', { name: /Extract Pages/i }));

    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledWith('extract-pages', ['srv-1'], { pages: '1,3-5' });
    });
  });
});

describe('ToolWorkbench — scan to pdf options', () => {
  it('renders scan settings and submits OCR-off defaults', async () => {
    mockFiles = [makeUploadedFile('scan.png', 'srv-img')];
    const user = userEvent.setup();
    renderWorkbench('scan-to-pdf');

    expect(screen.getByText(/Scan Settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enable OCR/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Convert to PDF/i }));

    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledWith('scan-to-pdf', ['srv-img'], {
        ocr: false,
        language: undefined,
      });
    });
  });

  it('includes the language when OCR is enabled', async () => {
    mockFiles = [makeUploadedFile('scan.png', 'srv-img')];
    const user = userEvent.setup();
    renderWorkbench('scan-to-pdf');

    await user.click(screen.getByLabelText(/Enable OCR/i));
    await user.click(screen.getByRole('button', { name: /Convert to PDF/i }));

    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledWith('scan-to-pdf', ['srv-img'], {
        ocr: true,
        language: 'eng',
      });
    });
  });
});
