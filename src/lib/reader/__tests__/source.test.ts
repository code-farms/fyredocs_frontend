import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSourceBytes, ReaderSourceError, sourceUrl } from '@/lib/reader/source';

const job = { kind: 'job', toolId: 'compress', jobId: 'j1' } as const;

describe('fetchSourceBytes', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the job and document download routes', () => {
    expect(sourceUrl(job)).toMatch(/j1\/download$/);
    expect(sourceUrl({ kind: 'doc', id: 'd1', orgId: 'o' })).toMatch(/documents\/d1\/download\?orgId=o$/);
  });

  it('returns the bytes after following the redirect', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Uint8Array([37, 80, 68, 70]), { status: 200 })));
    await expect(fetchSourceBytes(job)).resolves.toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ credentials: 'include' }));
  });

  it.each([
    [404, 'missing'],
    [410, 'missing'],
    [401, 'signed-out'],
    [500, 'failed'],
  ])('maps HTTP %i to %s', async (status, reason) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status })));
    await expect(fetchSourceBytes(job)).rejects.toEqual(new ReaderSourceError(reason as never));
  });

  it('treats a network/CORS failure as unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchSourceBytes(job)).rejects.toMatchObject({ reason: 'unreachable' });
  });
});
