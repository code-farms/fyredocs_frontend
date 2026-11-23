/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync, writeFileSync } from "fs";
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
  buildHubJsonLd,
  buildToolJsonLd,
  extractToolBases,
  getToolSeo,
  injectHead,
  injectRoot,
  renderHubStaticHtml,
  renderToolStaticHtml,
} from "./src/lib/toolSeo";

/**
 * Writes <route>.html next to index.html for every public tool page, the
 * /pdf-converter hub and the static pages, each with its own title, meta,
 * canonical and JSON-LD, and (for tools and the hub) the search copy inside
 * #root. Crawlers get real content without running JS; the Caddy edge serves
 * these via `try_files {path} {path}.html /index.html`.
 */
function prerenderPublicPages(outDir: string, siteUrl: string, toolsSource: string) {
  const template = readFileSync(path.join(outDir, "index.html"), "utf8");
  const tools = extractToolBases(toolsSource);
  const byId = new Map(tools.map((t) => [t.id, t]));
  const image = siteUrl ? siteUrl + DEFAULT_OG_IMAGE_PATH : undefined;
  const canonicalFor = (route: string) => (siteUrl ? siteUrl + route : undefined);
  const write = (route: string, html: string) => writeFileSync(path.join(outDir, `${route.slice(1)}.html`), html);

  for (const tool of tools) {
    const seo = getToolSeo(tool, tools);
    const related = seo.related.flatMap((id) => {
      const t = byId.get(id);
      return t ? [{ name: t.name, route: t.route }] : [];
    });
    const head = injectHead(template, {
      title: seo.title,
      description: seo.metaDescription,
      canonical: canonicalFor(tool.route),
      image,
      jsonLd: buildToolJsonLd(tool, seo, siteUrl),
    });
    write(tool.route, injectRoot(head, renderToolStaticHtml(seo, related)));
  }

  for (const [route, meta] of Object.entries(STATIC_PAGE_SEO)) {
    if (route === "/") continue;
    const hubLinks =
      route === PDF_CONVERTER_PATH
        ? tools
            .filter((t) => (PDF_CONVERTER_GROUPS as readonly string[]).includes(t.navGroup))
            .map((t) => ({ name: t.name, route: t.route }))
        : null;
    let html = injectHead(template, {
      title: meta.title,
      description: meta.description,
      canonical: canonicalFor(route),
      image,
      jsonLd: hubLinks ? buildHubJsonLd(hubLinks, siteUrl) : undefined,
    });
    if (hubLinks) html = injectRoot(html, renderHubStaticHtml(hubLinks));
    write(route, html);
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
      const paths = [...STATIC_PUBLIC_PATHS, ...extractToolRoutes(toolsSource)];
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: buildSitemapXml(siteUrl, paths) });
    },
    writeBundle(options) {
      if (!options.dir) return;
      const toolsSource = readFileSync(path.resolve(import.meta.dirname, "src/config/tools.ts"), "utf8");
      prerenderPublicPages(options.dir, siteUrl, toolsSource);
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
    plugins: [react(), seoPlugin(siteUrl)],
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
