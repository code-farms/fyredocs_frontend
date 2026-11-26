/**
 * Blog content model. Pure types (no runtime imports): vite.config.ts imports
 * the posts at build time to prerender /blog and /hi/blog pages, the sitemap
 * and the RSS feed, so nothing here may use the '@/' alias.
 */

export type BlogLang = 'en' | 'hi';

export const BLOG_LANGS: readonly BlogLang[] = ['en', 'hi'];

export type BlogCategory = 'exam-forms' | 'everyday' | 'banking' | 'how-to';

interface WithHeading {
  /** Becomes an <h2> with an anchor and a table-of-contents entry. */
  heading?: string;
}

export type BlogSection = WithHeading &
  (
    | { type: 'paragraph' | 'tip' | 'warning'; content: string }
    | { type: 'steps' | 'list'; content?: string; items: string[] }
    | { type: 'table'; content?: string; tableData: { headers: string[]; rows: string[][] } }
    /** Inline "do it now" card that links to a tool page. */
    | { type: 'toolCta'; toolId: string; text: string }
    /** Facts from an official source, shown with the source link and the date it was checked. */
    | {
        type: 'dataTable';
        content?: string;
        headers: string[];
        rows: string[][];
        /** Official pages the numbers come from (one or more). */
        sources: { label: string; url: string }[];
        /** YYYY-MM-DD */
        checkedOn: string;
      }
    /** Tickable "before you upload" list; ticks live in component state only. */
    | { type: 'checklist'; items: string[] }
    | { type: 'mistakes'; items: string[] }
  );

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogPostLocale {
  /** On-page H1. */
  title: string;
  /** <title> without the " | Fyredocs" suffix, when the H1 is too long for search results. */
  metaTitle?: string;
  /** Meta description and card summary, 70–160 chars. */
  description: string;
  /** 2–3 sentence answer shown first, for readers in a hurry. */
  quickAnswer: string;
  sections: BlogSection[];
  faqs: BlogFaq[];
}

export interface BlogPost {
  /** URL slug, shared by both languages: /blog/<slug> and /hi/blog/<slug>. */
  slug: string;
  category: BlogCategory;
  /** YYYY-MM-DD */
  publishedAt: string;
  /** YYYY-MM-DD; used for the sitemap lastmod and dateModified. */
  updatedAt: string;
  readMinutes: number;
  /** Tool ids the post links to; tool pages list the post under "Guides". */
  tools: string[];
  i18n: Record<BlogLang, BlogPostLocale>;
}
