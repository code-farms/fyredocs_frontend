import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CheckSquare, Square, XCircle, Zap } from 'lucide-react';
import { DocSectionBlock } from '@/components/docs/DocsContent';
import { Heading } from '@/components/ui/typography';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { getToolById } from '@/config/tools';
import type { DocSection } from '@/config/docs';
import type { BlogLang, BlogSection } from '@/content/blog/types';
import { BLOG_UI, formatBlogDate } from '@/content/blog/ui';
import { slugifyHeading } from '@/lib/docsNavigation';
import { cn } from '@/lib/utils';
import type { ToolId } from '@/types';

/** The 2–3 line answer at the top of every post. */
export const QuickAnswer = ({ text, lang }: { text: string; lang: BlogLang }) => (
  <aside className="rounded-xl border border-primary/25 bg-primary/5 p-5" aria-label={BLOG_UI[lang].quickAnswer}>
    <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-primary">
      <Zap className="h-4 w-4" aria-hidden />
      {BLOG_UI[lang].quickAnswer}
    </p>
    <p className="leading-relaxed text-foreground">{text}</p>
  </aside>
);

/** Inline "do it now" card placed at the step where the reader needs the tool. */
const ToolCta = ({ toolId, text }: { toolId: string; text: string }) => {
  const tool = getToolById(toolId as ToolId);
  if (!tool) return null;
  return (
    <Link
      to={tool.route}
      className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <ToolIcon icon={tool.icon} category={tool.category} size="md" />
      <span className="flex-1 font-medium">{text}</span>
      <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  );
};

const DataTable = ({
  section,
  lang,
}: {
  section: Extract<BlogSection, { type: 'dataTable' }>;
  lang: BlogLang;
}) => {
  const ui = BLOG_UI[lang];
  return (
    <div className="space-y-3">
      {section.content && <p className="leading-relaxed text-muted-foreground">{section.content}</p>}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {section.headers.map((h) => (
                <th key={h} scope="col" className="px-4 py-2.5 text-left font-semibold text-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0">
                {row.map((cell, j) => (
                  <td key={j} className={cn('px-4 py-2.5 align-top', j === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          {ui.checkedOn} {formatBlogDate(section.checkedOn, lang)}
        </span>
        <span>
          {ui.source}:{' '}
          {section.sources.map((src, i) => (
            <span key={src.url}>
              {i > 0 && ', '}
              <a href={src.url} target="_blank" rel="nofollow noopener noreferrer" className="underline hover:text-foreground">
                {src.label}
              </a>
            </span>
          ))}
        </span>
      </p>
    </div>
  );
};

/** Tickable list. Ticks are kept in state only — nothing is stored. */
const Checklist = ({ items, lang }: { items: string[]; lang: BlogLang }) => {
  const [done, setDone] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="mb-3 flex items-center justify-between text-sm font-semibold">
        {BLOG_UI[lang].checklist}
        <span className="text-xs font-normal text-muted-foreground" aria-live="polite">
          {done.size}/{items.length}
        </span>
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const checked = done.has(i);
          return (
            <li key={item}>
              <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => toggle(i)}
                className="flex w-full items-start gap-3 rounded-md p-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {checked ? (
                  <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Square className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className={cn('leading-relaxed', checked && 'text-muted-foreground line-through')}>{item}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Mistakes = ({ items, lang }: { items: string[]; lang: BlogLang }) => (
  <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-5">
    <p className="mb-3 text-sm font-semibold text-destructive">{BLOG_UI[lang].mistakes}</p>
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <span className="leading-relaxed text-foreground">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

/** Heading for custom blocks, matching the docs heading anchors so the ToC links work. */
const BlockHeading = ({ heading }: { heading: string }) => (
  <Heading level="h3" as="h2" id={slugifyHeading(heading)} className="mb-3 scroll-mt-24">
    {heading}
  </Heading>
);

const BlogSectionBlock = ({ section, lang }: { section: BlogSection; lang: BlogLang }) => {
  switch (section.type) {
    case 'paragraph':
    case 'tip':
    case 'warning':
      // Standard blocks reuse the docs renderer.
      return <DocSectionBlock section={{ heading: section.heading, type: section.type, content: section.content }} />;
    case 'steps':
    case 'list':
    case 'table': {
      const body: DocSection = {
        type: section.type,
        content: '',
        items: section.type === 'table' ? undefined : section.items,
        tableData: section.type === 'table' ? section.tableData : undefined,
      };
      if (!section.content) return <DocSectionBlock section={{ ...body, heading: section.heading }} />;
      // The docs renderer has no intro line for lists and tables, so add it here.
      return (
        <div>
          {section.heading && <BlockHeading heading={section.heading} />}
          <p className="mb-3 leading-relaxed text-muted-foreground">{section.content}</p>
          <DocSectionBlock section={body} />
        </div>
      );
    }
    default:
      return (
        <div>
          {section.heading && <BlockHeading heading={section.heading} />}
          {section.type === 'toolCta' && <ToolCta toolId={section.toolId} text={section.text} />}
          {section.type === 'dataTable' && <DataTable section={section} lang={lang} />}
          {section.type === 'checklist' && <Checklist items={section.items} lang={lang} />}
          {section.type === 'mistakes' && <Mistakes items={section.items} lang={lang} />}
        </div>
      );
  }
};

export const BlogContent = ({ sections, lang }: { sections: BlogSection[]; lang: BlogLang }) => (
  <div className="space-y-8">
    {sections.map((section, i) => (
      <BlogSectionBlock key={i} section={section} lang={lang} />
    ))}
  </div>
);

/** Thin bar at the top of the viewport showing how far the reader has scrolled. */
export const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary"
      style={{ transform: `scaleX(${progress})` }}
      aria-hidden
    />
  );
};
