import { Helmet } from 'react-helmet-async';
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from '@/lib/seo';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, serializeJsonLd, TITLE_SUFFIX } from '@/lib/toolSeo';

interface SeoProps {
  /** Page title without the site suffix, e.g. "Merge PDF". */
  title: string;
  description: string;
  /** Route path used for the canonical and og:url, e.g. "/merge". */
  path: string;
  /** Full title override (used by the home page, which leads with the brand). */
  fullTitle?: string;
  /** Structured data rendered as one application/ld+json script. */
  jsonLd?: Record<string, unknown>[];
  /** Keep the page out of search results (sign-in, 404). */
  noindex?: boolean;
  /** Page language for <html lang>; defaults to English so it resets after leaving a Hindi page. */
  lang?: string;
  /** hreflang → absolute URL, for pages that exist in several languages. */
  alternates?: Record<string, string>;
  /** RSS feed to advertise (blog pages). */
  rss?: { title: string; href: string };
}

/**
 * Title, description, canonical and Open Graph tags for a public page.
 * Canonical/og:url/og:image need VITE_SITE_URL; without it they are omitted.
 */
export const Seo = ({ title, description, path, fullTitle, jsonLd, noindex, lang = 'en', alternates, rss }: SeoProps) => {
  const pageTitle = fullTitle ?? `${title}${TITLE_SUFFIX}`;
  // A noindex page (404, sign-in) must not claim its URL as canonical.
  const canonical = noindex ? undefined : absoluteUrl(path);
  const image = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />}
      {image && <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />}
      {noindex && <meta name="robots" content="noindex" />}
      {Object.entries(alternates ?? {}).map(([hreflang, href]) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      {rss && <link rel="alternate" type="application/rss+xml" title={rss.title} href={rss.href} />}
      {jsonLd && jsonLd.length > 0 && <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>}
    </Helmet>
  );
};
