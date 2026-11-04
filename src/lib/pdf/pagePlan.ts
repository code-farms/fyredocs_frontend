// NOTE: ported from fyredocs_app/src/lib/pdf/pagePlan.ts — keep in sync.
/**
 * Page-operation planner for the on-device PDF editor (Phase 14). PURE — no
 * pdf-lib, no React. The editor's state is a `PageSpec[]`: one descriptor
 * per OUTPUT page. Every operation returns a new array (undo/redo is a
 * snapshot stack), and pdf-lib touches the file exactly twice — a probe at
 * open and `applyPagePlan` at save — so nothing here needs the document.
 */

export type PageRotation = 0 | 90 | 180 | 270;

export type FixedPageSizeId = 'a4' | 'letter' | 'legal';
export type MarginId = 'none' | 'small' | 'normal' | 'large';

/** PDF points. Legal exists only on-device — the backend enum stays a4/letter/id. */
export const PAGE_SIZES: Record<FixedPageSizeId, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
};

export const MARGIN_PT: Record<MarginId, number> = {
  none: 0,
  small: 18,
  normal: 36,
  large: 72,
};

/** A source page's raw MediaBox size + stored /Rotate (normalized 0–270). */
export interface SrcPageSize {
  width: number;
  height: number;
  rotation: number;
}

export type PageSpec =
  | {
      kind: 'source';
      id: string;
      /** 0-indexed page in the ORIGINAL document. */
      src: number;
      /** Rotation delta over the page's stored /Rotate. */
      rotate: PageRotation;
    }
  | { kind: 'blank'; id: string; width: number; height: number }
  | {
      kind: 'image';
      id: string;
      uri: string;
      mode: 'fit' | 'fill';
      pageSize: 'match' | FixedPageSizeId;
      /** Neighbour size captured at insert time — what 'match' resolves to. */
      matchSize: { width: number; height: number };
      rotate: PageRotation;
    };

let mintCounter = 0;
/** Ids only need to be unique within one editor session (grid keys, history). */
const mintId = (): string => `spec-${(mintCounter += 1)}`;

export const initialPlan = (pageCount: number): PageSpec[] =>
  Array.from({ length: pageCount }, (_, i) => ({
    kind: 'source' as const,
    id: `src-${i}`,
    src: i,
    rotate: 0 as const,
  }));

/** Effective VISIBLE size of a spec — stored rotation + delta swap w/h. This
 *  is the "neighbouring page's size" oracle for blank/image inserts. */
export const resolveSpecSize = (
  spec: PageSpec,
  srcSizes: SrcPageSize[]
): { width: number; height: number } => {
  if (spec.kind === 'blank') return { width: spec.width, height: spec.height };
  if (spec.kind === 'image') {
    const base = spec.pageSize === 'match' ? spec.matchSize : PAGE_SIZES[spec.pageSize];
    return spec.rotate === 90 || spec.rotate === 270
      ? { width: base.height, height: base.width }
      : { ...base };
  }
  const base = srcSizes[spec.src] ?? { ...PAGE_SIZES.a4, rotation: 0 };
  const effective = (((base.rotation + spec.rotate) % 360) + 360) % 360;
  return effective === 90 || effective === 270
    ? { width: base.height, height: base.width }
    : { width: base.width, height: base.height };
};

/** Size for a page inserted AFTER `index`: the preceding spec's, else the
 *  following one's (insert-at-start), else A4 (empty plan). */
const neighbourSize = (
  plan: PageSpec[],
  index: number,
  srcSizes: SrcPageSize[]
): { width: number; height: number } => {
  const neighbour = plan[index] ?? plan[0];
  return neighbour ? resolveSpecSize(neighbour, srcSizes) : { ...PAGE_SIZES.a4 };
};

export const movePage = (plan: PageSpec[], from: number, to: number): PageSpec[] => {
  if (from === to || from < 0 || to < 0 || from >= plan.length || to >= plan.length) return plan;
  const next = [...plan];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export const duplicatePage = (plan: PageSpec[], index: number): PageSpec[] => {
  const spec = plan[index];
  if (!spec) return plan;
  const next = [...plan];
  next.splice(index + 1, 0, { ...spec, id: mintId() });
  return next;
};

export const rotatePageBy90 = (plan: PageSpec[], index: number): PageSpec[] => {
  const spec = plan[index];
  if (!spec) return plan;
  const next = [...plan];
  if (spec.kind === 'blank') {
    // A blank has no content to rotate — swapping its dims IS the rotation.
    next[index] = { ...spec, width: spec.height, height: spec.width };
  } else {
    next[index] = { ...spec, rotate: (((spec.rotate + 90) % 360) as PageRotation) };
  }
  return next;
};

export const deletePage = (plan: PageSpec[], index: number): PageSpec[] =>
  plan[index] ? plan.filter((_, i) => i !== index) : plan;

/** Inserts a blank page after `index` (-1 = at the start), sized from the
 *  neighbouring page — NOT hardcoded A4 (A4 only when the plan is empty). */
export const insertBlankAfter = (
  plan: PageSpec[],
  index: number,
  srcSizes: SrcPageSize[]
): PageSpec[] => {
  const { width, height } = neighbourSize(plan, index, srcSizes);
  const next = [...plan];
  next.splice(index + 1, 0, { kind: 'blank', id: mintId(), width, height });
  return next;
};

/** Inserts an image page after `index`; 'match' captures the neighbour's
 *  size at insert time (same oracle as blank inserts). */
export const insertImageAfter = (
  plan: PageSpec[],
  index: number,
  srcSizes: SrcPageSize[],
  spec: { uri: string; mode: 'fit' | 'fill'; pageSize: 'match' | FixedPageSizeId }
): PageSpec[] => {
  const next = [...plan];
  next.splice(index + 1, 0, {
    kind: 'image',
    id: mintId(),
    uri: spec.uri,
    mode: spec.mode,
    pageSize: spec.pageSize,
    matchSize: neighbourSize(plan, index, srcSizes),
    rotate: 0,
  });
  return next;
};

/** True when applying the plan would produce a different document. */
export const isDirty = (plan: PageSpec[], srcPageCount: number): boolean => {
  if (plan.length !== srcPageCount) return true;
  return plan.some((spec, i) => spec.kind !== 'source' || spec.src !== i || spec.rotate !== 0);
};
