import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UpgradeDialog } from '../UpgradeDialog';

const plans = [
  { id: '1', name: 'guest', maxFileSizeMb: 20, maxFilesPerJob: 5, maxJobInputMb: 100, retentionDays: 0 },
  { id: '2', name: 'free', maxFileSizeMb: 50, maxFilesPerJob: 10, maxJobInputMb: 300, retentionDays: 7 },
  { id: '3', name: 'pro', maxFileSizeMb: 300, maxFilesPerJob: 50, maxJobInputMb: 300, retentionDays: 30 },
];

let mockPlan = 'pro';
vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ plan: mockPlan, planLimits: null }),
}));
vi.mock('@/hooks/usePlans', () => ({
  usePlans: () => ({ data: plans, isLoading: false }),
  usePlan: (name: string) => ({ plan: plans.find((p) => p.name === name), isLoading: false }),
}));

const renderDialog = (reason: 'fileSize' | 'fileCount' | 'jobTotal', message?: string) =>
  render(
    <MemoryRouter>
      <UpgradeDialog open onOpenChange={() => {}} reason={reason} message={message} />
    </MemoryRouter>
  );

describe('UpgradeDialog', () => {
  it('tells a pro user this is their plan maximum, without an upgrade offer', () => {
    mockPlan = 'pro';
    renderDialog('fileSize', '"big.pdf" (400 MB) is over the 300 MB per-file limit.');
    expect(screen.getByText(/maximum for your plan/i)).toBeInTheDocument();
    expect(screen.getByText(/300 MB per-file limit/)).toBeInTheDocument();
    expect(screen.queryByText(/Upgrade to Pro/i)).not.toBeInTheDocument();
  });

  it('offers Pro to a free user over the per-file limit', () => {
    mockPlan = 'free';
    renderDialog('fileSize');
    expect(screen.getAllByText(/Upgrade to Pro/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Files up to 300MB/)).toBeInTheDocument();
  });

  it('does not upsell a free user on a job total Pro does not raise', () => {
    mockPlan = 'free';
    renderDialog('jobTotal', 'These files add up to 320 MB, over the 300 MB total per job.');
    expect(screen.getByText(/maximum on every plan/i)).toBeInTheDocument();
    expect(screen.queryByText(/Upgrade to Pro/i)).not.toBeInTheDocument();
  });

  it('nudges a guest to a free account', () => {
    mockPlan = 'guest';
    renderDialog('jobTotal');
    expect(screen.getAllByText(/Create a free account/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Up to 300MB in total per job/)).toBeInTheDocument();
  });
});
