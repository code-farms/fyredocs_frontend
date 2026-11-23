import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, CheckCircle2, FileText, Search, Shield, Trash2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { useCommandPalette } from '@/components/common/CommandPalette';
import { getAllTools } from '@/config/tools';

const trustChips = [
  { icon: Trash2, label: 'Files auto-delete — you control retention' },
  { icon: UserX, label: 'No account needed for basic tools' },
  { icon: Shield, label: 'Encrypted in transit (HTTPS)' },
];

const mockFiles = [
  { name: 'quarterly-report.pdf', size: '2.4 MB' },
  { name: 'contract-final.pdf', size: '870 KB' },
  { name: 'scanned-invoice.pdf', size: '1.1 MB' },
];

export const Hero = () => {
  const { setOpen } = useCommandPalette();
  const toolCount = getAllTools().length;

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-1/4 -top-1/2 h-[800px] w-[800px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 h-[600px] w-[600px] rounded-full bg-brand-700/5 blur-3xl" />
      </div>

      <div className="container relative py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left zone: copy + CTAs */}
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-2 text-body-sm font-medium text-primary">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Free online PDF tools
            </div>

            <Heading level="display" responsive className="mb-6">
              Your documents, <span className="gradient-text">simplified</span>
            </Heading>

            <Text variant="body-lg" tone="muted" className="mb-8">
              Edit, convert, merge, compress — handle any PDF task in seconds. Nothing to install,
              and you don&apos;t even need an account to start.
            </Text>

            {/* CTAs */}
            <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button variant="gradient" size="xl" asChild>
                <Link to="/all-tools">
                  Explore All Tools
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>

            {/* Search affordance — opens the command palette */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mb-10 inline-flex h-11 w-full max-w-md items-center gap-3 rounded-md border border-input bg-card px-4 text-left text-body-sm text-muted-foreground transition-colors duration-fast hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1 truncate">Search {toolCount} tools…</span>
              <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-caption text-muted-foreground sm:inline-block">
                ⌘K
              </kbd>
            </button>

            {/* Trust chips */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
              {trustChips.map((chip) => (
                <div key={chip.label} className="flex items-center gap-2 text-muted-foreground">
                  <chip.icon className="h-4 w-4 text-primary" aria-hidden />
                  <span className="text-body-sm font-medium">{chip.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right zone: decorative dropzone mock (lg and up) */}
          <m.div
            className="hidden lg:block"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            aria-hidden
          >
            <m.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg"
            >
              {/* Dropzone area */}
              <div className="mb-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-300 bg-brand-500/5 px-6 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="text-body-sm font-medium text-foreground">Drop your PDFs here</p>
                <p className="mt-1 text-caption text-muted-foreground">or click to browse files</p>
              </div>

              {/* Processed file rows */}
              <div className="space-y-2">
                {mockFiles.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-body-sm text-foreground">
                      {file.name}
                    </span>
                    <span className="text-caption text-muted-foreground">{file.size}</span>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  </div>
                ))}
              </div>
            </m.div>
          </m.div>
        </div>
      </div>
    </section>
  );
};
