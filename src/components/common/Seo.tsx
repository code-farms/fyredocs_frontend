import { Helmet } from 'react-helmet-async';
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH, SITE_NAME } from '@/lib/seo';
import { serializeJsonLd } from '@/lib/toolSeo';

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
}

/**
 * Title, description, canonical and Open Graph tags for a public page.
 * Canonical/og:url/og:image need VITE_SITE_URL; without it they are omitted.
 */
export const Seo = ({ title, description, path, fullTitle, jsonLd }: SeoProps) => {
  const pageTitle = fullTitle ?? `${title} — ${SITE_NAME}`;
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      {jsonLd && jsonLd.length > 0 && <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>}
    </Helmet>
  );
};
