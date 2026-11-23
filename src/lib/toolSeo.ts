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
  /** Files allowed per job, for the limits FAQ. */
  maxFiles?: number;
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

/** Social preview image, 1200×630 (public/og-image.jpg). */
export const DEFAULT_OG_IMAGE_PATH = '/og-image.jpg';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
const CONVERT_GROUPS = new Set(['convert-from-pdf', 'convert-to-pdf', 'libreoffice']);

/** "PDF to Word" → { from: "PDF", to: "Word" }; anything else → null. */
const splitConversion = (name: string): { from: string; to: string } | null => {
  const m = /^(.+?) to (.+)$/.exec(name);
  return m ? { from: m[1], to: m[2] } : null;
};

/**
 * FAQs every tool page shares, with the tool's own name and file limit so the
 * pages are not word-for-word copies. Facts here must match the backend:
 * guest plan 20 MB per file (auth-service plans table), guest files deleted
 * after GUEST_JOB_TTL (30 min default), no watermark on any output.
 */
const commonFaqs = (tool: ToolSeoBase): Faq[] => {
  const files = tool.maxFiles ?? 1;
  const perJob = files > 1 ? `up to ${Math.min(files, 5)} files at a time` : 'one file at a time';
  return [
    {
      q: `Is ${tool.name} on Fyredocs free?`,
      a: `Yes. ${tool.name} is free to use as a guest, with no sign-up and no watermark on your files. A free account raises the size limits and keeps your files for longer.`,
    },
    {
      q: 'Are my files safe?',
      a: 'Files are encrypted in transit and processed on our servers. As a guest, your files are deleted automatically about 30 minutes after processing; signed-in plans keep them for longer. We never share your documents.',
    },
    {
      q: `How large a file can I use with ${tool.name}?`,
      a: `Guests can upload files up to 20 MB each, ${perJob}. It works in any modern browser on Windows, Mac, Android and iPhone — nothing to install.`,
    },
  ];
};

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
    title: 'Word to PDF Converter – Free DOC/DOCX to PDF | Fyredocs',
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
    related: ['merge', 'pdf-to-word', 'image-to-pdf', 'split', 'pdf-to-jpg'],
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
  'pdf-to-jpg': {
    title: 'PDF to JPG Converter – Free Online, High Quality | Fyredocs',
    metaDescription:
      'Convert PDF to JPG online for free. Every page becomes a high-quality JPG image you can share anywhere. No signup, no watermark, works on mobile.',
    h1: 'PDF to JPG Converter',
    intro:
      'Turn every page of a PDF into a JPG image. JPGs open everywhere — WhatsApp, Instagram, email, online forms and photo galleries — so you can share a page without sending the whole PDF.',
    faqs: [
      {
        q: 'What do I get for a PDF with several pages?',
        a: 'Each page becomes its own JPG. A one-page PDF downloads as a single JPG; a multi-page PDF downloads as a ZIP file with one JPG per page, in order.',
      },
      {
        q: 'Should I choose JPG or PNG?',
        a: 'JPG files are smaller and ideal for sharing and uploading. Choose PDF to PNG when you need lossless quality for sharp text or diagrams.',
      },
    ],
    related: ['image-to-pdf', 'pdf-to-image', 'compress', 'split', 'pdf-to-word'],
  },
  'pdf-to-image': {
    title: 'PDF to PNG Converter – Free, Lossless Quality | Fyredocs',
    metaDescription:
      'Convert PDF pages to lossless PNG images online for free. Sharp text and diagrams, one image per page. No signup, no watermark.',
    h1: 'PDF to PNG Converter',
    intro:
      'Save every page of a PDF as a lossless PNG image — the best choice when text, charts and diagrams must stay perfectly sharp. Need smaller files for sharing? Use PDF to JPG instead.',
    related: ['pdf-to-jpg', 'image-to-pdf', 'pdf-to-word', 'compress', 'split'],
  },
  'image-to-pdf': {
    title: 'JPG to PDF Converter – Images to PDF Free | Fyredocs',
    metaDescription:
      'Convert JPG, PNG and other images to PDF online for free. Combine many photos into one PDF. No signup, no watermark, works on mobile.',
    h1: 'JPG to PDF Converter',
    intro:
      'Turn photos and images (JPG, PNG and more) into a single PDF document. Perfect for scanned documents, receipts, certificates and assignment pages photographed on your phone.',
    related: ['pdf-to-jpg', 'merge', 'compress', 'scan-to-pdf', 'ocr'],
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
    title: 'PowerPoint to PDF – PPT/PPTX to PDF Free | Fyredocs',
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
  'remove-pages': {
    metaDescription:
      'Delete pages from a PDF online for free. Pick the pages you do not need and download a cleaner PDF. No signup, no watermark.',
    h1: 'Remove Pages from PDF',
    intro:
      'Delete blank, duplicate or unwanted pages from a PDF. Choose the pages to drop and download a clean copy — the rest of the document stays exactly as it was.',
    related: ['extract-pages', 'split', 'reorder', 'merge', 'compress'],
  },
  'extract-pages': {
    metaDescription:
      'Extract pages from a PDF online for free. Save only the pages you need as a new PDF. No signup, no watermark, works on any device.',
    h1: 'Extract Pages from PDF',
    intro:
      'Pull just the pages you need — a single certificate page, a chapter or a few slides — into a new PDF, without changing the original.',
    related: ['split', 'remove-pages', 'merge', 'reorder', 'compress'],
  },
  reorder: {
    metaDescription:
      'Reorder PDF pages online for free. Drag pages into the right order and save the PDF. No signup, no watermark, works on any device.',
    h1: 'Reorder PDF Pages',
    intro:
      'Fix pages that were scanned or merged in the wrong order. Drag the page thumbnails into place and download the corrected PDF.',
    related: ['rotate', 'merge', 'remove-pages', 'split', 'extract-pages'],
  },
  watermark: {
    metaDescription:
      'Add a text or image watermark to PDF online for free. Choose position and opacity to brand or protect documents. No signup needed.',
    h1: 'Add Watermark to PDF',
    intro:
      'Stamp a text or logo watermark on every page — "Confidential", "Draft" or your company logo — with the position, size and opacity you choose.',
    related: ['password-protect', 'add-page-numbers', 'sign-pdf', 'edit-pdf', 'compress'],
  },
  'add-page-numbers': {
    metaDescription:
      'Add page numbers to a PDF online for free. Choose position and style, then download the numbered PDF. No signup, no watermark.',
    h1: 'Add Page Numbers to PDF',
    intro:
      'Number the pages of a report, thesis or assignment automatically. Pick where the numbers go and download the numbered PDF.',
    related: ['merge', 'watermark', 'edit-pdf', 'reorder', 'compress'],
  },
  'repair-pdf': {
    metaDescription:
      'Repair corrupted or damaged PDF files online for free. Recover PDFs that will not open or show errors. No signup, no watermark.',
    h1: 'Repair PDF',
    intro:
      'Try to recover a PDF that will not open, shows errors or was damaged during download. Fyredocs rebuilds the file structure and saves whatever content can be read.',
    related: ['compress', 'pdf-to-pdfa', 'merge', 'ocr', 'pdf-to-word'],
  },
  'pdf-to-text': {
    metaDescription:
      'Extract text from PDF online for free. Save the text of any PDF as a plain .txt file. No signup, no watermark, works on any device.',
    h1: 'PDF to Text Converter',
    intro:
      'Pull all the text out of a PDF into a plain .txt file you can search, copy or paste anywhere. For scanned PDFs, run OCR first.',
    related: ['ocr', 'pdf-to-word', 'pdf-to-html', 'pdf-to-excel', 'compress'],
  },
  'html-to-pdf': {
    metaDescription:
      'Convert HTML files to PDF online for free. Keep layout, images and styles in a shareable PDF. No signup, no watermark.',
    h1: 'HTML to PDF Converter',
    intro:
      'Turn a saved web page or HTML file into a PDF that keeps its layout, images and styling — handy for receipts, reports and archiving pages.',
    related: ['pdf-to-html', 'word-to-pdf', 'merge', 'compress', 'image-to-pdf'],
  },
  'scan-to-pdf': {
    metaDescription:
      'Turn scanned images and phone photos into a clean PDF online for free, with optional OCR. No signup, no watermark.',
    h1: 'Scan to PDF',
    intro:
      'Convert photos of paper documents into a tidy PDF. Optional OCR makes the text searchable so you can find and copy words later.',
    related: ['image-to-pdf', 'ocr', 'merge', 'compress', 'pdf-to-word'],
  },
  'pdf-to-pdfa': {
    metaDescription:
      'Convert PDF to PDF/A (PDF/A-2b) online for free for long-term archiving and e-filing. No signup, no watermark.',
    h1: 'PDF to PDF/A Converter',
    intro:
      'Convert a PDF to PDF/A-2b, the archival standard many courts, government portals and record systems require for long-term storage.',
    related: ['repair-pdf', 'compress', 'pdf-to-word', 'merge', 'ocr'],
  },
};

