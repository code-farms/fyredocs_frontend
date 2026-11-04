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
const mockAiApi = vi.hoisted(() => ({ postExtract: vi.fn(), postTranscribe: vi.fn(), getAiQuota: vi.fn() }));
vi.mock('@/lib/aiApi', () => mockAiApi);

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
      getPageImage={async () => null}
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

describe('AiPanel — W9 ops', () => {
  beforeEach(() => {
    mockAuth.isAuthenticated = true;
    mockQuota.data = undefined;
    Object.values(mockToast).forEach((f) => f.mockReset());
  });
  afterEach(() => registerAiProvider(null));

  it('translates into the chosen language and shows page headings', async () => {
    const stub = createStubProvider({ chunks: () => ['<<page 1>>\nपरिचय\n<<page 2>>\nकिराया'] });
    registerAiProvider(stub);
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Translate…' }));
    await userEvent.click(screen.getByRole('button', { name: 'Translate' }));
    expect(await screen.findByText(/Page 1\s+परिचय/)).toBeInTheDocument();
    expect(stub.calls[0]).toMatchObject({ op: 'translate', targetLang: 'Hindi' });
    expect(screen.getByText(/Whole document → Hindi/)).toBeInTheDocument();
  });

  it('turns flashcards into a review link', async () => {
    registerAiProvider(createStubProvider({ chunks: () => ['Q: What is rent?\nA: Monthly payment\n\nQ: Term?\nA: 11 months'] }));
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Flashcards' }));
    expect(await screen.findByText('2 flashcards ready.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Review/ }));
    expect(window.location.pathname).toBe('/ai/flashcards');
  });

  it('asks follow-ups with the earlier exchange as history', async () => {
    const stub = createStubProvider({ chunks: (r) => [r.history?.length ? 'Second answer [p.3]' : 'First answer [p.2]'] });
    registerAiProvider(stub);
    renderPanel();
    await userEvent.click(screen.getByRole('tab', { name: 'Ask' }));
    const box = screen.getByRole('textbox', { name: 'Question about this document' });
    await userEvent.type(box, 'When is rent due?{Enter}');
    expect(await screen.findByText(/First answer/)).toBeInTheDocument();
    await userEvent.type(box, 'And termination?{Enter}');
    expect(await screen.findByText(/Second answer/)).toBeInTheDocument();
    expect(stub.calls[1]).toMatchObject({
      op: 'ask',
      question: 'And termination?',
      history: [
        { role: 'user', text: 'When is rent due?' },
        { role: 'assistant', text: 'First answer [p.2]' },
      ],
    });
  });

  it('simplifies a pasted passage without sending the document', async () => {
    const stub = createStubProvider({ chunks: () => ['Plain words.'] });
    registerAiProvider(stub);
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /Simplify text/ }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Passage to simplify' }), 'Heretofore the lessee shall…');
    await userEvent.click(screen.getByRole('button', { name: 'Simplify' }));
    expect(await screen.findByText('Plain words.')).toBeInTheDocument();
    expect(stub.calls[0]).toMatchObject({ op: 'rewrite', pages: [], passage: 'Heretofore the lessee shall…' });
  });
});

describe('AiPanel — details and handwriting', () => {
  beforeEach(() => {
    mockAuth.isAuthenticated = true;
    mockQuota.data = undefined;
    Object.values(mockToast).forEach((f) => f.mockReset());
  });

  it('detects details from text plus a picture of page 1', async () => {
    mockAiApi.postExtract.mockResolvedValue({ docType: 'invoice', confidence: 0.9, title: 'Invoice 42', fields: { invoiceNumber: '42', total: 1180 }, tables: [] });
    const getPageImage = vi.fn(async () => 'data:image/jpeg;base64,QUJD');
    renderPanel({ getPageImage });
    await userEvent.click(screen.getByRole('tab', { name: 'Details' }));
    await userEvent.click(screen.getByRole('button', { name: /Detect details/ }));
    expect(await screen.findByText('Invoice')).toBeInTheDocument();
    expect(getPageImage).toHaveBeenCalledWith(1);
    expect(mockAiApi.postExtract).toHaveBeenCalledWith({
      pages: [
        { index: 0, text: 'Intro page' },
        { index: 1, text: 'Rent is due monthly.' },
        { index: 2, text: 'Termination clause.' },
      ],
      images: ['data:image/jpeg;base64,QUJD'],
    });
  });

  it('transcribes scanned pages when there is no text layer', async () => {
    mockAiApi.postTranscribe.mockResolvedValue(['हस्तलिखित नोट']);
    renderPanel({ getPageText: async () => '', getPageImage: async () => 'data:image/jpeg;base64,QUJD' });
    await userEvent.click(screen.getByRole('button', { name: 'Summarize' }));
    await userEvent.click(await screen.findByRole('button', { name: /Transcribe with AI/ }));
    // Three pages = two requests, so the cost gate asks first.
    expect(screen.getByText(/Transcribing 3 pages uses up to about/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(await screen.findByText(/हस्तलिखित नोट/)).toBeInTheDocument();
    expect(mockAiApi.postTranscribe).toHaveBeenCalledWith({ images: ['data:image/jpeg;base64,QUJD'] , language: undefined });
  });
});
