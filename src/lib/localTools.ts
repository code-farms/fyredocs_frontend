/**
 * "Process in browser": the page tools run on-device with pdf-lib (the web
 * side of the app's Phase 14 on-device writer), so the file is never
 * uploaded. Opt-in per run; the server path stays the default, because a
 * browser run leaves no job in My Files or the activity history.
 *
 * Fidelity: page selections follow the SERVER's rules, so the same options
 * give the same pages either way. NOTE: serverPageList mirrors parsePageRange
 * in fyredocs_backend/organize-pdf/processing/processing_free.go (lenient:
 * invalid parts are skipped, the result is de-duplicated and sorted). Reorder
 * is the one deliberate difference: its order is kept here, while the server's
 * parsePageOrder currently sorts it (a known backend bug).
 */
import { PDFDocument } from 'pdf-lib';
import type { ToolId, ToolOptions } from '@/types';
import { initialPlan, type PageRotation, type PageSpec } from '@/lib/pdf/pagePlan';
import { applyPagePlan, buildPdfFromImages, readPdfPageInfo, WRITER_MAX_BYTES, type NormalizedImage } from '@/lib/pdf/writer';

export const LOCAL_TOOLS = new Set<ToolId>(['rotate', 'reorder', 'remove-pages', 'extract-pages', 'merge', 'image-to-pdf']);

/** Tools whose output combines several input files. Every other local tool takes one PDF. */
const MULTI_FILE = new Set<ToolId>(['merge', 'image-to-pdf']);

export class LocalToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalToolError';
  }
}

export interface LocalResult {
  bytes: Uint8Array;
  fileName: string;
}

/** 1-based pages named by `expr` exactly as the server reads them; "" / "all" = every page. */
export const serverPageList = (expr: string, maxPages: number): number[] => {
  const text = expr.trim();
  if (!text || text === 'all') return Array.from({ length: maxPages }, (_, i) => i + 1);
  const seen = new Set<number>();
  for (const raw of text.split(',')) {
    const part = raw.trim();
    if (part.includes('-')) {
      const bits = part.split('-');
      if (bits.length !== 2) continue;
      const start = Number(bits[0].trim());
      const end = Number(bits[1].trim());
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > maxPages || start > end) continue;
      for (let p = start; p <= end; p++) seen.add(p);
    } else {
      const page = Number(part);
      if (Number.isInteger(page) && page >= 1 && page <= maxPages) seen.add(page);
    }
  }
  return [...seen].sort((a, b) => a - b);
};

/** Like serverPageList but keeps the typed order (and repeats) — what "reorder" means. */
export const pageOrderList = (expr: string, maxPages: number): number[] => {
  const out: number[] = [];
  for (const raw of expr.split(',')) {
    const part = raw.trim();
    const bits = part.split('-');
    if (bits.length === 2) {
      const start = Number(bits[0].trim());
      const end = Number(bits[1].trim());
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end > maxPages || start > end) continue;
      for (let p = start; p <= end; p++) out.push(p);
    } else if (bits.length === 1) {
      const page = Number(part);
      if (part && Number.isInteger(page) && page >= 1 && page <= maxPages) out.push(page);
    }
  }
  return out;
};

const stem = (name: string) => name.replace(/\.[^.]+$/, '') || 'document';

const readPdf = async (file: File): Promise<Uint8Array> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = await readPdfPageInfo(bytes).catch(() => {
    throw new LocalToolError(`${file.name} isn't a readable PDF — try Repair PDF, or turn off “Process in browser”.`);
  });
  if (info.encrypted) {
    throw new LocalToolError(`${file.name} is password-protected — unlock it first, or turn off “Process in browser”.`);
  }
  return bytes;
};

const planFor = (count: number, keep: number[], rotateBy?: { pages: Set<number>; by: PageRotation }): PageSpec[] => {
  const base = initialPlan(count);
  return keep.map((page) => {
    const spec = base[page - 1];
    return rotateBy?.pages.has(page) && spec.kind === 'source' ? { ...spec, rotate: rotateBy.by } : spec;
  });
};

