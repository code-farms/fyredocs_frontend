import { JobWarning } from '@/types';

/** "page 3" / "pages 2 and 5" / "pages 1, 4 and 6". */
const pageList = (pages: number[]) => {
  if (pages.length === 1) return `page ${pages[0]}`;
  return `pages ${pages.slice(0, -1).join(', ')} and ${pages[pages.length - 1]}`;
};

/**
 * Document-wide warnings from the PDF workers' output guards
 * (fyredocs_backend optimize-pdf/processing/pdfguard.go, convert-from-pdf
 * textguard.go): Ghostscript can break text extraction, notably for Hindi.
 */
const documentWarnings: Record<string, string> = {
  'text-not-searchable':
    "This file looks right, but its text may not be searchable or copyable (this happens with some Hindi and other non-Latin fonts).",
  'text-kept-light-compression':
    'We used lighter compression to keep this document’s text searchable, so the file is less compressed than usual.',
};

/** One sentence per known warning code; unknown codes are not shown. */
export const warningMessages = (warnings: JobWarning[] = []): string[] => {
  const glare = [
    ...new Set(
      warnings.filter((w) => w.code === 'glare' && w.page !== undefined).map((w) => w.page as number)
    ),
  ].sort((a, b) => a - b);
  const messages = glare.length
    ? [`Glare covered text on ${pageList(glare)} — reshoot at a slight angle to avoid the reflection.`]
    : [];
  for (const code of new Set(warnings.filter((w) => w.page === undefined).map((w) => w.code))) {
    if (documentWarnings[code]) messages.push(documentWarnings[code]);
  }
  return messages;
};
