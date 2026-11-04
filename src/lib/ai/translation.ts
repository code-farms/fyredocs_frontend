// NOTE: ported from fyredocs_app/src/lib/ai/translation.ts — keep in sync.
/**
 * Translation output ↔ pages (Phase 23 §2). PURE. The server asks the model
 * to keep the `<<page N>>` markers it was shown, so a translated document
 * can be split back into pages: saved with form-feed separators, it stays
 * page-aligned with the original like every other stored text. Models
 * sometimes drop or mangle markers — then the whole answer is one page,
 * honestly, rather than guessing boundaries.
 */

const MARKER = /^[ \t]*<<\s*page\s+(\d+)\s*>>[ \t]*$/gim;

export interface TranslatedPage {
  /** 1-based page label from the marker; null when markers were missing. */
  page: number | null;
  text: string;
}

export const splitTranslation = (text: string): TranslatedPage[] => {
  const marks = [...text.matchAll(MARKER)];
  if (marks.length === 0) return text.trim() ? [{ page: null, text: text.trim() }] : [];
  const out: TranslatedPage[] = [];
  const lead = text.slice(0, marks[0].index).trim();
  if (lead) out.push({ page: null, text: lead });
  marks.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < marks.length ? (marks[i + 1].index ?? text.length) : text.length;
    out.push({ page: parseInt(m[1], 10), text: text.slice(start, end).trim() });
  });
  return out;
};

/** Pages joined with form feeds — the library's stored-text format. */
export const translationToStoredText = (text: string): string =>
  splitTranslation(text)
    .map((p) => p.text)
    .join('\f');

/** Readable rendering: markers become "Page N" headings. */
export const translationForDisplay = (text: string): string =>
  splitTranslation(text)
    .map((p) => (p.page !== null ? `Page ${p.page}\n${p.text}` : p.text))
    .join('\n\n');
