/**
 * Blog URLs, titles, JSON-LD, prerendered HTML and RSS.
 *
 * Pure (relative imports only, no import.meta.env): vite.config.ts uses it to
 * prerender /blog and /hi/blog pages and emit the feed; the React blog pages
 * use the same builders so crawlers and users see the same thing.
 */
import type { BlogLang, BlogPost, BlogSection } from '../content/blog/types';
import { BLOG_CATEGORY_LABELS, BLOG_UI, formatBlogDate } from '../content/blog/ui';
import {
  DEFAULT_OG_IMAGE_PATH,
  STATIC_STYLE,
  TITLE_SUFFIX,
  escapeHtml,
  linkList,
  type SeoLink,
} from './toolSeo';

type JsonLd = Record<string, unknown>;

const BRAND = 'Fyredocs';

export const blogIndexPath = (lang: BlogLang): string => (lang === 'hi' ? '/hi/blog' : '/blog');
export const blogPostPath = (slug: string, lang: BlogLang): string => `${blogIndexPath(lang)}/${slug}`;
export const otherLang = (lang: BlogLang): BlogLang => (lang === 'en' ? 'hi' : 'en');

/** hreflang map for a page that exists in both languages; English is the default. */
export const blogAlternates = (pathFor: (lang: BlogLang) => string, siteUrl: string): Record<string, string> =>
  siteUrl
    ? { en: siteUrl + pathFor('en'), hi: siteUrl + pathFor('hi'), 'x-default': siteUrl + pathFor('en') }
    : {};

export const blogPostTitle = (post: BlogPost, lang: BlogLang): string => {
  const l = post.i18n[lang];
  return `${l.metaTitle ?? l.title}${TITLE_SUFFIX}`;
};

export const blogIndexTitle = (lang: BlogLang): string => `${BLOG_UI[lang].indexMetaTitle}${TITLE_SUFFIX}`;

export const BLOG_RSS_PATH = '/blog/rss.xml';

/** Posts that link to a tool, newest first, for the tool page's "Guides" list. */
export const postsForTool = (posts: readonly BlogPost[], toolId: string): BlogPost[] =>
  posts.filter((p) => p.tools.includes(toolId));

/** Up to `n` other posts, same category first. */
export const relatedPosts = (posts: readonly BlogPost[], post: BlogPost, n = 3): BlogPost[] =>
  [
    ...posts.filter((p) => p.slug !== post.slug && p.category === post.category),
    ...posts.filter((p) => p.slug !== post.slug && p.category !== post.category),
  ].slice(0, n);

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