const defaultH1 = (tool: ToolSeoBase): string =>
  CONVERT_GROUPS.has(tool.navGroup) && splitConversion(tool.name) ? `${tool.name} Converter` : tool.name;

const defaultSteps = (tool: ToolSeoBase): string[] => {
  const conv = splitConversion(tool.name);
  const input = conv ? conv.from : 'PDF';
  return [
    `Upload your ${input} file — drag and drop it or tap to choose a file.`,
    'Check the options and start the job.',
    conv ? `Download your ${conv.to} file when processing finishes.` : 'Download the finished PDF when processing finishes.',
  ];
};

/** "<H1> – Free Online, No Signup | Fyredocs", shortened to stay within ~60 chars of a search result title. */
const defaultTitle = (h1: string): string =>
  [`${h1} – Free Online, No Signup | ${BRAND}`, `${h1} – Free Online | ${BRAND}`, `${h1} | ${BRAND}`].find(
    (t) => t.length <= 60,
  ) ?? `${h1} | ${BRAND}`;

/** Merged SEO copy for a tool: hand-written overrides first, generated defaults for the rest. */
export const getToolSeo = (tool: ToolSeoBase, siblings: readonly ToolSeoBase[] = []): ToolSeo => {
  const o = OVERRIDES[tool.id] ?? {};
  const h1 = o.h1 ?? defaultH1(tool);
  const related =
    o.related ?? siblings.filter((t) => t.navGroup === tool.navGroup && t.id !== tool.id).slice(0, 5).map((t) => t.id);
  return {
    title: o.title ?? defaultTitle(h1),
    metaDescription:
      o.metaDescription ??
      `Free online ${h1}: ${tool.description.charAt(0).toLowerCase()}${tool.description.slice(1)}. No signup, no watermark, works on any device.`,
    h1,
    intro: o.intro ?? `${tool.description} online for free. No installation, no account and no watermark.`,
    steps: o.steps ?? defaultSteps(tool),
    faqs: [...(o.faqs ?? []), ...commonFaqs(tool)],
    related,
  };
};

