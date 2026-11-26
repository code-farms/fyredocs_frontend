import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { BLOG_POSTS } from './index';
import { BLOG_LANGS } from './types';
import { extractToolBases } from '@/lib/toolSeo';
import { blogPostTitle, buildBlogPostJsonLd, buildBlogRss, renderBlogPostStaticHtml } from '@/lib/blogSeo';

const toolIds = new Set(
  extractToolBases(readFileSync(path.resolve(__dirname, '../../config/tools.ts'), 'utf8')).map((t) => t.id),
);
const DEVANAGARI = /[ऀ-ॿ]/;

describe('blog content', () => {
  it('has unique slugs', () => {
    const slugs = BLOG_POSTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  for (const post of BLOG_POSTS) {
    describe(post.slug, () => {
      it('links only to tools that exist', () => {
        for (const id of post.tools) expect(toolIds.has(id), id).toBe(true);
        for (const lang of BLOG_LANGS) {
          for (const s of post.i18n[lang].sections) {
            if (s.type === 'toolCta') expect(toolIds.has(s.toolId), `${lang} cta ${s.toolId}`).toBe(true);
          }
        }
      });

      for (const lang of BLOG_LANGS) {
        it(`${lang}: search title and description fit`, () => {
          const l = post.i18n[lang];
          expect(blogPostTitle(post, lang).length, 'title').toBeLessThanOrEqual(60);
          expect(l.description.length, 'description').toBeGreaterThanOrEqual(70);
          expect(l.description.length, 'description').toBeLessThanOrEqual(160);
          expect(l.faqs.length).toBeGreaterThanOrEqual(3);
        });

        it(`${lang}: every data table cites an https source and a check date`, () => {
          for (const s of post.i18n[lang].sections) {
            if (s.type !== 'dataTable') continue;
            expect(s.sources.length).toBeGreaterThan(0);
            for (const src of s.sources) expect(src.url).toMatch(/^https:\/\//);
            expect(s.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            for (const row of s.rows) expect(row.length).toBe(s.headers.length);
          }
        });
      }

      it('hi version is written in Hindi', () => {
        const hi = post.i18n.hi;
        expect(hi.title).toMatch(DEVANAGARI);
        expect(hi.quickAnswer).toMatch(DEVANAGARI);
      });

      it('both versions have the same structure', () => {
        expect(post.i18n.hi.sections.map((s) => s.type)).toEqual(post.i18n.en.sections.map((s) => s.type));
      });
    });
  }
});

describe('blog SEO output', () => {
  const post = BLOG_POSTS[0];
  it('builds BlogPosting, FAQPage and BreadcrumbList JSON-LD', () => {
    const types = buildBlogPostJsonLd(post, 'hi', 'https://fyredocs.com').map((x) => x['@type']);
    expect(types).toEqual(['BlogPosting', 'FAQPage', 'BreadcrumbList']);
  });

  it('renders the full article as static HTML', () => {
    const html = renderBlogPostStaticHtml(post, 'en', new Map([['compress', { name: 'Compress PDF', route: '/compress' }]]), []);
    expect(html).toContain(`<h1>`);
    expect(html).toContain(post.i18n.en.faqs[0].q.replace(/"/g, '&quot;'));
    expect(html).toContain(`href="/hi/blog/${post.slug}"`);
  });

  it('builds a valid-looking RSS feed', () => {
    const rss = buildBlogRss(BLOG_POSTS, 'https://fyredocs.com');
    expect(rss.match(/<item>/g)?.length).toBe(BLOG_POSTS.length);
    expect(rss).toContain('<link>https://fyredocs.com/blog</link>');
  });
});
