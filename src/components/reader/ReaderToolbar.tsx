import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Copy, Download, Headphones, PanelLeft, PenLine, Printer, Search, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { READER_THEMES, ZOOM_STEPS, type ReaderTheme } from '@/lib/reader/reader';

interface ReaderToolbarProps {
  title: string;
  page: number;
  pageCount: number;
  zoom: number;
  theme: ReaderTheme;
  thumbsOpen: boolean;
  downloadUrl?: string;
  searchOpen: boolean;
  bookmarked: boolean;
  onPage: (page: number) => void;
  onToggleSearch: () => void;
  onToggleBookmark: () => void;
  /** Omitted when the browser has no speech synthesis. */
  onReadAloud?: () => void;
  readAloudActive?: boolean;
  onPrint: () => void;
  onCopyText: () => void;
  /** Omitted when AI is off (the aiReading flag). */
  onAi?: () => void;
  aiOpen?: boolean;
  onAnnotate: () => void;
  annotating: boolean;
  onZoom: (dir: 1 | -1) => void;
  onTheme: (theme: ReaderTheme) => void;
  onToggleThumbs: () => void;
}

export const ReaderToolbar = ({
  title,
  page,
  pageCount,
  zoom,
  theme,
  thumbsOpen,
  downloadUrl,
  searchOpen,
  bookmarked,
  onPage,
  onToggleSearch,
  onToggleBookmark,
  onReadAloud,
  readAloudActive = false,
  onPrint,
  onCopyText,
  onAi,
  aiOpen = false,
  onAnnotate,
  annotating,
  onZoom,
  onTheme,
  onToggleThumbs,
}: ReaderToolbarProps) => {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isInteger(n) && n >= 1 && n <= pageCount) onPage(n);
    else setDraft(String(page));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleThumbs}
        aria-label={thumbsOpen ? 'Hide side panel' : 'Show side panel'}
        aria-pressed={thumbsOpen}
        className="hidden md:inline-flex"
      >
        <PanelLeft aria-hidden />
      </Button>
      <Text variant="body-sm" className="min-w-0 flex-1 truncate font-medium" title={title}>
        {title}
      </Text>

      <div className="flex items-center gap-1">
        <Input
          aria-label="Page number"
          className="h-8 w-14 text-center"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
        <Text variant="body-sm" tone="muted" as="span">
          of {pageCount}
        </Text>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onZoom(-1)} disabled={zoom <= ZOOM_STEPS[0]} aria-label="Zoom out">
          <ZoomOut aria-hidden />
        </Button>
        <Text variant="body-sm" as="span" className="w-12 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </Text>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onZoom(1)}
          disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
          aria-label="Zoom in"
        >
          <ZoomIn aria-hidden />
        </Button>
      </div>

      <Button variant="ghost" size="icon" onClick={onToggleSearch} aria-label="Search in document" aria-pressed={searchOpen}>
        <Search aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleBookmark}
        aria-label={bookmarked ? 'Remove bookmark from this page' : 'Bookmark this page'}
        aria-pressed={bookmarked}
      >
        {bookmarked ? <BookmarkCheck className="text-primary" aria-hidden /> : <Bookmark aria-hidden />}
      </Button>

      <Button variant="ghost" size="icon" onClick={onAnnotate} aria-label="Annotate" aria-pressed={annotating}>
        <PenLine aria-hidden />
      </Button>
      {onAi && (
        <Button variant="ghost" size="icon" onClick={onAi} aria-label="AI assistant" aria-pressed={aiOpen}>
          <Sparkles aria-hidden />
        </Button>
      )}
      {onReadAloud && (
        <Button variant="ghost" size="icon" onClick={onReadAloud} aria-label="Read aloud" aria-pressed={readAloudActive}>
          <Headphones aria-hidden />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={onCopyText} aria-label="Copy page text">
        <Copy aria-hidden />
      </Button>
      <Button variant="ghost" size="icon" onClick={onPrint} aria-label="Print">
        <Printer aria-hidden />
      </Button>

      <Select value={theme} onValueChange={(v) => onTheme(v as ReaderTheme)}>
        <SelectTrigger className="h-8 w-28" aria-label="Page theme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {READER_THEMES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {downloadUrl && (
        <Button variant="ghost" size="icon" asChild>
          <a href={downloadUrl} download aria-label="Download">
            <Download aria-hidden />
          </a>
        </Button>
      )}
    </div>
  );
};
