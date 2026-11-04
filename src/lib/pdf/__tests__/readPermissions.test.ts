import { describe, expect, it } from 'vitest';
import { readPermissions, type PDFDocumentProxy } from '@/lib/pdf/pdfjs';

const docWith = (getPermissions: () => Promise<number[] | null>) => ({ getPermissions }) as unknown as PDFDocumentProxy;

describe('readPermissions', () => {
  it('maps pdf.js granted flags onto the /P decoder', async () => {
    // PRINT (4) + PRINT_HIGH_QUALITY (2048) only.
    await expect(readPermissions(docWith(async () => [4, 2048]))).resolves.toMatchObject({ print: true, copy: false, modify: false });
    // COPY_FOR_ACCESSIBILITY (512) counts as copy, as in the app.
    await expect(readPermissions(docWith(async () => [512]))).resolves.toMatchObject({ print: false, copy: true });
  });

  it('is unrestricted for unencrypted files and fails open on errors', async () => {
    await expect(readPermissions(docWith(async () => null))).resolves.toBeNull();
    await expect(readPermissions(docWith(async () => Promise.reject(new Error('x'))))).resolves.toBeNull();
  });
});
