/**
 * Unsaved reader markup per document, in localStorage (the web stand-in for
 * the app's document_annotations table). Keyed by the pdf.js fingerprint, in
 * the app's own serializeDocument envelope so a draft is also a valid JSON
 * export. Best-effort like readerStore: every access is guarded, and the
 * store keeps only the most recently edited documents.
 */
import type { Annotation } from './model';
import { parseDocument, serializeDocument } from './annotationsJson';

export const DRAFTS_KEY = 'fyredocs.annotations.v1';
export const MAX_DRAFT_DOCS = 20;

type Store = Record<string, { json: string; updatedAt: number }>;

const read = (): Store => {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
};

const write = (store: Store) => {
  const kept = Object.entries(store)
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_DRAFT_DOCS);
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Quota or blocked storage: drafts are a convenience.
  }
};

/** Page index (0-based) → annotations; empty when there is no (valid) draft. */
export const loadDrafts = (fp: string): Record<number, Annotation[]> => {
  const entry = fp ? read()[fp] : undefined;
  return (entry && parseDocument(entry.json)) || {};
};

/** Saves the draft, or removes it when no page has markup. */
export const saveDrafts = (fp: string, pages: Record<number, Annotation[]>) => {
  if (!fp) return;
  const store = read();
  const nonEmpty = Object.fromEntries(Object.entries(pages).filter(([, list]) => list.length > 0));
  if (Object.keys(nonEmpty).length === 0) delete store[fp];
  else store[fp] = { json: serializeDocument(nonEmpty), updatedAt: Date.now() };
  write(store);
};

export const markupCount = (pages: Record<number, Annotation[]>) =>
  Object.values(pages).reduce((n, list) => n + list.length, 0);
