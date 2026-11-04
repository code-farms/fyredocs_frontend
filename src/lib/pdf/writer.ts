// NOTE: ported from fyredocs_app/src/lib/pdf/writer.ts — keep in sync.
/**
 * On-device PDF writer (Phase 14) — pdf-lib appliers over pagePlan's pure
 * descriptors, plus the image-to-pdf builder. pdf-lib is pure JS: no native
 * module, no rebuild, runs under plain Node in jest. NO expo imports here —
 * image bytes arrive pre-normalized (see imageInput.ts): pdf-lib can only
 * embed JPG/PNG, so WebP/HEIC re-encode before they reach this module.
 *
 * Deferred honestly (see TODO.md Phase 14): pdf-lib cannot encrypt, extract
 * text, or render — those stay backend / Phase 9 / Phase 16.
 */

import { degrees, PDFDocument } from 'pdf-lib';

import {
  MARGIN_PT,
  PAGE_SIZES,
  type FixedPageSizeId,
  type MarginId,
  type PageSpec,
  type SrcPageSize,
} from '@/lib/pdf/pagePlan';

/** Size gate — PDFDocument.load reads the whole file into JS memory (and
 *  save holds ~2-3×). Same rationale as OUTLINE_MAX_BYTES; the server tools
 *  remain the path for bigger files. */
export const WRITER_MAX_BYTES = 25 * 1024 * 1024;

export interface PdfPageInfo {
  pageCount: number;
  sizes: SrcPageSize[];
  encrypted: boolean;
}

/** One-shot probe at editor open; the loaded doc is discarded — the editor
 *  session holds only the plan, never the document. Throws on unparseable
 *  bytes (the screen shows its error state). */
export const readPdfPageInfo = async (bytes: Uint8Array | string): Promise<PdfPageInfo> => {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  const sizes = doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return { width, height, rotation: ((page.getRotation().angle % 360) + 360) % 360 };
  });
  return { pageCount: sizes.length, sizes, encrypted: doc.isEncrypted };
};

/** Image bytes ready for pdf-lib (already JPEG/PNG — see imageInput.ts). */
export interface NormalizedImage {
  bytes: Uint8Array;
  format: 'jpg' | 'png';
}

export interface ImagePlacement {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  drawWidth: number;
  drawHeight: number;
}

/**
 * Pure layout math for placing one image on one page.
 * - `auto` page size: the page takes the image's aspect with the long edge
 *   normalized to A4's (841.89pt) — 12MP photos must not become
 *   multi-thousand-point pages. Margins don't apply (review.tsx rule).
 * - `match`: the captured neighbour size, used as-is (orientation ignored —
 *   matching is the point).
 * - fixed sizes: orientation 'auto' follows the image; margins inset the
 *   content box.
 * - `fit` letterboxes (whole image visible, centered); `fill` covers the
 *   content box (centered, overflow cropped by the page bounds).
 */
export const computeImagePlacement = (
  imgW: number,
  imgH: number,
  opts: {
    pageSize: 'auto' | 'match' | FixedPageSizeId;
    matchSize?: { width: number; height: number };
    orientation: 'auto' | 'portrait' | 'landscape';
    margin: MarginId;
    mode: 'fit' | 'fill';
  }
): ImagePlacement => {
  let pageW: number;
  let pageH: number;
  if (opts.pageSize === 'auto') {
    const long = PAGE_SIZES.a4.height;
    if (imgW >= imgH) {
      pageW = long;
      pageH = (imgH / Math.max(1, imgW)) * long;
    } else {
      pageH = long;
      pageW = (imgW / Math.max(1, imgH)) * long;
    }
  } else if (opts.pageSize === 'match') {
    pageW = opts.matchSize?.width ?? PAGE_SIZES.a4.width;
    pageH = opts.matchSize?.height ?? PAGE_SIZES.a4.height;
  } else {
    ({ width: pageW, height: pageH } = PAGE_SIZES[opts.pageSize]);
  }

  if (opts.pageSize !== 'match') {
    const wantLandscape =
      opts.orientation === 'landscape' || (opts.orientation === 'auto' && imgW > imgH);
    if (wantLandscape && pageH > pageW) [pageW, pageH] = [pageH, pageW];
    if (!wantLandscape && pageW > pageH) [pageW, pageH] = [pageH, pageW];
  }

  const margin =
    opts.pageSize === 'a4' || opts.pageSize === 'letter' || opts.pageSize === 'legal'
      ? MARGIN_PT[opts.margin]
      : 0;
  const boxW = pageW - 2 * margin;
  const boxH = pageH - 2 * margin;
  const scale =
    opts.mode === 'fill'
      ? Math.max(boxW / Math.max(1, imgW), boxH / Math.max(1, imgH))
      : Math.min(boxW / Math.max(1, imgW), boxH / Math.max(1, imgH));
  const drawWidth = imgW * scale;
  const drawHeight = imgH * scale;
  return {
    pageWidth: pageW,
    pageHeight: pageH,
    x: margin + (boxW - drawWidth) / 2,
    y: margin + (boxH - drawHeight) / 2,
    drawWidth,
    drawHeight,
  };
};

