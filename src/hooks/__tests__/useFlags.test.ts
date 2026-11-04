import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchFlags } from '@/hooks/useFlags';

describe('fetchFlags', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps only boolean flags', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { flags: { aiReading: true, cloudBackup: false, typo: 'true', n: 1 } } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    await expect(fetchFlags()).resolves.toEqual({ aiReading: true, cloudBackup: false });
  });

  it('returns no flags for an empty payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: {} }), { status: 200, headers: { 'content-type': 'application/json' } }))
    );
    await expect(fetchFlags()).resolves.toEqual({});
  });
});
