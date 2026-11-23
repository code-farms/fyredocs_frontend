/**
 * Search copy and structured data for tool pages and the /pdf-converter hub.
 *
 * Pure (no import.meta.env, no '@/' imports): vite.config.ts imports this at
 * build time to prerender one static HTML file per public route, and the
 * React tool pages import it at runtime, so crawlers and users get the same
 * title, description, FAQ and JSON-LD.
 */

/** The registry fields SEO needs. Satisfied by ToolDefinition at runtime and by extractToolBases at build time. */
export interface ToolSeoBase {
  id: string;
  name: string;
  description: string;
  route: string;
  navGroup: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface ToolSeo {
  /** Full <title>, brand included, ideally ≤ 60 chars. */
  title: string;
  /** Meta description, ideally ≤ 160 chars. */
  metaDescription: string;
  h1: string;
  intro: string;
  steps: string[];
  faqs: Faq[];
  /** Tool ids linked under "Related tools". */
  related: string[];
}

export interface SeoLink {
  name: string;
  route: string;
}

const BRAND = 'Fyredocs';

/** Default social preview image (public/logo.png). */
export const DEFAULT_OG_IMAGE_PATH = '/logo.png';
const CONVERT_GROUPS = new Set(['convert-from-pdf', 'convert-to-pdf', 'libreoffice']);

/** "PDF to Word" → { from: "PDF", to: "Word" }; anything else → null. */
const splitConversion = (name: string): { from: string; to: string } | null => {
  const m = /^(.+?) to (.+)$/.exec(name);
  return m ? { from: m[1], to: m[2] } : null;
};

const COMMON_FAQS: Faq[] = [
  {
    q: 'Is Fyredocs free to use?',
    a: 'Yes. Every tool works for free as a guest, with no sign-up and no watermark. A free account raises the file size limits and keeps your files for longer.',
  },
  {
    q: 'Do I need to install anything or create an account?',
    a: 'No. Fyredocs runs in your browser on Windows, Mac, Linux, Android and iPhone. Open the tool, upload your file and download the result.',
  },
  {
    q: 'Are my files safe?',
    a: 'Files are encrypted in transit, processed on our servers and deleted automatically on a schedule based on your plan. We never share your documents.',
  },
  {
    q: 'What is the maximum file size?',
    a: 'Guests can upload files up to 20 MB each and up to 5 files per job. Signed-in plans allow larger files and more files per job.',
  },
];

/** Hand-written copy for the highest-volume searches. Missing fields fall back to the generated defaults. */
const OVERRIDES: Record<string, Partial<ToolSeo>> = {
  'pdf-to-word': {
    title: 'PDF to Word Converter – Free Online, No Signup | Fyredocs',
    metaDescription:
      'Convert PDF to Word (DOCX) online for free. Keeps text, tables and layout so you can edit the document. No signup, no watermark, works on phone and PC.',
    h1: 'PDF to Word Converter',
    intro:
      'Turn any PDF into an editable Microsoft Word document (.docx) in seconds. Fyredocs keeps paragraphs, tables, images and layout, so you can edit the text in Word, Google Docs or LibreOffice instead of retyping it.',
    faqs: [
      {
        q: 'Will the Word file keep my formatting?',
        a: 'Yes. Text, fonts, tables, images and page layout are kept as closely as possible. Complex magazine-style layouts may need small touch-ups.',
      },
      {
        q: 'Can I convert a scanned PDF to Word?',
        a: 'Scanned PDFs are images of text. Run them through OCR PDF first to add a text layer, then convert to Word to get editable text.',
      },
    ],
    related: ['word-to-pdf', 'ocr', 'pdf-to-excel', 'compress', 'edit-pdf'],
  },
  'word-to-pdf': {
    title: 'Word to PDF Converter – Free Online DOC/DOCX to PDF | Fyredocs',
    metaDescription:
      'Convert Word documents (DOC, DOCX) to PDF online for free. Keeps fonts, images and layout. No signup, no watermark, works on any device.',
    h1: 'Word to PDF Converter',
    intro:
      'Convert Microsoft Word files (.doc and .docx) to PDF that looks the same on every device. Fonts, images, tables and page layout are preserved, ready to share, print or submit.',
    related: ['pdf-to-word', 'merge', 'compress', 'excel-to-pdf', 'powerpoint-to-pdf'],
  },
  compress: {
    title: 'Compress PDF – Reduce PDF File Size Online Free | Fyredocs',
    metaDescription:
      'Compress PDF files online for free. Reduce PDF size for email, WhatsApp and form uploads while keeping good quality. No signup, no watermark.',
    h1: 'Compress PDF – Reduce PDF File Size',
    intro:
      'Make large PDFs small enough for email, WhatsApp or an online form upload. Fyredocs shrinks images and removes unneeded data while keeping text sharp and readable.',
    faqs: [
      {
        q: 'How much smaller will my PDF get?',
        a: 'It depends on the content. Scanned and image-heavy PDFs often shrink by 50–90%; text-only PDFs are usually small already and shrink less.',
      },
      {
        q: 'Will compression reduce quality?',
        a: 'Text and vector graphics stay sharp. Images are re-encoded at a lower resolution, which is usually not noticeable on screen.',
      },
    ],
    related: ['merge', 'pdf-to-word', 'image-to-pdf', 'split', 'pdf-to-image'],
  },
  merge: {
    title: 'Merge PDF – Combine PDF Files Online Free | Fyredocs',
    metaDescription:
      'Merge PDF files online for free. Combine multiple PDFs into one document in the order you want. No signup, no watermark, works on mobile.',
    h1: 'Merge PDF Files',
    intro:
      'Combine several PDF files into a single document. Drag the files into the order you want and download one clean PDF — handy for applications, reports and scanned pages.',
    related: ['split', 'compress', 'reorder', 'image-to-pdf', 'extract-pages'],
  },
  split: {
    title: 'Split PDF – Separate PDF Pages Online Free | Fyredocs',
    metaDescription:
      'Split a PDF into separate files online for free. Split every page or by page ranges. No signup, no watermark, works on phone and PC.',
    h1: 'Split PDF',
    intro:
      'Break one PDF into several smaller files — every page on its own, or by the page ranges you choose. Useful for sending only the pages someone needs.',
    related: ['merge', 'extract-pages', 'remove-pages', 'compress', 'reorder'],
  },
  'pdf-to-image': {
    title: 'PDF to Image Converter – PDF to PNG Online Free | Fyredocs',
    metaDescription:
      'Convert PDF pages to high-quality PNG images online for free. Every page becomes an image. No signup, no watermark, works on any device.',
    h1: 'PDF to Image Converter',
    intro:
      'Save every page of a PDF as a high-quality PNG image. Use the images in presentations, social posts, chats or anywhere a PDF is not accepted.',
    related: ['image-to-pdf', 'pdf-to-word', 'compress', 'split', 'pdf-to-ppt'],
  },
  'image-to-pdf': {
    title: 'Image to PDF Converter – JPG/PNG to PDF Online Free | Fyredocs',
    metaDescription:
      'Convert JPG, PNG and other images to PDF online for free. Combine many photos into one PDF. No signup, no watermark, works on mobile.',
    h1: 'Image to PDF Converter (JPG to PDF)',
    intro:
      'Turn photos and images (JPG, PNG and more) into a single PDF document. Perfect for scanned documents, receipts, certificates and assignment pages photographed on your phone.',
    related: ['pdf-to-image', 'merge', 'compress', 'scan-to-pdf', 'ocr'],
  },
  'pdf-to-excel': {
    title: 'PDF to Excel Converter – Free Online PDF to XLSX | Fyredocs',
    metaDescription:
      'Convert PDF tables to Excel (XLSX) online for free. Extract rows and columns into an editable spreadsheet. No signup, no watermark.',
    h1: 'PDF to Excel Converter',
    intro:
      'Pull tables out of PDF bank statements, invoices and reports into an editable Excel spreadsheet (.xlsx), so you can sort, filter and calculate instead of copying by hand.',
    related: ['excel-to-pdf', 'pdf-to-word', 'ocr', 'pdf-to-text', 'compress'],
  },
  'excel-to-pdf': {
    title: 'Excel to PDF Converter – XLS/XLSX to PDF Free | Fyredocs',
    metaDescription:
      'Convert Excel spreadsheets (XLS, XLSX) to PDF online for free. Keeps tables and formatting. No signup, no watermark, works on any device.',
    h1: 'Excel to PDF Converter',
    intro:
      'Convert Excel workbooks (.xls and .xlsx) into PDFs that keep your tables, borders and formatting intact — ready to share, print or attach.',
    related: ['pdf-to-excel', 'word-to-pdf', 'powerpoint-to-pdf', 'merge', 'compress'],
  },
  'powerpoint-to-pdf': {
    title: 'PowerPoint to PDF Converter – PPT/PPTX to PDF Free | Fyredocs',
    metaDescription:
      'Convert PowerPoint presentations (PPT, PPTX) to PDF online for free. One slide per page, layout kept. No signup, no watermark.',
    h1: 'PowerPoint to PDF Converter',
    intro:
      'Convert PowerPoint slides (.ppt and .pptx) to a PDF with one slide per page. Share decks that open anywhere without PowerPoint installed.',
    related: ['pdf-to-ppt', 'word-to-pdf', 'excel-to-pdf', 'merge', 'compress'],
  },
  'pdf-to-ppt': {
    title: 'PDF to PowerPoint Converter – PDF to PPTX Free | Fyredocs',
    metaDescription:
      'Convert PDF to PowerPoint (PPTX) online for free. Each page becomes an editable slide. No signup, no watermark, works on any device.',
    h1: 'PDF to PowerPoint Converter',
    intro:
      'Turn a PDF into a PowerPoint presentation (.pptx), one slide per page, so you can edit, rearrange and present it.',
    related: ['powerpoint-to-pdf', 'pdf-to-word', 'pdf-to-image', 'compress', 'merge'],
  },
  'unlock-pdf': {
    title: 'Unlock PDF – Remove PDF Password Online Free | Fyredocs',
    metaDescription:
      'Remove the password from a PDF you own, online and free. Enter the password once and download an unlocked copy. No signup needed.',
    h1: 'Unlock PDF – Remove Password',
    intro:
      'Remove the open password from a PDF you have the password for — bank statements, e-statements and payslips — so you do not have to type it every time.',
    related: ['password-protect', 'compress', 'merge', 'pdf-to-word', 'sign-pdf'],
  },
  'password-protect': {
    title: 'Protect PDF – Add Password to PDF Online Free | Fyredocs',
    metaDescription:
      'Add a password to your PDF online for free. Encrypt PDFs so only people with the password can open them. No signup, no watermark.',
    h1: 'Protect PDF with a Password',
    intro:
      'Encrypt a PDF with a password so only the people you share it with can open it. Ideal for ID documents, contracts and financial records.',
    related: ['unlock-pdf', 'sign-pdf', 'watermark', 'compress', 'merge'],
  },
  'edit-pdf': {
    title: 'Edit PDF Online Free – Add Text to PDF | Fyredocs',
    metaDescription:
      'Edit PDF files online for free. Add text and annotations to any page and download the updated PDF. No signup, no watermark.',
    h1: 'Edit PDF Online',
    intro:
      'Add text and annotations to any page of a PDF right in your browser — fill in details, add notes or correct information without special software.',
    related: ['sign-pdf', 'add-page-numbers', 'watermark', 'pdf-to-word', 'rotate'],
  },
  'sign-pdf': {
    title: 'Sign PDF Online Free – Add Signature to PDF | Fyredocs',
    metaDescription:
      'Sign PDF documents online for free. Draw your signature and place it anywhere on the page. No signup, no printing or scanning needed.',
    h1: 'Sign PDF Online',
    intro:
      'Draw your signature and place it on any page of a PDF. Sign forms, agreements and letters without printing, signing and scanning.',
    related: ['edit-pdf', 'password-protect', 'merge', 'compress', 'pdf-to-word'],
  },
  rotate: {
    title: 'Rotate PDF – Rotate PDF Pages Online Free | Fyredocs',
    metaDescription:
      'Rotate PDF pages online for free. Turn sideways or upside-down pages the right way and save the PDF. No signup, no watermark.',
    h1: 'Rotate PDF Pages',
    related: ['reorder', 'merge', 'split', 'edit-pdf', 'compress'],
  },
  ocr: {
    title: 'OCR PDF – Make Scanned PDF Searchable Free | Fyredocs',
    metaDescription:
      'OCR PDF online for free. Recognise text in scanned PDFs so you can search, select and copy it. No signup, no watermark.',
    h1: 'OCR PDF – Scanned PDF to Searchable Text',
    intro:
      'Scanned PDFs are just pictures of text. OCR (optical character recognition) adds a hidden text layer so you can search, select and copy the words.',
    related: ['pdf-to-word', 'scan-to-pdf', 'pdf-to-text', 'compress', 'image-to-pdf'],
  },
};

const defaultH1 = (tool: ToolSeoBase): string =>
  CONVERT_GROUPS.has(tool.navGroup) && splitConversion(tool.name) ? `${tool.name} Converter` : tool.name;

const defaultSteps = (tool: ToolSeoBase): string[] => {
  const conv = splitConversion(tool.name);
  const input = conv ? conv.from : 'PDF';
  return [
    `Upload your ${input} file — drag and drop it or click to choose a file.`,
    conv ? `Fyredocs converts it to ${conv.to} automatically.` : 'Choose your options and start the job.',
    'Download the result. Files are deleted automatically afterwards.',
  ];
};

/** Merged SEO copy for a tool: hand-written overrides first, generated defaults for the rest. */
export const getToolSeo = (tool: ToolSeoBase, siblings: readonly ToolSeoBase[] = []): ToolSeo => {
  const o = OVERRIDES[tool.id] ?? {};
  const h1 = o.h1 ?? defaultH1(tool);
  const related =
    o.related ?? siblings.filter((t) => t.navGroup === tool.navGroup && t.id !== tool.id).slice(0, 5).map((t) => t.id);
  return {
    title: o.title ?? `${h1} – Free Online, No Signup | ${BRAND}`,
    metaDescription:
      o.metaDescription ?? `${tool.description}. Free online ${h1.toLowerCase()} — no signup, no watermark, works on any device.`,
    h1,
    intro: o.intro ?? `${tool.description} online for free with ${BRAND}. No installation, no account and no watermark.`,
    steps: o.steps ?? defaultSteps(tool),
    faqs: [...(o.faqs ?? []), ...COMMON_FAQS],
    related,
  };
};

// ---------------------------------------------------------------------------
// Hub page for broad "pdf converter" searches
// ---------------------------------------------------------------------------

export const PDF_CONVERTER_PATH = '/pdf-converter';
export const PDF_CONVERTER_GROUPS = ['convert-from-pdf', 'convert-to-pdf', 'libreoffice'] as const;

export const PDF_CONVERTER_SEO = {
  title: 'Free PDF Converter – PDF to Word, Excel, JPG & More | Fyredocs',
  metaDescription:
    'Free online PDF converter. Convert PDF to Word, Excel, PowerPoint and images, or Word, Excel, PPT and JPG to PDF. No signup, no watermark.',
  h1: 'Free PDF Converter',
  intro:
    'Convert PDFs to and from Word, Excel, PowerPoint, images, HTML and OpenDocument formats — all free, in your browser, with no signup and no watermark.',
};

/** Title and description for non-tool public pages, shared by the pages and the prerender step. */
export const STATIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Fyredocs — Free Online PDF Tools',
    description: 'Merge, split, compress, and convert PDFs online for free. Fast, secure, no installation required.',
  },
  '/all-tools': {
    title: 'All PDF Tools — Fyredocs',
    description:
      'Browse every Fyredocs tool — organize, optimize, convert, edit, and secure PDFs. Free, fast, and no sign-up required.',
  },
  '/pricing': {
    title: 'Pricing — Fyredocs',
    description:
      'Simple, transparent pricing for Fyredocs PDF tools. Use tools as a guest for free, or create an account for bigger limits and longer file retention.',
  },
  '/about': {
    title: 'About — Fyredocs',
    description:
      'Fyredocs makes PDF tools accessible, fast, and private. Files are encrypted in transit, processed on our servers, and auto-deleted on a plan-based schedule.',
  },
  '/contact': {
    title: 'Contact — Fyredocs',
    description: 'Questions about Fyredocs PDF tools? Send us a message or email support@fyredocs.com.',
  },
  '/blog': {
    title: 'Blog — Fyredocs',
    description: 'Tips, tutorials, and insights about working with PDFs — compression, OCR, merging, security, and more.',
  },
  '/privacy': {
    title: 'Privacy Policy — Fyredocs',
    description: 'How Fyredocs collects, uses and protects your data and the files you process with our PDF tools.',
  },
  '/terms': {
    title: 'Terms of Service — Fyredocs',
    description: 'The terms that apply when you use Fyredocs online PDF tools and services.',
  },
  '/cookies': {
    title: 'Cookie Policy — Fyredocs',
    description: 'Which cookies Fyredocs uses, why, and how to change your cookie preferences.',
  },
  [PDF_CONVERTER_PATH]: { title: PDF_CONVERTER_SEO.title, description: PDF_CONVERTER_SEO.metaDescription },
};

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

