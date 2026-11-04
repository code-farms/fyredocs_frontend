import { useEffect, useRef, useState } from 'react';
import { renderPage, type PDFDocumentProxy } from '@/lib/pdf/pdfjs';
import { cn } from '@/lib/utils';

const THUMB_SCALE = 0.18;

interface ThumbProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  current: boolean;
  filter?: string;
  onSelect: (page: number) => void;
}

/** Renders its tiny canvas only once scrolled into the rail's view. */
const Thumb = ({ doc, pageNumber, current, filter, onSelect }: ThumbProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  useEffect(() => {
    if (!seen || !canvasRef.current) return;
    let task: Awaited<ReturnType<typeof renderPage>> | null = null;
    let cancelled = false;
    renderPage(doc, pageNumber, canvasRef.current, THUMB_SCALE)
      .then((t) => {
        task = t;
        if (cancelled) t.cancel();
        return t.promise;
      })
      // A failed or cancelled thumbnail just stays blank; the page itself has
      // its own error tile.
      .catch(() => undefined);
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [seen, doc, pageNumber]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(pageNumber)}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'flex w-full flex-col items-center gap-1 rounded-md p-2 text-caption text-muted-foreground hover:bg-muted',
        current && 'bg-muted text-foreground'
      )}
    >
      <span className={cn('min-h-[80px] bg-white ring-1 ring-border', current && 'ring-2 ring-primary')}>
        <canvas ref={canvasRef} className="block" style={{ filter }} />
      </span>
      {pageNumber}
    </button>
  );
};

interface ThumbRailProps {
  doc: PDFDocumentProxy;
  currentPage: number;
  filter?: string;
  onSelect: (page: number) => void;
}

export const ThumbRail = ({ doc, currentPage, filter, onSelect }: ThumbRailProps) => (
  <nav aria-label="Pages" className="grid grid-cols-2 gap-1 p-2">
    {Array.from({ length: doc.numPages }, (_, i) => i + 1).map((p) => (
      <Thumb key={p} doc={doc} pageNumber={p} current={p === currentPage} filter={filter} onSelect={onSelect} />
    ))}
  </nav>
);
