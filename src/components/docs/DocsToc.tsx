import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';
import { slugifyHeading } from '@/lib/docsNavigation';

interface DocsTocProps {
  /** Anything with optional headings (docs sections, blog sections). */
  sections: ReadonlyArray<{ heading?: string }>;
  className?: string;
  /** Rail title; defaults to "On this page". */
  label?: string;
}

/**
 * "On this page" right rail. Scroll-spy is driven by one IntersectionObserver
 * across all heading anchors; the topmost visible heading wins.
 */
export const DocsToc = ({ sections, className, label = 'On this page' }: DocsTocProps) => {
  const headings = useMemo(
    () =>
      sections
        .map((section) => section.heading)
        .filter((heading): heading is string => Boolean(heading))
        .map((heading) => ({ id: slugifyHeading(heading), title: heading })),
    [sections],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const headingIds = headings.map((h) => h.id).join(',');

  useEffect(() => {
    const ids = headingIds ? headingIds.split(',') : [];
    if (ids.length < 2) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Mark the topmost visible heading active (document order = ids order).
        const active = ids.find((id) => visible.has(id));
        if (active) setActiveId(active);
      },
      // Top offset clears the sticky headers; bottom margin keeps the spy
      // focused on the reading zone rather than the whole viewport.
      { rootMargin: '-96px 0px -60% 0px' },
    );

    const observed: Element[] = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        observed.push(el);
      }
    }

    setActiveId(ids[0] ?? null);
    return () => observer.disconnect();
  }, [headingIds]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label={label} className={cn('hidden xl:block', className)}>
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
        <Text variant="overline" tone="muted" as="div" className="mb-3">
          {label}
        </Text>
        <ul className="border-l border-border">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  'block -ml-px border-l-2 py-1 pl-3 pr-2 text-sm leading-snug transition-colors duration-fast',
                  activeId === heading.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                )}
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
