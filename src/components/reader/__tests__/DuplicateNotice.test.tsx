import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DuplicateNotice } from '../DuplicateNotice';

const renderNotice = (matches: Parameters<typeof DuplicateNotice>[0]['matches'], orgId?: string) =>
  render(
    <MemoryRouter>
      <DuplicateNotice matches={matches} orgId={orgId} />
    </MemoryRouter>
  );

describe('DuplicateNotice', () => {
  it('names an exact duplicate and links to it in the reader', () => {
    renderNotice({ exact: [{ id: 'a', name: 'Lease.pdf' }, { id: 'b', name: 'Lease (1).pdf' }], near: [{ id: 'c', name: 'scan' }], pending: false }, 'o1');
    expect(screen.getByText(/Same file as “Lease.pdf” and 1 more/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/reader?doc=a&org=o1');
  });

  it('calls a text-only match a re-scan, and dismisses', async () => {
    renderNotice({ exact: [], near: [{ id: 'c', name: 'Lease scan', distance: 2 }], pending: false });
    expect(screen.getByText(/Looks like a re-scan of “Lease scan”/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss duplicate notice' }));
    expect(screen.queryByText(/re-scan/)).toBeNull();
  });

  it('renders nothing without matches', () => {
    const { container } = renderNotice({ exact: [], near: [], pending: true });
    expect(container).toBeEmptyDOMElement();
  });
});
