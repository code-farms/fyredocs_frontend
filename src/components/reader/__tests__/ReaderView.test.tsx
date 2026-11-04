import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReaderView } from '../ReaderView';
import { saveLastPage, loadReaderState } from '@/lib/reader/readerStore';
import type { PDFDocumentProxy } from '@/lib/pdf/pdfjs';

const pageTexts = ['Intro', 'The lease term', 'Rent and lease renewal'];
vi.mock('@/lib/pdf/pdfjs', async (orig) => ({
  ...(await orig<typeof import('@/lib/pdf/pdfjs')>()),
  renderPage: async () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
  pageSize: async () => ({ width: 600, height: 800 }),
  readOutline: async () => [
    { title: 'Terms', depth: 0, page: 2 },
    { title: 'Renewal', depth: 1, page: 3 },
  ],
  docFingerprint: () => 'fp-view',
  pageTextLayer: async (_d: unknown, p: number) => {
    const str = pageTexts[p - 1];
    return {
      text: str,
      offsets: [0],
      items: [{ str, bx: 0.1, by: 0.2, ex: 0.5, ey: 0.2, tx: 0.1, ty: 0.18, eol: false }],
    };
  },
}));
const mockToast = vi.hoisted(() => ({ info: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: mockToast }));

const doc = { numPages: 3 } as unknown as PDFDocumentProxy;

describe('ReaderView', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    Element.prototype.scrollTo = vi.fn();
    mockToast.info.mockReset();
  });

  it('searches the text layer, counts matches and highlights them', async () => {
    const user = userEvent.setup();
    render(<ReaderView doc={doc} title="Lease.pdf" />);
    await user.click(screen.getByRole('button', { name: 'Search in document' }));
    await user.type(screen.getByRole('textbox', { name: 'Search in document' }), 'LEASE');
    expect(await screen.findByText('1 of 2 · 2 pages')).toBeInTheDocument();
    await waitFor(() => expect(document.querySelectorAll('[data-active]').length).toBe(1));

    await user.click(screen.getByRole('button', { name: 'Next match' }));
    expect(await screen.findByText('2 of 2 · 2 pages')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Match case' }));
    expect(await screen.findByText('No matches')).toBeInTheDocument();
  });

  it('bookmarks the current page and lists it', async () => {
    const user = userEvent.setup();
    render(<ReaderView doc={doc} title="Lease.pdf" />);
    await user.click(screen.getByRole('button', { name: 'Bookmark this page' }));
    expect(loadReaderState('fp-view').bookmarks.map((b) => b.page)).toEqual([1]);
    expect(screen.getByRole('button', { name: 'Remove bookmark from this page' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Bookmarks' }));
    expect(within(screen.getByRole('tabpanel')).getByText('Page 1', { selector: 'span.block' })).toBeInTheDocument();
  });

  it('shows the outline and resumes at the last page read', async () => {
    saveLastPage('fp-view', 3);
    const user = userEvent.setup();
    render(<ReaderView doc={doc} title="Lease.pdf" />);
    await waitFor(() => expect(mockToast.info).toHaveBeenCalledWith('Resumed at page 3'));
    expect(screen.getByRole('textbox', { name: 'Page number' })).toHaveValue('3');
    await user.click(screen.getByRole('tab', { name: 'Contents' }));
    await user.click(await screen.findByRole('button', { name: /Terms/ }));
    expect(screen.getByRole('textbox', { name: 'Page number' })).toHaveValue('2');
  });
});
