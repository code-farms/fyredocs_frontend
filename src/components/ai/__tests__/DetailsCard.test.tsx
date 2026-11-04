import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DetailsCard } from '../DetailsCard';
import { decodeExtraction, type Extraction } from '@/lib/ai/extraction';

const make = (raw: unknown) => decodeExtraction(raw) as Extraction;

describe('DetailsCard', () => {
  it('masks an ID number until revealed and flags a bad checksum', async () => {
    const aadhaar = make({
      docType: 'id_document',
      subtype: 'aadhaar',
      confidence: 0.9,
      title: 'Aadhaar',
      fields: { name: 'Asha', documentNumber: '1234 5678 9012' },
      tables: [],
    });
    render(<DetailsCard extraction={aadhaar} docName="scan" />);
    expect(screen.queryByText('1234 5678 9012')).toBeNull();
    expect(screen.getByText(/doesn't match the .* format/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Show/ }));
    expect(screen.getByText('1234 5678 9012')).toBeInTheDocument();
  });

  it('offers vCard, table CSV and rename downloads', async () => {
    const onDownloadAs = vi.fn();
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:x');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const card = make({
      docType: 'business_card',
      confidence: 0.4,
      title: 'Ravi Kumar card',
      fields: { name: 'Ravi Kumar', emails: ['ravi@example.com'], phones: ['+919812345678'] },
      tables: [{ title: 'Rates', header: ['Item', 'Price'], rows: [['=cmd', '-12.50']] }],
    });
    render(<DetailsCard extraction={card} docName="scan" onDownloadAs={onDownloadAs} />);
    expect(screen.getByText('Low confidence')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Save contact/ }));
    await userEvent.click(screen.getByRole('button', { name: /Rates/ }));
    const blobs = createObjectURL.mock.calls.map((c) => c[0] as Blob);
    expect(await blobs[0].text()).toContain('FN:Ravi Kumar');
    const csv = await blobs[1].text();
    expect(csv).toContain("'=cmd");
    expect(csv).toContain('-12.50');
    await userEvent.click(screen.getByRole('button', { name: /Download as/ }));
    expect(onDownloadAs).toHaveBeenCalledWith('Ravi-Kumar-card.pdf');
    vi.unstubAllGlobals();
  });
});
