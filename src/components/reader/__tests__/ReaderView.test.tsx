import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReaderView } from '../ReaderView';
import { saveLastPage, loadReaderState } from '@/lib/reader/readerStore';
import type { PDFDocumentProxy } from '@/lib/pdf/pdfjs';

const pageTexts = ['Intro', 'The lease term', 'Rent and lease renewal'];
const mockPermissions = vi.hoisted(() => vi.fn(() => null as null | Record<string, boolean>));
const mockFlags = vi.hoisted(() => ({ value: {} as Record<string, boolean> }));
vi.mock('@/hooks/useFlags', () => ({ useFlags: () => mockFlags.value }));
const mockSave = vi.hoisted(() => vi.fn());
vi.mock('@/lib/annotate/savePdf', async (orig) => ({
  ...(await orig<typeof import('@/lib/annotate/savePdf')>()),
  saveAnnotatedPdf: (...a: unknown[]) => mockSave(...a),
}));
const mockAuth = vi.hoisted(() => ({ isAuthenticated: false }));
vi.mock('@/auth/useAuth', () => ({ useAuth: () => mockAuth }));
const mockDocsApi = vi.hoisted(() => ({
  updateDocument: vi.fn(async () => ({})),
  getDocumentDuplicates: vi.fn(async () => ({ exact: [], near: [], pending: false })),
  saveDocumentExtraction: vi.fn(async () => undefined),
}));
vi.mock('@/lib/documentsApi', async (orig) => ({ ...(await orig<typeof import('@/lib/documentsApi')>()), ...mockDocsApi }));
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
    // getData runs once on open (re-reading saved marks); no print frame is ever created.
    expect(document.querySelector('iframe')).toBeNull();
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

describe('ReaderView annotate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    Element.prototype.scrollTo = vi.fn();
    Object.values(mockToast).forEach((f) => f.mockReset());
    mockPermissions.mockReturnValue(null);
    mockSave.mockReset();
  });

  it('opens the annotate toolbar and shows drafts kept from last time', async () => {
    const { saveDrafts } = await import('@/lib/annotate/webDrafts');
    saveDrafts('fp-view', { 1: [{ id: 'b', kind: 'rect', x: 0.1, y: 0.1, w: 0.2, h: 0.2, color: '#111111', strokeWidth: 0.006 }] });
    const user = userEvent.setup();
    render(<ReaderView doc={doc} title="Lease.pdf" />);
    await user.click(screen.getByRole('button', { name: 'Annotate' }));
    expect(screen.getByRole('toolbar', { name: 'Annotate' })).toBeInTheDocument();
    expect(screen.getByText(/1 mark · draft kept in this browser/)).toBeInTheDocument();
  });

  it('respects a PDF that forbids annotations', async () => {
    mockPermissions.mockReturnValue({ print: true, copy: true, modify: false, annotate: false, assemble: false });
    const user = userEvent.setup();
    render(<ReaderView doc={doc} title="Locked.pdf" />);
    await waitFor(() => expect(mockPermissions).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Annotate' }));
    expect(mockToast.info).toHaveBeenCalledWith("Adding annotations is restricted by this document's permissions.");
    expect(screen.queryByRole('toolbar', { name: 'Annotate' })).toBeNull();
  });

  it('saves the markup into a downloaded PDF', async () => {
    const { saveDrafts } = await import('@/lib/annotate/webDrafts');
    const mark = { id: 'b', kind: 'rect' as const, x: 0.1, y: 0.1, w: 0.2, h: 0.2, color: '#111111', strokeWidth: 0.006 };
    saveDrafts('fp-view', { 0: [mark] });
    mockSave.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    const getData = vi.fn(async () => new Uint8Array([1]));
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    const user = userEvent.setup();
    render(<ReaderView doc={{ numPages: 3, getData } as unknown as PDFDocumentProxy} title="Lease.pdf" />);
    await user.click(screen.getByRole('button', { name: 'Annotate' }));
    await user.click(screen.getByRole('button', { name: /Save PDF/ }));
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(new Uint8Array([1]), { 0: [mark] }));
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringMatching(/text stays searchable/));
    vi.unstubAllGlobals();
  });
});

