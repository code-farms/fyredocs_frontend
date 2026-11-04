import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { documentDownloadUrl, downloadDocument } from '@/lib/documentsApi';

describe('downloadDocument', () => {
  const assign = vi.fn();
  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal('location', { ...window.location, assign });
  });
  afterEach(() => vi.unstubAllGlobals());

  const respond = (init: Partial<Response>) =>
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 0, type: 'basic', ...init }));

  it('builds the document download URL with the workspace', () => {
    expect(documentDownloadUrl('d1', 'org1')).toMatch(/\/documents\/d1\/download\?orgId=org1$/);
    expect(documentDownloadUrl('d1')).toMatch(/\/documents\/d1\/download$/);
  });

  it('navigates only after the probe sees the presigned redirect', async () => {
    respond({ type: 'opaqueredirect' });
    await expect(downloadDocument('d1')).resolves.toBe('started');
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/d1\/download$/), { credentials: 'include', redirect: 'manual' });
    expect(assign).toHaveBeenCalledWith(expect.stringMatching(/d1\/download$/));
  });

  it('reports missing bytes, signed-out and other failures without navigating', async () => {
    respond({ status: 404 });
    await expect(downloadDocument('d1')).resolves.toBe('missing');
    respond({ status: 401 });
    await expect(downloadDocument('d1')).resolves.toBe('signed-out');
    respond({ status: 500 });
    await expect(downloadDocument('d1')).resolves.toBe('failed');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(downloadDocument('d1')).resolves.toBe('failed');
    expect(assign).not.toHaveBeenCalled();
  });
});