const embed = (dst: PDFDocument, img: NormalizedImage) =>
  img.format === 'png' ? dst.embedPng(img.bytes) : dst.embedJpg(img.bytes);

/**
 * Applies a plan to the source bytes, producing a NEW document's bytes (the
 * editor saves as a new library document — the original is never touched).
 * `images` maps image-spec uris to pre-normalized bytes.
 */
export const applyPagePlan = async (
  srcBytes: Uint8Array | string,
  plan: PageSpec[],
  srcSizes: SrcPageSize[],
  images: Map<string, NormalizedImage> = new Map()
): Promise<Uint8Array> => {
  const src = await PDFDocument.load(srcBytes, { ignoreEncryption: true, updateMetadata: false });
  const dst = await PDFDocument.create();
  // One copyPages call in output order — duplicates fall out of a repeated
  // index producing an independent copy.
  const srcIndices = plan.flatMap((spec) => (spec.kind === 'source' ? [spec.src] : []));
  const copied = await dst.copyPages(src, srcIndices);
  let cursor = 0;
  for (const spec of plan) {
    if (spec.kind === 'source') {
      const page = copied[cursor];
      cursor += 1;
      if (spec.rotate !== 0) {
        const stored = srcSizes[spec.src]?.rotation ?? 0;
        page.setRotation(degrees((stored + spec.rotate) % 360));
      }
      dst.addPage(page);
    } else if (spec.kind === 'blank') {
      dst.addPage([spec.width, spec.height]);
    } else {
      const img = images.get(spec.uri);
      if (!img) throw new Error(`No normalized bytes for image page (${spec.uri})`);
      const embedded = await embed(dst, img);
      const placement = computeImagePlacement(embedded.width, embedded.height, {
        pageSize: spec.pageSize,
        matchSize: spec.matchSize,
        orientation: 'auto',
        margin: 'none',
        mode: spec.mode,
      });
      const page = dst.addPage([placement.pageWidth, placement.pageHeight]);
      page.drawImage(embedded, {
        x: placement.x,
        y: placement.y,
        width: placement.drawWidth,
        height: placement.drawHeight,
      });
      if (spec.rotate !== 0) page.setRotation(degrees(spec.rotate));
    }
  }
  return dst.save();
};

/**
 * Copies a page range [start, endExclusive) into a fresh document (Phase 17
 * chunked extraction — each chunk OCRs as its own job). Unlike the page
 * editor this deliberately DOES rebuild via copyPages: the chunk is a
 * throwaway upload, not a preserved original.
 */
export const extractPageRange = async (
  srcBytes: Uint8Array | string,
  start: number,
  endExclusive: number
): Promise<Uint8Array> => {
  const src = await PDFDocument.load(srcBytes, { ignoreEncryption: true, updateMetadata: false });
  const dst = await PDFDocument.create();
  const indices: number[] = [];
  for (let i = Math.max(0, start); i < Math.min(endExclusive, src.getPageCount()); i += 1) {
    indices.push(i);
  }
  const copied = await dst.copyPages(src, indices);
  for (const page of copied) dst.addPage(page);
  return dst.save();
};

/** On-device image-to-pdf options — deliberately its OWN shape: the backend
 *  page-size enum (auto/a4/letter/id) must not change, and `legal`,
 *  orientation and quality exist only on this path. */
export interface ImageToPdfBuildOptions {
  pageSize: 'auto' | FixedPageSizeId;
  margin: MarginId;
  orientation: 'auto' | 'portrait' | 'landscape';
}

/** Builds a PDF from pre-normalized images, one page each, always `fit`. */
export const buildPdfFromImages = async (
  images: NormalizedImage[],
  options: ImageToPdfBuildOptions,
  onProgress?: (done: number, total: number) => void
): Promise<Uint8Array> => {
  const dst = await PDFDocument.create();
  for (let i = 0; i < images.length; i += 1) {
    const embedded = await embed(dst, images[i]);
    const placement = computeImagePlacement(embedded.width, embedded.height, {
      pageSize: options.pageSize,
      orientation: options.orientation,
      margin: options.margin,
      mode: 'fit',
    });
    const page = dst.addPage([placement.pageWidth, placement.pageHeight]);
    page.drawImage(embedded, {
      x: placement.x,
      y: placement.y,
      width: placement.drawWidth,
      height: placement.drawHeight,
    });
    onProgress?.(i + 1, images.length);
  }
  return dst.save();
};
