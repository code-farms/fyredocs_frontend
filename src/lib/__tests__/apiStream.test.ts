import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiStream, ApiHttpError } from '@/lib/apiClient';

const sse = (chunks: string[]) =>
  new Response(
    new ReadableStream({
      start(c) {
        chunks.forEach((s) => c.enqueue(new TextEncoder().encode(s)));
        c.close();
      },
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } }
  );

describe('apiStream', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses SSE frames split across chunks and drops malformed ones', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sse(['data: {"type":"delta","te', 'xt":"Hi"}\n\ndata: {bad}\n\n', 'data: {"type":"done"}\n\n'])));
    const events: unknown[] = [];
    await apiStream('/api/ai/ops/summarize', { pages: [] }, (e) => events.push(e));
    expect(events).toEqual([{ type: 'delta', text: 'Hi' }, { type: 'done' }]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/ai\/ops\/summarize$/),
      expect.objectContaining({ method: 'POST', credentials: 'include', headers: expect.objectContaining({ Accept: 'text/event-stream' }) })
    );
  });

  it('delivers a JSON fallback as one event', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { text: 'x' } }), { status: 200, headers: { 'content-type': 'application/json' } }))
    );
    const events: unknown[] = [];
    await apiStream('/api/ai/ops/explain', {}, (e) => events.push(e));
    expect(events).toEqual([{ success: true, data: { text: 'x' } }]);
  });

  it('throws ApiHttpError with the code for pre-stream errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, error: { code: 'AI_REQUEST_TOO_LARGE', details: 'too big' } }), {
          status: 413,
          headers: { 'content-type': 'application/json' },
        })
      )
    );
    await expect(apiStream('/api/ai/ops/summarize', {}, () => undefined)).rejects.toMatchObject({
      status: 413,
      code: 'AI_REQUEST_TOO_LARGE',
    });
    expect(ApiHttpError).toBeDefined();
  });
});
