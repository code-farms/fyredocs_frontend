import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Download, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoading } from '@/components/common/LoadingState';
import { ReaderView } from '@/components/reader/ReaderView';
import { openPdf, PdfOpenError, type PDFDocumentProxy } from '@/lib/pdf/pdfjs';
import { hasNonEmbeddedFonts } from '@/lib/pdf/fonts';
import { readerSourceFromParams } from '@/lib/reader/reader';
import { fetchSourceBytes, ReaderSourceError, sourceUrl } from '@/lib/reader/source';
import { toast } from '@/lib/toast';

/** Font check parses the whole file with pdf-lib; skip it for very large ones. */
const FONT_CHECK_MAX_BYTES = 25 * 1024 * 1024;

type LoadError =
  | { kind: 'source'; reason: ReaderSourceError['reason'] }
  | { kind: 'open'; reason: PdfOpenError['reason'] };

const ERROR_COPY: Record<string, { title: string; description: string }> = {
  'source:missing': { title: 'File not available', description: 'This file has expired or has no stored copy.' },
  'source:signed-out': { title: 'Sign in to open this file', description: 'Your session has ended. Sign in and try again.' },
  'source:unreachable': {
    title: "Couldn't load the file in the reader",
    description: 'You can still download it and open it in another app.',
  },
  'source:failed': { title: "Couldn't load the file", description: 'Something went wrong fetching it. Try again.' },
  'open:password': {
    title: 'This PDF is password-protected',
    description: 'The reader cannot open encrypted PDFs. Unlock it first, then open the unlocked copy.',
  },
  'open:invalid': {
    title: 'This PDF looks damaged',
    description: 'It is not a valid PDF or it is truncated. Repair PDF may be able to fix it.',
  },
  'open:failed': { title: "The PDF couldn't be opened", description: 'Try again, or download it instead.' },
};

const ReaderPage = () => {
  const [params] = useSearchParams();
  const source = useMemo(() => readerSourceFromParams(params), [params]);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [title, setTitle] = useState('Document');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoadError | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Load bytes (URL source or a local file that never leaves the browser), then open.
  useEffect(() => {
    if (!source && !localFile) return;
    const abort = new AbortController();
    let opened: PDFDocumentProxy | null = null;
    setLoading(true);
    setError(null);
    setDoc(null);
    (async () => {
      try {
        const bytes = localFile ? new Uint8Array(await localFile.arrayBuffer()) : await fetchSourceBytes(source!, abort.signal);
        if (abort.signal.aborted) return;
        // pdf.js detaches the buffer it is given, so the font check gets its own copy.
        const fontCopy = bytes.byteLength <= FONT_CHECK_MAX_BYTES ? bytes.slice() : null;
        opened = await openPdf(bytes);
        if (abort.signal.aborted) return;
        setDoc(opened);
        setTitle(localFile?.name ?? 'Document');
        if (fontCopy) {
          void hasNonEmbeddedFonts(fontCopy).then((missing) => {
            if (missing && !abort.signal.aborted) {
              toast.info('Some fonts are not embedded', 'Text may look slightly different from the original.');
            }
          });
        }
      } catch (err) {
        if (abort.signal.aborted) return;
        if (err instanceof ReaderSourceError) setError({ kind: 'source', reason: err.reason });
        else if (err instanceof PdfOpenError) setError({ kind: 'open', reason: err.reason });
        else setError({ kind: 'open', reason: 'failed' });
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    })();
    return () => {
      abort.abort();
      void opened?.destroy();
    };
  }, [source, localFile, attempt]);

  const downloadUrl = source ? sourceUrl(source) : undefined;

  const head = (
    <Helmet>
      <title>PDF Reader — Fyredocs</title>
      <meta name="description" content="Read PDFs in your browser — zoom, page thumbnails and night mode." />
    </Helmet>
  );

  if (!source && !localFile) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        {head}
        <BookOpen className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
        <Heading level="h1" className="mb-2">
          PDF Reader
        </Heading>
        <Text tone="muted" className="mb-8">
          Open a PDF to read it here. The file stays in your browser — nothing is uploaded.
        </Text>
        <Button asChild size="lg">
          <label className="cursor-pointer">
            <FileUp aria-hidden />
            Open a PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setLocalFile(file);
              }}
            />
          </label>
        </Button>
      </div>
    );
  }

  if (error) {
    const copy = ERROR_COPY[`${error.kind}:${error.reason}`];
    return (
      <div className="container max-w-2xl py-16">
        {head}
        <div className="rounded-xl border bg-card">
          <ErrorState
            title={copy.title}
            description={copy.description}
            onRetry={error.reason === 'failed' || error.reason === 'unreachable' ? () => setAttempt((n) => n + 1) : undefined}
            retryLabel="Try again"
          />
          <div className="flex flex-wrap justify-center gap-2 px-6 pb-6">
            {error.kind === 'open' && error.reason === 'password' && (
              <Button variant="outline" asChild>
                <Link to="/unlock-pdf">Unlock PDF</Link>
              </Button>
            )}
            {error.kind === 'open' && error.reason === 'invalid' && (
              <Button variant="outline" asChild>
                <Link to="/repair-pdf">Repair PDF</Link>
              </Button>
            )}
            {error.kind === 'source' && error.reason === 'signed-out' && (
              <Button variant="outline" asChild>
                <Link to="/signin">Sign in</Link>
              </Button>
            )}
            {downloadUrl && error.reason !== 'missing' && error.reason !== 'signed-out' && (
              <Button variant="outline" asChild>
                <a href={downloadUrl} download>
                  <Download aria-hidden />
                  Download instead
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading || !doc) {
    return (
      <div className="container py-16">
        {head}
        <PageLoading label="Opening PDF…" />
      </div>
    );
  }

  return (
    <>
      {head}
      <ReaderView doc={doc} title={title} downloadUrl={downloadUrl} />
    </>
  );
};

export default ReaderPage;
