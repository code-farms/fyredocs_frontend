// NOTE: ported from fyredocs_app/src/lib/export/csv.ts — keep in sync.
/**
 * RFC 4180 CSV (Phase 23 §5: expense export, table export). PURE.
 *
 * Formula-injection guard: spreadsheet apps execute a cell that starts with
 * = + - @ (or a tab/CR), and extracted values come from untrusted documents
 * — a receipt reading "=HYPERLINK(...)" must not become a live formula. Such
 * cells are prefixed with an apostrophe (OWASP's recommendation). Plain
 * negative numbers are exempt: "-12.50" is data, and mangling it would break
 * the amount column.
 */

const DANGEROUS = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^-?\d+(\.\d+)?$/;

export const csvCell = (value: string | number | null | undefined): string => {
  let s = value === null || value === undefined ? '' : String(value);
  if (DANGEROUS.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Rows → CSV text with CRLF line endings (what Excel expects), BOM-prefixed
 *  so Excel opens UTF-8 (₹, names in Indic scripts) correctly. */
export const toCsv = (rows: (string | number | null | undefined)[][]): string =>
  `\uFEFF${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;

/** A filename-safe stem: no path or shell-hostile characters. */
export const safeFileStem = (name: string, fallback = 'export'): string =>
  name
    .replace(/[^\p{L}\p{M}\p{N} ._-]+/gu, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || fallback;
