import { docNavGroups, docs, type DocSection } from '@/config/docs';
import { devDocNavGroups, developerDocs } from '@/config/developerDocs';

// ============================================================================
// TYPES
// ============================================================================

/** Minimal nav-group shape shared by docNavGroups and devDocNavGroups. */
export interface NavGroupLike {
  title: string;
  items: { slug: string; title: string }[];
}

export interface FlatNavItem {
  slug: string;
  title: string;
  group: string;
}

export interface AdjacentDocs {
  prev?: FlatNavItem;
  next?: FlatNavItem;
}

export type DocsArea = 'docs' | 'dev-docs';

export interface DocSearchEntry {
  slug: string;
  title: string;
  description: string;
  group: string;
  area: DocsArea;
  headings: string[];
  content: string;
}

// ============================================================================
// HEADING ANCHORS
// ============================================================================

/** Kebab-case a heading for use as a URL anchor (punctuation stripped). */
export const slugifyHeading = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    // Unicode letters, marks and digits survive, so Hindi headings get real
    // anchors (ASCII-only stripping left them with an empty id).
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

// ============================================================================
// NAVIGATION
// ============================================================================

/** Flatten nav groups into a single ordered list (group order preserved). */
export const flattenNav = (groups: NavGroupLike[]): FlatNavItem[] =>
  groups.flatMap((group) =>
    group.items.map((item) => ({ slug: item.slug, title: item.title, group: group.title })),
  );

/** Previous/next docs for a slug, honoring sidebar group order. */
export const getAdjacentDocs = (slug: string, groups: NavGroupLike[]): AdjacentDocs => {
  const flat = flattenNav(groups);
  const index = flat.findIndex((item) => item.slug === slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? flat[index - 1] : undefined,
    next: index < flat.length - 1 ? flat[index + 1] : undefined,
  };
};

// ============================================================================
// SEARCH INDEX
// ============================================================================

/** Extract the searchable plain text from one doc section. */
const sectionText = (section: DocSection): string => {
  const parts: string[] = [];
  // Mermaid sources aren't human-readable prose — skip them.
  if (section.type !== 'mermaid' && section.content) parts.push(section.content);
  if (section.items?.length) parts.push(section.items.join(' '));
  if (section.tableData) {
    parts.push(section.tableData.headers.join(' '));
    parts.push(section.tableData.rows.map((row) => row.join(' ')).join(' '));
  }
  return parts.join(' ');
};

const buildEntries = (
  entries: { slug: string; title: string; description: string; sections: DocSection[] }[],
  groups: NavGroupLike[],
  area: DocsArea,
): DocSearchEntry[] => {
  const groupBySlug = new Map(flattenNav(groups).map((item) => [item.slug, item.group]));
  return entries.map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    description: doc.description,
    group: groupBySlug.get(doc.slug) ?? 'Other',
    area,
    headings: doc.sections
      .map((section) => section.heading)
      .filter((heading): heading is string => Boolean(heading)),
    content: doc.sections.map(sectionText).join(' '),
  }));
};

let cachedIndex: DocSearchEntry[] | null = null;

/**
 * Full-text search index over user docs AND dev docs.
 * Built once per session — the doc configs are static modules.
 */
export const buildSearchIndex = (): DocSearchEntry[] => {
  if (!cachedIndex) {
    cachedIndex = [
      ...buildEntries(docs, docNavGroups, 'docs'),
      ...buildEntries(developerDocs, devDocNavGroups, 'dev-docs'),
    ];
  }
  return cachedIndex;
};