// ---------------------------------------------------------------------------
// Hub page for broad "pdf converter" searches
// ---------------------------------------------------------------------------

export const PDF_CONVERTER_PATH = '/pdf-converter';
export const PDF_CONVERTER_GROUPS = ['convert-from-pdf', 'convert-to-pdf', 'libreoffice'] as const;

export const PDF_CONVERTER_SEO = {
  title: 'Free PDF Converter – Word, Excel, JPG & More | Fyredocs',
  metaDescription:
    'Free online PDF converter. Convert PDF to Word, Excel, PowerPoint and images, or Word, Excel, PPT and JPG to PDF. No signup, no watermark.',
  h1: 'Free PDF Converter',
  intro:
    'Convert PDFs to and from Word, Excel, PowerPoint, images, HTML and OpenDocument formats — all free, in your browser, with no signup and no watermark.',
};

/** Title and description for non-tool public pages, shared by the pages and the prerender step. */
/** Suffix for page titles, shared by <Seo> and the prerender step. */
export const TITLE_SUFFIX = ` | ${BRAND}`;

/** Title and description for non-tool public pages, shared by the pages and the prerender step. */
export const STATIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: `${BRAND} – Free Online PDF Tools`,
    description:
      'Free online PDF tools: convert PDF to Word, JPG and Excel, merge, split, compress and sign PDFs. Fast, secure, no signup and no watermark.',
  },
  '/all-tools': {
    title: `All PDF Tools${TITLE_SUFFIX}`,
    description:
      'Browse every Fyredocs tool — organize, optimize, convert, edit, and secure PDFs. Free, fast, and no sign-up required.',
  },
  '/pricing': {
    title: `Pricing${TITLE_SUFFIX}`,
    description:
      'Simple, transparent pricing for Fyredocs PDF tools. Use tools as a guest for free, or create an account for bigger limits and longer file retention.',
  },
  '/about': {
    title: `About${TITLE_SUFFIX}`,
    description:
      'Fyredocs makes PDF tools accessible, fast, and private. Files are encrypted in transit, processed on our servers, and auto-deleted on a plan-based schedule.',
  },
  '/contact': {
    title: `Contact${TITLE_SUFFIX}`,
    description: 'Questions about Fyredocs PDF tools? Send us a message or email support@fyredocs.com.',
  },
  '/blog': {
    title: `Blog${TITLE_SUFFIX}`,
    description: 'Tips, tutorials, and insights about working with PDFs — compression, OCR, merging, security, and more.',
  },
  '/docs': {
    title: `Help Guides${TITLE_SUFFIX}`,
    description:
      'Step-by-step guides for every Fyredocs PDF tool: how to convert, merge, split, compress, protect and sign PDFs, plus limits and FAQs.',
  },
  '/privacy': {
    title: `Privacy Policy${TITLE_SUFFIX}`,
    description: 'How Fyredocs collects, uses and protects your data and the files you process with our PDF tools.',
  },
  '/terms': {
    title: `Terms of Service${TITLE_SUFFIX}`,
    description: 'The terms that apply when you use Fyredocs online PDF tools and services.',
  },
  '/cookies': {
    title: `Cookie Policy${TITLE_SUFFIX}`,
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
  const out = [app, faq];
  if (siteUrl) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        { '@type': 'ListItem', position: 2, name: 'All tools', item: `${siteUrl}/all-tools` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: url },
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

/** Organization + WebSite for the home page, so brand searches can show the name and logo. */
export const buildHomeJsonLd = (siteUrl: string): JsonLd[] =>
  siteUrl
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: BRAND,
          url: `${siteUrl}/`,
          logo: `${siteUrl}/favicon-192.png`,
          email: 'support@fyredocs.com',
        },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: `${siteUrl}/` },
      ]
    : [];

