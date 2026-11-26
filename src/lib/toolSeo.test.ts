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
      expect(seo.title.length, tool.id).toBeLessThanOrEqual(60);
      expect(seo.metaDescription.length, tool.id).toBeGreaterThanOrEqual(70);
      expect(seo.metaDescription.length, tool.id).toBeLessThanOrEqual(160);
      // Tool names keep their casing ("PDF", not "pdf") in generated copy.
      expect(seo.metaDescription, tool.id).not.toMatch(/\bpdf\b/);
      expect(seo.faqs.length).toBeGreaterThanOrEqual(1);
      expect(seo.steps.length).toBe(3);
      for (const id of seo.related) expect(ids.has(id), `${tool.id} → ${id}`).toBe(true);
    }
  });
});

describe('pdf-to-jpg', () => {
  it('is registered and has JPG-specific copy', () => {
    const tool = tools.find((t) => t.id === 'pdf-to-jpg')!;
    expect(tool).toMatchObject({ route: '/pdf-to-jpg', navGroup: 'convert-from-pdf' });
    const seo = getToolSeo(tool, tools);
    expect(seo.h1).toBe('PDF to JPG Converter');
    expect(seo.faqs[0].q).toMatch(/several pages/);
  });

  it('puts each tool\'s own file limit in the FAQ', () => {
    const merge = getToolSeo(tools.find((t) => t.id === 'merge')!, tools);
    const split = getToolSeo(tools.find((t) => t.id === 'split')!, tools);
    expect(merge.faqs.at(-1)!.a).toContain('up to 5 files');
    expect(split.faqs.at(-1)!.a).toContain('one file at a time');
  });
});

describe('deep copy for previously "crawled – not indexed" tools', () => {
  const DEEP = ['unlock-pdf', 'password-protect', 'pdf-to-excel', 'add-page-numbers', 'extract-pages', 'reorder'];

  it.each(DEEP)('%s has use cases, tips and tool-specific FAQs', (id) => {
    const seo = getToolSeo(tools.find((t) => t.id === id)!, tools);
    expect(seo.useCases?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(seo.tips?.length ?? 0).toBeGreaterThanOrEqual(2);
    // 3 tool-specific + 1 shared
    expect(seo.faqs.length).toBeGreaterThanOrEqual(4);
    const html = renderToolStaticHtml(seo, []);
    expect(html).toContain('When to use');
    expect(html).toContain(seo.tips![0].replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  });

  it('every tool page has its own use cases, tips and at least 3 tool-specific FAQs', () => {
    for (const tool of tools) {
      const seo = getToolSeo(tool, tools);
      expect(seo.useCases?.length ?? 0, tool.id).toBeGreaterThanOrEqual(3);
      expect(seo.tips?.length ?? 0, tool.id).toBeGreaterThanOrEqual(2);
      expect(seo.faqs.length, tool.id).toBeGreaterThanOrEqual(4);
      // Exactly one shared FAQ; the rest are tool-specific and unique to the page.
      expect(seo.faqs.filter((f) => f.q.includes('free, and are my files safe')), tool.id).toHaveLength(1);
    }
  });

  it('no two tool pages share a use case, tip or FAQ question', () => {
    const seen = new Map<string, string>();
    for (const tool of tools) {
      const seo = getToolSeo(tool, tools);
      const own = [...(seo.useCases ?? []), ...(seo.faqs.slice(0, -1).map((f) => f.q))];
      for (const line of own) {
        expect(seen.get(line), `${tool.id} repeats "${line}" from ${seen.get(line)}`).toBeUndefined();
        seen.set(line, tool.id);
      }
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
    expect(types).toEqual(['SoftwareApplication', 'FAQPage', 'BreadcrumbList']);
  });

  it('puts the visible copy inside #root', () => {
    const html = injectRoot(template, renderToolStaticHtml(seo, [{ name: 'Merge PDF', route: '/merge' }]));
    expect(html).toContain(`<h1>${seo.h1}</h1>`);
    expect(html).toContain(seo.faqs[0].q);
    expect(html).toContain('<a href="/merge">Merge PDF</a>');
  });
});
