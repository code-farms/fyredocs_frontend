import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { LibraryDocumentCard } from '../LibraryDocumentCard';
import type { ApiDocument } from '@/lib/documentsApi';

const mockDownload = vi.fn();
vi.mock('@/lib/documentsApi', async (orig) => ({
  ...(await orig<typeof import('@/lib/documentsApi')>()),
  downloadDocument: (...args: unknown[]) => mockDownload(...args),
}));
const mockToastError = vi.fn();
vi.mock('@/lib/toast', () => ({ toast: { error: (m: string) => mockToastError(m), success: vi.fn() } }));

const base: ApiDocument = {
  id: 'd1',
  name: 'Lease.pdf',
  fileSize: 1000,
  status: 'ready',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Document actions' }));
  return user;
};

describe('LibraryDocumentCard download', () => {
  it('uses the job download link when the document came from a job', async () => {
    render(<LibraryDocumentCard doc={{ ...base, metadata: { jobId: 'j1', toolId: 'compress' } }} onDelete={vi.fn()} />);
    await openMenu();
    expect(screen.getByRole('menuitem', { name: 'Download' })).toHaveAttribute('href', expect.stringContaining('j1'));
  });

  it('downloads backed-up documents through document-service and explains a missing file', async () => {
    mockDownload.mockResolvedValue('missing');
    render(<LibraryDocumentCard doc={{ ...base, organizationId: 'org1' }} onDelete={vi.fn()} />);
    const user = await openMenu();
    await user.click(screen.getByRole('menuitem', { name: 'Download' }));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith('This document has no stored file.'));
    expect(mockDownload).toHaveBeenCalledWith('d1', 'org1');
  });
});