/** The fields of a docs.ts entry SEO needs. */
export interface DocSeoInput {
  slug: string;
  title: string;
  description: string;
  category?: string;
  sections: { heading?: string; content: string; type: string; items?: string[] }[];
}

export const docPath = (slug: string): string => `/docs/${slug}`;
/**
 * Tool guides are titled "How to use X" so they target how-to searches and do
 * not compete with the tool page itself for "X".
 */
export const docTitle = (doc: Pick<DocSeoInput, 'title' | 'category'>): string =>
  doc.category === 'tool-guide' ? `How to Use ${doc.title} – Guide${TITLE_SUFFIX}` : `${doc.title} – Help${TITLE_SUFFIX}`;

/** docs.ts descriptions are one short sentence; pad them to a useful snippet length. */
export const docDescription = (doc: Pick<DocSeoInput, 'description'>): string => {
  const base = doc.description.trim().replace(/\.?$/, '.');
  return base.length >= 90 ? base : `${base} Step-by-step help for Fyredocs free online PDF tools.`;
};

export const buildDocJsonLd = (doc: DocSeoInput, siteUrl: string): JsonLd[] => [
  {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    description: docDescription(doc),
    author: { '@type': 'Organization', name: BRAND },
    publisher: { '@type': 'Organization', name: BRAND },
    ...(siteUrl ? { mainEntityOfPage: siteUrl + docPath(doc.slug) } : {}),
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
    /\bid:\s*'([^']+)',\s*name:\s*'([^']+)',\s*description:\s*'([^']+)',([\s\S]*?)\broute:\s*'([^']+)',\s*navGroup:\s*'([^']+)'/g;
  return [...toolsSource.matchAll(entry)].map(([, id, name, description, middle, route, navGroup]) => {
    const maxFiles = /\bmaxFiles:\s*(\d+)/.exec(middle);
    return { id, name, description, route, navGroup, ...(maxFiles ? { maxFiles: Number(maxFiles[1]) } : {}) };
  });
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
  if (meta.image) {
    extra.push(`<meta property="og:image" content="${escapeHtml(meta.image)}" ${PRERENDER_ATTR} />`);
    extra.push(`<meta property="og:image:width" content="${OG_IMAGE_WIDTH}" ${PRERENDER_ATTR} />`);
    extra.push(`<meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" ${PRERENDER_ATTR} />`);
  }
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
  // body{margin:0} matches Tailwind's preflight: if the first paint beats the
  // stylesheet, the browser's default 8px margin otherwise snaps away (CLS).
  '<style>body{margin:0}.seo-static{max-width:56rem;margin:0 auto;padding:2rem 1rem;font-family:Inter,system-ui,sans-serif;line-height:1.6}.seo-static a{color:inherit}</style>';

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

