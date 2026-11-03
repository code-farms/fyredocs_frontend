import { Suspense } from 'react';
import { lazyWithReload } from '@/lib/lazyWithReload';
import type { DocSection } from '@/config/docs';
import { Lightbulb, AlertTriangle, Hash } from 'lucide-react';
import { Heading } from '@/components/ui/typography';
import { slugifyHeading } from '@/lib/docsNavigation';
import { toast } from '@/lib/toast';
import { CodeBlock } from './CodeBlock';

const SectionMermaid = lazyWithReload(() =>
  import('./SectionMermaid').then((mod) => ({ default: mod.SectionMermaid })),
);

interface DocsContentProps {
  sections: DocSection[];
}

const SectionParagraph = ({ content }: { content: string }) => (
  <p className="text-muted-foreground leading-relaxed">{content}</p>
);

const SectionSteps = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-muted-foreground">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <span className="leading-relaxed">{item}</span>
      </li>
    ))}
  </ul>
);

const SectionList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 text-muted-foreground">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-2" />
        <span className="leading-relaxed">{item}</span>
      </li>
    ))}
  </ul>
);

const SectionTable = ({ tableData }: { tableData: { headers: string[]; rows: string[][] } }) => (
  <div className="overflow-x-auto rounded-lg border">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/50">
          {tableData.headers.map((header, i) => (
            <th key={i} className="px-4 py-2.5 text-left font-semibold text-foreground">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableData.rows.map((row, i) => (
          <tr key={i} className="border-b last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-2.5 text-muted-foreground">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SectionTip = ({ content }: { content: string }) => (
  <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
    <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
    <p className="text-sm text-foreground leading-relaxed">{content}</p>
  </div>
);

const SectionWarning = ({ content }: { content: string }) => (
  <div className="flex gap-3 rounded-lg border border-warning/30 bg-warning-subtle p-4">
    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden />
    <p className="text-sm text-warning-subtle-foreground leading-relaxed">{content}</p>
  </div>
);

/** Section heading with a stable anchor id and a hover copy-link affordance. */
const SectionHeading = ({ heading }: { heading: string }) => {
  const id = slugifyHeading(heading);

  const copyAnchorLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      // Clipboard unavailable (permissions / insecure context) — fail silently.
    }
  };

  return (
    <Heading
      level="h3"
      as="h2"
      id={id}
      className="group/heading scroll-mt-24 mb-3 flex items-center gap-1.5"
    >
      {heading}
      <button
        type="button"
        onClick={copyAnchorLink}
        aria-label={`Copy link to "${heading}"`}
        className="opacity-0 group-hover/heading:opacity-100 focus-visible:opacity-100 transition-opacity duration-fast rounded-md p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Hash className="w-4 h-4" aria-hidden />
      </button>
    </Heading>
  );
};

export const DocsContent = ({ sections }: DocsContentProps) => {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <div key={index}>
          {section.heading && <SectionHeading heading={section.heading} />}
          {section.type === 'paragraph' && <SectionParagraph content={section.content} />}
          {section.type === 'steps' && section.items && <SectionSteps items={section.items} />}
          {section.type === 'list' && section.items && <SectionList items={section.items} />}
          {section.type === 'table' && section.tableData && <SectionTable tableData={section.tableData} />}
          {section.type === 'tip' && <SectionTip content={section.content} />}
          {section.type === 'warning' && <SectionWarning content={section.content} />}
          {section.type === 'code' && <CodeBlock content={section.content} language={section.language} />}
          {section.type === 'formats' && section.content && <SectionParagraph content={section.content} />}
          {section.type === 'mermaid' && (
            <Suspense fallback={<div className="h-48 rounded-lg border bg-muted/50 animate-pulse" />}>
              <SectionMermaid content={section.content} />
            </Suspense>
          )}
        </div>
      ))}
    </div>
  );
};
