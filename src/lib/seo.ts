import { normalizeSiteUrl } from './sitemap';

/** Public origin from VITE_SITE_URL (build-time), e.g. "https://fyredocs.com". "" when unset. */
export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);

export const SITE_NAME = 'Fyredocs';

/** Absolute URL for a path, or undefined when the site URL is unknown (dev, tests). */
export const absoluteUrl = (path: string): string | undefined =>
  SITE_URL ? SITE_URL + (path.startsWith('/') ? path : `/${path}`) : undefined;

export { DEFAULT_OG_IMAGE_PATH } from './toolSeo';
