import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  buildToolJsonLd,
  extractToolBases,
  getToolSeo,
  injectHead,
  injectRoot,
  renderToolStaticHtml,
} from './toolSeo';

const toolsSource = readFileSync(path.resolve(__dirname, '../config/tools.ts'), 'utf8');
const tools = extractToolBases(toolsSource);

describe('extractToolBases', () => {
  it('reads every tool in the registry', () => {
    const routes = [...toolsSource.matchAll(/\broute:\s*'([^']+)'/g)].map((m) => m[1]);
    expect(tools.map((t) => t.route)).toEqual(routes);
    expect(tools.find((t) => t.id === 'pdf-to-word')).toMatchObject({
      name: 'PDF to Word',
      route: '/pdf-to-word',
      navGroup: 'convert-from-pdf',
    });
  });
});

describe('getToolSeo', () => {
  it('uses hand-written copy for high-volume tools', () => {
    const seo = getToolSeo(tools.find((t) => t.id === 'pdf-to-word')!, tools);
    expect(seo.h1).toBe('PDF to Word Converter');
    expect(seo.title).toContain('PDF to Word Converter');
  });

  it('generates complete copy for every tool, with related links that exist', () => {
    const ids = new Set(tools.map((t) => t.id));
    for (const tool of tools) {
      const seo = getToolSeo(tool, tools);
      expect(seo.title.length, tool.id).toBeLessThanOrEqual(75);
      expect(seo.metaDescription.length, tool.id).toBeLessThanOrEqual(170);
      expect(seo.faqs.length).toBeGreaterThanOrEqual(4);
      expect(seo.steps.length).toBe(3);
      for (const id of seo.related) expect(ids.has(id), `${tool.id} → ${id}`).toBe(true);
    }
  });
});

describe('prerender helpers', () => {
  const template =
    '<html><head><title>Old</title><meta name="description" content="old" /><meta property="og:title" content="old" /><meta property="og:description" content="old" /></head><body><div id="root"></div></body></html>';
  const tool = tools.find((t) => t.id === 'compress')!;
  const seo = getToolSeo(tool, tools);

  it('replaces head tags and adds canonical and JSON-LD', () => {
    const html = injectHead(template, {
      title: seo.title,
      description: 'A < B & "C"',
      canonical: 'https://fyredocs.com/compress',
      jsonLd: buildToolJsonLd(tool, seo, 'https://fyredocs.com'),
    });
    expect(html).toContain(`<title>${seo.title}</title>`);
    expect(html).toContain('content="A &lt; B &amp; &quot;C&quot;"');
    expect(html).toContain('<link rel="canonical" href="https://fyredocs.com/compress" data-prerender />');
    const ld = /<script type="application\/ld\+json" data-prerender>(.*?)<\/script>/.exec(html)![1];
    const types = (JSON.parse(ld) as { '@type': string }[]).map((x) => x['@type']);
    expect(types).toEqual(['SoftwareApplication', 'FAQPage', 'HowTo', 'BreadcrumbList']);
  });

  it('puts the visible copy inside #root', () => {
    const html = injectRoot(template, renderToolStaticHtml(seo, [{ name: 'Merge PDF', route: '/merge' }]));
    expect(html).toContain(`<h1>${seo.h1}</h1>`);
    expect(html).toContain(seo.faqs[0].q);
    expect(html).toContain('<a href="/merge">Merge PDF</a>');
  });
});
