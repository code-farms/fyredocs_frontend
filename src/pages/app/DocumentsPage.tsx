import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Search, FileStack, SearchX, FolderInput, Loader2, FolderPlus, TagsIcon, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { MetricsErrorState } from '@/components/admin/MetricsErrorState';
import { TableSkeleton } from '@/components/common/LoadingState';
import { LibraryDocumentCard } from '@/components/app/LibraryDocumentCard';
import { CreateNamedDialog } from '@/components/app/CreateNamedDialog';
import {
  useDocuments,
  useFolders,
  useTags,
  useDeleteDocument,
  useCreateFolder,
  useCreateTag,
  useMoveDocument,
  useToggleTag,
  useMoveToOrg,
} from '@/hooks/useDocuments';
import { useJobHistory } from '@/hooks/useJobHistory';
import { useActiveOrg } from '@/components/app/ActiveOrgContext';
import { canWrite } from '@/lib/orgsApi';
import { bulkRegisterDocuments, listAllReceipts, type ApiDocument, type CreateDocumentInput } from '@/lib/documentsApi';
import { expenseCsv, receiptRecords, totalsSummary } from '@/lib/expenseExport';
import { getToolById } from '@/config/tools';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'ready' | 'processing' | 'failed';
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'processing', label: 'Processing' },
  { id: 'failed', label: 'Failed' },
];