type JsonLd = Record<string, unknown>;

/** SoftwareApplication + FAQPage + HowTo + BreadcrumbList for a tool page. URLs are omitted when siteUrl is "". */
export const buildToolJsonLd = (tool: ToolSeoBase, seo: ToolSeo, siteUrl: string): JsonLd[] => {
  const url = siteUrl ? siteUrl + tool.route : undefined;
  const app: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: seo.h1,
    description: seo.metaDescription,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@type': 'Organization', name: BRAND },
    ...(url ? { url } : {}),
  };
  const faq: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: seo.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const howTo: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${seo.h1}`,
    step: seo.steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
  };
  const out = [app, faq, howTo];
  if (siteUrl) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'All tools', item: `${siteUrl}/all-tools` },
        { '@type': 'ListItem', position: 3, name: seo.h1, item: url },
      ],
    });
  }
  return out;
};

/** ItemList of converters for the hub page. */
export const buildHubJsonLd = (links: readonly SeoLink[], siteUrl: string): JsonLd[] => [
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: PDF_CONVERTER_SEO.h1,
    itemListElement: links.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: l.name,
      ...(siteUrl ? { url: siteUrl + l.route } : {}),
    })),
  },
];

/** JSON for a <script type="application/ld+json">, with "<" escaped so content can never close the tag. */
export const serializeJsonLd = (data: JsonLd | JsonLd[]): string => JSON.stringify(data).replace(/</g, '\\u003c');

// ---------------------------------------------------------------------------
// Build-time helpers (prerender)
// ---------------------------------------------------------------------------

/**
 * Tool entries from the tools.ts source text. vite.config.ts cannot import
 * tools.ts itself (it uses the '@/' alias), so this reads the fields SEO
 * needs with a regex per entry, the same approach as extractToolRoutes.
 */
export const extractToolBases = (toolsSource: string): ToolSeoBase[] => {
  const entry =
    /\bid:\s*'([^']+)',\s*name:\s*'([^']+)',\s*description:\s*'([^']+)',[\s\S]*?\broute:\s*'([^']+)',\s*navGroup:\s*'([^']+)'/g;
  return [...toolsSource.matchAll(entry)].map(([, id, name, description, route, navGroup]) => ({
    id,
    name,
    description,
    route,
    navGroup,
  }));
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Marks head tags added at build time. main.tsx removes them before React
 * mounts, because react-helmet-async renders its own copies and duplicate
 * canonical / FAQPage tags confuse crawlers that run JS.
 */
export const PRERENDER_ATTR = 'data-prerender';

export interface HeadMeta {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  jsonLd?: JsonLd[];
}

/** Replaces the template's title/description/og tags and appends canonical, og:url, og:image and JSON-LD. */
export const injectHead = (template: string, meta: HeadMeta): string => {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`);
  const extra: string[] = [];
  if (meta.canonical) {
    extra.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" ${PRERENDER_ATTR} />`);
    extra.push(`<meta property="og:url" content="${escapeHtml(meta.canonical)}" ${PRERENDER_ATTR} />`);
  }
  if (meta.image) extra.push(`<meta property="og:image" content="${escapeHtml(meta.image)}" ${PRERENDER_ATTR} />`);
  if (meta.jsonLd?.length)
    extra.push(`<script type="application/ld+json" ${PRERENDER_ATTR}>${serializeJsonLd(meta.jsonLd)}</script>`);
  if (extra.length) html = html.replace('</head>', `    ${extra.join('\n    ')}\n  </head>`);
  return html;
};