/** Static HTML for the home page: H1, intro and links to the main tools. */
export const renderHomeStaticHtml = (links: readonly SeoLink[]): string =>
  [
    STATIC_STYLE,
    '<main class="seo-static">',
    `<h1>Free Online PDF Tools</h1>`,
    `<p>${escapeHtml(STATIC_PAGE_SEO['/'].description)}</p>`,
    '<h2>Popular tools</h2>',
    linkList(links),
    `<p><a href="${PDF_CONVERTER_PATH}">Free PDF converter</a> · <a href="/all-tools">All PDF tools</a></p>`,
    '</main>',
  ].join('');

/** Static HTML for a help guide: headings, paragraphs and lists (code and diagrams skipped). */
export const renderDocStaticHtml = (doc: DocSeoInput, tool?: SeoLink): string => {
  const body = doc.sections
    .filter((sec) => sec.type !== 'code' && sec.type !== 'mermaid')
    .map((sec) => {
      const parts: string[] = [];
      if (sec.heading) parts.push(`<h2>${escapeHtml(sec.heading)}</h2>`);
      if (sec.content) parts.push(`<p>${escapeHtml(sec.content)}</p>`);
      if (sec.items?.length) {
        const tag = sec.type === 'steps' ? 'ol' : 'ul';
        parts.push(`<${tag}>${sec.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`);
      }
      return parts.join('');
    });
  return [
    STATIC_STYLE,
    '<main class="seo-static">',
    `<h1>${escapeHtml(doc.title)}</h1>`,
    `<p>${escapeHtml(doc.description)}</p>`,
    ...body,
    tool ? `<p><a href="${escapeHtml(tool.route)}">Open ${escapeHtml(tool.name)}</a></p>` : '',
    '<p><a href="/docs">All help guides</a> · <a href="/all-tools">All PDF tools</a></p>',
    '</main>',
  ].join('');
};

/** Static HTML for the help-guide index. */
export const renderDocsIndexStaticHtml = (docs: readonly DocSeoInput[]): string =>
  [
    STATIC_STYLE,
    '<main class="seo-static">',
    '<h1>Fyredocs Help Guides</h1>',
    `<p>${escapeHtml(STATIC_PAGE_SEO['/docs'].description)}</p>`,
    linkList(docs.map((d) => ({ name: d.title, route: docPath(d.slug) }))),
    '</main>',
  ].join('');
