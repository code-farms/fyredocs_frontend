/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import zlib from "zlib";
import {
  STATIC_PUBLIC_PATHS,
  buildRobotsTxt,
  buildSitemapXml,
  extractToolRoutes,
  normalizeSiteUrl,
} from "./src/lib/sitemap";
import {
  DEFAULT_OG_IMAGE_PATH,
  PDF_CONVERTER_GROUPS,
  PDF_CONVERTER_PATH,
  STATIC_PAGE_SEO,
  buildDocJsonLd,
  buildHomeJsonLd,
  buildHubJsonLd,
  buildToolJsonLd,
  docPath,
  docDescription,
  docTitle,
  extractToolBases,
  getToolSeo,
  injectHead,
  injectRoot,
  renderDocStaticHtml,
  renderDocsIndexStaticHtml,
  renderHomeStaticHtml,
  renderHubStaticHtml,
  renderToolStaticHtml,
} from "./src/lib/toolSeo";
import { docs } from "./src/config/docs";
import { BLOG_POSTS } from "./src/content/blog";
import { BLOG_LANGS } from "./src/content/blog/types";
import { BLOG_UI } from "./src/content/blog/ui";
import {
  BLOG_RSS_PATH,
  blogAlternates,
  blogIndexPath,
  blogIndexTitle,
  blogPostPath,
  blogPostTitle,
  buildBlogIndexJsonLd,
  buildBlogPostJsonLd,
  buildBlogRss,
  postsForTool,
  relatedPosts,
  renderBlogIndexStaticHtml,
  renderBlogPostStaticHtml,
} from "./src/lib/blogSeo";

/** The SPA shell Caddy serves for routes with no prerendered file. */
const SHELL_FILE = "_shell.html";

/**
 * Prerenders every public page so crawlers get real content without running JS:
 * - `<route>.html` for each tool, the /pdf-converter hub, the static pages and
 *   each /docs guide, with its own title, meta, canonical and JSON-LD, and
 *   (except plain static pages) the page copy inside #root;
 * - `index.html` becomes the home page, and the untouched shell is kept as
 *   `_shell.html` for every other route, so app pages never flash home copy.
 * The Caddy edge serves these via `try_files {path} {path}.html /_shell.html`.
 */
