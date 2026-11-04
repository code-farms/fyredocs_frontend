import { JobWarning } from '@/types';

/** "page 3" / "pages 2 and 5" / "pages 1, 4 and 6". */
const pageList = (pages: number[]) => {
  if (pages.length === 1) return `page ${pages[0]}`;
  return `pages ${pages.slice(0, -1).join(', ')} and ${pages[pages.length - 1]}`;
};

/** One sentence per known warning code; unknown codes are not shown. */
export const warningMessages = (warnings: JobWarning[] = []): string[] => {
  const glare = [...new Set(warnings.filter((w) => w.code === 'glare').map((w) => w.page))].sort((a, b) => a - b);
  return glare.length
    ? [`Glare covered text on ${pageList(glare)} — reshoot at a slight angle to avoid the reflection.`]
    : [];
};
