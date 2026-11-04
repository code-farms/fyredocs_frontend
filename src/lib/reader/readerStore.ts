/**
 * Per-document reader state (last page, bookmarks) in localStorage, keyed by
 * the pdf.js fingerprint so the same file is recognised however it was opened.
 *
 * Browser storage is a convenience here, never a record: every access is
 * guarded (private windows and blocked storage throw), a failure just means
 * no resume/bookmarks, and the store is capped so it can't grow forever.
 */

export interface Bookmark {
  /** 1-based. */
  page: number;
  label: string;
  createdAt: number;
}

export interface DocReaderState {
  lastPage: number;
  bookmarks: Bookmark[];
  updatedAt: number;
}

type Store = Record<string, DocReaderState>;

export const STORE_KEY = 'fyredocs.reader.v1';
/** Least-recently-used documents beyond this are dropped. */
export const MAX_DOCS = 50;
export const MAX_LABEL = 80;

const storage = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

const readStore = (): Store => {
  try {
    const raw = storage()?.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
};

const writeStore = (store: Store) => {
  const kept = Object.entries(store)
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_DOCS);
  try {
    storage()?.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Quota or blocked storage: resume/bookmarks are best-effort.
  }
};

const empty = (): DocReaderState => ({ lastPage: 1, bookmarks: [], updatedAt: Date.now() });

const update = (fp: string, change: (s: DocReaderState) => DocReaderState): DocReaderState => {
  if (!fp) return empty();
  const store = readStore();
  const next = { ...change(store[fp] ?? empty()), updatedAt: Date.now() };
  store[fp] = next;
  writeStore(store);
  return next;
};

export const loadReaderState = (fp: string): DocReaderState => {
  const s = fp ? readStore()[fp] : undefined;
  return s && Array.isArray(s.bookmarks) && Number.isInteger(s.lastPage) ? s : empty();
};

export const saveLastPage = (fp: string, page: number) => update(fp, (s) => ({ ...s, lastPage: page }));

/** Adds a bookmark for `page`, or removes it if one exists. */
export const toggleBookmark = (fp: string, page: number): Bookmark[] =>
  update(fp, (s) => ({
    ...s,
    bookmarks: s.bookmarks.some((b) => b.page === page)
      ? s.bookmarks.filter((b) => b.page !== page)
      : [...s.bookmarks, { page, label: `Page ${page}`, createdAt: Date.now() }].sort((a, b) => a.page - b.page),
  })).bookmarks;

export const renameBookmark = (fp: string, page: number, label: string): Bookmark[] =>
  update(fp, (s) => ({
    ...s,
    bookmarks: s.bookmarks.map((b) =>
      b.page === page ? { ...b, label: label.trim().slice(0, MAX_LABEL) || `Page ${page}` } : b
    ),
  })).bookmarks;

export const removeBookmark = (fp: string, page: number): Bookmark[] =>
  update(fp, (s) => ({ ...s, bookmarks: s.bookmarks.filter((b) => b.page !== page) })).bookmarks;
