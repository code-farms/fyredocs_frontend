import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Languages } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Badge } from '@/components/ui/badge';
import { Heading, Text } from '@/components/ui/typography';
import { BLOG_POSTS } from '@/content/blog';
import type { BlogCategory, BlogLang } from '@/content/blog/types';
import { BLOG_CATEGORY_LABELS, BLOG_UI, formatBlogDate } from '@/content/blog/ui';
import {
  BLOG_RSS_PATH,
  blogAlternates,
  blogIndexPath,
  blogIndexTitle,
  blogPostPath,
  buildBlogIndexJsonLd,
  otherLang,
} from '@/lib/blogSeo';
import { SITE_URL } from '@/lib/seo';
import { cn } from '@/lib/utils';

const BlogPage = ({ lang }: { lang: BlogLang }) => {
  const ui = BLOG_UI[lang];
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const categories = useMemo(() => [...new Set(BLOG_POSTS.map((p) => p.category))], []);
  const posts = category ? BLOG_POSTS.filter((p) => p.category === category) : BLOG_POSTS;
  const jsonLd = useMemo(() => buildBlogIndexJsonLd(BLOG_POSTS, lang, SITE_URL), [lang]);

  return (
    <>
      <Seo
        title={ui.indexMetaTitle}
        fullTitle={blogIndexTitle(lang)}
        description={ui.indexDescription}
        path={blogIndexPath(lang)}
        jsonLd={jsonLd}
        lang={lang}
        alternates={blogAlternates(blogIndexPath, SITE_URL)}
        rss={{ title: BLOG_UI.en.indexTitle, href: BLOG_RSS_PATH }}
      />

      <div className="container py-12 md:py-16" lang={lang}>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <Heading level="display" responsive>
            {ui.indexTitle}
          </Heading>
          <Text variant="body-lg" tone="muted" className="mt-4">
            {ui.indexIntro}
          </Text>
          <Link
            to={blogIndexPath(otherLang(lang))}
            hrefLang={otherLang(lang)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Languages className="h-4 w-4" aria-hidden />
            {ui.readInOther}
          </Link>
        </div>

        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2" role="group" aria-label={ui.blog}>
            {[null, ...categories].map((c) => (
              <button
                key={c ?? 'all'}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {c ? BLOG_CATEGORY_LABELS[c][lang] : ui.all}
              </button>
            ))}
          </div>
        )}

        <ul className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const l = post.i18n[lang];
            return (
              <li key={post.slug}>
                <Link
                  to={blogPostPath(post.slug, lang)}
                  className="group flex h-full flex-col rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
                >
                  <Badge variant="secondary" className="mb-3 w-fit">
                    {BLOG_CATEGORY_LABELS[post.category][lang]}
                  </Badge>
                  <h2 className="mb-2 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
                    {l.title}
                  </h2>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">{l.description}</p>
                  <span className="flex items-center justify-between text-body-sm text-muted-foreground">
                    <span className="flex items-center gap-3">
                      <span>{formatBlogDate(post.updatedAt, lang)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" aria-hidden />
                        {post.readMinutes} {ui.minRead}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default BlogPage;
