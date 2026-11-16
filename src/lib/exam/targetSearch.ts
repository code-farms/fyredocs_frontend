/**
 * Fit an encoded image into a byte range, e.g. "photo 20–50 KB".
 *
 * Pure and platform-free: the caller injects the encoder (canvas.toBlob on the
 * web, expo-image-manipulator on mobile). This file is copied verbatim into
 * fyredocs_app/src/lib/exam/ — keep it free of '@/' and platform imports.
 *
 * Strategy: binary-search JPEG quality for the highest quality that is
 * <= maxBytes. If even the lowest quality is too big and downscaling is
 * allowed, shrink the pixel size step by step and search again. If the best
 * result is below minBytes, pad the JPEG with comment segments (no visual
 * change) so portals that enforce a minimum size accept it.
 */
import { padJpegToSize } from './jpegPad';

/** Exam portals mean 1 KB = 1024 bytes. */
export const KB = 1024;

export interface ByteRange {
  minBytes: number;
  maxBytes: number;
}

export interface Encoded {
  bytes: Uint8Array;
}

/** Encode at a pixel scale (1 = requested size) and JPEG quality (0–1). */
export type Encoder = (scale: number, quality: number) => Promise<Encoded>;

export interface TargetOptions {
  /** Allow shrinking pixel size when quality alone can't get under maxBytes. Off for fixed-size exam photos. */
  allowDownscale?: boolean;
  minQuality?: number;
  maxQuality?: number;
  /** Binary-search steps per scale (each is one encode). */
  steps?: number;
  /** Smallest scale tried when downscaling. */
  minScale?: number;
}

export type TargetStatus = 'ok' | 'padded' | 'too-large';

export interface TargetResult {
  bytes: Uint8Array;
  quality: number;
  scale: number;
  status: TargetStatus;
}

const SCALE_STEP = 0.85;

export const fitToByteRange = async (
  encode: Encoder,
  range: ByteRange,
  opts: TargetOptions = {}
): Promise<TargetResult> => {
  const { minBytes, maxBytes } = range;
  if (!(maxBytes > 0) || minBytes < 0 || minBytes > maxBytes) {
    throw new RangeError(`invalid byte range ${minBytes}–${maxBytes}`);
  }
  const minQ = opts.minQuality ?? 0.05;
  const maxQ = opts.maxQuality ?? 0.95;
  const steps = opts.steps ?? 8;
  const minScale = opts.minScale ?? 0.2;

  let smallest: TargetResult | null = null;

  for (let scale = 1; scale >= minScale - 1e-9; scale *= SCALE_STEP) {
    const best = await searchQuality(encode, scale, maxBytes, minQ, maxQ, steps);
    if (best) return finish(best, range);
    // Nothing fit at this scale: remember the smallest attempt for the error result.
    const low = await encode(scale, minQ);
    if (!smallest || low.bytes.length < smallest.bytes.length) {
      smallest = { bytes: low.bytes, quality: minQ, scale, status: 'too-large' };
    }
    if (!opts.allowDownscale) break;
  }
  return smallest!;
};

/** Highest quality whose output is <= maxBytes at this scale, or null if even minQ is too big. */
const searchQuality = async (
  encode: Encoder,
  scale: number,
  maxBytes: number,
  minQ: number,
  maxQ: number,
  steps: number
): Promise<TargetResult | null> => {
  const top = await encode(scale, maxQ);
  if (top.bytes.length <= maxBytes) return { bytes: top.bytes, quality: maxQ, scale, status: 'ok' };

  let lo = minQ;
  let hi = maxQ;
  let best: TargetResult | null = null;
  const bottom = await encode(scale, lo);
  if (bottom.bytes.length > maxBytes) return null;
  best = { bytes: bottom.bytes, quality: lo, scale, status: 'ok' };

  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2;
    const out = await encode(scale, mid);
    if (out.bytes.length <= maxBytes) {
      lo = mid;
      // JPEG size is only roughly monotonic in quality; keep the largest fitting output.
      if (out.bytes.length >= best.bytes.length) best = { bytes: out.bytes, quality: mid, scale, status: 'ok' };
    } else {
      hi = mid;
    }
  }
  return best;
};

const finish = (best: TargetResult, { minBytes, maxBytes }: ByteRange): TargetResult => {
  if (best.bytes.length >= minBytes) return best;
  // Aim a little above the minimum (portals sometimes round), never past the maximum.
  const margin = Math.min(512, Math.floor((maxBytes - minBytes) / 2));
  const padded = padJpegToSize(best.bytes, minBytes + margin);
  return { ...best, bytes: padded, status: 'padded' };
};
