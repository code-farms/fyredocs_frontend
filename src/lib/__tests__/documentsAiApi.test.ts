import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDocumentDuplicates, listAllReceipts, saveDocumentExtraction } from '@/lib/documentsApi';
import { expenseCsv, receiptRecords, totalsSummary } from '@/lib/expenseExport';
import type { ApiDocument } from '@/lib/documentsApi';

const ok = (data: unknown, meta?: unknown) =>
  new Response(JSON.stringify({ success: true, message: 'ok', data, meta }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('document AI API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends id_document as type only', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => ok({}));
    vi.stubGlobal('fetch', fetchMock);
    await saveDocumentExtraction('d1', 'id_document', { fields: { documentNumber: '1234' } });
    await saveDocumentExtraction('d2', 'receipt', { fields: { total: 5 } }, 'o1');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ docType: 'id_document' });
    expect(fetchMock.mock.calls[1][0]).toMatch(/documents\/d2\/extraction\?orgId=o1$/);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ docType: 'receipt', extraction: { fields: { total: 5 } } });
  });

  it('pages through every receipt and fails loudly', async () => {
    const page = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, name: `r${i}` }));
    const fetchMock = vi.fn().mockResolvedValueOnce(ok(page(100), { total: 130 })).mockResolvedValueOnce(ok(page(30), { total: 130 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await listAllReceipts('o1')).toHaveLength(130);
    expect(fetchMock.mock.calls[1][0]).toMatch(/docType=receipt&limit=100&page=2&orgId=o1/);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
    await expect(listAllReceipts()).rejects.toThrow();
  });

  it('reads duplicates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ exact: [{ id: 'a', name: 'A' }], near: [], pending: false })));
    expect(await getDocumentDuplicates('d1')).toEqual({ exact: [{ id: 'a', name: 'A' }], near: [], pending: false });
  });
});

describe('expense export', () => {
  const receipt = (name: string, fields: Record<string, unknown>): ApiDocument =>
    ({
      id: name,
      name,
      fileSize: 1,
      status: 'ready',
      createdAt: '',
      updatedAt: '',
      docType: 'receipt',
      extraction: { docType: 'receipt', confidence: 0.9, title: name, fields, tables: [] },
    }) as ApiDocument;

  it('builds a dated CSV and totals per currency', () => {
    const records = receiptRecords([
      receipt('cafe.pdf', { date: '2026-10-02', merchant: 'Cafe', total: 120, currency: 'INR' }),
      receipt('taxi.pdf', { date: '2026-10-01', merchant: 'Taxi', total: 80.5, currency: 'INR' }),
      receipt('hotel.pdf', { date: '2026-10-03', merchant: '=Hotel', total: 50, currency: 'USD' }),
      { ...receipt('broken.pdf', {}), extraction: 'nope' } as ApiDocument,
    ]);
    expect(records).toHaveLength(3);
    const csv = expenseCsv(records);
    const lines = csv.replace(/^\uFEFF/, '').trim().split('\r\n');
    expect(lines[0]).toBe('Date,Merchant,Category,Total,Tax,Currency,Document');
    expect(lines[1]).toMatch(/^2026-10-01,Taxi/);
    expect(csv).toContain("'=Hotel"); // formula guard
    expect(totalsSummary(records)).toBe('200.50 INR · 50.00 USD');
  });
});
