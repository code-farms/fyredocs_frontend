import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, Clock, Languages, RefreshCw } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Badge } from '@/components/ui/badge';
import { Heading, Text } from '@/components/ui/typography';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DocsToc } from '@/components/docs/DocsToc';
import { BlogContent, QuickAnswer, ReadingProgress } from '@/components/blog/BlogBlocks';
import { getToolById } from '@/config/tools';
import { BLOG_POSTS } from '@/content/blog';
import type { BlogLang } from '@/content/blog/types';
import { BLOG_CATEGORY_LABELS, BLOG_UI, formatBlogDate } from '@/content/blog/ui';
import {
  BLOG_RSS_PATH,
  blogAlternates,
  blogIndexPath,
  blogPostPath,
  blogPostTitle,
  buildBlogPostJsonLd,
  otherLang,
  relatedPosts,
} from '@/lib/blogSeo';
import { SITE_URL } from '@/lib/seo';
import { slugifyHeading } from '@/lib/docsNavigation';
import type { ToolId } from '@/types';
import NotFound from './NotFound';

const BlogPostPage = ({ lang }: { lang: BlogLang }) => {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const jsonLd = useMemo(() => (post ? buildBlogPostJsonLd(post, lang, SITE_URL) : []), [post, lang]);

  if (!post) return <NotFound />;

  const l = post.i18n[lang];
  const ui = BLOG_UI[lang];
  const tools = post.tools.flatMap((id) => {
    const t = getToolById(id as ToolId);
    return t ? [t] : [];
  });
  const related = relatedPosts(BLOG_POSTS, post);
  const tocSections = [...l.sections, ...(l.faqs.length ? [{ heading: ui.faq }] : [])];

  return (
    <>
      <Seo
        title={l.metaTitle ?? l.title}
        fullTitle={blogPostTitle(post, lang)}
        description={l.description}
        path={blogPostPath(post.slug, lang)}
        jsonLd={jsonLd}
        lang={lang}
        alternates={blogAlternates((x) => blogPostPath(post.slug, x), SITE_URL)}
        rss={{ title: BLOG_UI.en.indexTitle, href: BLOG_RSS_PATH }}
      />
      <ReadingProgress />

      <div className="container max-w-6xl py-10 xl:grid xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-12">
        <article className="mx-auto min-w-0 max-w-3xl xl:mx-0" lang={lang}>
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">{ui.home}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={blogIndexPath(lang)}>{ui.blog}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">{l.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <header className="mb-8 space-y-4">
            <Badge variant="secondary">{BLOG_CATEGORY_LABELS[post.category][lang]}</Badge>
            <Heading level="h1" responsive as="h1">
              {l.title}
            </Heading>
            <Text tone="muted" variant="body-lg">
              {l.description}
            </Text>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4" aria-hidden />
                {ui.updated} {formatBlogDate(post.updatedAt, lang)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                {post.readMinutes} {ui.minRead}
              </span>
              <Link
                to={blogPostPath(post.slug, otherLang(lang))}
                hrefLang={otherLang(lang)}
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Languages className="h-4 w-4" aria-hidden />
                {ui.readInOther}
              </Link>
            </div>
          </header>

          <div className="space-y-10">
            <QuickAnswer text={l.quickAnswer} lang={lang} />

            <BlogContent sections={l.sections} lang={lang} />

            {l.faqs.length > 0 && (
              <section>
                <Heading level="h3" as="h2" id={slugifyHeading(ui.faq)} className="mb-4 scroll-mt-24">
                  {ui.faq}
                </Heading>
                <div className="divide-y rounded-xl border">
                  {l.faqs.map((faq) => (
                    <details key={faq.q} className="group px-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                        <h3 className="text-base font-medium">{faq.q}</h3>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <p className="pb-4 leading-relaxed text-muted-foreground">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {tools.length > 0 && (
              <section aria-label={ui.toolsUsed}>
                <Heading level="h3" as="h2" className="mb-4">
                  {ui.toolsUsed}
                </Heading>
                <div className="flex flex-wrap gap-2">
                  {tools.map((t) => (
                    <Link
                      key={t.id}
                      to={t.route}
                      className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {related.length > 0 && (
              <section aria-label={ui.relatedPosts} className="border-t pt-8">
                <Heading level="h3" as="h2" className="mb-4">
                  {ui.relatedPosts}
                </Heading>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {related.map((p) => (
                    <li key={p.slug}>
                      <Link
                        to={blogPostPath(p.slug, lang)}
                        className="group flex h-full flex-col justify-between gap-3 rounded-xl border p-4 transition-colors hover:border-primary/50"
                      >
                        <span className="font-medium leading-snug">{p.i18n[lang].title}</span>
                        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </article>

        <DocsToc sections={tocSections} label={ui.onThisPage} className="sticky top-24 self-start" />
      </div>
    </>
  );
};

export default BlogPostPage;
