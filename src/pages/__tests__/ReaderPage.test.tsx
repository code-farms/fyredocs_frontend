import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import ReaderPage from '../ReaderPage';
import { PdfOpenError } from '@/lib/pdf/pdfjs';
import { ReaderSourceError } from '@/lib/reader/source';

const mockOpen = vi.fn();
const mockRender = vi.fn();
const mockPermissions = vi.hoisted(() => vi.fn(() => null as null | Record<string, boolean>));
const mockFlags = vi.hoisted(() => ({ value: {} as Record<string, boolean> }));
vi.mock('@/hooks/useFlags', () => ({ useFlags: () => mockFlags.value }));
vi.mock('@/lib/pdf/pdfjs', async (orig) => ({
  ...(await orig<typeof import('@/lib/pdf/pdfjs')>()),
  openPdf: (...a: unknown[]) => mockOpen(...a),
  renderPage: (...a: unknown[]) => mockRender(...a),
  pageSize: async () => ({ width: 600, height: 800 }),
  readOutline: async () => [],
  readPermissions: async () => mockPermissions(),
  docFingerprint: () => 'fp-test',
  pageTextLayer: async () => ({ text: '', offsets: [], items: [] }),
}));
const mockFetch = vi.fn();
vi.mock('@/lib/reader/source', async (orig) => ({
  ...(await orig<typeof import('@/lib/reader/source')>()),
  fetchSourceBytes: (...a: unknown[]) => mockFetch(...a),
}));
vi.mock('@/lib/pdf/fonts', () => ({ hasNonEmbeddedFonts: async () => false }));

const fakeDoc = (numPages: number) => ({ numPages, destroy: vi.fn() });
const okTask = () => ({ promise: Promise.resolve(), cancel: vi.fn() });

const renderAt = (url: string) =>
  rtlRender(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/reader" element={<ReaderPage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

describe('ReaderPage', () => {
  beforeEach(() => {
    mockOpen.mockReset();
    mockRender.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    localStorage.clear();
  });

  it('opens a local file without any network request', async () => {
    mockOpen.mockResolvedValue(fakeDoc(3));
    mockRender.mockResolvedValue(okTask());
    renderAt('/reader');
    const file = new File([new Uint8Array([37, 80, 68, 70])], 'Lease.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText(/Open a PDF/), file);
    expect(await screen.findByText('of 3')).toBeInTheDocument();
    expect(screen.getByText('Lease.pdf')).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getAllByLabelText(/^Page \d$/)).toHaveLength(3);
  });

  it('loads a job output and contains a failed page to its own tile', async () => {
    mockFetch.mockResolvedValue(new Uint8Array([1]));
    mockOpen.mockResolvedValue(fakeDoc(2));
    mockRender.mockImplementation(async (_d: unknown, page: number) =>
      page === 2 ? { promise: Promise.reject(new Error('boom')), cancel: vi.fn() } : okTask()
    );
    renderAt('/reader?job=j1&tool=compress');
    expect(await screen.findByText("Page 2 couldn't be displayed.")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith({ kind: 'job', toolId: 'compress', jobId: 'j1' }, expect.anything());

    mockRender.mockResolvedValue(okTask());
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByText("Page 2 couldn't be displayed.")).toBeNull());
  });

  it('points encrypted PDFs at Unlock PDF', async () => {
    mockFetch.mockResolvedValue(new Uint8Array([1]));
    mockOpen.mockRejectedValue(new PdfOpenError('password', 'x'));
    renderAt('/reader?doc=d1');
    expect(await screen.findByText('This PDF is password-protected')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Unlock PDF' })).toHaveAttribute('href', '/unlock-pdf');
  });

  it('falls back to a download when the file cannot be fetched', async () => {
    mockFetch.mockRejectedValue(new ReaderSourceError('unreachable'));
    renderAt('/reader?doc=d1&org=o1');
    expect(await screen.findByText("Couldn't load the file in the reader")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download instead/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/documents\/d1\/download\?orgId=o1$/)
    );
  });
});
