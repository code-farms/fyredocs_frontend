/**
 * Build-time SEO helpers. Pure (no import.meta.env, no '@/' imports) because
 * vite.config.ts imports this file to emit sitemap.xml and robots.txt.
 */

/** Public, indexable pages that are not tools. Tool routes come from src/config/tools.ts. */
export const STATIC_PUBLIC_PATHS = [
  '/',
  '/all-tools',
  '/pricing',
  '/about',
  '/contact',
  '/blog',
  '/privacy',
  '/terms',
  '/cookies',
] as const;

/** Signed-in areas crawlers should skip (they only show a sign-in redirect anyway). */
export const DISALLOWED_PATHS = ['/app/', '/admin/', '/dashboard', '/my-files', '/activity', '/dev-docs'] as const;

/** "https://x.in/" → "https://x.in"; empty or invalid → "" (SEO output is then skipped). */
export const normalizeSiteUrl = (raw: string | undefined): string => {
  const value = (raw ?? '').trim().replace(/\/+$/, '');
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.origin;
  } catch {
    return '';
  }
};

/** Every `route: '/x'` entry in the tools registry source, in order, de-duplicated. */
export const extractToolRoutes = (toolsSource: string): string[] => {
  const routes = [...toolsSource.matchAll(/\broute:\s*['"](\/[^'"]*)['"]/g)].map((m) => m[1]);
  return [...new Set(routes)];
};

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const buildSitemapXml = (siteUrl: string, paths: readonly string[]): string => {
  const unique = [...new Set(paths)];
  const urls = unique.map((p) => `  <url><loc>${escapeXml(siteUrl + (p === '/' ? '/' : p))}</loc></url>`);
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
};

/** Allow everything public; add the Sitemap line only when the site URL is known. */
export const buildRobotsTxt = (siteUrl: string): string => {
  const lines = ['User-agent: *', 'Allow: /', ...DISALLOWED_PATHS.map((p) => `Disallow: ${p}`)];
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  return lines.join('\n') + '\n';
};
