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

const uploadArgs: { deferUpload?: boolean }[] = [];
vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: (args: { deferUpload?: boolean }) => (uploadArgs.push(args), {
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

const mockRun = vi.fn();
vi.mock('@/lib/localTools', async (orig) => ({
  ...(await orig<typeof import('@/lib/localTools')>()),
  runLocalTool: (...a: unknown[]) => mockRun(...a),
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

const renderWorkbench = (toolId: ToolId) => render(<ToolWorkbench tool={TOOLS[toolId]} />);
const lastDefer = () => uploadArgs[uploadArgs.length - 1]?.deferUpload;

beforeEach(() => {
  createJobMock.mockClear();
  mockRun.mockReset();
  uploadArgs.length = 0;
  mockFiles = [];
});

describe('ToolWorkbench — process in browser', () => {
  it('offers the toggle on page tools only, off by default', () => {
    const { unmount } = renderWorkbench('rotate');
    expect(screen.getByRole('switch', { name: /Process in browser/ })).toHaveAttribute('aria-checked', 'false');
    expect(lastDefer()).toBe(false);
    unmount();
    renderWorkbench('compress');
    expect(screen.queryByRole('switch', { name: /Process in browser/ })).toBeNull();
  });

  it('defers uploads while on', async () => {
    renderWorkbench('rotate');
    await userEvent.click(screen.getByRole('switch', { name: /Process in browser/ }));
    expect(lastDefer()).toBe(true);
  });

  it('runs the tool locally instead of creating a job', async () => {
    mockFiles = [makeUploadedFile('scan.pdf', 'local-1')];
    mockRun.mockResolvedValue({ bytes: new Uint8Array([37, 80, 68, 70]), fileName: 'scan-rotated.pdf' });
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:out'), revokeObjectURL: vi.fn() });
    const user = userEvent.setup();
    renderWorkbench('rotate');
    await user.click(screen.getByRole('switch', { name: /Process in browser/ }));
    await user.click(screen.getByRole('button', { name: /Rotate/ }));
    expect(await screen.findByText(/Processed in your browser/)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Download/ })).toHaveAttribute('download', 'scan-rotated.pdf');
    expect(mockRun).toHaveBeenCalledWith('rotate', [mockFiles[0].file], expect.objectContaining({ rotation: 90 }));
    expect(createJobMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('falls back to the server on failure', async () => {
    mockFiles = [makeUploadedFile('scan.pdf', 'local-1')];
    const { LocalToolError } = await import('@/lib/localTools');
    mockRun.mockRejectedValue(new LocalToolError('scan.pdf is password-protected — unlock it first.'));
    const user = userEvent.setup();
    renderWorkbench('rotate');
    await user.click(screen.getByRole('switch', { name: /Process in browser/ }));
    await user.click(screen.getByRole('button', { name: /Rotate/ }));
    expect(await screen.findByText(/password-protected/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Process on the server instead/ }));
    expect(lastDefer()).toBe(false);
    // AnimatedSwitch fades the views, so wait for the configure view to return.
    expect(await screen.findByRole('switch', { name: /Process in browser/ })).toHaveAttribute('aria-checked', 'false');
  });
});
