/**
 * Fetches PDF bytes for the reader. Both download routes 302 to a presigned
 * URL on the same public origin (Caddy proxies /outputs to MinIO), so a plain
 * credentialed fetch follows the redirect. If the object store is ever served
 * from another origin, fetch fails with a TypeError and the reader falls back
 * to a normal download instead of showing a dead page.
 */
import { buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath } from '@/lib/toolApi';
import { documentDownloadUrl } from '@/lib/documentsApi';
import type { ReaderSource } from './reader';

export type SourceFailure = 'missing' | 'signed-out' | 'unreachable' | 'failed';

export class ReaderSourceError extends Error {
  constructor(readonly reason: SourceFailure) {
    super(reason);
    this.name = 'ReaderSourceError';
  }
}

export const sourceUrl = (source: ReaderSource): string =>
  source.kind === 'job'
    ? buildApiUrl(buildDownloadPath(source.toolId, source.jobId))
    : documentDownloadUrl(source.id, source.orgId);

export const fetchSourceBytes = async (source: ReaderSource, signal?: AbortSignal): Promise<Uint8Array> => {
  let res: Response;
  try {
    res = await fetch(sourceUrl(source), { credentials: 'include', signal });
  } catch (err) {
    if ((err as { name?: string })?.name === 'AbortError') throw err;
    throw new ReaderSourceError('unreachable');
  }
  if (res.status === 404 || res.status === 410) throw new ReaderSourceError('missing');
  if (res.status === 401 || res.status === 403) throw new ReaderSourceError('signed-out');
  if (!res.ok) throw new ReaderSourceError('failed');
  return new Uint8Array(await res.arrayBuffer());
};
