import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiHttpError, apiRequest } from '@/lib/apiClient';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('apiRequest errors', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the envelope error.code on ApiHttpError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(413, { success: false, message: 'Too big', error: { code: 'FILE_TOO_LARGE', details: 'file exceeds 50 MB' } })
      )
    );
    const err = await apiRequest('/api/x').catch((e) => e);
    expect(err).toBeInstanceOf(ApiHttpError);
    expect(err).toMatchObject({ status: 413, code: 'FILE_TOO_LARGE', message: 'file exceeds 50 MB' });
  });

  it('leaves code undefined for bodies without one', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status: 502 })));
    const err = await apiRequest('/api/x').catch((e) => e);
    expect(err).toMatchObject({ status: 502, message: 'bad gateway' });
    expect(err.code).toBeUndefined();
  });
});
