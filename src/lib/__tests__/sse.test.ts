// NOTE: ported from fyredocs_app/src/lib/__tests__/sse.test.ts — keep in sync.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
/// <reference types="jest" />
import { createSseParser } from './../sse';

const collect = (chunks: string[]) => {
  const out: string[] = [];
  const p = createSseParser((d) => out.push(d));
  chunks.forEach((c) => p.push(c));
  p.end();
  return out;
};

describe('createSseParser', () => {
  it('emits one payload per blank-line-terminated event', () => {
    expect(collect(['data: {"a":1}\n\ndata: {"b":2}\n\n'])).toEqual(['{"a":1}', '{"b":2}']);
  });

  it('reassembles events split at any byte boundary', () => {
    const wire = 'data: hello\r\n\r\ndata: world\n\n';
    for (let cut = 1; cut < wire.length; cut++) {
      expect(collect([wire.slice(0, cut), wire.slice(cut)])).toEqual(['hello', 'world']);
    }
  });

  it('joins multi-line data and ignores comments and other fields', () => {
    expect(collect([': keepalive\nevent: x\nid: 3\ndata: a\ndata: b\n\n'])).toEqual(['a\nb']);
  });

  it('flushes a trailing event without a final blank line', () => {
    expect(collect(['data: tail'])).toEqual(['tail']);
  });

  it('skips events with no data lines', () => {
    expect(collect(['event: ping\n\n'])).toEqual([]);
  });
});
