/**
 * Grow a JPEG to an exact byte size by inserting COM (comment) segments right
 * after the SOI marker. Decoders ignore COM, so the image is unchanged.
 * Pure; copied verbatim into fyredocs_app/src/lib/exam/.
 */

const SEGMENT_OVERHEAD = 4; // FF FE + 2-byte length
const MAX_PAYLOAD = 65533; // length field max 0xFFFF includes its own 2 bytes

export const isJpeg = (bytes: Uint8Array): boolean =>
  bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

/**
 * Returns a JPEG of exactly `targetSize` bytes when possible. If the gap is
 * 1–3 bytes (smaller than one empty segment) the result overshoots by up to 3.
 * Returns the input unchanged when it is already >= targetSize.
 */
export const padJpegToSize = (bytes: Uint8Array, targetSize: number): Uint8Array => {
  if (!isJpeg(bytes)) throw new TypeError('not a JPEG');
  let need = targetSize - bytes.length;
  if (need <= 0) return bytes;
  if (need < SEGMENT_OVERHEAD) need = SEGMENT_OVERHEAD;

  const segments: number[] = [];
  while (need > 0) {
    let payload = Math.min(MAX_PAYLOAD, need - SEGMENT_OVERHEAD);
    const after = need - SEGMENT_OVERHEAD - payload;
    // Don't leave a remainder too small for another segment.
    if (after > 0 && after < SEGMENT_OVERHEAD) payload -= SEGMENT_OVERHEAD - after;
    segments.push(payload);
    need -= SEGMENT_OVERHEAD + payload;
  }

  const extra = segments.reduce((sum, p) => sum + SEGMENT_OVERHEAD + p, 0);
  const out = new Uint8Array(bytes.length + extra);
  out.set(bytes.subarray(0, 2), 0); // SOI
  let at = 2;
  for (const payload of segments) {
    const len = payload + 2;
    out[at++] = 0xff;
    out[at++] = 0xfe;
    out[at++] = len >> 8;
    out[at++] = len & 0xff;
    out.fill(0x20, at, at + payload); // spaces
    at += payload;
  }
  out.set(bytes.subarray(2), at);
  return out;
};
