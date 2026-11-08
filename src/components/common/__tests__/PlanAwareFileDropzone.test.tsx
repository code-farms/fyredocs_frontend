import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@/test/test-utils';
import { PlanAwareFileDropzone } from '../PlanAwareFileDropzone';
import { TOOLS } from '@/config/tools';
import { MB } from '@/lib/uploadLimits';

// test-utils signs in as plan "free" with no planLimits, so limits come from
// the /auth/plans row below.
vi.mock('@/hooks/usePlans', () => {
  const plans = [
    { id: '1', name: 'guest', maxFileSizeMb: 20, maxFilesPerJob: 5, maxJobInputMb: 100, retentionDays: 0 },
    { id: '2', name: 'free', maxFileSizeMb: 50, maxFilesPerJob: 10, maxJobInputMb: 300, retentionDays: 7 },
    { id: '3', name: 'pro', maxFileSizeMb: 300, maxFilesPerJob: 50, maxJobInputMb: 300, retentionDays: 30 },
  ];
  return {
    usePlans: () => ({ data: plans, isLoading: false }),
    usePlan: (name: string) => ({ plan: plans.find((p) => p.name === name), isLoading: false }),
  };
});

const sizedFile = (sizeBytes: number, name = 'doc.pdf') => {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
};

const select = (container: HTMLElement, files: File[]) => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
};

const onFilesSelected = vi.fn();
const onLimitExceeded = vi.fn();

beforeEach(() => {
  onFilesSelected.mockClear();
  onLimitExceeded.mockClear();
});

describe('PlanAwareFileDropzone', () => {
  it('shows the effective plan limit instead of a hardcoded tool limit', () => {
    const { getByText } = render(
      <PlanAwareFileDropzone tool={TOOLS.compress} onFilesSelected={onFilesSelected} />
    );
    expect(getByText('Max 50MB per file')).toBeInTheDocument();
  });

  it('forwards a selection exactly at the per-file limit', () => {
    const { container } = render(
      <PlanAwareFileDropzone tool={TOOLS.compress} onFilesSelected={onFilesSelected} onLimitExceeded={onLimitExceeded} />
    );
    select(container, [sizedFile(50 * MB)]);
    expect(onFilesSelected).toHaveBeenCalledTimes(1);
    expect(onLimitExceeded).not.toHaveBeenCalled();
  });

  it('rejects an oversized file before forwarding it', () => {
    const { container } = render(
      <PlanAwareFileDropzone tool={TOOLS.compress} onFilesSelected={onFilesSelected} onLimitExceeded={onLimitExceeded} />
    );
    select(container, [sizedFile(51 * MB, 'big.pdf')]);
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(onLimitExceeded).toHaveBeenCalledWith('fileSize', expect.stringContaining('50 MB per-file limit'));
  });

  it('rejects a selection whose total with existing files exceeds the job limit', () => {
    const existing = Array.from({ length: 6 }, () => ({ size: 50 * MB }));
    const { container } = render(
      <PlanAwareFileDropzone
        tool={TOOLS.merge}
        onFilesSelected={onFilesSelected}
        onLimitExceeded={onLimitExceeded}
        currentFiles={existing}
      />
    );
    select(container, [sizedFile(1 * MB)]);
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(onLimitExceeded).toHaveBeenCalledWith('jobTotal', expect.stringContaining('300 MB total per job'));
  });

  it('applies the 20 MB image-tool cap', () => {
    const { container } = render(
      <PlanAwareFileDropzone tool={TOOLS['image-to-pdf']} onFilesSelected={onFilesSelected} onLimitExceeded={onLimitExceeded} />
    );
    select(container, [sizedFile(21 * MB, 'photo.jpg')]);
    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(onLimitExceeded).toHaveBeenCalledWith('fileSize', expect.stringContaining('20 MB'));
  });
});
