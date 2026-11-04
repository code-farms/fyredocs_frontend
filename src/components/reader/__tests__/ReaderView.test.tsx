import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReaderView } from '../ReaderView';
import { saveLastPage, loadReaderState } from '@/lib/reader/readerStore';
import type { PDFDocumentProxy } from '@/lib/pdf/pdfjs';

const pageTexts = ['Intro', 'The lease term', 'Rent and lease renewal'];
const mockPermissions = vi.hoisted(() => vi.fn(() => null as null | Record<string, boolean>));
const mockFlags = vi.hoisted(() => ({ value: {} as Record<string, boolean> }));
vi.mock('@/hooks/useFlags', () => ({ useFlags: () => mockFlags.value }));
vi.mock('@/lib/pdf/pdfjs', async (orig) => ({
  ...(await orig<typeof import('@/lib/pdf/pdfjs')>()),
  renderPage: async () => ({ promise: Promise.resolve(), cancel: vi.fn() }),
  pageSize: async () => ({ width: 600, height: 800 }),
  readOutline: async () => [
    { title: 'Terms', depth: 0, page: 2 },
    { title: 'Renewal', depth: 1, page: 3 },
  ],
  readPermissions: async () => mockPermissions(),
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
    // The toast fires in the same effect that sets the page; wait for the re-render.
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Page number' })).toHaveValue('3'));
    await user.click(screen.getByRole('tab', { name: 'Contents' }));
    await user.click(await screen.findByRole('button', { name: /Terms/ }));
    expect(screen.getByRole('textbox', { name: 'Page number' })).toHaveValue('2');
  });
});

describe('ReaderView permissions and actions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    Element.prototype.scrollTo = vi.fn();
    Object.values(mockToast).forEach((f) => f.mockReset());
  });

  it('explains restricted printing and copying instead of doing them', async () => {
    mockPermissions.mockReturnValue({ print: false, copy: false, modify: false, annotate: false, assemble: false });
    const getData = vi.fn();
    const user = userEvent.setup();
    render(<ReaderView doc={{ numPages: 3, getData } as unknown as PDFDocumentProxy} title="Locked.pdf" />);
    await waitFor(() => expect(mockPermissions).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Print' }));
    await user.click(screen.getByRole('button', { name: 'Copy page text' }));
    expect(mockToast.info).toHaveBeenCalledWith("Printing is restricted by this document's permissions.");
    expect(mockToast.info).toHaveBeenCalledWith("Copying text is restricted by this document's permissions.");
    expect(getData).not.toHaveBeenCalled();
  });

  it('copies the current page text when allowed', async () => {
    mockPermissions.mockReturnValue(null);
    const user = userEvent.setup();
    // user-event installs its own clipboard stub at setup; spy on that one.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<ReaderView doc={doc} title="Lease.pdf" />);
    await user.click(screen.getByRole('button', { name: 'Copy page text' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('Intro'));
    expect(mockToast.success).toHaveBeenCalledWith('Copied the text of page 1');
  });

  it('hides read aloud when the browser has no speech engine', () => {
    // jsdom has no speechSynthesis, which is exactly the unsupported case.
    render(<ReaderView doc={doc} title="Lease.pdf" />);
    expect(screen.queryByRole('button', { name: 'Read aloud' })).toBeNull();
  });
});

describe('ReaderView AI gate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    Element.prototype.scrollTo = vi.fn();
  });

  it('shows the AI button only when the aiReading flag is on', () => {
    mockFlags.value = {};
    const { unmount } = render(<ReaderView doc={doc} title="Lease.pdf" />);
    expect(screen.queryByRole('button', { name: 'AI assistant' })).toBeNull();
    unmount();
    mockFlags.value = { aiReading: true };
    render(<ReaderView doc={doc} title="Lease.pdf" />);
    expect(screen.getByRole('button', { name: 'AI assistant' })).toBeInTheDocument();
    mockFlags.value = {};
  });
});
