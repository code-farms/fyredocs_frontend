import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildRobotsTxt, buildSitemapXml, extractToolRoutes, normalizeSiteUrl } from '@/lib/sitemap';
import { getAllTools } from '@/config/tools';

describe('normalizeSiteUrl', () => {
  it('keeps only the origin', () => {
    expect(normalizeSiteUrl('https://fyredocs.com/')).toBe('https://fyredocs.com');
    expect(normalizeSiteUrl(' https://fyredocs.com/x/ ')).toBe('https://fyredocs.com');
  });
  it('returns "" for empty or invalid values', () => {
    expect(normalizeSiteUrl(undefined)).toBe('');
    expect(normalizeSiteUrl('')).toBe('');
    expect(normalizeSiteUrl('fyredocs.com')).toBe('');
    expect(normalizeSiteUrl('ftp://fyredocs.com')).toBe('');
  });
});

describe('extractToolRoutes', () => {
  it('matches every route in the real tools registry', () => {
    const source = readFileSync(resolve(__dirname, '../../config/tools.ts'), 'utf8');
    const expected = [...new Set(getAllTools().map((t) => t.route))];
    expect(extractToolRoutes(source).sort()).toEqual(expected.sort());
  });
});

describe('buildSitemapXml', () => {
  it('lists absolute, de-duplicated, escaped URLs', () => {
    const xml = buildSitemapXml('https://x.in', ['/', '/merge', '/merge', '/a&b']);
    expect(xml).toContain('<loc>https://x.in/</loc>');
    expect(xml).toContain('<loc>https://x.in/merge</loc>');
    expect(xml.match(/\/merge</g)).toHaveLength(1);
    expect(xml).toContain('https://x.in/a&amp;b');
  });
});

describe('buildRobotsTxt', () => {
  it('adds the sitemap line only with a site URL', () => {
    expect(buildRobotsTxt('')).not.toContain('Sitemap');
    expect(buildRobotsTxt('https://x.in')).toContain('Sitemap: https://x.in/sitemap.xml');
    expect(buildRobotsTxt('')).toContain('Disallow: /admin/');
  });
});
