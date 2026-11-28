import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BatchProgress } from '../BatchProgress';
import { FileItem } from '../FileItem';
import type { BatchJob } from '@/hooks/useBatchJob';
import type { FileUpload } from '@/types';

const noop = vi.fn();

describe('waiting status', () => {
  it('batch: a queued part says which part it waits for', () => {
    const jobs: BatchJob[] = [
      { id: 'b1', fileName: 'scan (part 1 of 2).pdf', fileId: 'u1', job: null, status: 'processing' },
      { id: 'b2', fileName: 'scan (part 2 of 2).pdf', fileId: 'u2', job: null, status: 'pending' },
    ];
    render(
      <BatchProgress
        batchJobs={jobs}
        isProcessing
        completedCount={0}
        failedCount={0}
        totalCount={2}
        overallProgress={30}
        onCancel={noop}
        onRetryFailed={noop}
        onDownloadAll={noop}
        onReset={noop}
      />
    );
    expect(screen.getByText('Waiting — starts after part 1')).toBeInTheDocument();
    expect(screen.getByText('Processing 1 of 2…')).toBeInTheDocument();
  });

  it('batch: a part held by the server says so', () => {
    const jobs: BatchJob[] = [
      { id: 'b1', fileName: 'a.pdf', fileId: 'u1', job: null, status: 'pending', waitingOnServer: true },
    ];
    render(
      <BatchProgress
        batchJobs={jobs}
        isProcessing
        completedCount={0}
        failedCount={0}
        totalCount={1}
        overallProgress={0}
        onCancel={noop}
        onRetryFailed={noop}
        onDownloadAll={noop}
        onReset={noop}
      />
    );
    expect(screen.getByText('Waiting for your other file to finish…')).toBeInTheDocument();
  });

  it('batch: a failed row has its own retry, and a row note is shown', () => {
    const onRetryRow = vi.fn();
    const jobs: BatchJob[] = [
      { id: 'b1', fileName: 'scan (part 1 of 3).pdf', fileId: 'u1', job: null, status: 'completed' },
      { id: 'b2', fileName: 'scan (part 2 of 3).pdf', fileId: 'u2', job: null, status: 'failed', error: 'Job failed' },
      { id: 'b3', fileName: 'scan (part 3 of 3).pdf', fileId: 'u3', job: null, status: 'completed' },
    ];
    const props = {
      isProcessing: false,
      completedCount: 2,
      failedCount: 1,
      totalCount: 3,
      overallProgress: 100,
      onCancel: noop,
      onRetryFailed: noop,
      onDownloadAll: noop,
      onReset: noop,
      onRetryRow,
    };
    const { rerender } = render(<BatchProgress batchJobs={jobs} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry scan (part 2 of 3).pdf' }));
    expect(onRetryRow).toHaveBeenCalledWith('b2');

    jobs[1] = { ...jobs[1], status: 'pending', error: undefined, note: 'Uploading again…' };
    rerender(<BatchProgress batchJobs={[...jobs]} {...props} isProcessing />);
    expect(screen.getByText('Uploading again…')).toBeInTheDocument();
  });

  it('upload list: an idle file queued behind another shows the waiting text', () => {
    const file = {
      id: 'f2',
      file: new File([new Uint8Array(4)], 'scan (part 2 of 2).pdf'),
      state: 'idle',
      progress: { loaded: 0, total: 4, percentage: 0 },
      parts: [],
    } as unknown as FileUpload;
    render(<FileItem file={file} index={1} onRemove={noop} waitingAfter="scan (part 1 of 2).pdf" />);
    expect(screen.getByText('Waiting — starts after part 1')).toBeInTheDocument();
  });
});
