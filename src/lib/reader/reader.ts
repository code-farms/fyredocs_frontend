/**
 * Pure reader logic (no DOM, no pdf.js): zoom steps, the bounded render
 * window, page themes, and the /reader URL contract used by entry points.
 */
import type { ToolId } from '@/types';

export const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;
export const DEFAULT_ZOOM = 1;

/** Next zoom step in `dir`, clamped to the ends of ZOOM_STEPS. */
export const stepZoom = (zoom: number, dir: 1 | -1): number => {
  if (dir > 0) return ZOOM_STEPS.find((z) => z > zoom + 1e-6) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  return [...ZOOM_STEPS].reverse().find((z) => z < zoom - 1e-6) ?? ZOOM_STEPS[0];
};

/**
 * Pages (1-based) whose canvases stay rendered: the current page ± `radius`.
 * Everything else is a sized placeholder, so a 1000-page document holds at
 * most 2·radius+1 bitmaps instead of growing with every page scrolled past.
 */
export const renderWindow = (current: number, total: number, radius = 2): Set<number> => {
  const pages = new Set<number>();
  if (total < 1) return pages;
  const centre = Math.min(Math.max(1, current), total);
  for (let p = Math.max(1, centre - radius); p <= Math.min(total, centre + radius); p++) pages.add(p);
  return pages;
};

/** Vertical gap between pages, CSS px. */
export const PAGE_GAP = 16;

/** Top offset (CSS px) of each page in the scroll column, from page heights. */
export const pageOffsets = (heights: number[], gap = PAGE_GAP): number[] => {
  const offsets: number[] = [];
  let y = gap;
  for (const h of heights) {
    offsets.push(y);
    y += h + gap;
  }
  return offsets;
};

/**
 * 1-based page shown at scroll position `y` — the last page whose top is at
 * or above it. Binary search: called on every scroll frame of 1000+ pages.
 */
export const pageAt = (offsets: number[], y: number): number => {
  if (offsets.length === 0) return 1;
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (offsets[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
};

export type ReaderTheme = 'light' | 'night' | 'sepia';

export const READER_THEMES: { value: ReaderTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'night', label: 'Night' },
  { value: 'sepia', label: 'Sepia' },
];

/**
 * CSS filter for the page canvas only (chrome keeps its own theme). Night
 * inverts then rotates hue back so photos keep roughly their colours.
 */
export const themeFilter = (theme: ReaderTheme): string | undefined => {
  if (theme === 'night') return 'invert(0.92) hue-rotate(180deg)';
  if (theme === 'sepia') return 'sepia(0.45) brightness(0.97)';
  return undefined;
};

/** Where the reader gets its bytes. A local file never touches the URL. */
export type ReaderSource =
  /** docId/orgId: set when the job output is also a library document (opened from the library). */
  | { kind: 'job'; toolId: ToolId; jobId: string; docId?: string; orgId?: string }
  | { kind: 'doc'; id: string; orgId?: string };

/** The library document behind a source, if any — what AI details and duplicates attach to. */
export const libraryDocOf = (source: ReaderSource | null): { id: string; orgId?: string } | null => {
  if (!source) return null;
  if (source.kind === 'doc') return { id: source.id, ...(source.orgId ? { orgId: source.orgId } : {}) };
  return source.docId ? { id: source.docId, ...(source.orgId ? { orgId: source.orgId } : {}) } : null;
};

export const readerSourceFromParams = (params: URLSearchParams): ReaderSource | null => {
  const jobId = params.get('job');
  const toolId = params.get('tool');
  const docId = params.get('doc');
  const org = params.get('org');
  if (jobId && toolId) {
    return { kind: 'job', toolId: toolId as ToolId, jobId, ...(docId ? { docId } : {}), ...(org ? { orgId: org } : {}) };
  }
  if (docId) return { kind: 'doc', id: docId, ...(org ? { orgId: org } : {}) };
  return null;
};

export const readerHref = (source: ReaderSource): string => {
  const q = new URLSearchParams();
  if (source.kind === 'job') {
    q.set('job', source.jobId);
    q.set('tool', source.toolId);
    if (source.docId) q.set('doc', source.docId);
    if (source.orgId) q.set('org', source.orgId);
  } else {
    q.set('doc', source.id);
    if (source.orgId) q.set('org', source.orgId);
  }
  return `/reader?${q.toString()}`;
};

/** True for names/MIME types the reader can open. */
export const isPdfName = (name?: string | null, mime?: string | null) =>
  mime === 'application/pdf' || /\.pdf$/i.test(name ?? '');
