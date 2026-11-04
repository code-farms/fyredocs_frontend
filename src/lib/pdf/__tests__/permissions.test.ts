// NOTE: ported from fyredocs_app/src/lib/pdf/__tests__/permissions.test.ts — keep in sync.
import { describe, it, expect } from 'vitest';
/**
 * Pins the /P permission-bit decoder (PDF 32000-1 Table 22) — including the
 * negative int16/int32 values real producers store — and the null contract
 * for unencrypted documents.
 */

import { PDFDocument } from 'pdf-lib';

import { decodePermissionBits, readPdfPermissions } from '@/lib/pdf/permissions';

describe('decodePermissionBits', () => {
  it('all bits set → everything allowed', () => {
    expect(decodePermissionBits(-1)).toEqual({
      print: true,
      copy: true,
      modify: true,
      annotate: true,
      assemble: true,
    });
  });

  it('reserved-only bits (pdfcpu PermissionsNone 0xF0C3 as int16) → nothing allowed', () => {
    // 0xF0C3 sign-extended to int16 is -3901... compute: 0xF0C3 = 61635;
    // as int16: 61635 - 65536 = -3901.
    expect(decodePermissionBits(-3901)).toEqual({
      print: false,
      copy: false,
      modify: false,
      annotate: false,
      assemble: false,
    });
  });

  it('print via bit 3 or bit 12 independently', () => {
    expect(decodePermissionBits(0b100).print).toBe(true); // bit 3
    expect(decodePermissionBits(1 << 11).print).toBe(true); // bit 12
    expect(decodePermissionBits(0).print).toBe(false);
  });

  it('copy via bit 5 or bit 10', () => {
    expect(decodePermissionBits(1 << 4).copy).toBe(true);
    expect(decodePermissionBits(1 << 9).copy).toBe(true);
    expect(decodePermissionBits(0).copy).toBe(false);
  });

  it('modify is bit 4 alone', () => {
    expect(decodePermissionBits(1 << 3).modify).toBe(true);
    expect(decodePermissionBits(~(1 << 3)).modify).toBe(false);
  });

  it('annotate via bit 6 or bit 9; assemble via bit 11', () => {
    expect(decodePermissionBits(1 << 5).annotate).toBe(true);
    expect(decodePermissionBits(1 << 8).annotate).toBe(true);
    expect(decodePermissionBits(1 << 10).assemble).toBe(true);
  });

  it('decodes pdfcpu print-only (PermissionsPrint 0xF8C7 as int16 = -1849)', () => {
    const p = decodePermissionBits(-1849);
    expect(p.print).toBe(true);
    expect(p.copy).toBe(false);
    expect(p.modify).toBe(false);
  });

  it('int32-flavoured negative values decode identically to int16 ones', () => {
    // 0xFFFFF0C3 as int32 === -3901 — same low bits as the int16 form.
    expect(decodePermissionBits(0xfffff0c3 | 0)).toEqual(decodePermissionBits(-3901));
  });
});

describe('readPdfPermissions', () => {
  it('returns null for unencrypted documents', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    expect(await readPdfPermissions(await doc.save())).toBeNull();
  });

  it('rejects unparseable bytes (callers fail open)', async () => {
    await expect(readPdfPermissions(new Uint8Array([1, 2, 3]))).rejects.toThrow();
  });
});
