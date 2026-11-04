import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { AiPanel } from '../AiPanel';
import { registerAiProvider } from '@/lib/ai/provider';
import { createStubProvider } from '@/lib/ai/stubProvider';

const mockAuth = vi.hoisted(() => ({ isAuthenticated: true }));
vi.mock('@/auth/useAuth', () => ({ useAuth: () => mockAuth }));
const mockQuota = vi.hoisted(() => ({ data: undefined as undefined | Record<string, unknown> }));
vi.mock('@/hooks/useAiQuota', () => ({ useAiQuota: () => mockQuota }));
const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: mockToast }));

const texts = ['Intro page', 'Rent is due monthly.', 'Termination clause.'];
const getPageText = async (p: number) => texts[p - 1] ?? '';

const renderPanel = (props: Partial<Parameters<typeof AiPanel>[0]> = {}) => {
  const onCite = vi.fn();
  render(
    <AiPanel
      pageCount={3}
      currentPage={2}
      title="Lease"
      getPageText={getPageText}
      onCite={onCite}
      onClose={vi.fn()}
      {...props}
    />
  );
  return { onCite };
};

describe('AiPanel', () => {
  beforeEach(() => {
    mockAuth.isAuthenticated = true;
    mockQuota.data = undefined;
    Object.values(mockToast).forEach((f) => f.mockReset());
  });
  afterEach(() => registerAiProvider(null));

  it('asks guests to sign in instead of offering a broken button', () => {
    mockAuth.isAuthenticated = false;
    renderPanel();
    expect(screen.getByRole('link', { name: /Sign in/ })).toHaveAttribute('href', '/signin');
    expect(screen.queryByRole('button', { name: 'Summarize' })).toBeNull();
  });

  it('streams a summary whose citations jump the reader', async () => {
    const seen: unknown[] = [];
    registerAiProvider(
      createStubProvider({
        chunks: (req) => {
          seen.push(req);
          return ['Rent is monthly ', '[p.2].'];
        },
      })
    );
    const { onCite } = renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Summarize' }));
    const cite = await screen.findByRole('button', { name: 'Go to page 2' });
    expect(screen.getByText(/Summarize · Whole document/)).toBeInTheDocument();
    await userEvent.click(cite);
    expect(onCite).toHaveBeenCalledWith(2);
    expect(seen[0]).toMatchObject({ op: 'summarize', pages: [{ index: 0 }, { index: 1 }, { index: 2 }] });
  });

  it('renders key points as a list', async () => {
    registerAiProvider(createStubProvider({ chunks: () => ['- First point [p.1]\n- Second point'] }));
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Key points' }));
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
  });

  it('shows the sentence for a server error', async () => {
    registerAiProvider(createStubProvider({ failWith: 'AI_QUOTA_EXCEEDED' }));
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Explain' }));
    expect(await screen.findByText(/used this period's AI quota/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('refuses a run the quota cannot cover, before sending anything', async () => {
    const run = vi.fn();
    registerAiProvider({ id: 'backend', run } as never);
    mockQuota.data = { remainingTokens: 100, limitTokens: 100_000, resetsAt: '2026-12-01T00:00:00Z' };
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Summarize' }));
    expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/Not enough AI quota.*resets 1 Dec/));
    expect(run).not.toHaveBeenCalled();
  });

  it('offers summarize-in-parts over the page budget and points scans at OCR', async () => {
    registerAiProvider(createStubProvider({ chunks: () => ['x'] }));
    renderPanel({ pageCount: 60, getPageText: async () => '' });
    expect(screen.getByRole('button', { name: /Summarize whole document in parts/ })).toBeInTheDocument();
    expect(screen.getByText(/AI reads up to 50 pages at a time/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Summarize' }));
    expect(await screen.findByRole('link', { name: /OCR first/ })).toHaveAttribute('href', '/ocr');
  });
});
