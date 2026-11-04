import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { ResultStage } from '../ResultStage';
import { getAllTools } from '@/config/tools';
import type { Job, JobWarning } from '@/types';

const tool = getAllTools().find((t) => t.id === 'scan-to-pdf')!;
const now = new Date();
const job = (warnings?: JobWarning[]): Job => ({
  id: 'j1',
  toolId: 'scan-to-pdf',
  state: 'completed',
  progress: { currentStep: 'Completed', totalSteps: 3, completedSteps: 3, percentage: 100 },
  createdAt: now,
  updatedAt: now,
  result: {
    downloadUrl: '/dl',
    fileName: 'scan.pdf',
    fileSize: 1024,
    expiresAt: new Date(now.getTime() + 86_400_000 * 2),
    ...(warnings ? { warnings } : {}),
  },
  fileIds: [],
  options: {},
});

describe('ResultStage warnings', () => {
  it('shows the glare note for the affected pages', () => {
    render(<ResultStage tool={tool} job={job([{ page: 2, code: 'glare' }])} onStartOver={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Glare covered text on page 2');
  });

  it('shows no note for a clean result', () => {
    render(<ResultStage tool={tool} job={job()} onStartOver={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.queryByText(/Glare covered text/)).toBeNull();
  });
});

describe('ResultStage failure', () => {
  const failed = (toolId: string, code: string): Job => ({
    ...job(),
    toolId: toolId as Job['toolId'],
    state: 'failed',
    result: undefined,
    error: { code, message: 'Something failed', isRetryable: true },
  });
  const toolFor = (id: string) => getAllTools().find((t) => t.id === id)!;

  it('suggests Repair PDF for a conversion failure on a PDF tool', () => {
    render(<ResultStage tool={toolFor('compress')} job={failed('compress', 'CONVERSION_FAILED')} onStartOver={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByRole('link', { name: /Try Repair PDF/ })).toHaveAttribute('href', '/repair-pdf');
  });

  it('does not suggest Repair for unlock, image tools or other failures', () => {
    const { unmount } = render(
      <ResultStage tool={toolFor('unlock-pdf')} job={failed('unlock-pdf', 'CONVERSION_FAILED')} onStartOver={vi.fn()} onRetry={vi.fn()} />
    );
    expect(screen.queryByRole('link', { name: /Try Repair PDF/ })).toBeNull();
    unmount();
    const second = render(
      <ResultStage tool={toolFor('scan-to-pdf')} job={failed('scan-to-pdf', 'CONVERSION_FAILED')} onStartOver={vi.fn()} onRetry={vi.fn()} />
    );
    expect(screen.queryByRole('link', { name: /Try Repair PDF/ })).toBeNull();
    second.unmount();
    render(<ResultStage tool={toolFor('compress')} job={failed('compress', 'FAILED')} onStartOver={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.queryByRole('link', { name: /Try Repair PDF/ })).toBeNull();
  });
});