const DocumentsPage = () => {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [folderDialog, setFolderDialog] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);

  const rawStatus = params.get('status') ?? 'all';
  const status: StatusFilter = STATUS_FILTERS.some((s) => s.id === rawStatus) ? (rawStatus as StatusFilter) : 'all';
  const q = params.get('q') ?? '';
  const folderId = params.get('folderId') ?? '';
  const tagId = params.get('tagId') ?? '';

  const { activeOrgId, activeOrg, orgs } = useActiveOrg();
  const personal = activeOrgId === null;
  const scopeLabel = personal ? 'your library' : (activeOrg?.name ?? 'this workspace');
  const writableOrgs = orgs.filter((o) => canWrite(o.role)).map((o) => ({ id: o.id, name: o.name }));

  const folders = useFolders(activeOrgId ?? undefined);
  const tags = useTags(activeOrgId ?? undefined);
  const { data, isLoading, isError, refetch } = useDocuments({
    status: status === 'all' ? undefined : status,
    folderId: folderId || undefined,
    tagId: tagId || undefined,
    q: q || undefined,
    orgId: activeOrgId ?? undefined,
    limit: 100,
  });
  const del = useDeleteDocument();
  const move = useMoveDocument();
  const toggleTag = useToggleTag();
  const moveToOrg = useMoveToOrg();
  const createFolder = useCreateFolder();
  const createTag = useCreateTag();
  const qc = useQueryClient();

  // Backfill: completed jobs from history not yet in the library (deduped by jobId).
  const libraryAll = useDocuments({ limit: 100 });
  const history = useJobHistory();
  const importable = useMemo(() => {
    if (!personal) return []; // history backfill targets the personal library
    const known = new Set<string>();
    for (const d of libraryAll.data?.documents ?? []) {
      const jid = d.metadata?.jobId;
      if (typeof jid === 'string') known.add(jid);
    }
    return history.jobs.filter((j) => j.state === 'completed' && j.result && !known.has(j.id));
  }, [personal, libraryAll.data, history.jobs]);

  const importMut = useMutation({
    mutationFn: async () => {
      const inputs: CreateDocumentInput[] = importable.map((j) => {
        const tool = getToolById(j.toolId);
        return {
          name: j.result!.fileName,
          fileType: tool?.outputFormat ?? j.result!.fileName.split('.').pop(),
          fileSize: j.result!.fileSize,
          status: 'ready',
          metadata: { jobId: j.id, toolId: j.toolId, toolType: j.toolId },
        };
      });
      return bulkRegisterDocuments(inputs);
    },
    onSuccess: (count) => {
      toast.success(`Imported ${count} file${count === 1 ? '' : 's'} into your library`);
      void qc.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => toast.error('Could not import files from history'),
  });

  const documents = data?.documents ?? [];
  const total = data?.total ?? 0;
  const hasFilters = status !== 'all' || !!q || !!folderId || !!tagId;

  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };

  const handleDelete = async (doc: ApiDocument) => {
    try {
      await del.mutateAsync({ id: doc.id, orgId: activeOrgId ?? undefined });
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Could not delete document', error instanceof Error ? error.message : undefined);
    }
  };

  // Folders/tags are scoped to the active workspace (personal or org).
  // Expense CSV over every receipt whose details were detected (reader → Details).
  const exportReceipts = useMutation({
    mutationFn: async () => receiptRecords(await listAllReceipts(activeOrgId ?? undefined)),
    onSuccess: (records) => {
      if (records.length === 0) {
        toast.info('No receipts yet', 'Open a receipt in the reader and use AI → Details to add it.');
        return;
      }
      const url = URL.createObjectURL(new Blob([expenseCsv(records)], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${records.length} receipt${records.length === 1 ? '' : 's'}`, totalsSummary(records) || undefined);
    },
    onError: () => toast.error("The receipts couldn't be exported — try again."),
  });

  const cardProps = {
    folders: folders.data,
    tags: tags.data,
    onMove: (doc: ApiDocument, fid: string | null) =>
      move.mutate(
        { id: doc.id, folderId: fid, orgId: activeOrgId ?? undefined },
        { onSuccess: () => toast.success(fid ? 'Moved to folder' : 'Removed from folder') },
      ),
    onToggleTag: (doc: ApiDocument, tagId: string, attached: boolean) =>
      toggleTag.mutate({ documentId: doc.id, tagId, attached, orgId: activeOrgId ?? undefined }),
    workspaces: writableOrgs,
    currentOrgId: activeOrgId,
    onMoveToOrg: (doc: ApiDocument, targetOrgId: string | null) =>
      moveToOrg.mutate(
        { id: doc.id, targetOrgId, currentOrgId: activeOrgId ?? undefined },
        { onSuccess: () => toast.success(targetOrgId ? 'Moved to workspace' : 'Moved to Personal') },
      ),
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Helmet>
        <title>Documents — Fyredocs</title>
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-body-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${total} document${total === 1 ? '' : 's'} in ${scopeLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFolderDialog(true)}>
            <FolderPlus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">New folder</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTagDialog(true)}>
            <TagsIcon className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">New tag</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReceipts.mutate()} disabled={exportReceipts.isPending}>
            {exportReceipts.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Receipt className="h-4 w-4" aria-hidden />}
            <span className="hidden sm:inline">Export receipts (CSV)</span>
          </Button>
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}>
              <LayoutGrid className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'}>
              <List className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {importable.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderInput className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium">
                {importable.length} processed file{importable.length === 1 ? '' : 's'} from your history aren’t in your library yet
              </p>
              <p className="text-caption text-muted-foreground">Import them to search, organize, and manage them here.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => importMut.mutate()} disabled={importMut.isPending}>
            {importMut.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Import {importable.length} file{importable.length === 1 ? '' : 's'}
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setParam('q', e.target.value)} placeholder="Search documents…" className="h-9 pl-9" aria-label="Search documents" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setParam('status', f.id)}
              aria-pressed={status === f.id}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-body-sm font-medium transition-colors',
                status === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {folders.data && folders.data.length > 0 && (
          <Select value={folderId || 'all'} onValueChange={(v) => setParam('folderId', v)}>
            <SelectTrigger className="h-9 w-40" aria-label="Filter by folder">
              <SelectValue placeholder="All folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All folders</SelectItem>
              {folders.data.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tags.data && tags.data.length > 0 && (
          <Select value={tagId || 'all'} onValueChange={(v) => setParam('tagId', v)}>
            <SelectTrigger className="h-9 w-36" aria-label="Filter by tag">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.data.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <MetricsErrorState title="Could not load your documents" onRetry={() => refetch()} />
      ) : total === 0 && !hasFilters ? (
        <EmptyState
          icon={FileStack}
          title={personal ? 'Your library is empty' : `No documents in ${scopeLabel}`}
          description={
            personal
              ? 'Documents you process while signed in are saved here automatically — searchable, organizable, and ready to download.'
              : 'Move documents into this workspace from your personal library using the “Move to workspace” action.'
          }
          action={
            personal ? (
              <Button asChild>
                <Link to="/all-tools">Process your first document</Link>
              </Button>
            ) : undefined
          }
        />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No documents match"
          description="Try a different search, status, folder, or tag."
          action={
            hasFilters ? (
              <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {documents.map((doc) => (
            <LibraryDocumentCard key={doc.id} doc={doc} onDelete={handleDelete} {...cardProps} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <LibraryDocumentCard key={doc.id} doc={doc} onDelete={handleDelete} variant="row" {...cardProps} />
          ))}
        </div>
      )}

      <CreateNamedDialog
        open={folderDialog}
        onOpenChange={setFolderDialog}
        title="New folder"
        label="Folder name"
        placeholder="e.g. Invoices"
        submitting={createFolder.isPending}
        onSubmit={async (name) => {
          try {
            await createFolder.mutateAsync({ name, orgId: activeOrgId ?? undefined });
            toast.success('Folder created');
            setFolderDialog(false);
          } catch {
            toast.error('Could not create folder');
          }
        }}
      />
      <CreateNamedDialog
        open={tagDialog}
        onOpenChange={setTagDialog}
        title="New tag"
        label="Tag name"
        placeholder="e.g. Q3"
        withColor
        submitting={createTag.isPending}
        onSubmit={async (name, color) => {
          try {
            await createTag.mutateAsync({ name, color, orgId: activeOrgId ?? undefined });
            toast.success('Tag created');
            setTagDialog(false);
          } catch {
            toast.error('Could not create tag');
          }
        }}
      />
    </div>
  );
};

export default DocumentsPage;
