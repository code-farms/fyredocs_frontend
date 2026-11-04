import { useEffect, useMemo } from 'react';
import { CheckCircle2, Cloud, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { Text } from '@/components/ui/typography';
import type { LocalResult } from '@/lib/localTools';

const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

interface LocalResultCardProps {
  result?: LocalResult;
  error?: string;
  onStartOver: () => void;
  /** Turns browser processing off so the same files go through the server. */
  onUseServer: () => void;
}

/** Outcome of a "Process in browser" run — a Blob download, never a server job. */
export const LocalResultCard = ({ result, error, onStartOver, onUseServer }: LocalResultCardProps) => {
  const url = useMemo(
    () => (result ? URL.createObjectURL(new Blob([result.bytes as BlobPart], { type: 'application/pdf' })) : null),
    [result]
  );
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  if (error || !result || !url) {
    return (
      <div className="rounded-xl border bg-card">
        <ErrorState title="Couldn't process in the browser" description={error ?? 'Something went wrong.'} />
        <div className="flex flex-col gap-2 px-6 pb-6 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={onUseServer}>
            <Cloud aria-hidden />
            Process on the server instead
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onStartOver}>
            <RotateCcw aria-hidden />
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-subtle">
          <CheckCircle2 className="h-6 w-6 text-success" aria-hidden />
        </div>
        <div>
          <h3 className="text-h4 font-semibold">All done!</h3>
          <Text variant="body-sm" tone="muted">
            Processed in your browser — not uploaded and not saved to My Files.
          </Text>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-success/20 bg-success-subtle/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{result.fileName}</p>
          <Text variant="body-sm" tone="muted" as="span">
            {formatFileSize(result.bytes.byteLength)}
          </Text>
        </div>
        <Button variant="gradient" size="lg" asChild className="shrink-0">
          <a href={url} download={result.fileName}>
            <Download aria-hidden />
            Download
          </a>
        </Button>
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={onStartOver}>
        <RotateCcw aria-hidden />
        Start over
      </Button>
    </div>
  );
};
