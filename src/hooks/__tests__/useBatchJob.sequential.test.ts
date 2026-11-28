import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const apiJson = vi.fn();
vi.mock('@/lib/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/apiClient')>();
  return { ...actual, apiJson: (...a: unknown[]) => apiJson(...a), apiRequest: vi.fn() };
});
vi.mock('@/lib/activity', () => ({ track: vi.fn() }));
vi.mock('@/lib/guestToken', () => ({ setGuestToken: vi.fn() }));

import { ApiHttpError } from '@/lib/apiClient';
import { useBatchJob } from '../useBatchJob';

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  listeners = new Map<string, (e: MessageEvent) => void>();
  onerror: (() => void) | null = null;
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, fn: (e: MessageEvent) => void) {
    this.listeners.set(type, fn);
  }
  close() {}
  emit(status: string) {
    this.listeners.get('job-update')?.({ data: JSON.stringify({ jobId: 'x', status, progress: 100 }) } as MessageEvent);
  }
}

const files = [
  { id: 'f1', name: 'a (part 1 of 2).pdf', serverFileId: 'u1' },
  { id: 'f2', name: 'a (part 2 of 2).pdf', serverFileId: 'u2' },
];
const created = (id: string) => ({ data: { id, status: 'queued', progress: 0 } });

describe('useBatchJob runs one job at a time', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
  });
  afterEach(() => {
    apiJson.mockReset();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('creates the next job only after the previous one finished', async () => {
    apiJson.mockResolvedValueOnce(created('j1')).mockResolvedValueOnce(created('j2'));
    const { result } = renderHook(() => useBatchJob());

    act(() => result.current.startBatch('ocr', files, { language: 'eng' }));
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));
    expect(apiJson).toHaveBeenCalledTimes(1);
    expect(result.current.batchJobs.map((b) => b.status)).toEqual(['processing', 'pending']);

    act(() => FakeEventSource.instances[0].emit('JobCompleted'));
    await waitFor(() => expect(apiJson).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(2));

    act(() => FakeEventSource.instances[1].emit('JobCompleted'));
    await waitFor(() => expect(result.current.completedCount).toBe(2));
    // Completed rows carry a download URL (download button, Download All, merge).
    expect(result.current.batchJobs.map((b) => b.job?.result?.downloadUrl)).toEqual([
      expect.stringMatching(/\/j1\/download$/),
      expect.stringMatching(/\/j2\/download$/),
    ]);
    expect(result.current.isProcessing).toBe(false);
  });

  it('moves on after a failed job, and stops after cancel', async () => {
    apiJson.mockRejectedValueOnce(new ApiHttpError('bad', 400, 'INVALID_INPUT')).mockResolvedValueOnce(created('j2'));
    const { result } = renderHook(() => useBatchJob());

    act(() => result.current.startBatch('ocr', files, { language: 'eng' }));
    await waitFor(() => expect(apiJson).toHaveBeenCalledTimes(2));
    expect(result.current.batchJobs[0].status).toBe('failed');

    act(() => result.current.cancelBatch());
    expect(result.current.batchJobs[1].status).toBe('failed');
    expect(apiJson).toHaveBeenCalledTimes(2);
  });

  it('reruns one failed row with a new upload and leaves the others alone', async () => {
    apiJson
      .mockResolvedValueOnce(created('j1'))
      .mockResolvedValueOnce(created('j2'))
      .mockResolvedValueOnce(created('j1-retry'));
    const { result } = renderHook(() => useBatchJob());

    act(() => result.current.startBatch('ocr', files, { language: 'eng' }));
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));
    act(() => FakeEventSource.instances[0].emit('JobFailed'));
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(2));
    act(() => FakeEventSource.instances[1].emit('JobCompleted'));
    await waitFor(() => expect(result.current.isProcessing).toBe(false));
    expect(result.current.batchJobs.map((b) => b.status)).toEqual(['failed', 'completed']);
    expect(result.current.batchJobs[0].localFileId).toBe('f1');

    let rerun: Promise<void> | undefined;
    act(() => {
      rerun = result.current.rerunJob(result.current.batchJobs[0].id, 'u1-new');
    });
    await waitFor(() => expect(apiJson).toHaveBeenCalledTimes(3));
    expect(JSON.parse((apiJson.mock.calls[2][1] as { body: string }).body).uploadId).toBe('u1-new');
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(3));
    act(() => FakeEventSource.instances[2].emit('JobCompleted'));
    await act(async () => {
      await rerun;
    });
    expect(result.current.batchJobs.map((b) => b.status)).toEqual(['completed', 'completed']);
    expect(result.current.batchJobs[1].job?.id).toBe('j2');
  });

  it('waits and retries when the server says another job is running', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiJson
      .mockRejectedValueOnce(new ApiHttpError('busy', 429, 'JOB_IN_PROGRESS'))
      .mockResolvedValueOnce(created('j1'));
    const { result } = renderHook(() => useBatchJob());

    act(() => result.current.startBatch('ocr', files.slice(0, 1), { language: 'eng' }));
    await waitFor(() => expect(apiJson).toHaveBeenCalledTimes(1));
    expect(result.current.batchJobs[0].status).toBe('pending');
    await waitFor(() => expect(result.current.batchJobs[0].waitingOnServer).toBe(true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await waitFor(() => expect(apiJson).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.batchJobs[0].status).toBe('processing'));
    expect(result.current.batchJobs[0].waitingOnServer).toBe(false);
  });
});
