import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Heading, Text } from '@/components/ui/typography';
import { getToolById } from '@/config/tools';
import type { ToolSeo } from '@/lib/toolSeo';
import type { ToolId } from '@/types';
import { BLOG_POSTS } from '@/content/blog';
import { blogPostPath, postsForTool } from '@/lib/blogSeo';

/**
 * Search copy below the tool UI: intro, how-to steps, FAQ and related tools.
 * FAQ uses native <details> so the answers stay in the DOM when collapsed
 * (they back the FAQPage JSON-LD, which Google requires to be visible text).
 */
export const ToolSeoContent = ({ seo, toolId }: { seo: ToolSeo; toolId: string }) => {
  const guides = postsForTool(BLOG_POSTS, toolId);
  const related = seo.related.flatMap((id) => {
    const tool = getToolById(id as ToolId);
    return tool ? [tool] : [];
  });

  return (
    <section className="container max-w-4xl space-y-10 border-t py-12" aria-labelledby="tool-about-heading">
      <div>
        <Heading level="h2" id="tool-about-heading" className="mb-3">
          About {seo.h1}
        </Heading>
        <Text tone="muted">{seo.intro}</Text>
      </div>

      {seo.useCases && seo.useCases.length > 0 && (
        <div>
          <Heading level="h2" className="mb-4">
            When to use {seo.h1}
          </Heading>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            {seo.useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {seo.tips && seo.tips.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <Heading level="h2" className="mb-3 text-xl">
            Tips
          </Heading>
          <ul className="list-disc space-y-2 pl-5">
            {seo.tips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Heading level="h2" className="mb-4">
          How to use {seo.h1}
        </Heading>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          {seo.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div>
        <Heading level="h2" className="mb-4">
          Frequently asked questions
        </Heading>
        <div className="divide-y rounded-xl border">
          {seo.faqs.map((faq) => (
            <details key={faq.q} className="group px-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-medium">{faq.q}</h3>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      {related.length > 0 && (
        <nav aria-label="Related tools">
          <Heading level="h2" className="mb-4">
            Related tools
          </Heading>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((tool) => (
              <li key={tool.id}>
                <Link
                  to={tool.route}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">{tool.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{tool.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {guides.length > 0 && (
        <nav aria-label="Guides">
          <Heading level="h2" className="mb-4">
            Guides
          </Heading>
          <ul className="space-y-2">
            {guides.map((post) => (
              <li key={post.slug}>
                <Link to={blogPostPath(post.slug, 'en')} className="font-medium text-primary hover:underline">
                  {post.i18n.en.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
};
