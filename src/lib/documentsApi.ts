import { apiJson, apiRequest, buildApiUrl } from '@/lib/apiClient';

// ---- document-service shapes ----
export interface ApiTag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
}

export interface ApiFolder {
  id: string;
  parentId?: string | null;
  name: string;
  createdAt: string;
}

export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface ApiDocument {
  id: string;
  /** Workspace the document belongs to; null/absent for personal documents. */
  organizationId?: string | null;
  folderId?: string | null;
  name: string;
  fileType?: string;
  mimeType?: string;
  fileSize: number;
  thumbnailPath?: string;
  status: DocumentStatus;
  metadata?: Record<string, unknown>;
  /** Saved AI extract type (document-service, web roadmap D1). */
  docType?: string;
  /** Saved AI extract result; never present for id_document. */
  extraction?: unknown;
  uploadedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags?: ApiTag[];
}

export interface DocumentListParams {
  status?: string;
  folderId?: string;
  tagId?: string;
  q?: string;
  page?: number;
  limit?: number;
  /** List soft-deleted documents (Trash view). */
  trashed?: boolean;
  /** Organization scope; omit/undefined for personal documents. */
  orgId?: string;
  /** Only documents with this saved extract type (e.g. 'receipt'). */
  docType?: string;
}

type Envelope<T> = { success: boolean; message: string; data: T; meta?: { total?: number; page?: number; limit?: number } };

/** List documents. Resolves to empty on failure (service not yet populated/up). */
export const listDocuments = async (params: DocumentListParams = {}): Promise<{ documents: ApiDocument[]; total: number }> => {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.folderId) q.set('folderId', params.folderId);
  if (params.tagId) q.set('tagId', params.tagId);
  if (params.q) q.set('q', params.q);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.trashed) q.set('trashed', 'true');
  if (params.orgId) q.set('orgId', params.orgId);
  if (params.docType) q.set('docType', params.docType);
  const qs = q.toString();
  try {
    const res = await apiJson<Envelope<ApiDocument[]>>(`/api/documents${qs ? `?${qs}` : ''}`);
    return { documents: res.data ?? [], total: res.meta?.total ?? (res.data?.length ?? 0) };
  } catch {
    return { documents: [], total: 0 };
  }
};

export interface CreateDocumentInput {
  name: string;
  folderId?: string;
  fileType?: string;
  mimeType?: string;
  fileSize?: number;
  storagePath?: string;
  status?: DocumentStatus;
  metadata?: Record<string, unknown>;
}

export const createDocument = (input: CreateDocumentInput): Promise<ApiDocument> =>
  apiJson<Envelope<ApiDocument>>('/api/documents', { method: 'POST', body: JSON.stringify(input) }).then((r) => r.data);

export const deleteDocument = (id: string, orgId?: string): Promise<void> =>
  apiRequest(`/api/documents/${id}${orgId ? `?orgId=${orgId}` : ''}`, { method: 'DELETE' }).then(() => undefined);

export const restoreDocument = (id: string): Promise<void> =>
  apiJson(`/api/documents/${id}/restore`, { method: 'POST' }).then(() => undefined);

export const purgeDocument = (id: string): Promise<void> =>
  apiRequest(`/api/documents/${id}/permanent`, { method: 'DELETE' }).then(() => undefined);

export interface UpdateDocumentInput {
  name?: string;
  /** Empty string moves the document to the root (no folder). */
  folderId?: string;
  status?: DocumentStatus;
  metadata?: Record<string, unknown>;
  /** Move scope: an org id, or "" for personal. */
  organizationId?: string;
  /** 16-hex text fingerprint for near-duplicate detection; "" clears it. */
  simhash?: string;
}

