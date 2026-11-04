// NOTE: ported from fyredocs_app/src/lib/annotate/annotationsJson.ts — keep in sync.
/**
 * JSON codec for the annotation model (Phase 15). PURE — the single
 * serialization used by draft rows (`document_annotations.data`), the JSON
 * export format, and the lossless `/FyreAnnot` key inside non-destructively
 * saved PDFs. Parsing is defensive by contract: structural validation per
 * kind, unknown kinds dropped, corrupt input returns null — a bad blob must
 * degrade to "no annotations", never crash the editor.
 */

import type { Annotation, AnnotationKind, Pt, Rect } from '@/lib/annotate/model';

export const ANNOTATIONS_FORMAT = 'fyredocs-annotations';

const KINDS = new Set<AnnotationKind>([
  'pen',
  'highlight',
  'underline',
  'strike',
  'rect',
  'ellipse',
  'arrow',
  'text',
  'note',
  'stamp',
  'date',
  'signature',
  'blur',
  'redact',
]);

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

const isPt = (v: unknown): v is Pt => {
  const p = v as Pt;
  return typeof v === 'object' && v !== null && isNum(p.x) && isNum(p.y);
};

const isRect = (v: unknown): v is Rect => {
  const r = v as Rect;
  return typeof v === 'object' && v !== null && isNum(r.x) && isNum(r.y) && isNum(r.w) && isNum(r.h);
};

/** Optional 0..1 alpha (Phase 7). Absent is valid — that is what keeps
 *  pre-Phase-7 annotations parsing — but present-and-nonsense is not. */
const isOptAlpha = (v: unknown): boolean => v === undefined || (isNum(v) && v >= 0 && v <= 1);

/** Optional rotation in degrees (Phase 7). Any finite angle is accepted;
 *  the model normalizes into 0..360 on write. */
const isOptAngle = (v: unknown): boolean => v === undefined || isNum(v);

/** Structural validation of one candidate annotation. */
const isAnnotation = (v: unknown): v is Annotation => {
  if (typeof v !== 'object' || v === null) return false;
  const a = v as Record<string, unknown>;
  if (!isStr(a.id) || !KINDS.has(a.kind as AnnotationKind)) return false;
  if (!isOptAlpha(a.opacity)) return false;
  switch (a.kind as AnnotationKind) {
    case 'pen':
    case 'highlight':
      return (
        Array.isArray(a.points) &&
        a.points.length > 0 &&
        a.points.every(isPt) &&
        isNum(a.dx) &&
        isNum(a.dy) &&
        isStr(a.color) &&
        isNum(a.strokeWidth) &&
        isRect(a.bounds)
      );
    case 'underline':
    case 'strike':
    case 'arrow':
      return isNum(a.x1) && isNum(a.y1) && isNum(a.x2) && isNum(a.y2) && isStr(a.color) && isNum(a.strokeWidth);
    case 'rect':
    case 'ellipse':
      return isNum(a.x) && isNum(a.y) && isNum(a.w) && isNum(a.h) && isStr(a.color) && isNum(a.strokeWidth);
    case 'text':
    case 'note':
    case 'stamp':
    case 'date':
      return isNum(a.x) && isNum(a.y) && isStr(a.text) && isStr(a.color) && isNum(a.fontScale);
    case 'signature':
      return (
        isNum(a.x) &&
        isNum(a.y) &&
        isNum(a.w) &&
        isNum(a.aspect) &&
        isStr(a.sigRelPath) &&
        isOptAngle(a.rotation)
      );
    case 'blur':
    case 'redact':
      return isNum(a.x) && isNum(a.y) && isNum(a.w) && isNum(a.h);
  }
};

/** One page's annotations → versioned JSON (`{v:1,a:[...]}`). */
export const serializePage = (list: Annotation[]): string => JSON.stringify({ v: 1, a: list });

/** Parses one page blob. Invalid entries dropped; corrupt blob → null. */
export const parsePage = (json: string): Annotation[] | null => {
  try {
    const raw = JSON.parse(json) as { v?: number; a?: unknown };
    if (typeof raw !== 'object' || raw === null || !Array.isArray(raw.a)) return null;
    return raw.a.filter(isAnnotation);
  } catch {
    return null;
  }
};

/** Single-annotation codec — the `/FyreAnnot` payload. */
export const serializeAnnotation = (a: Annotation): string => JSON.stringify(a);

export const parseAnnotation = (json: string): Annotation | null => {
  try {
    const raw = JSON.parse(json) as unknown;
    return isAnnotation(raw) ? raw : null;
  } catch {
    return null;
  }
};

/** Whole-document export envelope. */
export const serializeDocument = (pages: Record<number, Annotation[]>): string =>
  JSON.stringify({ format: ANNOTATIONS_FORMAT, v: 1, pages });

/** Parses a document export. Non-object pages / invalid entries dropped;
 *  wrong format or corrupt input → null. */
export const parseDocument = (json: string): Record<number, Annotation[]> | null => {
  try {
    const raw = JSON.parse(json) as { format?: string; pages?: Record<string, unknown> };
    if (typeof raw !== 'object' || raw === null) return null;
    if (raw.format !== ANNOTATIONS_FORMAT || typeof raw.pages !== 'object' || raw.pages === null) {
      return null;
    }
    const out: Record<number, Annotation[]> = {};
    for (const [key, value] of Object.entries(raw.pages)) {
      const page = Number.parseInt(key, 10);
      if (!Number.isInteger(page) || page < 0 || !Array.isArray(value)) continue;
      const list = value.filter(isAnnotation);
      if (list.length > 0) out[page] = list;
    }
    return out;
  } catch {
    return null;
  }
};
