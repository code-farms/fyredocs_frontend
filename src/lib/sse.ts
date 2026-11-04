// NOTE: ported from fyredocs_app/src/lib/sse.ts — keep in sync.
/**
 * Incremental Server-Sent Events parser (Phase 23). PURE — fed decoded text
 * chunks as they arrive, emits each event's `data` payload. Chunks split
 * anywhere (mid-line, mid-CRLF), so the buffer only releases complete
 * events; multi-line `data:` fields join with "\n" per the SSE spec.
 * Comments (`:keepalive`) and non-data fields (event/id/retry) are ignored —
 * the AI stream carries its type inside the JSON payload.
 */

export interface SseParser {
  push(chunk: string): void;
  /** Flush a trailing event the server ended without a blank line. */
  end(): void;
}

export const createSseParser = (onData: (data: string) => void): SseParser => {
  let buffer = '';
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length > 0) onData(dataLines.join('\n'));
    dataLines = [];
  };

  const line = (raw: string) => {
    if (raw === '') {
      dispatch();
      return;
    }
    if (raw.startsWith(':')) return;
    const colon = raw.indexOf(':');
    const field = colon === -1 ? raw : raw.slice(0, colon);
    let value = colon === -1 ? '' : raw.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    if (field === 'data') dataLines.push(value);
  };

  return {
    push(chunk) {
      buffer += chunk;
      // A trailing "\r" may be half of a CRLF split across chunks — hold it.
      let idx: number;
      while ((idx = buffer.search(/\r\n|\n|\r(?!$)/)) !== -1) {
        const sepLen = buffer.startsWith('\r\n', idx) ? 2 : 1;
        line(buffer.slice(0, idx));
        buffer = buffer.slice(idx + sepLen);
      }
    },
    end() {
      if (buffer.length > 0) line(buffer.replace(/\r$/, ''));
      buffer = '';
      dispatch();
    },
  };
};
