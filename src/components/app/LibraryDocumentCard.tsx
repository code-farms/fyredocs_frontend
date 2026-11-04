import { useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { BookOpen, Building2, Download, FolderInput, MoreVertical, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, type StatusBadgeProps } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FileTypeIcon } from '@/components/app/FileTypeIcon';
import { buildApiUrl } from '@/lib/apiClient';
import { buildDownloadPath, getToolIdByApiName } from '@/lib/toolApi';
import { formatBytes } from '@/lib/userMetrics';
import { downloadDocument, type ApiDocument, type ApiFolder, type ApiTag, type DocumentStatus, type DocumentDownloadResult } from '@/lib/documentsApi';
import { toast } from '@/lib/toast';
import { isPdfName, readerHref, type ReaderSource } from '@/lib/reader/reader';
import type { ToolId } from '@/types';

const STATUS_MAP: Record<DocumentStatus, NonNullable<StatusBadgeProps['status']>> = {
  uploaded: 'idle',
  processing: 'processing',
  ready: 'completed',
  failed: 'failed',
};

/** The processing job a document was registered from, if any. */
function jobOf(doc: ApiDocument): { toolId: ToolId; jobId: string } | null {
  const meta = doc.metadata ?? {};
  const jobId = typeof meta.jobId === 'string' ? meta.jobId : undefined;
  if (!jobId) return null;
  // History-import docs store the frontend toolId; server-finalized docs store
  // the backend toolType (e.g. "merge-pdf") — map it to a toolId.
  let toolId: ToolId | undefined;
  if (typeof meta.toolId === 'string') toolId = meta.toolId as ToolId;
  else if (typeof meta.toolType === 'string') toolId = getToolIdByApiName(meta.toolType);
  return toolId ? { toolId, jobId } : null;
}

/** Download URL when the document was registered from a processing job. */
function downloadUrlFor(doc: ApiDocument): string | null {
  const job = jobOf(doc);
  return job ? buildApiUrl(buildDownloadPath(job.toolId, job.jobId)) : null;
}

/** Reader source: the job output when there is one, else the document's stored bytes. */
function readerSourceFor(doc: ApiDocument): ReaderSource {
  const job = jobOf(doc);
  return job
    ? { kind: 'job', ...job }
    : { kind: 'doc', id: doc.id, ...(doc.organizationId ? { orgId: doc.organizationId } : {}) };
}

const DOWNLOAD_ERRORS: Record<Exclude<DocumentDownloadResult, 'started'>, string> = {
  missing: 'This document has no stored file.',
  'signed-out': 'Sign in again to download this document.',
  failed: "The download couldn't start — try again.",
};

export interface LibraryDocumentCardProps {
  doc: ApiDocument;
  onDelete: (doc: ApiDocument) => void | Promise<void>;
  variant?: 'grid' | 'row';
  /** When provided, enables the "Move to folder" submenu. */
  folders?: ApiFolder[];
  onMove?: (doc: ApiDocument, folderId: string | null) => void;
  /** When provided, enables the "Tags" submenu. */
  tags?: ApiTag[];
  onToggleTag?: (doc: ApiDocument, tagId: string, attached: boolean) => void;
  /** When provided, enables the "Move to workspace" submenu. */
  workspaces?: { id: string; name: string }[];
  currentOrgId?: string | null;
  onMoveToOrg?: (doc: ApiDocument, targetOrgId: string | null) => void;
}

export function LibraryDocumentCard({
  doc,
  onDelete,
  variant = 'grid',
  folders,
  onMove,
  tags,
  onToggleTag,
  workspaces,
  currentOrgId,
  onMoveToOrg,
}: LibraryDocumentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const downloadUrl = downloadUrlFor(doc);
  const meta = [doc.fileType?.toUpperCase(), formatBytes(doc.fileSize)].filter(Boolean).join(' · ');
  const attachedTagIds = new Set((doc.tags ?? []).map((t) => t.id));

  const actions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Document actions">
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isPdfName(doc.name, doc.mimeType) && (
          <DropdownMenuItem asChild>
            <Link to={readerHref(readerSourceFor(doc))}>
              <BookOpen className="mr-2 h-4 w-4" aria-hidden />
              Open in reader
            </Link>
          </DropdownMenuItem>
        )}
        {downloadUrl ? (
          <DropdownMenuItem asChild>
            <a href={downloadUrl} download>
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Download
            </a>
          </DropdownMenuItem>
        ) : (
          // No processing job (e.g. backed up from the mobile app): the
          // document's own stored bytes, if it has any.
          <DropdownMenuItem
            onClick={async () => {
              const result = await downloadDocument(doc.id, doc.organizationId ?? undefined);
              if (result !== 'started') toast.error(DOWNLOAD_ERRORS[result]);
            }}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Download
          </DropdownMenuItem>
        )}

        {folders && onMove && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput className="mr-2 h-4 w-4" aria-hidden />
              Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
              <DropdownMenuItem disabled={!doc.folderId} onClick={() => onMove(doc, null)}>
                No folder
              </DropdownMenuItem>
              {folders.map((f) => (
                <DropdownMenuItem key={f.id} disabled={doc.folderId === f.id} onClick={() => onMove(doc, f.id)}>
                  {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {tags && onToggleTag && tags.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <TagIcon className="mr-2 h-4 w-4" aria-hidden />
              Tags
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
              {tags.map((t) => {
                const attached = attachedTagIds.has(t.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={t.id}
                    checked={attached}
                    onCheckedChange={() => onToggleTag(doc, t.id, attached)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {t.name}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {workspaces && onMoveToOrg && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Building2 className="mr-2 h-4 w-4" aria-hidden />
              Move to workspace
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
              <DropdownMenuItem disabled={(currentOrgId ?? null) === null} onClick={() => onMoveToOrg(doc, null)}>
                Personal
              </DropdownMenuItem>
              {workspaces.map((w) => (
                <DropdownMenuItem key={w.id} disabled={currentOrgId === w.id} onClick={() => onMoveToOrg(doc, w.id)}>
                  {w.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const confirm = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title="Delete this document?"
      description={`${doc.name} will be moved to Trash.`}
      confirmLabel="Delete"
      tone="destructive"
      onConfirm={() => onDelete(doc)}
    />
  );

  if (variant === 'row') {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <FileTypeIcon fileType={doc.fileType} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.name}</p>
          <p className="truncate text-caption text-muted-foreground">{meta}</p>
        </div>
        <StatusBadge status={STATUS_MAP[doc.status]} className="hidden sm:inline-flex" />
        <span className="hidden w-28 shrink-0 text-right text-caption text-muted-foreground md:inline">
          {format(new Date(doc.updatedAt), 'd MMM, p')}
        </span>
        {actions}
        {confirm}
      </div>
    );
  }

  return (
    <Card className="group flex flex-col p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
          <FileTypeIcon fileType={doc.fileType} />
        </div>
        {actions}
      </div>
      <p className="mt-3 truncate text-sm font-medium" title={doc.name}>
        {doc.name}
      </p>
      <p className="truncate text-caption text-muted-foreground">{meta}</p>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={STATUS_MAP[doc.status]} />
        <span className="text-caption text-muted-foreground">{format(new Date(doc.createdAt), 'd MMM')}</span>
      </div>
      {doc.tags && doc.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {doc.tags.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color || 'currentColor' }} />
              {t.name}
            </span>
          ))}
          {doc.tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 3}</span>}
        </div>
      )}
      {confirm}
    </Card>
  );
}
