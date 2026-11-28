/**
 * Over the OCR page limit: instead of a dead end, split the scan into parts
 * that each fit the plan (OCR'd as one batch, then optionally merged back), or
 * keep only the first pages. Everything runs in the browser with the same
 * pdf-lib helpers as "Process in browser" (lib/localTools.ts), so the worker
 * still sees ordinary files that are each under its per-job page limit.
 */
import type { ToolDefinition } from '@/types';
import { runLocalTool } from '@/lib/localTools';
import { WRITER_MAX_BYTES } from '@/lib/pdf/writer';
import { MB, type PlanLimits } from '@/lib/uploadLimits';

/** A 1-based, inclusive page range. */
export interface PageRange {
  from: number;
  to: number;
}

const stem = (name: string) => name.replace(/\.[^.]+$/, '') || 'document';

export const rangeLabel = (r: PageRange) => (r.from === r.to ? `${r.from}` : `${r.from}–${r.to}`);

/**
 * Balanced parts of at most `limit` pages: the fewest parts that fit, with
 * sizes as even as possible (12 pages at 10 → 1–6 and 7–12, not 10 + 2).
 */
export const planOcrParts = (pages: number, limit: number): PageRange[] => {
  if (pages <= 0 || limit <= 0) return [];
  const count = Math.ceil(pages / limit);
  const size = Math.ceil(pages / count);
  const parts: PageRange[] = [];
  for (let from = 1; from <= pages; from += size) parts.push({ from, to: Math.min(pages, from + size - 1) });
  return parts;
};

/**
 * Why the scan cannot be split for this plan, or null when it can: the browser
 * writer's size cap, the files-per-job limit (counting files already added),
 * and the per-file / per-job size limits.
 */
export const splitBlocker = (
  file: File,
  parts: PageRange[],
  limits: PlanLimits,
  tool: Pick<ToolDefinition, 'maxFiles'>,
  existingFiles = 0
): string | null => {
  if (parts.length < 2) return 'This scan does not need splitting.';
  if (file.size > WRITER_MAX_BYTES) {
    return `Splitting runs on your device and handles files up to ${WRITER_MAX_BYTES / MB} MB.`;
  }
  const maxFiles = Math.min(limits.maxFilesPerJob, tool.maxFiles);
  if (existingFiles + parts.length > maxFiles) {
    return `It would need ${parts.length} parts, and your plan runs up to ${maxFiles} files at a time.`;
  }
  if (file.size > limits.maxFileSizeMb * MB || file.size > limits.maxJobInputMb * MB) {
    return 'This file is larger than your plan allows.';
  }
  return null;
};

const toFile = (bytes: Uint8Array, name: string) =>
  new File([bytes as BlobPart], name, { type: 'application/pdf', lastModified: Date.now() });

const extract = async (file: File, range: PageRange, name: string) => {
  const { bytes } = await runLocalTool('extract-pages', [file], { pages: `${range.from}-${range.to}` });
  return toFile(bytes, name);
};

/** One PDF per part, named "<stem> (part i of k).pdf" so the batch lists them in order. */
export const splitForOcr = async (file: File, parts: PageRange[]): Promise<File[]> => {
  const out: File[] = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(await extract(file, parts[i], `${stem(file.name)} (part ${i + 1} of ${parts.length}).pdf`));
  }
  return out;
};

/** Pages 1–n as "<stem> (pages 1-n).pdf". */
export const firstPagesForOcr = (file: File, n: number): Promise<File> =>
  extract(file, { from: 1, to: n }, `${stem(file.name)} (pages 1-${n}).pdf`);

/** Joins the OCR'd parts (in part order) into "<stem> (OCR).pdf"; the text layer is kept. */
export const mergeOcrParts = async (parts: File[], originalStem: string): Promise<File> => {
  const { bytes } = await runLocalTool('merge', parts, {});
  return toFile(bytes, `${originalStem} (OCR).pdf`);
};

export const fileStem = stem;