describe('ReaderView annotate — reopen and import', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    Element.prototype.scrollTo = vi.fn();
    Object.values(mockToast).forEach((f) => f.mockReset());
    mockPermissions.mockReturnValue(null);
  });

  const mark = { id: 'b', kind: 'rect' as const, x: 0.1, y: 0.1, w: 0.2, h: 0.2, color: '#111111', strokeWidth: 0.006 };

  it('re-opens marks saved into the PDF when there is no draft', async () => {
    const { PDFDocument } = await import('pdf-lib');
    const { appendAnnotationsToPdf } = await import('@/lib/annotate/pdfAnnots');
    const pdf = await PDFDocument.create();
    pdf.addPage([600, 800]);
    await appendAnnotationsToPdf(pdf, { 0: [mark] });
    const bytes = await pdf.save();
    const user = userEvent.setup();
    render(<ReaderView doc={{ numPages: 3, getData: async () => bytes } as unknown as PDFDocumentProxy} title="Saved.pdf" />);
    await user.click(screen.getByRole('button', { name: 'Annotate' }));
    expect(await screen.findByText(/1 mark · draft kept/)).toBeInTheDocument();
  });

  it('imports a JSON export, asking before it replaces existing marks', async () => {
    const { saveDrafts } = await import('@/lib/annotate/webDrafts');
    const { PDFDocument } = await import('pdf-lib');
    saveDrafts('fp-view', { 0: [mark] });
    const pdf = await PDFDocument.create();
    pdf.addPage([600, 800]);
    const bytes = await pdf.save();
    const user = userEvent.setup();
    render(<ReaderView doc={{ numPages: 3, getData: async () => bytes } as unknown as PDFDocumentProxy} title="Lease.pdf" />);
    await user.click(screen.getByRole('button', { name: 'Annotate' }));
    const { serializeDocument } = await import('@/lib/annotate/annotationsJson');
    const file = new File([serializeDocument({ 0: [mark, { ...mark, id: 'c', x: 0.5 }] })], 'marks.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Import annotations file'), file);
    await user.click(await screen.findByRole('button', { name: 'Replace' }));
    expect(await screen.findByText(/2 marks · draft kept/)).toBeInTheDocument();
  });
});

describe('ReaderView library document', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
    Element.prototype.scrollTo = vi.fn();
    mockPermissions.mockReturnValue(null);
    Object.values(mockDocsApi).forEach((f) => f.mockClear());
  });

  it('fingerprints the text, then shows duplicates (signed in only)', async () => {
    // Long enough text for a SimHash (≥ 40 shingles).
    pageTexts[0] = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
    mockAuth.isAuthenticated = true;
    mockDocsApi.getDocumentDuplicates.mockResolvedValueOnce({ exact: [], near: [{ id: 'n1', name: 'Lease scan', distance: 1 }], pending: false });
    render(
      <MemoryRouter>
        <ReaderView doc={doc} title="Lease.pdf" libraryDoc={{ id: 'lib-1', orgId: 'o1' }} />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Looks like a re-scan of “Lease scan”/)).toBeInTheDocument();
    expect(mockDocsApi.updateDocument).toHaveBeenCalledWith('lib-1', { simhash: expect.stringMatching(/^[0-9a-f]{16}$/) }, 'o1');
    mockAuth.isAuthenticated = false;
    pageTexts[0] = 'Intro';
  });

  it('does nothing for guests or local files', async () => {
    mockAuth.isAuthenticated = false;
    render(
      <MemoryRouter>
        <ReaderView doc={doc} title="Lease.pdf" libraryDoc={{ id: 'lib-2' }} />
      </MemoryRouter>
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(mockDocsApi.getDocumentDuplicates).not.toHaveBeenCalled();
    expect(mockDocsApi.updateDocument).not.toHaveBeenCalled();
  });
});
