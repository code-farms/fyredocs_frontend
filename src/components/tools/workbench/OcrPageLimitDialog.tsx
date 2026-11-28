import { useState } from 'react';
import { Info, Scissors, FileText, Sparkles, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { rangeLabel, type PageRange } from '@/lib/ocrSplit';

export interface OcrPageLimitState {
  file: File;
  pages: number;
  limit: number;
  parts: PageRange[];
  /** Why splitting is not offered (too many parts, file too big), or null. */
  splitBlocked: string | null;
}

interface OcrPageLimitDialogProps {
  state: OcrPageLimitState | null;
  busy: boolean;
  onClose: () => void;
  onSplit: (merge: boolean) => void;
  onFirstPages: () => void;
  onSeePlans: () => void;
}

const joinRanges = (parts: PageRange[]) => {
  const labels = parts.map(rangeLabel);
  return labels.length <= 2 ? labels.join(' and ') : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
};

/**
 * Shown when one scan is longer than the plan's OCR page limit. Instead of only
 * an upgrade prompt, it offers to split the scan into parts that fit (OCR'd as a
 * batch, optionally merged back into one PDF) or to OCR just the first pages.
 * Splitting runs in the browser (lib/ocrSplit.ts).
 */
export const OcrPageLimitDialog = ({ state, busy, onClose, onSplit, onFirstPages, onSeePlans }: OcrPageLimitDialogProps) => {
  const [merge, setMerge] = useState(true);
  if (!state) return null;
  const { pages, limit, parts, splitBlocked } = state;

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" aria-hidden />
            Too many pages for one OCR run
          </DialogTitle>
          <DialogDescription>
            This scan has {pages} pages. Your plan does up to {limit} pages per OCR run, so it can’t go in one run.
            Choose how you want to continue:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {splitBlocked === null ? (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
              <Button className="w-full justify-start gap-2" disabled={busy} onClick={() => onSplit(merge)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Scissors className="h-4 w-4" aria-hidden />}
                Split into {parts.length} parts and OCR all
              </Button>
              <p className="mt-2 text-body-sm text-muted-foreground">
                Pages {joinRanges(parts)} — each part fits your plan. Recommended.
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-body-sm">
                <Checkbox checked={merge} onCheckedChange={(v) => setMerge(v === true)} disabled={busy} />
                Merge the results back into one PDF
              </label>
            </div>
          ) : (
            <p className="rounded-xl border bg-muted/40 p-3 text-body-sm text-muted-foreground">
              Splitting isn’t available here: {splitBlocked}
            </p>
          )}

          <Button variant="outline" className="w-full justify-start gap-2" disabled={busy} onClick={onFirstPages}>
            <FileText className="h-4 w-4" aria-hidden />
            OCR only the first {limit} pages
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-2" disabled={busy} onClick={onSeePlans}>
            <Sparkles className="h-4 w-4" aria-hidden />
            See plans with more pages per run
          </Button>
        </div>

        <p className="text-caption text-muted-foreground">Splitting happens on your device — nothing extra is uploaded.</p>
      </DialogContent>
    </Dialog>
  );
};
