import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/typography';
import { ThumbRail } from './ThumbRail';
import type { OutlineEntry, PDFDocumentProxy } from '@/lib/pdf/pdfjs';
import type { Bookmark } from '@/lib/reader/readerStore';
import { cn } from '@/lib/utils';

export type SidePanelTab = 'pages' | 'contents' | 'bookmarks';

interface ReaderSidePanelProps {
  doc: PDFDocumentProxy;
  currentPage: number;
  filter?: string;
  tab: SidePanelTab;
  outline: OutlineEntry[] | null;
  bookmarks: Bookmark[];
  onTab: (tab: SidePanelTab) => void;
  onSelect: (page: number) => void;
  onRenameBookmark: (page: number, label: string) => void;
  onRemoveBookmark: (page: number) => void;
}

const BookmarkRow = ({
  bookmark,
  onSelect,
  onRename,
  onRemove,
}: {
  bookmark: Bookmark;
  onSelect: () => void;
  onRename: (label: string) => void;
  onRemove: () => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bookmark.label);

  if (editing) {
    const save = () => {
      onRename(draft);
      setEditing(false);
    };
    return (
      <li className="px-2 py-1">
        <Input
          autoFocus
          aria-label={`Rename bookmark for page ${bookmark.page}`}
          className="h-8"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-1 rounded-md px-2 hover:bg-muted">
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 py-2 text-left">
        <Text variant="body-sm" as="span" className="block truncate">
          {bookmark.label}
        </Text>
        <Text variant="caption" tone="muted" as="span">
          Page {bookmark.page}
        </Text>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => {
          setDraft(bookmark.label);
          setEditing(true);
        }}
        aria-label={`Rename bookmark ${bookmark.label}`}
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} aria-label={`Remove bookmark ${bookmark.label}`}>
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </li>
  );
};

export const ReaderSidePanel = ({
  doc,
  currentPage,
  filter,
  tab,
  outline,
  bookmarks,
  onTab,
  onSelect,
  onRenameBookmark,
  onRemoveBookmark,
}: ReaderSidePanelProps) => (
  <Tabs value={tab} onValueChange={(v) => onTab(v as SidePanelTab)} className="flex w-60 shrink-0 flex-col border-r bg-card">
    <TabsList className="m-2 grid grid-cols-3">
      <TabsTrigger value="pages">Pages</TabsTrigger>
      <TabsTrigger value="contents">Contents</TabsTrigger>
      <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
    </TabsList>

    <TabsContent value="pages" className="mt-0 min-h-0 flex-1 overflow-y-auto">
      <ThumbRail doc={doc} currentPage={currentPage} filter={filter} onSelect={onSelect} />
    </TabsContent>

    <TabsContent value="contents" className="mt-0 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
      {outline === null ? (
        <Text variant="body-sm" tone="muted" className="p-2">
          Loading contents…
        </Text>
      ) : outline.length === 0 ? (
        <Text variant="body-sm" tone="muted" className="p-2">
          This PDF has no table of contents.
        </Text>
      ) : (
        <ul>
          {outline.map((entry, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={entry.page === null}
                onClick={() => entry.page && onSelect(entry.page)}
                className={cn(
                  'flex w-full items-baseline gap-2 rounded-md py-1.5 pr-2 text-left text-body-sm hover:bg-muted disabled:opacity-60',
                  entry.depth > 0 ? 'pl-6 text-muted-foreground' : 'pl-2 font-medium'
                )}
              >
                <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                {entry.page !== null && <span className="text-caption tabular-nums text-muted-foreground">{entry.page}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </TabsContent>

    <TabsContent value="bookmarks" className="mt-0 min-h-0 flex-1 overflow-y-auto px-1 pb-2">
      {bookmarks.length === 0 ? (
        <Text variant="body-sm" tone="muted" className="p-2">
          No bookmarks yet. Use the bookmark button in the toolbar to save the current page.
        </Text>
      ) : (
        <ul>
          {bookmarks.map((b) => (
            <BookmarkRow
              key={b.page}
              bookmark={b}
              onSelect={() => onSelect(b.page)}
              onRename={(label) => onRenameBookmark(b.page, label)}
              onRemove={() => onRemoveBookmark(b.page)}
            />
          ))}
        </ul>
      )}
    </TabsContent>
  </Tabs>
);
