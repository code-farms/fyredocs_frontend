import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/components/common/Seo';
import { ChevronLeft } from 'lucide-react';
import { ToolCategory, ToolDefinition } from '@/types';
import { ToolIcon } from '@/components/icons/ToolIcon';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/lib/utils';

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
  return (
    <>
      <Seo title={tool.name} description={tool.description} path={tool.route} />

      {/* Category accent band */}
      <div className={cn('bg-gradient-to-b pt-8', CATEGORY_GRADIENT[tool.category])}>
        <div className="container max-w-4xl">
          <PageHeader
            breadcrumb={
              <Link
                to="/all-tools"
                className="inline-flex items-center gap-1 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                All tools
              </Link>
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
                {tool.name}
              </span>
            }
            description={tool.description}
            className="mb-0 border-b-0"
          />
        </div>
      </div>

      {/* Tool content */}
      <div className={cn('container max-w-4xl py-8', className)}>{children}</div>
    </>
  );
};
