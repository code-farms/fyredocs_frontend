import { useMemo, useState } from 'react';
import { Seo } from '@/components/common/Seo';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { EmptyState } from '@/components/common/EmptyState';
import { ToolGrid } from '@/components/home/ToolGrid';
import { NAV_GROUPS } from '@/config/navigation';
import { getAllTools } from '@/config/tools';
import { filterTools } from '@/lib/toolSearch';
import { ToolNavGroup } from '@/types';
import { cn } from '@/lib/utils';

const isNavGroup = (value: string | null): value is ToolNavGroup =>
  NAV_GROUPS.some((group) => group.id === value);

const AllToolsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  const categoryParam = searchParams.get('category');
  const activeCategory: ToolNavGroup | null = isNavGroup(categoryParam) ? categoryParam : null;

  const allTools = useMemo(() => getAllTools(), []);

  const setCategory = (category: ToolNavGroup | null) => {
    setSearchParams(
      (params) => {
        if (category) {
          params.set('category', category);
        } else {
          params.delete('category');
        }
        return params;
      },
      { replace: true },
    );
  };

  const clearFilters = () => {
    setQuery('');
    setCategory(null);
  };

  const scopedTools = activeCategory
    ? allTools.filter((tool) => tool.navGroup === activeCategory)
    : allTools;

  const isSearching = query.trim().length > 0;
  const searchResults = isSearching ? filterTools(query, scopedTools) : scopedTools;
  const resultCount = searchResults.length;

  const visibleGroups = NAV_GROUPS.filter(
    (group) => (!activeCategory || group.id === activeCategory),
  )
    .map((group) => ({
      group,
      tools: scopedTools.filter((tool) => tool.navGroup === group.id),
    }))
    .filter(({ tools }) => tools.length > 0);

  return (
    <>
      <Seo title="All PDF Tools" description="Browse every Fyredocs tool — organize, optimize, convert, edit, and secure PDFs. Free, fast, and no sign-up required." path="/all-tools" />

      <div className="container py-12">
        <div className="mb-8 text-center">
          <Heading level="display" responsive>
            All PDF Tools
          </Heading>
          <Text variant="body-lg" tone="muted" className="mt-3">
            Everything you need to work with PDFs — free, fast, and secure.
          </Text>
        </div>

        {/* Sticky toolbar */}
        <div className="sticky top-16 z-30 -mx-4 mb-8 border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${allTools.length} tools…`}
                className="pl-9"
                aria-label="Search tools"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  activeCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                All
              </button>
              {NAV_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setCategory(activeCategory === group.id ? null : group.id)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    activeCategory === group.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {group.shortTitle}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <Text variant="body-sm" tone="muted" className="mb-6" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'tool' : 'tools'}
          {isSearching && ` matching “${query.trim()}”`}
          {activeCategory && ` in ${NAV_GROUPS.find((g) => g.id === activeCategory)?.title}`}
        </Text>

        {resultCount === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No tools match your filters"
            description="Try a different search term or clear the filters to browse everything."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : isSearching ? (
          /* Flat ranked list while searching */
          <ToolGrid tools={searchResults} columns={4} />
        ) : (
          /* Grouped by category */
          <div className="space-y-12">
            {visibleGroups.map(({ group, tools }) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`}>
                <div className="mb-4 flex items-center gap-3">
                  <Heading level="h3" as="h2" id={`group-${group.id}`} className={group.styles.text}>
                    {group.title}
                  </Heading>
                  <Text as="span" variant="body-sm" tone="subtle">
                    {tools.length} {tools.length === 1 ? 'tool' : 'tools'}
                  </Text>
                </div>
                <ToolGrid tools={tools} columns={4} />
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AllToolsPage;