/** Canvas re-encode for formats pdf-lib can't embed (WebP) and to apply EXIF orientation. */
const normalizeImage = async (file: File): Promise<NormalizedImage> => {
  if (file.type === 'image/png') return { bytes: new Uint8Array(await file.arrayBuffer()), format: 'png' };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new LocalToolError(`${file.name} couldn't be read as an image.`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  canvas.width = canvas.height = 0;
  if (!blob) throw new LocalToolError(`${file.name} couldn't be converted.`);
  return { bytes: new Uint8Array(await blob.arrayBuffer()), format: 'jpg' };
};

/**
 * Why a local run can't start (too many files, too large), or null when it
 * can. Checked before any work so the user is told up front.
 */
export const localBlocker = (toolId: ToolId, files: File[]): string | null => {
  if (!LOCAL_TOOLS.has(toolId)) return 'This tool runs on the server only.';
  if (!MULTI_FILE.has(toolId) && files.length > 1) {
    return 'Processing in the browser handles one PDF at a time — remove the extra files or turn it off.';
  }
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total > WRITER_MAX_BYTES) {
    return `Processing in the browser is limited to ${WRITER_MAX_BYTES / (1024 * 1024)} MB — turn it off for larger files.`;
  }
  return null;
};

export const runLocalTool = async (toolId: ToolId, files: File[], options: ToolOptions): Promise<LocalResult> => {
  const blocker = localBlocker(toolId, files);
  if (blocker) throw new LocalToolError(blocker);
  const opts = options as Record<string, unknown>;

  if (toolId === 'image-to-pdf') {
    const images: NormalizedImage[] = [];
    for (const file of files) images.push(await normalizeImage(file));
    const bytes = await buildPdfFromImages(images, { pageSize: 'auto', orientation: 'auto', margin: 'none' });
    return { bytes, fileName: `${stem(files[0].name)}${files.length > 1 ? '-and-more' : ''}.pdf` };
  }

  if (toolId === 'merge') {
    if (files.length < 2) throw new LocalToolError('Add at least two PDFs to merge.');
    const out = await PDFDocument.create();
    for (const file of files) {
      const src = await PDFDocument.load(await readPdf(file), { updateMetadata: false });
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    return { bytes: await out.save(), fileName: `${stem(files[0].name)}-merged.pdf` };
  }

  const file = files[0];
  const bytes = await readPdf(file);
  const info = await readPdfPageInfo(bytes);
  const n = info.pageCount;
  let keep: number[];
  let rotate: { pages: Set<number>; by: PageRotation } | undefined;
  let suffix: string;

  switch (toolId) {
    case 'rotate': {
      const by = Number(opts.rotation) as PageRotation;
      if (![90, 180, 270].includes(by)) throw new LocalToolError('Choose 90, 180 or 270 degrees.');
      const applyTo = String(opts.applyToPages ?? 'all');
      keep = serverPageList('', n);
      const pages = keep.filter((p) => applyTo === 'all' || (applyTo === 'odd' ? p % 2 === 1 : applyTo === 'even' ? p % 2 === 0 : true));
      rotate = { pages: new Set(pages), by };
      suffix = 'rotated';
      break;
    }
    case 'reorder':
      keep = pageOrderList(String(opts.order ?? ''), n);
      if (keep.length === 0) throw new LocalToolError(`Enter a page order using pages 1–${n}.`);
      suffix = 'reordered';
      break;
    case 'remove-pages': {
      const remove = new Set(serverPageList(String(opts.pages ?? ''), n));
      if (remove.size === 0) throw new LocalToolError(`None of those pages exist — this PDF has ${n} pages.`);
      keep = serverPageList('', n).filter((p) => !remove.has(p));
      if (keep.length === 0) throw new LocalToolError("That would remove every page — keep at least one.");
      suffix = 'pages-removed';
      break;
    }
    case 'extract-pages':
      keep = serverPageList(String(opts.pages ?? ''), n);
      if (keep.length === 0) throw new LocalToolError(`None of those pages exist — this PDF has ${n} pages.`);
      suffix = 'extracted';
      break;
    default:
      throw new LocalToolError('This tool runs on the server only.');
  }

  const out = await applyPagePlan(bytes, planFor(n, keep, rotate), info.sizes);
  return { bytes: out, fileName: `${stem(file.name)}-${suffix}.pdf` };
};