/** Puts server-rendered markup inside #root. React's createRoot replaces it on mount. */
export const injectRoot = (template: string, body: string): string =>
  template.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

/** Minimal inline styles so the static content is readable for the moment before the app mounts. */
const STATIC_STYLE =
  '<style>.seo-static{max-width:56rem;margin:0 auto;padding:2rem 1rem;font-family:Inter,system-ui,sans-serif;line-height:1.6}.seo-static a{color:inherit}</style>';

const linkList = (links: readonly SeoLink[]): string =>
  `<ul>${links.map((l) => `<li><a href="${escapeHtml(l.route)}">${escapeHtml(l.name)}</a></li>`).join('')}</ul>`;

/** Static HTML for a tool page: H1, intro, how-to steps, FAQ and related links. */
export const renderToolStaticHtml = (seo: ToolSeo, related: readonly SeoLink[]): string =>
  [
    STATIC_STYLE,
    '<main class="seo-static">',
    `<h1>${escapeHtml(seo.h1)}</h1>`,
    `<p>${escapeHtml(seo.intro)}</p>`,
    `<h2>How to use ${escapeHtml(seo.h1)}</h2>`,
    `<ol>${seo.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>`,
    '<h2>Frequently asked questions</h2>',
    ...seo.faqs.map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`),
    related.length ? `<h2>Related tools</h2>${linkList(related)}` : '',
    '<p><a href="/all-tools">See all PDF tools</a></p>',
    '</main>',
  ].join('');

/** Static HTML for the /pdf-converter hub. */
export const renderHubStaticHtml = (links: readonly SeoLink[]): string =>
  [
    STATIC_STYLE,
    '<main class="seo-static">',
    `<h1>${escapeHtml(PDF_CONVERTER_SEO.h1)}</h1>`,
    `<p>${escapeHtml(PDF_CONVERTER_SEO.intro)}</p>`,
    linkList(links),
    '</main>',
  ].join('');