export const buildBlogPostJsonLd = (post: BlogPost, lang: BlogLang, siteUrl: string): JsonLd[] => {
  const l = post.i18n[lang];
  const url = siteUrl ? siteUrl + blogPostPath(post.slug, lang) : undefined;
  const org = {
    '@type': 'Organization',
    name: BRAND,
    ...(siteUrl ? { url: `${siteUrl}/`, logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon-192.png` } } : {}),
  };
  const out: JsonLd[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: l.title,
      description: l.description,
      inLanguage: lang === 'hi' ? 'hi-IN' : 'en-IN',
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: org,
      publisher: org,
      ...(siteUrl ? { image: siteUrl + DEFAULT_OG_IMAGE_PATH } : {}),
      ...(url ? { mainEntityOfPage: url, url } : {}),
    },
  ];
  if (l.faqs.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: l.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  if (siteUrl) {
    const ui = BLOG_UI[lang];
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: ui.home, item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: ui.blog, item: siteUrl + blogIndexPath(lang) },
        { '@type': 'ListItem', position: 3, name: l.title, item: url },
      ],
    });
  }
  return out;
};

export const buildBlogIndexJsonLd = (posts: readonly BlogPost[], lang: BlogLang, siteUrl: string): JsonLd[] => [
  {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: BLOG_UI[lang].indexTitle,
    description: BLOG_UI[lang].indexDescription,
    inLanguage: lang === 'hi' ? 'hi-IN' : 'en-IN',
    ...(siteUrl ? { url: siteUrl + blogIndexPath(lang) } : {}),
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.i18n[lang].title,
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
      ...(siteUrl ? { url: siteUrl + blogPostPath(p.slug, lang) } : {}),
    })),
  },
];

// ---------------------------------------------------------------------------
// Prerendered HTML
// ---------------------------------------------------------------------------

const sectionHtml = (sec: BlogSection, lang: BlogLang, tools: ReadonlyMap<string, SeoLink>): string => {
  const ui = BLOG_UI[lang];
  const parts: string[] = [];
  if (sec.heading) parts.push(`<h2>${escapeHtml(sec.heading)}</h2>`);
  const list = (items: string[], tag: 'ul' | 'ol') =>
    `<${tag}>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`;
  const table = (headers: string[], rows: string[][]) =>
    `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`;
  switch (sec.type) {
    case 'paragraph':
    case 'tip':
    case 'warning':
      parts.push(`<p>${escapeHtml(sec.content)}</p>`);
      break;
    case 'steps':
    case 'list':
      if (sec.content) parts.push(`<p>${escapeHtml(sec.content)}</p>`);
      parts.push(list(sec.items, sec.type === 'steps' ? 'ol' : 'ul'));
      break;
    case 'table':
      if (sec.content) parts.push(`<p>${escapeHtml(sec.content)}</p>`);
      parts.push(table(sec.tableData.headers, sec.tableData.rows));
      break;
    case 'dataTable':
      if (sec.content) parts.push(`<p>${escapeHtml(sec.content)}</p>`);
      parts.push(table(sec.headers, sec.rows));
      parts.push(
        `<p>${escapeHtml(ui.source)}: ${sec.sources
          .map((src) => `<a href="${escapeHtml(src.url)}" rel="nofollow noopener">${escapeHtml(src.label)}</a>`)
          .join(', ')} · ${escapeHtml(ui.checkedOn)} ${escapeHtml(formatBlogDate(sec.checkedOn, lang))}</p>`,
      );
      break;
    case 'toolCta': {
      const tool = tools.get(sec.toolId);
      if (tool) parts.push(`<p><a href="${escapeHtml(tool.route)}">${escapeHtml(sec.text)}</a></p>`);
      break;
    }
    case 'checklist':
      parts.push(`<h3>${escapeHtml(ui.checklist)}</h3>`, list(sec.items, 'ul'));
      break;
    case 'mistakes':
      parts.push(`<h3>${escapeHtml(ui.mistakes)}</h3>`, list(sec.items, 'ul'));
      break;
  }
  return parts.join('');
};

/**
 * Keeps the static H1 and quick-answer paragraph a little LARGER than their React
 * versions (same 48rem column, bigger type). If a React element were
 * bigger, the browser would record it as a new, late LCP entry when the app
 * mounts — seen on posts going from ~1 s to ~4 s LCP on a throttled phone.
 */
const BLOG_STATIC_STYLE =
  '<style>.seo-blog{max-width:48rem}.seo-blog h1{font-size:2.5rem;line-height:1.3}.seo-blog .qa{padding:1.25rem;line-height:1.9}</style>';

/** Full article markup for crawlers; React replaces it on mount. */
export const renderBlogPostStaticHtml = (
  post: BlogPost,
  lang: BlogLang,
  tools: ReadonlyMap<string, SeoLink>,
  related: readonly BlogPost[],
): string => {
  const l = post.i18n[lang];
  const ui = BLOG_UI[lang];
  const toolLinks = post.tools.flatMap((id) => (tools.has(id) ? [tools.get(id)!] : []));
  return [
    STATIC_STYLE,
    BLOG_STATIC_STYLE,
    '<main class="seo-static seo-blog"><article>',
    `<p><a href="${blogIndexPath(lang)}">${escapeHtml(ui.blog)}</a> · ${escapeHtml(
      BLOG_CATEGORY_LABELS[post.category][lang],
    )}</p>`,
    `<h1>${escapeHtml(l.title)}</h1>`,
    `<p>${escapeHtml(ui.updated)} ${escapeHtml(formatBlogDate(post.updatedAt, lang))} · ${post.readMinutes} ${escapeHtml(
      ui.minRead,
    )}</p>`,
    `<p class="qa"><strong>${escapeHtml(ui.quickAnswer)}:</strong> ${escapeHtml(l.quickAnswer)}</p>`,
    ...l.sections.map((s) => sectionHtml(s, lang, tools)),
    l.faqs.length ? `<h2>${escapeHtml(ui.faq)}</h2>` : '',
    ...l.faqs.map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`),
    toolLinks.length ? `<h2>${escapeHtml(ui.toolsUsed)}</h2>${linkList(toolLinks)}` : '',
    related.length
      ? `<h2>${escapeHtml(ui.relatedPosts)}</h2>${linkList(
          related.map((p) => ({ name: p.i18n[lang].title, route: blogPostPath(p.slug, lang) })),
        )}`
      : '',
    `<p><a href="${blogPostPath(post.slug, otherLang(lang))}" hreflang="${otherLang(lang)}">${escapeHtml(
      ui.readInOther,
    )}</a></p>`,
    '</article></main>',
  ].join('');
};

export const renderBlogIndexStaticHtml = (posts: readonly BlogPost[], lang: BlogLang): string => {
  const ui = BLOG_UI[lang];
  return [
    STATIC_STYLE,
    '<main class="seo-static">',
    `<h1>${escapeHtml(ui.indexTitle)}</h1>`,
    `<p>${escapeHtml(ui.indexIntro)}</p>`,
    ...posts.map(
      (p) =>
        `<h2><a href="${blogPostPath(p.slug, lang)}">${escapeHtml(p.i18n[lang].title)}</a></h2><p>${escapeHtml(
          p.i18n[lang].description,
        )}</p>`,
    ),
    `<p><a href="${blogIndexPath(otherLang(lang))}" hreflang="${otherLang(lang)}">${escapeHtml(ui.readInOther)}</a></p>`,
    '</main>',
  ].join('');
};

// ---------------------------------------------------------------------------
// RSS
// ---------------------------------------------------------------------------

const rfc822 = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toUTCString();
};

/** RSS 2.0 feed of the English posts. */
export const buildBlogRss = (posts: readonly BlogPost[], siteUrl: string): string => {
  const ui = BLOG_UI.en;
  const items = posts.map((p) => {
    const url = siteUrl + blogPostPath(p.slug, 'en');
    return [
      '    <item>',
      `      <title>${escapeHtml(p.i18n.en.title)}</title>`,
      `      <link>${escapeHtml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeHtml(url)}</guid>`,
      `      <pubDate>${rfc822(p.publishedAt)}</pubDate>`,
      `      <description>${escapeHtml(p.i18n.en.description)}</description>`,
      '    </item>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeHtml(ui.indexTitle)}</title>`,
    `    <link>${escapeHtml(siteUrl + blogIndexPath('en'))}</link>`,
    `    <description>${escapeHtml(ui.indexDescription)}</description>`,
    '    <language>en-in</language>',
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
};
