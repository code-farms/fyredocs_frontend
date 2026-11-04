/**
 * "Export all receipts (CSV)" for the web library (the app's shareExpenseCsv,
 * Phase 23 §5): every live receipt with a saved extraction, sorted by date,
 * one currency per row — totals are never summed across currencies.
 */
import type { ApiDocument } from '@/lib/documentsApi';
import { expenseRows, expenseTotals, type ReceiptRecord } from '@/lib/ai/expenses';
import { decodeExtraction } from '@/lib/ai/extraction';
import { toCsv } from '@/lib/export/csv';

/** Library rows → receipt records; rows whose saved extraction doesn't validate are skipped. */
export const receiptRecords = (docs: ApiDocument[]): ReceiptRecord[] =>
  docs.flatMap((d) => {
    const extraction = d.extraction ? decodeExtraction(d.extraction) : null;
    return extraction ? [{ name: d.name, extraction }] : [];
  });

export const expenseCsv = (records: ReceiptRecord[]): string => toCsv(expenseRows(records));

/** "₹1,240.00 · $35.50" style summary for the toast, per currency. */
export const totalsSummary = (records: ReceiptRecord[]): string =>
  expenseTotals(records)
    .map((t) => `${t.total.toFixed(2)}${t.currency ? ` ${t.currency}` : ''}`)
    .join(' · ');