function prerenderPublicPages(outDir: string, siteUrl: string, toolsSource: string) {
  const template = readFileSync(path.join(outDir, "index.html"), "utf8");
  const tools = extractToolBases(toolsSource);
  const byId = new Map(tools.map((t) => [t.id, t]));
  const image = siteUrl ? siteUrl + DEFAULT_OG_IMAGE_PATH : undefined;
  const canonicalFor = (route: string) => (siteUrl ? siteUrl + route : undefined);
  const write = (file: string, html: string) => {
    const target = path.join(outDir, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, html);
  };
  const writeRoute = (route: string, html: string) => write(`${route.slice(1)}.html`, html);
  const page = (route: string, title: string, description: string, jsonLd?: Record<string, unknown>[], body?: string) => {
    const head = injectHead(template, { title, description, canonical: canonicalFor(route), image, jsonLd });
    return body ? injectRoot(head, body) : head;
  };

  write(SHELL_FILE, template);

  const home = STATIC_PAGE_SEO["/"];
  const popular = ["pdf-to-word", "pdf-to-jpg", "compress", "merge", "word-to-pdf", "image-to-pdf", "split", "pdf-to-excel"]
    .flatMap((id) => (byId.has(id) ? [{ name: byId.get(id)!.name, route: byId.get(id)!.route }] : []));
  write("index.html", page("/", home.title, home.description, buildHomeJsonLd(siteUrl), renderHomeStaticHtml(popular, tools)));

  for (const tool of tools) {
    const seo = getToolSeo(tool, tools);
    const related = seo.related.flatMap((id) => {
      const t = byId.get(id);
      return t ? [{ name: t.name, route: t.route }] : [];
    });
    const guides = postsForTool(BLOG_POSTS, tool.id).map((p) => ({
      name: p.i18n.en.title,
      route: blogPostPath(p.slug, "en"),
    }));
    writeRoute(
      tool.route,
      page(tool.route, seo.title, seo.metaDescription, buildToolJsonLd(tool, seo, siteUrl), renderToolStaticHtml(seo, related, guides)),
    );
  }

  const hubLinks = tools
    .filter((t) => (PDF_CONVERTER_GROUPS as readonly string[]).includes(t.navGroup))
    .map((t) => ({ name: t.name, route: t.route }));
  for (const [route, meta] of Object.entries(STATIC_PAGE_SEO)) {
    if (route === "/") continue;
    if (route === PDF_CONVERTER_PATH) {
      writeRoute(route, page(route, meta.title, meta.description, buildHubJsonLd(hubLinks, siteUrl), renderHubStaticHtml(hubLinks)));
    } else if (route === "/docs") {
      writeRoute(route, page(route, meta.title, meta.description, undefined, renderDocsIndexStaticHtml(docs)));
    } else {
      writeRoute(route, page(route, meta.title, meta.description));
    }
  }

  // Blog: index and every post in each language, with hreflang pairs, <html lang>
  // and the RSS link. /hi/... files land in dist/hi/.
  const toolLinks = new Map(tools.map((t) => [t.id, { name: t.name, route: t.route }]));
  const rss = { title: BLOG_UI.en.indexTitle, href: BLOG_RSS_PATH };
  for (const lang of BLOG_LANGS) {
    const indexRoute = blogIndexPath(lang);
    const indexHead = injectHead(template, {
      title: blogIndexTitle(lang),
      description: BLOG_UI[lang].indexDescription,
      canonical: canonicalFor(indexRoute),
      image,
      lang,
      alternates: blogAlternates(blogIndexPath, siteUrl),
      rss,
      jsonLd: buildBlogIndexJsonLd(BLOG_POSTS, lang, siteUrl),
    });
    writeRoute(indexRoute, injectRoot(indexHead, renderBlogIndexStaticHtml(BLOG_POSTS, lang)));
    for (const post of BLOG_POSTS) {
      const route = blogPostPath(post.slug, lang);
      const head = injectHead(template, {
        title: blogPostTitle(post, lang),
        description: post.i18n[lang].description,
        canonical: canonicalFor(route),
        image,
        lang,
        alternates: blogAlternates((l) => blogPostPath(post.slug, l), siteUrl),
        rss,
        jsonLd: buildBlogPostJsonLd(post, lang, siteUrl),
      });
      writeRoute(route, injectRoot(head, renderBlogPostStaticHtml(post, lang, toolLinks, relatedPosts(BLOG_POSTS, post))));
    }
  }

  for (const doc of docs) {
    const route = docPath(doc.slug);
    const tool = doc.toolId ? byId.get(doc.toolId) : undefined;
    const toolLink = tool ? { name: tool.name, route: tool.route } : undefined;
    writeRoute(
      route,
      page(route, docTitle(doc), docDescription(doc), buildDocJsonLd(doc, siteUrl), renderDocStaticHtml(doc, toolLink)),
    );
  }
}

/**
 * Build-time SEO output from VITE_SITE_URL (e.g. https://fyredocs.com):
 * robots.txt always; sitemap.xml and the Plausible script only when the site
 * URL is set, so local and preview builds never report to analytics.
 */
function seoPlugin(siteUrl: string): Plugin {
  return {
    name: "fyredocs-seo",
    transformIndexHtml() {
      if (!siteUrl) return [];
      return [
        {
          tag: "script",
          attrs: { defer: true, "data-domain": new URL(siteUrl).hostname, src: "https://plausible.io/js/script.js" },
          injectTo: "head",
        },
      ];
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: buildRobotsTxt(siteUrl) });
      if (!siteUrl) return;
      const toolsSource = readFileSync(path.resolve(import.meta.dirname, "src/config/tools.ts"), "utf8");
      const blogLastmod = BLOG_POSTS.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), "");
      const paths = [
        ...STATIC_PUBLIC_PATHS,
        ...extractToolRoutes(toolsSource),
        "/docs",
        ...docs.map((d) => docPath(d.slug)),
        ...BLOG_LANGS.flatMap((lang) => [
          { path: blogIndexPath(lang), lastmod: blogLastmod || undefined },
          ...BLOG_POSTS.map((p) => ({ path: blogPostPath(p.slug, lang), lastmod: p.updatedAt })),
        ]),
      ];
      const lastmod = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: buildSitemapXml(siteUrl, paths, lastmod) });
      this.emitFile({ type: "asset", fileName: BLOG_RSS_PATH.slice(1), source: buildBlogRss(BLOG_POSTS, siteUrl) });
    },
    writeBundle(options) {
      if (!options.dir) return;
      const toolsSource = readFileSync(path.resolve(import.meta.dirname, "src/config/tools.ts"), "utf8");
      prerenderPublicPages(options.dir, siteUrl, toolsSource);
    },
  };
}

