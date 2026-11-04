// NOTE: ported from fyredocs_app/src/lib/export/vcard.ts — keep in sync.
/**
 * vCard 3.0 from a business card extraction (Phase 23 §5). PURE.
 *
 * "Save contact" shares this .vcf: iOS and Android Contacts import it
 * directly, so no contacts permission or native module is needed. 3.0 (not
 * 4.0) because it is the version both platforms' importers handle reliably.
 * Text values are escaped per RFC 2426 and long lines folded at 75 octets.
 */

export interface CardContact {
  name?: string;
  jobTitle?: string;
  company?: string;
  emails?: string[];
  phones?: string[];
  website?: string;
  address?: string;
}

export const escapeVCard = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Fold to ≤75 UTF-8 octets per physical line; continuations start with a space. */
export const foldLine = (line: string): string => {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const n = encoder.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += n;
  }
  out.push(current);
  return out.join('\r\n ');
};

/** "Asha Rao" → N:Rao;Asha;;;  (single word → given name only). */
const structuredName = (full: string): string => {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return `;${escapeVCard(parts[0] ?? '')};;;`;
  const family = parts.pop()!;
  return `${escapeVCard(family)};${escapeVCard(parts.join(' '))};;;`;
};

export const buildVCard = (c: CardContact): string => {
  const fn = c.name?.trim() || c.company?.trim() || 'Contact';
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(fn)}`, `N:${c.name ? structuredName(c.name) : ';;;;'}`];
  if (c.company) lines.push(`ORG:${escapeVCard(c.company)}`);
  if (c.jobTitle) lines.push(`TITLE:${escapeVCard(c.jobTitle)}`);
  for (const e of c.emails ?? []) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(e)}`);
  for (const p of c.phones ?? []) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(p)}`);
  if (c.website) lines.push(`URL:${escapeVCard(c.website)}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(c.address)};;;;`);
  lines.push('END:VCARD');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
};

const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);

/** Business card extraction fields → contact. */
export const contactFromFields = (fields: Record<string, unknown>): CardContact => ({
  name: str(fields.name),
  jobTitle: str(fields.jobTitle),
  company: str(fields.company),
  emails: strs(fields.emails),
  phones: strs(fields.phones),
  website: str(fields.website),
  address: str(fields.address),
});
