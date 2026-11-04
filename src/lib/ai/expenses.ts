// NOTE: ported from fyredocs_app/src/lib/ai/expenses.ts — keep in sync.
/**
 * Expense export (Phase 23 §5): every receipt the AI understood, as CSV
 * rows. PURE over decoded extractions. Rows without a total are kept (with
 * an empty amount) — dropping them would make the export silently disagree
 * with the library; the user can see and fix the gap in their sheet.
 */

import type { Extraction } from './extraction';

export const EXPENSE_HEADER = ['Date', 'Merchant', 'Category', 'Total', 'Tax', 'Currency', 'Document'];

export interface ReceiptRecord {
  name: string;
  extraction: Extraction;
}

const num = (v: unknown): string => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '');
const text = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Receipts → rows sorted by date (undated last), header first. */
export const expenseRows = (receipts: ReceiptRecord[]): string[][] => {
  const rows = receipts
    .filter((r) => r.extraction.docType === 'receipt')
    .map((r) => {
      const f = r.extraction.fields;
      return [text(f.date), text(f.merchant), text(f.category), num(f.total), num(f.tax), text(f.currency), r.name];
    })
    .sort((a, b) => (a[0] && b[0] ? a[0].localeCompare(b[0]) : a[0] ? -1 : b[0] ? 1 : 0));
  return [EXPENSE_HEADER, ...rows];
};

/** Totals per currency — mixed currencies are never summed together. */
export const expenseTotals = (receipts: ReceiptRecord[]): { currency: string; total: number; count: number }[] => {
  const by = new Map<string, { total: number; count: number }>();
  for (const r of receipts) {
    const f = r.extraction.fields;
    if (r.extraction.docType !== 'receipt' || typeof f.total !== 'number') continue;
    const cur = typeof f.currency === 'string' ? f.currency : '';
    const acc = by.get(cur) ?? { total: 0, count: 0 };
    acc.total = Math.round((acc.total + f.total) * 100) / 100;
    acc.count += 1;
    by.set(cur, acc);
  }
  return [...by.entries()].map(([currency, v]) => ({ currency, ...v }));
};