/**
 * Writes .br / .gz next to every text file
 * in dist, so Caddy's `file_server { precompressed }` serves them with zero
 * per-request CPU. Each client gets the best variant its Accept-Encoding
 * lists; clients that list none get the original file. No .zst: Brotli at
 * quality 11 beats zstd on these files, and every zstd-capable browser also
 * accepts br, so a .zst would never be served. Runs in closeBundle,
 * after seoPlugin's writeBundle has written the prerendered *.html pages.
 */
function precompressPlugin(): Plugin {
  const COMPRESSIBLE = /\.(js|mjs|css|html|svg|json|txt|xml|webmanifest)$/;
  const MIN_BYTES = 1024;
  let outDir = "dist";
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      return e.isDirectory() ? walk(full) : [full];
    });
  return {
    name: "fyredocs-precompress",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      for (const file of walk(outDir)) {
        if (!COMPRESSIBLE.test(file) || statSync(file).size < MIN_BYTES) continue;
        const raw = readFileSync(file);
        writeFileSync(
          `${file}.br`,
          zlib.brotliCompressSync(raw, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
              [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
            },
          }),
        );
        writeFileSync(`${file}.gz`, zlib.gzipSync(raw, { level: 9 }));
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Pass "" so loadEnv returns ALL vars, not just VITE_-prefixed ones.
  // API_PROXY_TARGET is read only by the dev server (Node side) and is never
  // shipped into the client bundle, so it deliberately omits the VITE_ prefix.
  //
  // Precedence: shell/CI env > .env files > built-in default. loadEnv only
  // reads .env files, so we check process.env first to honour shell-exported
  // vars like `API_PROXY_TARGET=... npm run dev` and CI-injected vars.
  //
  // The default is the Caddy edge (http://localhost), not the gateway port:
  // Caddy is what routes /grafana and /uploads, so pointing straight at
  // http://localhost:8080 would break those two.
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    process.env.API_PROXY_TARGET || env.API_PROXY_TARGET || "http://localhost";
  const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL || env.VITE_SITE_URL);

  return {
    server: {
      host: "::",
      port: 5173,
      // Dev-server proxy to the Caddy edge, which fronts the api-gateway and
      // routes object bytes to MinIO. The production build is served by Caddy
      // itself, so these only matter for `npm run dev`.
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/auth": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/admin/metrics": {
          target: proxyTarget,
          changeOrigin: true,
        },
        // Embedded Grafana (observability profile). The edge @grafana route
        // forward_auths this before proxying to Grafana. Intentionally NO
        // `ws: true`: the only WebSocket is Grafana Live, which the kiosk overview
        // dashboard doesn't need. Proxying it made Vite's dev server spam the
        // console with unhandled EPIPE on every socket teardown (Vite attaches its
        // own error loggers, so a `configure` hook can't suppress them). Without
        // `ws`, Vite leaves the Live upgrade unproxied (it fails silently in the
        // browser) and panels load over HTTP as normal. Production (Caddy) proxies
        // the WS fine, so Live works there.
        "/grafana": {
          target: proxyTarget,
          changeOrigin: true,
        },
        // Presigned multipart upload PUTs (the Caddy edge routes these to MinIO).
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
        },
        // Presigned output GETs — the reader fetches these bytes after the
        // download route's 302, so they must be same-origin in dev too.
        "/outputs": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), seoPlugin(siteUrl), precompressPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Split stable vendor code out of the entry chunk. It keeps the entry
          // under the 500 kB warning and, more usefully, lets browsers keep
          // these cached across deploys: they only change on a dependency bump,
          // while the app chunk's hash changes on every release.
          codeSplitting: {
            groups: [
              {
                name: "react-vendor",
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              },
              {
                name: "motion",
                test: /[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
              },
              // Docs-only syntax highlighter (loaded lazily by CodeBlock).
              // Named so it doesn't surface as a mystery "http-*.js" chunk.
              // PDF reader engine (loaded lazily by /reader). Its worker is a
              // separate ?url asset, not part of this chunk.
              {
                name: "pdfjs",
                test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
              },
              {
                name: "shiki",
                test: /[\\/]node_modules[\\/](shiki|@shikijs|oniguruma-to-es|regex|regex-recursion|regex-utilities)[\\/]/,
              },
            ],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      css: false,
    },
  };
});
