import { ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/common/Seo';
import { ToolCategory, ToolDefinition } from '@/types';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/lib/utils';
import { getAllTools } from '@/config/tools';
import { SITE_URL } from '@/lib/seo';
import { buildToolJsonLd, getToolSeo } from '@/lib/toolSeo';
import { ToolSeoContent } from './ToolSeoContent';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface ToolPageLayoutProps {
  tool: ToolDefinition;
  children: ReactNode;
  className?: string;
}

/** Static maps — dynamic `bg-tool-${category}` classes don't survive Tailwind JIT. */
const CATEGORY_GRADIENT: Record<ToolCategory, string> = {
  merge: 'from-tool-merge/10 to-transparent',
  split: 'from-tool-split/10 to-transparent',
  compress: 'from-tool-compress/10 to-transparent',
  convert: 'from-tool-convert/10 to-transparent',
  organize: 'from-tool-organize/10 to-transparent',
  security: 'from-tool-security/10 to-transparent',
  ocr: 'from-tool-ocr/10 to-transparent',
  watermark: 'from-tool-watermark/10 to-transparent',
  edit: 'from-tool-edit/10 to-transparent',
};

const CATEGORY_ICON_BG: Record<ToolCategory, string> = {
  merge: 'bg-tool-merge-light',
  split: 'bg-tool-split-light',
  compress: 'bg-tool-compress-light',
  convert: 'bg-tool-convert-light',
  organize: 'bg-tool-organize-light',
  security: 'bg-tool-security-light',
  ocr: 'bg-tool-ocr-light',
  watermark: 'bg-tool-watermark-light',
  edit: 'bg-tool-edit-light',
};

export const ToolPageLayout = ({ tool, children, className }: ToolPageLayoutProps) => {
  const seo = useMemo(() => getToolSeo(tool, getAllTools()), [tool]);
  const jsonLd = useMemo(() => buildToolJsonLd(tool, seo, SITE_URL), [tool, seo]);
  return (
    <>
      <Seo
        title={seo.h1}
        fullTitle={seo.title}
        description={seo.metaDescription}
        path={tool.route}
        jsonLd={jsonLd}
      />

      {/* Category accent band */}
      <div className={cn('bg-gradient-to-b pt-8', CATEGORY_GRADIENT[tool.category])}>
        <div className="container max-w-4xl">
          <PageHeader
            breadcrumb={
              // Mirrors the BreadcrumbList JSON-LD (Home › All tools › tool).
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/all-tools">All tools</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{tool.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            }
            title={
              <span className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                    CATEGORY_ICON_BG[tool.category]
                  )}
                >
                  <ToolIcon icon={tool.icon} category={tool.category} size="xl" />
                </span>
                {seo.h1}
              </span>
            }
            description={tool.description}
            className="mb-0 border-b-0"
          />
        </div>
      </div>

      {/* Tool content */}
      <div className={cn('container max-w-4xl py-8', className)}>{children}</div>

      <ToolSeoContent seo={seo} toolId={tool.id} />
    </>
  );
};
