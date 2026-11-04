import { useEffect, useRef, useState } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { isRenderCancelled, renderPage, type PDFDocumentProxy } from '@/lib/pdf/pdfjs';
import type { NormalizedRect } from '@/lib/pdf/oracle/oracleMath';
import { cn } from '@/lib/utils';

/** One search match on this page: its rects (a match can wrap lines) and whether it is the selected one. */
export interface PageHighlight {
  rects: NormalizedRect[];
  active: boolean;
}

interface PageViewProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  /** CSS px per PDF point. */
  scale: number;
  /** Page size in PDF points (placeholder until rendered). */
  size: { width: number; height: number };
  /** Inside the render window: draw the canvas; outside: a sized placeholder. */
  active: boolean;
  filter?: string;
  /** Search matches, drawn above the paper so the theme filter never recolours them. */
  highlights?: PageHighlight[];
}

/**
 * One page cell. A render failure is contained to this tile with its own
 * Retry — the rest of the document stays readable.
 */
export const PageView = ({ doc, pageNumber, scale, size, active, filter, highlights }: PageViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    let cancelled = false;
    let task: Awaited<ReturnType<typeof renderPage>> | null = null;
    renderPage(doc, pageNumber, canvasRef.current, scale)
      .then((t) => {
        task = t;
        if (cancelled) t.cancel();
        return t.promise;
      })
      .catch((err) => {
        if (!cancelled && !isRenderCancelled(err)) setFailed(true);
      });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [active, doc, pageNumber, scale, attempt]);

  const width = Math.floor(size.width * scale);
  const height = Math.floor(size.height * scale);

  return (
    <div
      data-page={pageNumber}
      aria-label={`Page ${pageNumber}`}
      className="relative mx-auto shadow-sm ring-1 ring-border"
      style={{ width, height }}
    >
      {/* Paper + canvas share the theme filter, so placeholders darken in night mode too. */}
      <div className="absolute inset-0 bg-white" style={{ filter }}>
        {active && !failed && <canvas ref={canvasRef} className="block" />}
      </div>
      {highlights?.map((h, i) =>
        h.rects.map((r, j) => (
          <span
            key={`${i}-${j}`}
            aria-hidden
            data-active={h.active || undefined}
            className={cn('pointer-events-none absolute rounded-[2px]', h.active ? 'bg-primary/40 ring-1 ring-primary' : 'bg-warning/40')}
            style={{ left: r.x * width, top: r.y * height, width: r.w * width, height: r.h * height }}
          />
        ))
      )}
      {failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-4 text-center">
          <TriangleAlert className="h-6 w-6 text-warning" aria-hidden />
          <Text variant="body-sm">Page {pageNumber} couldn't be displayed.</Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            <RotateCcw aria-hidden />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