export const updateDocument = (id: string, patch: UpdateDocumentInput, orgId?: string): Promise<ApiDocument> =>
  apiJson<Envelope<ApiDocument>>(`/api/documents/${id}${orgId ? `?orgId=${orgId}` : ''}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  }).then((r) => r.data);

const orgQuery = (orgId?: string) => (orgId ? `?orgId=${orgId}` : '');

/** document-service download route: 302 to a 5-minute presigned URL, 404 when no bytes are stored. */
export const documentDownloadUrl = (id: string, orgId?: string): string =>
  buildApiUrl(`/api/documents/${id}/download${orgQuery(orgId)}`);

export type DocumentDownloadResult = 'started' | 'missing' | 'signed-out' | 'failed';

/**
 * Downloads a document's stored bytes — the path for documents backed up from
 * the mobile app, which have no processing job to download from.
 *
 * Probes with redirect:'manual' first: following the 302 from fetch would need
 * CORS on the object store, and navigating blindly turns a 404 ("no stored
 * file") into a JSON error page. Only a redirect navigates; the presigned URL
 * answers with Content-Disposition: attachment, so the page stays put.
 */
export const downloadDocument = async (id: string, orgId?: string): Promise<DocumentDownloadResult> => {
  const url = documentDownloadUrl(id, orgId);
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'include', redirect: 'manual' });
  } catch {
    return 'failed';
  }
  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400) || res.ok) {
    window.location.assign(url);
    return 'started';
  }
  if (res.status === 404) return 'missing';
  if (res.status === 401) return 'signed-out';
  return 'failed';
};

export const attachTag = (documentId: string, tagId: string, orgId?: string): Promise<void> =>
  apiJson(`/api/documents/${documentId}/tags${orgQuery(orgId)}`, { method: 'POST', body: JSON.stringify({ tagId }) }).then(() => undefined);

export const detachTag = (documentId: string, tagId: string, orgId?: string): Promise<void> =>
  apiRequest(`/api/documents/${documentId}/tags/${tagId}${orgQuery(orgId)}`, { method: 'DELETE' }).then(() => undefined);

export const createFolder = (name: string, parentId?: string, orgId?: string): Promise<ApiFolder> =>
  apiJson<Envelope<ApiFolder>>('/api/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parentId, organizationId: orgId }),
  }).then((r) => r.data);

export const deleteFolder = (id: string, orgId?: string): Promise<void> =>
  apiRequest(`/api/folders/${id}${orgQuery(orgId)}`, { method: 'DELETE' }).then(() => undefined);

export const createTag = (name: string, color?: string, orgId?: string): Promise<ApiTag> =>
  apiJson<Envelope<ApiTag>>('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name, color, organizationId: orgId }),
  }).then((r) => r.data);

export const deleteTag = (id: string, orgId?: string): Promise<void> =>
  apiRequest(`/api/tags/${id}${orgQuery(orgId)}`, { method: 'DELETE' }).then(() => undefined);

/**
 * Hints that a job should finalize into an organization workspace. Best-effort:
 * called at job creation; document-service applies it when the job completes.
 */
export const setJobWorkspaceHint = async (jobId: string, organizationId: string): Promise<void> => {
  try {
    await apiJson('/api/documents/workspace-hint', { method: 'POST', body: JSON.stringify({ jobId, organizationId }) });
  } catch {
    // Non-fatal: the document still finalizes into the personal library.
  }
};

export const listFolders = async (orgId?: string): Promise<ApiFolder[]> => {
  try {
    const res = await apiJson<Envelope<ApiFolder[]>>(`/api/folders${orgId ? `?orgId=${orgId}` : ''}`);
    return res.data ?? [];
  } catch {
    return [];
  }
};

export const listTags = async (orgId?: string): Promise<ApiTag[]> => {
  try {
    const res = await apiJson<Envelope<ApiTag[]>>(`/api/tags${orgId ? `?orgId=${orgId}` : ''}`);
    return res.data ?? [];
  } catch {
    return [];
  }
};

/**
 * Register many documents (one-time history backfill). Sequential to be gentle
 * on the service; returns the count that succeeded. Skips individual failures.
 */
export const bulkRegisterDocuments = async (inputs: CreateDocumentInput[]): Promise<number> => {
  let ok = 0;
  for (const input of inputs) {
    try {
      await createDocument(input);
      ok += 1;
    } catch {
      // skip and continue
    }
  }
  return ok;
};

// ---- AI extraction + duplicates (document-service, web roadmap D1) ----

/** Saves a document's extract result. id_document is sent as docType only — the server refuses ID details. */
export const saveDocumentExtraction = (
  id: string,
  docType: string,
  extraction: unknown,
  orgId?: string
): Promise<void> =>
  apiJson(`/api/documents/${id}/extraction${orgQuery(orgId)}`, {
    method: 'PUT',
    body: JSON.stringify(docType === 'id_document' ? { docType } : { docType, extraction }),
  }).then(() => undefined);

export interface DuplicateMatches {
  exact: { id: string; name: string }[];
  near: { id: string; name: string; distance?: number }[];
  /** The document's own hash isn't computed yet, so `exact` may be incomplete. */
  pending: boolean;
}

export const getDocumentDuplicates = (id: string, orgId?: string): Promise<DuplicateMatches> =>
  apiJson<Envelope<DuplicateMatches>>(`/api/documents/${id}/duplicates${orgQuery(orgId)}`).then((r) => r.data);

/** Server page size cap (document-service ListDocuments). */
const MAX_PAGE = 100;
/** Hard stop for the receipts walk: 50 pages × 100. */
const MAX_RECEIPT_PAGES = 50;

/**
 * Every live receipt in scope, for the expense CSV. Unlike listDocuments this
 * THROWS on failure — an export that silently came back empty would look like
 * "you have no receipts".
 */
export const listAllReceipts = async (orgId?: string): Promise<ApiDocument[]> => {
  const out: ApiDocument[] = [];
  for (let page = 1; page <= MAX_RECEIPT_PAGES; page++) {
    const q = new URLSearchParams({ docType: 'receipt', limit: String(MAX_PAGE), page: String(page) });
    if (orgId) q.set('orgId', orgId);
    const res = await apiJson<Envelope<ApiDocument[]>>(`/api/documents?${q.toString()}`);
    const batch = res.data ?? [];
    out.push(...batch);
    const total = res.meta?.total ?? out.length;
    if (batch.length < MAX_PAGE || out.length >= total) break;
  }
  return out;
};
