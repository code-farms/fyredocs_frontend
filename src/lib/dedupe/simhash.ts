// NOTE: ported from fyredocs_app/src/lib/dedupe/simhash.ts — keep in sync.
/**
 * Near-duplicate fingerprints for document text (Phase 23 §3). PURE.
 *
 * Two scans of the same page never share bytes, but their OCR text is
 * nearly identical. A 64-bit SimHash over word 3-shingles maps similar text
 * to fingerprints a few bits apart, so "is this a re-scan?" is a Hamming
 * distance, not a text diff. The 64 bits are two 32-bit halves (hex
 * strings): no BigInt on the hot path.
 *
 * Too little text gives fingerprints that collide on noise, so anything
 * under MIN_SHINGLES returns null — "unknown", never "duplicate".
 */

export const MIN_SHINGLES = 40;
/** Max differing bits (of 64) to call two texts near-duplicates. */
export const NEAR_DUP_BITS = 3;

/** Lowercased word tokens; digits kept (amounts/dates distinguish docs).
 *  Combining marks (\p{M}) belong to the word: Devanagari vowel signs and
 *  viramas would otherwise split every Hindi word in two. */
export const tokenize = (text: string): string[] => text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];

const fnv1a = (s: string, seed: number): number => {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

/** 16 hex chars, or null when the text is too short to fingerprint. */
export const simhash = (text: string): string | null => {
  const words = tokenize(text);
  if (words.length - 2 < MIN_SHINGLES) return null;
  const v = new Int32Array(64);
  for (let i = 0; i + 2 < words.length; i++) {
    const shingle = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    const hi = fnv1a(shingle, 0x811c9dc5);
    const lo = fnv1a(shingle, 0x050c5d1f);
    for (let b = 0; b < 32; b++) {
      v[b] += (hi >>> b) & 1 ? 1 : -1;
      v[32 + b] += (lo >>> b) & 1 ? 1 : -1;
    }
  }
  let hi = 0;
  let lo = 0;
  for (let b = 0; b < 32; b++) {
    if (v[b] > 0) hi |= 1 << b;
    if (v[32 + b] > 0) lo |= 1 << b;
  }
  return (hi >>> 0).toString(16).padStart(8, '0') + (lo >>> 0).toString(16).padStart(8, '0');
};

const popcount = (x: number): number => {
  let n = x >>> 0;
  n -= (n >>> 1) & 0x55555555;
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return (((n + (n >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
};

/** Differing bits between two fingerprints. */
export const hamming = (a: string, b: string): number =>
  popcount(parseInt(a.slice(0, 8), 16) ^ parseInt(b.slice(0, 8), 16)) +
  popcount(parseInt(a.slice(8), 16) ^ parseInt(b.slice(8), 16));

export const isNearDuplicate = (a: string | null, b: string | null): boolean =>
  !!a && !!b && hamming(a, b) <= NEAR_DUP_BITS;
