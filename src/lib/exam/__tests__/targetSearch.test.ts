import { describe, expect, it } from 'vitest';
import { fitToByteRange, KB, type Encoder } from '../targetSearch';
import { isJpeg, padJpegToSize } from '../jpegPad';

/** Minimal JPEG-shaped bytes: SOI, filler, EOI. */
const fakeJpeg = (size: number): Uint8Array => {
  const b = new Uint8Array(Math.max(size, 6)).fill(0x11);
  b[0] = 0xff;
  b[1] = 0xd8;
  b[2] = 0xff;
  b[b.length - 2] = 0xff;
  b[b.length - 1] = 0xd9;
  return b;
};

/** Size grows with quality and with pixel area, like a real encoder. */
const modelEncoder = (fullSizeAtMaxQ: number): Encoder & { calls: number } => {
  const fn = (async (scale: number, quality: number) => {
    fn.calls++;
    const size = Math.round(fullSizeAtMaxQ * scale * scale * (0.1 + 0.9 * quality));
    return { bytes: fakeJpeg(size) };
  }) as Encoder & { calls: number };
  fn.calls = 0;
  return fn;
};

describe('fitToByteRange', () => {
  it('keeps max quality when it already fits', async () => {
    const r = await fitToByteRange(modelEncoder(30 * KB), { minBytes: 10 * KB, maxBytes: 50 * KB });
    expect(r.status).toBe('ok');
    expect(r.quality).toBe(0.95);
    expect(r.scale).toBe(1);
  });

  it('lowers quality to land inside the range, close to the maximum', async () => {
    const r = await fitToByteRange(modelEncoder(200 * KB), { minBytes: 20 * KB, maxBytes: 50 * KB });
    expect(r.status).toBe('ok');
    expect(r.bytes.length).toBeLessThanOrEqual(50 * KB);
    expect(r.bytes.length).toBeGreaterThan(45 * KB);
    expect(r.scale).toBe(1);
  });

  it('reports too-large without changing pixel size when downscaling is off', async () => {
    const r = await fitToByteRange(modelEncoder(2000 * KB), { minBytes: 10 * KB, maxBytes: 50 * KB });
    expect(r.status).toBe('too-large');
    expect(r.scale).toBe(1);
  });

  it('downscales when allowed and quality alone is not enough', async () => {
    const r = await fitToByteRange(modelEncoder(2000 * KB), { minBytes: 0, maxBytes: 100 * KB }, { allowDownscale: true });
    expect(r.status).toBe('ok');
    expect(r.scale).toBeLessThan(1);
    expect(r.bytes.length).toBeLessThanOrEqual(100 * KB);
  });

  it('pads a too-small result up into the range', async () => {
    const r = await fitToByteRange(modelEncoder(4 * KB), { minBytes: 10 * KB, maxBytes: 20 * KB });
    expect(r.status).toBe('padded');
    expect(r.bytes.length).toBeGreaterThanOrEqual(10 * KB);
    expect(r.bytes.length).toBeLessThanOrEqual(20 * KB);
    expect(isJpeg(r.bytes)).toBe(true);
  });

  it('bounds the number of encodes', async () => {
    const enc = modelEncoder(200 * KB);
    await fitToByteRange(enc, { minBytes: 0, maxBytes: 50 * KB }, { steps: 8 });
    expect(enc.calls).toBeLessThanOrEqual(10);
  });

  it('rejects an invalid range', async () => {
    await expect(fitToByteRange(modelEncoder(1), { minBytes: 5, maxBytes: 1 })).rejects.toThrow(RangeError);
  });
});

describe('padJpegToSize', () => {
  it('hits the exact size and keeps SOI first and the original body after the segments', () => {
    const src = fakeJpeg(1000);
    const out = padJpegToSize(src, 5000);
    expect(out.length).toBe(5000);
    expect([out[0], out[1], out[2], out[3]]).toEqual([0xff, 0xd8, 0xff, 0xfe]);
    expect(out.subarray(out.length - (src.length - 2))).toEqual(src.subarray(2));
  });

  it('splits gaps larger than one segment and stays exact', () => {
    const out = padJpegToSize(fakeJpeg(100), 100 + 65537 + 2);
    expect(out.length).toBe(100 + 65537 + 2);
  });

  it('overshoots by at most 3 bytes for tiny gaps', () => {
    const out = padJpegToSize(fakeJpeg(100), 102);
    expect(out.length).toBeGreaterThanOrEqual(102);
    expect(out.length).toBeLessThanOrEqual(104);
  });

  it('returns the input when already big enough, and rejects non-JPEG', () => {
    const src = fakeJpeg(100);
    expect(padJpegToSize(src, 50)).toBe(src);
    expect(() => padJpegToSize(new Uint8Array([1, 2, 3, 4]), 10)).toThrow(TypeError);
  });
});
