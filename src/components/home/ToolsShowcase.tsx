import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heading, Text } from '@/components/ui/typography';
import { ToolGrid } from './ToolGrid';
import { NAV_GROUPS, getToolsByNavGroup } from '@/config/navigation';
import { getPopularTools } from '@/config/tools';

const TOOLS_PER_TAB = 8;

export const ToolsShowcase = () => {
  const popularTools = getPopularTools();

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Heading level="h2" responsive className="mb-3">
            Every tool you need for PDFs
          </Heading>
          <Text variant="body-lg" tone="muted">
            Organize, optimize, convert, edit, and secure your documents — all in one place.
          </Text>
        </div>

        <Tabs defaultValue="popular">
          <div className="mb-8 flex justify-center">
            <TabsList className="h-auto flex-wrap justify-center gap-1">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              {NAV_GROUPS.map((group) => (
                <TabsTrigger key={group.id} value={group.id}>
                  {group.shortTitle}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="popular">
            <ToolGrid tools={popularTools} limit={TOOLS_PER_TAB} columns={4} />
          </TabsContent>
          {NAV_GROUPS.map((group) => (
            <TabsContent key={group.id} value={group.id}>
              <ToolGrid tools={getToolsByNavGroup(group.id)} limit={TOOLS_PER_TAB} columns={4} />
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
          <Link
            to="/all-tools"
            className="inline-flex items-center gap-1.5 text-body font-medium text-primary transition-colors hover:text-primary-hover"
          >
            View all tools
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/pdf-converter"
            className="inline-flex items-center gap-1.5 text-body font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Free PDF converter
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
};
