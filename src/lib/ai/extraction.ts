// NOTE: ported from fyredocs_app/src/lib/ai/extraction.ts — keep in sync.
/**
 * AI document understanding — the app side of POST /api/ai/extract
 * (Phase 23 §3). PURE. The server already validated and normalized every
 * value; this module re-validates anyway (the stored blob outlives app
 * versions and the wire is untrusted), encodes the versioned blob for
 * document_extractions, and turns fields into display rows.
 *
 * ID numbers are PII: rows for them are flagged `sensitive` and render
 * masked (last 4) until the user reveals them.
 */

import { z } from 'zod';

export const DOC_TYPES = [
  'invoice',
  'receipt',
  'id_document',
  'business_card',
  'form',
  'letter',
  'contract',
  'statement',
  'other',
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  invoice: 'Invoice',
  receipt: 'Receipt',
  id_document: 'ID document',
  business_card: 'Business card',
  form: 'Form',
  letter: 'Letter',
  contract: 'Contract',
  statement: 'Statement',
  other: 'Document',
};

export const ID_SUBTYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  aadhaar: 'Aadhaar',
  pan: 'PAN card',
  driver_license: 'Driving licence',
  voter_id: 'Voter ID',
  business_license: 'Business licence',
  other_id: 'ID',
};

const tableSchema = z.object({
  title: z.string().optional(),
  header: z.array(z.string()).catch([]),
  rows: z.array(z.array(z.string())).catch([]),
});
export type ExtractedTable = z.infer<typeof tableSchema>;

const extractionSchema = z.object({
  docType: z.enum(DOC_TYPES).catch('other'),
  subtype: z.string().optional(),
  confidence: z.number().min(0).max(1).catch(0),
  title: z.string().catch(''),
  language: z.string().optional(),
  fields: z.record(z.string(), z.unknown()).catch({}),
  tables: z.array(tableSchema).catch([]),
});

export type Extraction = z.infer<typeof extractionSchema>;

/** Decode a server result or a stored blob; null when it isn't one. */
export const decodeExtraction = (raw: unknown): Extraction | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const parsed = extractionSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

const BLOB_VERSION = 1;

export const encodeExtractionBlob = (e: Extraction): string => JSON.stringify({ v: BLOB_VERSION, ...e });

/** Corrupt or future-version blobs degrade to "no extraction", never a crash. */
export const decodeExtractionBlob = (blob: string): Extraction | null => {
  try {
    const raw = JSON.parse(blob) as { v?: unknown };
    if (raw?.v !== BLOB_VERSION) return null;
    return decodeExtraction(raw);
  } catch {
    return null;
  }
};

/** Badge text: "Receipt", "PAN card"… */
export const docTypeLabel = (e: Pick<Extraction, 'docType' | 'subtype'>): string =>
  e.docType === 'id_document' && e.subtype ? (ID_SUBTYPE_LABELS[e.subtype] ?? 'ID') : DOC_TYPE_LABELS[e.docType];

export interface FieldRow {
  key: string;
  label: string;
  value: string;
  /** Masked until revealed (ID numbers). */
  sensitive?: boolean;
}

const LABELS: Record<string, string> = {
  merchant: 'Merchant',
  date: 'Date',
  total: 'Total',
  tax: 'Tax',
  category: 'Category',
  paymentMethod: 'Paid with',
  invoiceNumber: 'Invoice no.',
  vendor: 'Vendor',
  customer: 'Billed to',
  issueDate: 'Issued',
  dueDate: 'Due',
  subtotal: 'Subtotal',
  name: 'Name',
  jobTitle: 'Title',
  company: 'Company',
  emails: 'Email',
  phones: 'Phone',
  website: 'Website',
  address: 'Address',
  fullName: 'Name',
  documentNumber: 'Number',
  dateOfBirth: 'Date of birth',
  expiryDate: 'Expires',
  issuingAuthority: 'Issued by',
  nationality: 'Nationality',
  sender: 'From',
  recipient: 'To',
  parties: 'Parties',
  effectiveDate: 'Effective',
  endDate: 'Ends',
  accountHolder: 'Account holder',
  period: 'Period',
  closingBalance: 'Closing balance',
};

const AMOUNT_KEYS = new Set(['total', 'tax', 'subtotal', 'closingBalance']);
const DATE_KEYS = new Set(['date', 'issueDate', 'dueDate', 'dateOfBirth', 'expiryDate', 'effectiveDate', 'endDate']);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-03-12" → "12 Mar 2026"; day-first matches how the doc types are
 *  printed in the app's main market, and it is unambiguous with the month name. */
export const formatIsoDate = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1] ?? m[2]} ${m[1]}`;
};

export const formatAmount = (n: number, currency?: string): string => {
  const fixed = Math.abs(n).toFixed(2);
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}${currency ? `${currency} ` : ''}${grouped}.${dec}`;
};

/** Masks all but the last 4 alphanumerics, keeping separators. */
export const maskId = (value: string): string => {
  const total = value.replace(/[^A-Za-z0-9]/g, '').length;
  let seen = 0;
  return value.replace(/[A-Za-z0-9]/g, (ch) => (++seen > total - 4 ? ch : '•'));
};

const asText = (v: unknown): string =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string').join(', ') : typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';

/** Display rows for the scalar fields, in schema order. Line items, form
 *  fields and tables render separately. */
export const fieldRows = (e: Extraction): FieldRow[] => {
  const currency = typeof e.fields.currency === 'string' ? e.fields.currency : undefined;
  const rows: FieldRow[] = [];
  for (const [key, raw] of Object.entries(e.fields)) {
    if (key === 'currency' || key === 'lineItems' || key === 'fields') continue;
    let value: string;
    if (AMOUNT_KEYS.has(key) && typeof raw === 'number') value = formatAmount(raw, currency);
    else if (DATE_KEYS.has(key) && typeof raw === 'string') value = formatIsoDate(raw);
    else if (key === 'category' && typeof raw === 'string') value = raw.charAt(0).toUpperCase() + raw.slice(1);
    else value = asText(raw);
    if (!value) continue;
    rows.push({
      key,
      label: LABELS[key] ?? key,
      value,
      sensitive: e.docType === 'id_document' && key === 'documentNumber',
    });
  }
  return rows;
};

/** Form key/value pairs, when the doc is a form. */
export const formPairs = (e: Extraction): { key: string; value: string }[] => {
  const raw = e.fields.fields;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((p) => {
    const o = p as { key?: unknown; value?: unknown };
    return typeof o?.key === 'string' ? [{ key: o.key, value: typeof o.value === 'string' ? o.value : '' }] : [];
  });
};

/** Expiry within 60 days (or past) for ID documents — a reminder, not a verdict. */
export const expiryWarning = (e: Extraction, now = new Date()): 'expired' | 'soon' | null => {
  const raw = e.fields.expiryDate;
  if (e.docType !== 'id_document' || typeof raw !== 'string') return null;
  const t = Date.parse(`${raw}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  const days = (t - now.getTime()) / 86_400_000;
  if (days < 0) return 'expired';
  return days <= 60 ? 'soon' : null;
};
