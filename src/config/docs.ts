import { ToolId } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type DocCategory = 'getting-started' | 'tool-guide' | 'concept' | 'faq';

export interface DocSection {
  heading?: string;
  content: string;
  type: 'paragraph' | 'steps' | 'table' | 'tip' | 'formats' | 'code' | 'warning' | 'list' | 'mermaid';
  items?: string[];
  tableData?: { headers: string[]; rows: string[][] };
  language?: string;
}

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
  category: DocCategory;
  toolCategory?: string;
  toolId?: ToolId;
  sections: DocSection[];
}

// ============================================================================
// SIDEBAR NAVIGATION STRUCTURE
// ============================================================================

export interface DocNavGroup {
  title: string;
  color: string;
  items: { slug: string; title: string }[];
}

export const docNavGroups: DocNavGroup[] = [
  {
    title: 'Getting Started',
    color: 'text-primary',
    items: [
      { slug: 'getting-started', title: 'Introduction' },
    ],
  },
  {
    title: 'Organize PDF',
    color: 'text-category-organize',
    items: [
      { slug: 'merge-pdf', title: 'Merge PDF' },
      { slug: 'split-pdf', title: 'Split PDF' },
      { slug: 'reorder-pages', title: 'Reorder Pages' },
      { slug: 'remove-pages', title: 'Remove Pages' },
      { slug: 'extract-pages', title: 'Extract Pages' },
      { slug: 'scan-to-pdf', title: 'Scan to PDF' },
    ],
  },
  {
    title: 'Optimize PDF',
    color: 'text-category-optimize',
    items: [
      { slug: 'compress-pdf', title: 'Compress PDF' },
      { slug: 'repair-pdf', title: 'Repair PDF' },
      { slug: 'ocr-pdf', title: 'OCR PDF' },
    ],
  },
  {
    title: 'Convert to PDF',
    color: 'text-category-convert-to',
    items: [
      { slug: 'image-to-pdf', title: 'Image to PDF' },
      { slug: 'word-to-pdf', title: 'Word to PDF' },
      { slug: 'powerpoint-to-pdf', title: 'PowerPoint to PDF' },
      { slug: 'excel-to-pdf', title: 'Excel to PDF' },
      { slug: 'html-to-pdf', title: 'HTML to PDF' },
    ],
  },
  {
    title: 'Convert from PDF',
    color: 'text-category-convert-from',
    items: [
      { slug: 'pdf-to-image', title: 'PDF to Image' },
      { slug: 'pdf-to-word', title: 'PDF to Word' },
      { slug: 'pdf-to-ppt', title: 'PDF to PowerPoint' },
      { slug: 'pdf-to-excel', title: 'PDF to Excel' },
      { slug: 'pdf-to-text', title: 'PDF to Text' },
      { slug: 'pdf-to-pdfa', title: 'PDF to PDF/A' },
    ],
  },
  {
    title: 'Edit PDF',
    color: 'text-category-edit',
    items: [
      { slug: 'rotate-pdf', title: 'Rotate Pages' },
      { slug: 'add-page-numbers', title: 'Add Page Numbers' },
      { slug: 'add-watermark', title: 'Add Watermark' },
      { slug: 'edit-pdf', title: 'Edit PDF' },
    ],
  },
  {
    title: 'PDF Security',
    color: 'text-category-security',
    items: [
      { slug: 'unlock-pdf', title: 'Unlock PDF' },
      { slug: 'protect-pdf', title: 'Protect PDF' },
      { slug: 'sign-pdf', title: 'Sign PDF' },
    ],
  },
  {
    title: 'Concepts',
    color: 'text-muted-foreground',
    items: [
      { slug: 'supported-formats', title: 'Supported Formats' },
      { slug: 'file-limits', title: 'File Limits' },
      { slug: 'security-privacy', title: 'Security & Privacy' },
      { slug: 'accounts-plans', title: 'Accounts & Plans' },
      { slug: 'activity-history', title: 'Activity History' },
    ],
  },
  {
    title: 'FAQ',
    color: 'text-muted-foreground',
    items: [
      { slug: 'faq', title: 'FAQ' },
    ],
  },
];

// ============================================================================
// DOCUMENTATION ENTRIES
// ============================================================================

export const docs: DocEntry[] = [
  // ──────────────────────────────────────
  // GETTING STARTED
  // ──────────────────────────────────────
  {
    slug: 'getting-started',
    title: 'Getting Started with Fyredocs',
    description: 'Learn how to use Fyredocs to work with your PDF files quickly and easily.',
    category: 'getting-started',
    sections: [
      {
        heading: 'What is Fyredocs?',
        content: 'Fyredocs is a free online platform that lets you work with PDF files right in your browser. You can merge, split, compress, convert, and edit PDFs without installing any software. Every tool runs on the server, so your computer\'s speed and operating system do not matter.',
        type: 'paragraph',
      },
      {
        heading: 'How it works',
        content: 'Every tool on Fyredocs follows the same workflow:',
        type: 'steps',
        items: [
          'Choose a tool from the homepage or navigation menu',
          'Upload your file(s) by dragging and dropping or clicking to browse',
          'Configure any options (compression level, page ranges, DPI, etc.)',
          'Click the action button to start processing',
          'Download your result once processing is complete',
        ],
      },
      {
        heading: 'No account required',
        content: 'You can use every tool on Fyredocs as a guest without signing up. Guest files are automatically deleted after 2 hours. Create a free account if you want longer file retention and access to your job history across sessions.',
        type: 'tip',
      },
      {
        heading: 'Your files are safe',
        content: 'All uploads travel over HTTPS. Files are processed on isolated server instances and automatically deleted — after 2 hours for guests, or according to plan retention for registered users. Fyredocs never reads, indexes, or shares your document content. See the Security & Privacy page for the full details.',
        type: 'paragraph',
      },
    ],
  },

  // ──────────────────────────────────────
  // ORGANIZE PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into a single document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'merge',
    sections: [
      {
        heading: 'What it does',
        content: 'Merge PDF combines two or more PDF files into a single document by appending them sequentially — all pages from file 1 come first, then all pages from file 2, and so on. The output is one continuous PDF. Note that bookmarks and internal cross-document links may not be preserved across the merged files, because each source file has its own internal reference structure.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'list',
        items: [
          'Combining chapters or sections into one document for distribution',
          'Merging scanned pages that were saved as separate files by a scanner',
          'Assembling a report from multiple PDF sources (cover page, body, appendix)',
          'Creating a single portfolio PDF from several separate documents',
        ],
      },
      {
        heading: 'Limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Limit'],
          rows: [
            ['Maximum files per merge', '20'],
            ['Maximum size per file', '50 MB'],
            ['Input format', 'PDF only'],
            ['Output format', 'Single merged PDF'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload between 2 and 20 PDF files using drag-and-drop or the file browser',
          'Drag files on screen to reorder them — the order shown is the order in the output',
          'Click "Merge" to combine them into one PDF',
          'Download the merged file when processing completes',
        ],
      },
      {
        heading: 'Large merged files',
        content: 'Merged PDFs with 500 or more pages may be slow to open in some PDF viewers, especially on mobile devices or in browser-based readers. Consider splitting very large outputs into logical sections if you plan to distribute them.',
        type: 'warning',
      },
      {
        heading: 'Reorder before merging',
        content: 'Use drag and drop to rearrange files before clicking Merge. The final document follows exactly the order you see on screen, so take a moment to confirm the sequence is correct.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'split-pdf',
    title: 'Split PDF',
    description: 'Separate a PDF into multiple smaller documents using four different split modes.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'split',
    sections: [
      {
        heading: 'What it does',
        content: 'Split PDF breaks a single PDF file into multiple smaller documents. There are four distinct split modes, each suited to a different use case. Understanding which mode to pick will save you time.',
        type: 'paragraph',
      },
      {
        heading: 'Split modes explained',
        content: 'Each mode produces different output. Here is what happens with a 10-page PDF as an example:',
        type: 'table',
        tableData: {
          headers: ['Mode', 'What it does', 'Example (10-page PDF)'],
          rows: [
            ['All pages', 'Creates a separate single-page PDF for every page in the document', '10 separate PDFs: page-1.pdf, page-2.pdf, ... page-10.pdf'],
            ['Range', 'Extracts the specified pages into ONE new PDF', 'Entering "1-3,5,7-9" produces one PDF containing pages 1, 2, 3, 5, 7, 8, 9'],
            ['Extract (span)', 'Divides the document into chunks of N pages each', 'With span=3: four files — pages 1-3, pages 4-6, pages 7-9, page 10'],
            ['Equal', 'Splits the document into exactly N equal parts', 'With N=2: two files — pages 1-5 and pages 6-10'],
          ],
        },
      },
      {
        heading: 'Page range syntax',
        content: 'When using Range mode, you specify pages with a comma-separated list. You can mix individual pages and ranges:',
        type: 'list',
        items: [
          'Individual pages: 1,3,5 — extracts only those three pages',
          'Consecutive range: 1-5 — extracts pages 1 through 5 inclusive',
          'Mixed: 1-3,5,7-9 — extracts pages 1, 2, 3, 5, 7, 8, 9 into one PDF',
        ],
      },
      {
        heading: 'Page numbers are 1-based',
        content: 'Page numbering starts at 1, not 0. The first page of your document is page 1. Entering 0 will produce an error.',
        type: 'warning',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a single PDF file (max 50 MB)',
          'Select one of the four split modes: All pages, Range, Extract, or Equal',
          'If using Range mode, enter the page numbers or ranges you want',
          'If using Extract mode, enter the span (number of pages per chunk)',
          'If using Equal mode, enter the number of equal parts',
          'Click "Split" to process',
          'Download the resulting file(s)',
        ],
      },
    ],
  },
  {
    slug: 'reorder-pages',
    title: 'Reorder Pages',
    description: 'Rearrange the pages within a PDF document by specifying their new order.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'reorder',
    sections: [
      {
        heading: 'What it does',
        content: 'Reorder Pages lets you rearrange the pages inside a PDF document. You provide a comma-separated list of page numbers in the new order you want, and the tool produces a PDF with pages in that exact sequence.',
        type: 'paragraph',
      },
      {
        heading: 'How the page list works',
        content: 'Enter every page number exactly once, in the order you want them to appear. For example, if your PDF has 5 pages and you enter "3,1,2,5,4", the output PDF will have: page 3 first, then page 1, then page 2, then page 5, then page 4.',
        type: 'paragraph',
      },
      {
        heading: 'Rules',
        content: '',
        type: 'list',
        items: [
          'Every page in the document must be listed exactly once',
          'No page number can be repeated or omitted',
          'Page numbers are 1-based (first page is 1)',
          'Use commas to separate page numbers: "3,1,2,5,4"',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file (max 50 MB)',
          'Enter the new page order as a comma-separated list (e.g., "3,1,2,5,4")',
          'Click "Reorder" to process',
          'Download the reorganized PDF',
        ],
      },
      {
        heading: 'Example',
        content: '"3,1,2,5,4" on a 5-page PDF puts page 3 first, then page 1, page 2, page 5, page 4.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'remove-pages',
    title: 'Remove Pages',
    description: 'Permanently delete specific pages from a PDF document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'remove-pages',
    sections: [
      {
        heading: 'What it does',
        content: 'Remove Pages deletes the specified pages from your PDF and produces a new file without them. The original uploaded file is not modified — you download a new copy with the pages removed.',
        type: 'paragraph',
      },
      {
        heading: 'Page syntax',
        content: 'Specify the pages to remove using the same syntax as other page-based tools:',
        type: 'list',
        items: [
          'Individual pages: 2,4,6 — removes only those three pages',
          'Consecutive ranges: 3-8 — removes pages 3 through 8 inclusive',
          'Mixed: 1,3-5,9 — removes pages 1, 3, 4, 5, and 9',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file (max 50 MB)',
          'Enter the page numbers or ranges to remove (e.g., "2,4,6-8")',
          'Click "Remove Pages" to process',
          'Download the updated PDF',
        ],
      },
      {
        heading: 'This is permanent',
        content: 'The output file will not contain the removed pages. There is no undo. Make sure you have a backup of the original file if you might need those pages later.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'extract-pages',
    title: 'Extract Pages',
    description: 'Pull specific pages out of a PDF into a new document.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'extract-pages',
    sections: [
      {
        heading: 'What it does',
        content: 'Extract Pages creates a new PDF containing only the pages you specify. The original file is not modified. This is the inverse of Remove Pages — instead of deleting pages, you pick which ones to keep.',
        type: 'paragraph',
      },
      {
        heading: 'Extract vs. Split',
        content: 'Extract Pages always produces a single PDF with your selected pages. Split PDF (in Range mode) can do the same thing, but Split also offers modes that divide the document into multiple files. If you just want one PDF with specific pages, Extract Pages is the simpler choice.',
        type: 'paragraph',
      },
      {
        heading: 'Page syntax',
        content: 'The same syntax used across Fyredocs page-based tools:',
        type: 'list',
        items: [
          'Individual pages: 1,3,5 — extracts only those three pages',
          'Consecutive ranges: 1-5 — extracts pages 1 through 5',
          'Mixed: 1-3,7,10-12 — extracts pages 1, 2, 3, 7, 10, 11, 12',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file (max 50 MB)',
          'Enter the page numbers or ranges to extract (e.g., "1,3,5-7")',
          'Click "Extract" to process',
          'Download the new PDF containing only the extracted pages',
        ],
      },
    ],
  },
  {
    slug: 'scan-to-pdf',
    title: 'Scan to PDF',
    description: 'Convert scanned images into a multi-page PDF with optional OCR.',
    category: 'tool-guide',
    toolCategory: 'ORGANIZE PDF',
    toolId: 'scan-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Scan to PDF converts images (JPG, PNG, WebP) into a multi-page PDF document where each image becomes one page. This is ideal for digitizing physical documents that you have photographed or scanned. You can optionally enable OCR to add an invisible searchable text layer on top of the images.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats and limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Value'],
          rows: [
            ['Accepted image formats', 'JPG, PNG, WebP'],
            ['Output format', 'PDF'],
            ['Maximum images', '20'],
            ['Maximum size per image', '20 MB'],
          ],
        },
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['OCR', 'Enable to add a searchable text layer so you can select and search text in the output PDF'],
            ['Language', 'Choose the language for OCR text recognition — matching the correct language improves accuracy'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 20 images (JPG, PNG, or WebP, max 20 MB each)',
          'Reorder the images if needed — each image becomes one page in order',
          'Optionally enable OCR and select the document language',
          'Click "Convert" to create the PDF',
          'Download the resulting PDF',
        ],
      },
      {
        heading: 'For best OCR results',
        content: 'Use high-resolution scans (300 DPI or higher), ensure the text is not skewed or rotated, and pick the correct language. Low-quality photos taken at an angle will produce poor OCR results.',
        type: 'tip',
      },
    ],
  },

  // ──────────────────────────────────────
  // OPTIMIZE PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce PDF file size with four compression levels, each with different quality tradeoffs.',
    category: 'tool-guide',
    toolCategory: 'OPTIMIZE PDF',
    toolId: 'compress',
    sections: [
      {
        heading: 'What it does',
        content: 'Compress PDF reduces the file size of your PDF documents by recompressing images, removing unused objects, and optimizing internal structures. You choose from four compression levels, each with a different tradeoff between file size reduction and visual quality.',
        type: 'paragraph',
      },
      {
        heading: 'Compression levels',
        content: 'The actual reduction depends on the content of your PDF (image-heavy documents compress more than text-only ones), but here are typical ranges:',
        type: 'table',
        tableData: {
          headers: ['Level', 'Typical reduction', 'Quality impact', 'Best for'],
          rows: [
            ['Low', '~10-20%', 'Virtually no visible loss — images stay sharp', 'Archival, print-ready documents, legal filings'],
            ['Medium', '~30-50%', 'Balanced — slight softening of images at close zoom', 'General use, sharing, uploading to portals'],
            ['High', '~50-70%', 'Noticeable image quality loss — fine details may blur', 'Email attachments, reducing storage costs'],
            ['Extreme', '~70-90%', 'Significant quality loss — images will be visibly blurry', 'Minimum viable file size, quick previews'],
          ],
        },
      },
      {
        heading: 'Batch processing',
        content: 'You can upload up to 10 PDF files at once. Each file is compressed separately with individual progress tracking, so you can see which files are done and download them independently.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload one or more PDF files (up to 10, max 50 MB each)',
          'Select your desired compression level: Low, Medium, High, or Extreme',
          'Click "Compress" to process all files',
          'Download the compressed file(s) — the tool shows the size before and after',
        ],
      },
      {
        heading: 'Extreme compression degrades images',
        content: 'At the Extreme level, images will be visibly blurry and fine text rendered as images may become hard to read. This level is only appropriate when file size matters more than visual quality. If your PDF will be printed, use Low or Medium instead.',
        type: 'warning',
      },
      {
        heading: 'Choosing the right level',
        content: '',
        type: 'list',
        items: [
          'For email (under 10 MB limit): start with High, drop to Extreme only if needed',
          'For archival or legal: use Low to preserve quality faithfully',
          'For printing: use Low or Medium — printers expose compression artifacts',
          'For web upload or general sharing: Medium is usually the sweet spot',
        ],
      },
    ],
  },
  {
    slug: 'repair-pdf',
    title: 'Repair PDF',
    description: 'Rebuild the internal structure of corrupted PDF files using pdfcpu.',
    category: 'tool-guide',
    toolCategory: 'OPTIMIZE PDF',
    toolId: 'repair-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Repair PDF uses pdfcpu to rebuild the internal structure of a damaged PDF file. A PDF is essentially a database of objects (pages, fonts, images) linked by cross-reference tables. When those internal references become corrupted — due to incomplete downloads, disk errors, or software bugs — the file may fail to open or render incorrectly. This tool reconstructs those references and attempts to recover readable content.',
        type: 'paragraph',
      },
      {
        heading: 'What it can fix',
        content: '',
        type: 'list',
        items: [
          'Corrupted cross-reference tables (the most common type of PDF corruption)',
          'Damaged page trees where the viewer cannot find or order pages',
          'Missing or broken internal object references',
          'Files truncated during download that still have intact page content',
        ],
      },
      {
        heading: 'What it cannot fix',
        content: '',
        type: 'list',
        items: [
          'Encrypted files where you do not have the password — use Unlock PDF first if you know the password',
          'Files where the actual content bytes (images, text streams) are destroyed — if the data is gone, no tool can reconstruct it',
          'Files that are completely zeroed out or overwritten with random data',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload the damaged PDF file (max 50 MB)',
          'Click "Repair" to start the reconstruction process',
          'Download the repaired file if the repair succeeds',
        ],
      },
      {
        heading: 'Not all files can be recovered',
        content: 'If the content bytes themselves are missing or overwritten, repair cannot reconstruct them. Before assuming a file is corrupted, try opening it in a different PDF viewer (Adobe Acrobat, Chrome, Firefox) — some viewers are more tolerant of minor structural issues than others.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'ocr-pdf',
    title: 'OCR PDF',
    description: 'Add a searchable text layer to scanned or image-based PDFs using Tesseract OCR.',
    category: 'tool-guide',
    toolCategory: 'OPTIMIZE PDF',
    toolId: 'ocr',
    sections: [
      {
        heading: 'What it does',
        content: 'OCR (Optical Character Recognition) uses Tesseract OCR to analyze scanned or image-based PDF pages, recognize the text in them, and add an invisible text layer on top of each page. The visual appearance of the PDF does not change — you still see the original scanned image — but you can now select, copy, and search the recognized text. This is essential for making scanned archives searchable or for enabling text extraction from image-based PDFs.',
        type: 'paragraph',
      },
      {
        heading: 'When you need OCR (and when you don\'t)',
        content: 'OCR is only useful for scanned or image-based PDFs where the text is part of an image rather than actual digital text. If you can already select and copy text in your PDF, it is already digital and does not need OCR. Running OCR on an already-digital PDF is unnecessary and will not improve it.',
        type: 'paragraph',
      },
      {
        heading: 'DPI settings and tradeoffs',
        content: 'DPI (dots per inch) controls the resolution at which each page is rendered before Tesseract analyzes it. Higher DPI means more detail for the OCR engine to work with, but also means longer processing time:',
        type: 'table',
        tableData: {
          headers: ['DPI', 'Speed', 'Accuracy', 'Best for'],
          rows: [
            ['150', 'Fast', 'Rough — suitable for clean, large-font documents', 'Quick processing of clear, simple scans'],
            ['300', 'Moderate', 'Standard — good accuracy for most documents', 'General-purpose OCR, office documents'],
            ['400', 'Slow', 'High — better with small text and detailed pages', 'Dense documents, small font sizes'],
            ['600', 'Slowest', 'Best — maximum accuracy for difficult sources', 'Archival-quality OCR, faded or low-quality scans'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 scanned or image-based PDF files (max 50 MB each)',
          'Select the document language — this must match the actual language for accurate recognition',
          'Choose a DPI setting based on your quality and speed requirements',
          'Click "OCR" to process',
          'Download the searchable PDF(s)',
        ],
      },
      {
        heading: 'Accuracy depends on input quality',
        content: 'OCR accuracy is directly tied to the quality of the source scan. Clean, high-resolution scans with standard printed fonts produce excellent results. Faded text, unusual fonts, skewed pages, and low-resolution images degrade accuracy. Handwritten text has particularly low accuracy and may not be recognized at all.',
        type: 'warning',
      },
    ],
  },

  // ──────────────────────────────────────
  // CONVERT TO PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert JPG, PNG, or WebP images into a multi-page PDF document.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'image-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Image to PDF converts your images (JPG, PNG, WebP) into a PDF document. Each image becomes one page. Upload multiple images to create a multi-page PDF, and drag to reorder them before converting.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats and limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Value'],
          rows: [
            ['Accepted formats', 'JPG/JPEG, PNG, WebP'],
            ['Output format', 'PDF'],
            ['Maximum files', '20'],
            ['Maximum size per file', '20 MB'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload one or more images (JPG, PNG, or WebP)',
          'Drag to arrange them in the desired page order',
          'Click "Convert" to create the PDF',
          'Download the resulting multi-page PDF',
        ],
      },
    ],
  },
  {
    slug: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Microsoft Word documents to PDF using LibreOffice.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'word-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Word to PDF converts Microsoft Word documents (.doc, .docx) into PDF format using LibreOffice as the conversion engine. Standard formatting — headings, paragraphs, tables, lists, and embedded images — is preserved. However, complex layouts, custom fonts not available on the server, and VBA macros may not convert perfectly.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats and limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Value'],
          rows: [
            ['Accepted formats', 'DOC, DOCX'],
            ['Output format', 'PDF'],
            ['Maximum files', '5'],
            ['Maximum size per file', '50 MB'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 Word documents (max 50 MB each)',
          'Click "Convert" to start processing',
          'Download the PDF version(s)',
        ],
      },
      {
        heading: 'Conversion fidelity',
        content: 'Simple text-heavy documents with standard fonts convert almost perfectly. Documents with complex multi-column layouts, custom fonts, embedded macros, or heavy use of WordArt and SmartArt may look different in the PDF output. If exact fidelity is critical, consider exporting to PDF directly from Microsoft Word.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'powerpoint-to-pdf',
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF using LibreOffice.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'powerpoint-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'PowerPoint to PDF converts your presentations (.ppt, .pptx) into PDF format using LibreOffice. Each slide becomes one page in the output PDF. Standard elements like text, shapes, tables, and embedded images are preserved. Animations, transitions, speaker notes, and custom fonts are not included in the PDF output.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats and limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Value'],
          rows: [
            ['Accepted formats', 'PPT, PPTX'],
            ['Output format', 'PDF'],
            ['Maximum files', '5'],
            ['Maximum size per file', '50 MB'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PowerPoint files (max 50 MB each)',
          'Click "Convert" to start processing',
          'Download the PDF version(s)',
        ],
      },
      {
        heading: 'Conversion fidelity',
        content: 'Slides with complex overlapping elements, custom fonts, or heavy graphics may shift or render differently. For pixel-perfect output, export to PDF directly from PowerPoint.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'excel-to-pdf',
    title: 'Excel to PDF',
    description: 'Convert Excel spreadsheets to PDF using LibreOffice.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'excel-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Excel to PDF converts your spreadsheets (.xls, .xlsx) into PDF format using LibreOffice. Tables, cell formatting, borders, and basic formulas (as their computed values) are preserved. Charts and conditional formatting may not render identically to what you see in Excel.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats and limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Value'],
          rows: [
            ['Accepted formats', 'XLS, XLSX'],
            ['Output format', 'PDF'],
            ['Maximum files', '5'],
            ['Maximum size per file', '50 MB'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 Excel files (max 50 MB each)',
          'Click "Convert" to start processing',
          'Download the PDF version(s)',
        ],
      },
      {
        heading: 'Wide spreadsheets',
        content: 'Very wide spreadsheets may be split across multiple PDF pages or scaled down to fit. If your spreadsheet has many columns, consider setting a print area in Excel before uploading for a cleaner result.',
        type: 'tip',
      },
    ],
  },
  {
    slug: 'html-to-pdf',
    title: 'HTML to PDF',
    description: 'Convert HTML files to portable PDF documents.',
    category: 'tool-guide',
    toolCategory: 'CONVERT TO PDF',
    toolId: 'html-to-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'HTML to PDF converts HTML files into PDF format. This is useful for saving web pages, HTML reports, or HTML-based documentation as portable, printable PDF files. Inline CSS and embedded images are rendered; external stylesheets and remote resources may not be available during conversion.',
        type: 'paragraph',
      },
      {
        heading: 'Supported formats and limits',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Value'],
          rows: [
            ['Accepted formats', 'HTML, HTM'],
            ['Output format', 'PDF'],
            ['Maximum files', '5'],
            ['Maximum size per file', '50 MB'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 HTML files (max 50 MB each)',
          'Click "Convert" to start processing',
          'Download the PDF version(s)',
        ],
      },
      {
        heading: 'Rendering limitations',
        content: 'The converter cannot load external CSS, JavaScript, or images referenced by URL. For best results, use self-contained HTML files with inline styles and base64-encoded images.',
        type: 'warning',
      },
    ],
  },

  // ──────────────────────────────────────
  // CONVERT FROM PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'pdf-to-image',
    title: 'PDF to Image',
    description: 'Convert each page of a PDF into a separate PNG image.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-image',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Image renders each page of your PDF as a separate PNG image file. This is useful for embedding individual pages in presentations, sharing on platforms that do not support PDF, or creating image previews of documents.',
        type: 'paragraph',
      },
      {
        heading: 'Output details',
        content: '',
        type: 'list',
        items: [
          'Each page becomes one PNG file',
          'Pages are numbered sequentially (page-1.png, page-2.png, etc.)',
          'If you upload a 10-page PDF, you get 10 separate PNG files',
          'Images are rendered at a resolution suitable for on-screen viewing',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files (max 50 MB each)',
          'Click "Convert" to process',
          'Download the resulting PNG images (provided as a ZIP if multiple)',
        ],
      },
    ],
  },
  {
    slug: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert PDF documents to editable Word (.docx) files.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-word',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Word converts your PDF documents into editable Microsoft Word (.docx) files. The converter attempts to preserve text, formatting, and layout as closely as possible. Tables and simple single-column layouts convert well. Complex multi-column layouts, embedded images, and unusual fonts may shift or change during conversion.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'list',
        items: [
          'Editing content from a PDF you received when you do not have the original Word file',
          'Updating an old document where only the PDF version survives',
          'Extracting and reformatting PDF content for a new purpose',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files (max 50 MB each)',
          'Click "Convert" to process',
          'Download the Word (.docx) document(s)',
        ],
      },
      {
        heading: 'Conversion accuracy',
        content: 'Simple, text-heavy documents with standard layouts convert best. Complex layouts with overlapping elements, custom fonts, or heavy graphics may not convert perfectly. If the output looks wrong, try simplifying the source PDF or using copy-paste for the sections you need.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'pdf-to-ppt',
    title: 'PDF to PowerPoint',
    description: 'Convert PDF files to editable PowerPoint (.pptx) presentations.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-ppt',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to PowerPoint converts your PDF into an editable PowerPoint (.pptx) presentation. Each PDF page becomes one slide. Text and basic layout elements are converted to editable slide objects where possible. Complex graphics and unusual formatting may be rendered as background images rather than editable elements.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files (max 50 MB each)',
          'Click "Convert" to process',
          'Download the PowerPoint (.pptx) file(s)',
        ],
      },
      {
        heading: 'Conversion accuracy',
        content: 'PDFs originally created from PowerPoint tend to convert back well. PDFs from other sources (scanned documents, complex design layouts) may produce slides with limited editability. Complex overlapping elements, custom fonts, and heavy graphics may not convert perfectly.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'pdf-to-excel',
    title: 'PDF to Excel',
    description: 'Extract tables and data from PDFs into editable Excel (.xlsx) spreadsheets.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-excel',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Excel extracts tables and structured data from your PDF documents into editable Excel (.xlsx) spreadsheets. The converter identifies tabular structures in the PDF and maps them to spreadsheet rows and columns. Non-tabular content (paragraphs, images, headers) may not convert meaningfully.',
        type: 'paragraph',
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'list',
        items: [
          'Extracting data from financial reports, invoices, or statements in PDF format',
          'Converting tabular data for analysis, sorting, or charting in Excel',
          'Pulling numbers from regulatory filings or data sheets',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files (max 50 MB each)',
          'Click "Convert" to process',
          'Download the Excel (.xlsx) file(s)',
        ],
      },
      {
        heading: 'Table detection',
        content: 'The converter works best on PDFs with clearly defined tables that use visible borders or consistent column alignment. Tables without borders, merged cells, or unusual layouts may not be detected correctly. Always verify the extracted data against the original.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'pdf-to-text',
    title: 'PDF to Text',
    description: 'Extract plain text from PDF documents, stripping all formatting.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-text',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to Text extracts all text content from your PDF and saves it as a plain text (.txt) file. All formatting, images, colors, and layout information is stripped — you get only the raw text content. Tables lose their visual structure and become sequences of text values.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files (max 50 MB each)',
          'Click "Convert" to process',
          'Download the plain text (.txt) file(s)',
        ],
      },
      {
        heading: 'Scanned PDFs need OCR first',
        content: 'If your PDF is scanned (the text is part of an image), this tool will extract little or no text. Use the OCR tool first to add a searchable text layer, then use PDF to Text to extract it.',
        type: 'tip',
      },
      {
        heading: 'Tables and layout',
        content: 'Tables will lose their columnar structure in plain text output. If you need to preserve table structure, use PDF to Excel instead.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'pdf-to-pdfa',
    title: 'PDF to PDF/A',
    description: 'Convert PDFs to ISO 19005-2 archival format for long-term preservation.',
    category: 'tool-guide',
    toolCategory: 'CONVERT FROM PDF',
    toolId: 'pdf-to-pdfa',
    sections: [
      {
        heading: 'What it does',
        content: 'PDF to PDF/A converts your documents to PDF/A-2b format, which conforms to ISO 19005-2, the international standard for long-term digital document preservation. The conversion embeds all fonts used in the document directly into the file, ensuring it can be rendered faithfully on any system in the future without depending on external font files.',
        type: 'paragraph',
      },
      {
        heading: 'What changes during conversion',
        content: 'PDF/A is a strict subset of PDF. To comply with the standard, certain features are removed or modified:',
        type: 'list',
        items: [
          'All fonts are embedded (even if they were not before)',
          'Interactive form fields may be flattened',
          'JavaScript actions are removed',
          'External content references are removed',
          'Transparency may be flattened depending on the source',
        ],
      },
      {
        heading: 'When to use it',
        content: '',
        type: 'list',
        items: [
          'Archiving legal, compliance, or regulatory documents that must remain readable for years',
          'Submitting files to government or institutional systems that require PDF/A format',
          'Ensuring documents remain faithfully reproducible regardless of the viewer or operating system',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 5 PDF files (max 50 MB each)',
          'Click "Convert" to process',
          'Download the PDF/A-2b file(s)',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // EDIT PDF TOOLS
  // ──────────────────────────────────────
  {
    slug: 'rotate-pdf',
    title: 'Rotate Pages',
    description: 'Rotate PDF pages by 90, 180, or 270 degrees with fine-grained page selection.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'rotate',
    sections: [
      {
        heading: 'What it does',
        content: 'Rotate Pages lets you rotate pages in your PDF clockwise by a fixed angle. This is commonly needed when scanned documents come in sideways or upside down, or when landscape pages need to be turned for printing.',
        type: 'paragraph',
      },
      {
        heading: 'Rotation angles',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Angle', 'Effect'],
          rows: [
            ['90°', 'Quarter turn clockwise — landscape becomes portrait (or vice versa)'],
            ['180°', 'Upside down — corrects pages that were scanned in reverse'],
            ['270°', 'Quarter turn counter-clockwise — equivalent to 90° in the other direction'],
          ],
        },
      },
      {
        heading: 'Page selection',
        content: 'You can apply the rotation to different subsets of pages:',
        type: 'list',
        items: [
          'All pages — rotates every page in the document',
          'Odd pages only — useful for double-sided scans where only one side is rotated',
          'Even pages only — the complement of odd pages',
          'Specific page numbers — target individual pages by number',
        ],
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file (max 50 MB)',
          'Select the rotation angle: 90°, 180°, or 270°',
          'Choose which pages to rotate: all, odd, even, or specific pages',
          'Click "Rotate" to process',
          'Download the rotated PDF',
        ],
      },
    ],
  },
  {
    slug: 'add-page-numbers',
    title: 'Add Page Numbers',
    description: 'Insert page numbers at configurable positions and formats on every page.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'add-page-numbers',
    sections: [
      {
        heading: 'What it does',
        content: 'Add Page Numbers stamps a page number onto each page of your PDF. You control exactly where the number appears, what format it uses, and what number to start from.',
        type: 'paragraph',
      },
      {
        heading: 'Position options',
        content: 'Choose from six positions on the page:',
        type: 'list',
        items: [
          'Top-left, top-center, top-right',
          'Bottom-left, bottom-center, bottom-right',
        ],
      },
      {
        heading: 'Number formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Format', 'Example output'],
          rows: [
            ['"1"', '1, 2, 3, 4, ...'],
            ['"Page 1"', 'Page 1, Page 2, Page 3, ...'],
            ['"1 of N"', '1 of 10, 2 of 10, 3 of 10, ...'],
            ['"- 1 -"', '- 1 -, - 2 -, - 3 -, ...'],
          ],
        },
      },
      {
        heading: 'Start number',
        content: 'The starting number does not have to be 1. If this PDF is a section of a larger document (for example, chapter 3 starting on page 47), set the start number to 47 so the page numbers continue from the previous section.',
        type: 'tip',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file (max 50 MB)',
          'Choose the position (e.g., bottom-center)',
          'Select the number format (e.g., "Page 1")',
          'Set the starting number (default is 1)',
          'Adjust font size if needed',
          'Click "Add Numbers" to process',
          'Download the numbered PDF',
        ],
      },
    ],
  },
  {
    slug: 'add-watermark',
    title: 'Add Watermark',
    description: 'Add text or image watermarks with configurable position, opacity, and tiling.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'watermark',
    sections: [
      {
        heading: 'What it does',
        content: 'Add Watermark places a text or image watermark on every page of your PDF. This is commonly used to mark documents as "CONFIDENTIAL", "DRAFT", or to brand them with a logo. You control the watermark type, position, opacity, and size.',
        type: 'paragraph',
      },
      {
        heading: 'Watermark types',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Type', 'Description'],
          rows: [
            ['Text watermark', 'Type your own text, choose font size — common for "CONFIDENTIAL", "DRAFT", "SAMPLE"'],
            ['Image watermark', 'Upload an image file (logo, stamp) to overlay on pages — set scale to control size'],
          ],
        },
      },
      {
        heading: 'Position modes',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Position', 'Description'],
          rows: [
            ['Center', 'Single watermark centered on each page'],
            ['Diagonal', 'Text rotated 45 degrees across the page — the classic "CONFIDENTIAL" style'],
            ['Tiled', 'Repeats the watermark in a grid pattern across the entire page'],
          ],
        },
      },
      {
        heading: 'Opacity',
        content: 'Opacity ranges from 0% (invisible) to 100% (fully opaque). For watermarks that should be visible but not obscure the underlying content, use 20-40% opacity. This lets the document text show through clearly while the watermark remains readable.',
        type: 'tip',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 10 PDF files (max 50 MB each)',
          'Choose text or image watermark',
          'For text: enter your text, set font size',
          'For image: upload the watermark image, set scale',
          'Select position: center, diagonal, or tiled',
          'Set opacity (recommended: 20-40%)',
          'Click "Add Watermark" to process',
          'Download the watermarked PDF(s)',
        ],
      },
    ],
  },
  {
    slug: 'edit-pdf',
    title: 'Edit PDF',
    description: 'Add text annotations at specific positions on any page of a PDF.',
    category: 'tool-guide',
    toolCategory: 'EDIT PDF',
    toolId: 'edit-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Edit PDF lets you add new text annotations at specific positions on any page of your PDF. You specify the text content, the page number, the X/Y coordinates, and the font size. The text is placed on top of the existing page content.',
        type: 'paragraph',
      },
      {
        heading: 'Important limitation',
        content: 'This tool cannot modify or delete existing text in the PDF. It only adds new text on top of what is already there. If you need to change existing text, you will need to use a full PDF editor like Adobe Acrobat.',
        type: 'warning',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file (max 50 MB)',
          'Add one or more text annotations, specifying for each: the text content, page number, X and Y position, and font size',
          'Click "Apply" to process',
          'Download the edited PDF with your annotations added',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // SECURITY TOOLS
  // ──────────────────────────────────────
  {
    slug: 'unlock-pdf',
    title: 'Unlock PDF',
    description: 'Remove password protection from PDFs when you know the current password.',
    category: 'tool-guide',
    toolCategory: 'PDF SECURITY',
    toolId: 'unlock-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Unlock PDF removes the password requirement from a protected PDF so it can be opened freely without entering a password. You must provide the current password — this tool verifies it, decrypts the file, and produces an unprotected copy.',
        type: 'paragraph',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 10 password-protected PDF files (max 50 MB each)',
          'Enter the current password that protects the file(s)',
          'Click "Unlock" to remove the password protection',
          'Download the unlocked PDF(s) — they will open without a password prompt',
        ],
      },
      {
        heading: 'This is not a password cracker',
        content: 'This tool cannot bypass, guess, or brute-force unknown passwords. You must enter the correct password. If you do not know the password, this tool cannot help you — contact the person who created or sent you the protected file.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Add password protection and permission controls to PDF documents.',
    category: 'tool-guide',
    toolCategory: 'PDF SECURITY',
    toolId: 'password-protect',
    sections: [
      {
        heading: 'What it does',
        content: 'Protect PDF encrypts your document with a password. Anyone who receives the file must enter this password to open it. You can also independently control whether the recipient is allowed to print, copy text from, or edit the document.',
        type: 'paragraph',
      },
      {
        heading: 'Options',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Option', 'Description'],
          rows: [
            ['Open password', 'The password required to open the document. Leave it empty to restrict permissions without locking the file'],
            ['Allow printing', 'If disabled, the document cannot be printed from a compliant PDF viewer'],
            ['Allow copying', 'If disabled, text selection and copy are blocked in compliant viewers'],
            ['Allow editing', 'If disabled, content changes are blocked in compliant viewers'],
            ['Allow comments and form filling', 'If disabled, annotations and form filling are blocked in compliant viewers'],
            ['Allow page changes', 'If disabled, inserting, rotating and deleting pages is blocked in compliant viewers'],
            ['Permissions password', 'Optional separate password needed to change the permissions; defaults to the open password'],
            ['Encryption', 'AES-256 (default), AES-128, or RC4-128 for very old viewers'],
          ],
        },
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload up to 10 PDF files (max 50 MB each)',
          'Set the open password, a permissions password, or both',
          'Choose which permissions to allow and the encryption level',
          'Click "Protect" to apply encryption',
          'Download the protected PDF(s)',
        ],
      },
      {
        heading: 'Password protection is a deterrent, not absolute security',
        content: 'PDF password protection can be bypassed by some third-party tools, especially the permission restrictions (print, copy, edit). The open password provides stronger protection, but it is not equivalent to enterprise-grade encryption. For highly sensitive documents, consider additional security measures beyond PDF passwords.',
        type: 'warning',
      },
    ],
  },
  {
    slug: 'sign-pdf',
    title: 'Sign PDF',
    description: 'Add a visual signature image to PDF documents by drawing or uploading.',
    category: 'tool-guide',
    toolCategory: 'PDF SECURITY',
    toolId: 'sign-pdf',
    sections: [
      {
        heading: 'What it does',
        content: 'Sign PDF lets you add a visual signature image to your PDF. You can draw your signature on screen or upload an image of your signature, then position it on any page of the document. The signature is embedded as an image overlay on the PDF page.',
        type: 'paragraph',
      },
      {
        heading: 'This is NOT a digital signature',
        content: 'This tool adds a visual image of a signature — the same as printing the document, signing it with a pen, and scanning it back. It does NOT create a cryptographic digital signature. It does not provide legal non-repudiation, certificate-based verification, or tamper detection. For legally binding digital signatures with certificates, use dedicated e-signature software such as DocuSign, Adobe Sign, or similar services.',
        type: 'warning',
      },
      {
        heading: 'How to use it',
        content: '',
        type: 'steps',
        items: [
          'Upload a PDF file (max 50 MB)',
          'Draw your signature on the canvas OR upload an image of your signature',
          'Position the signature on the desired page and location',
          'Click "Sign" to apply the signature to the PDF',
          'Download the signed PDF',
        ],
      },
    ],
  },

  // ──────────────────────────────────────
  // CONCEPTS
  // ──────────────────────────────────────
  {
    slug: 'supported-formats',
    title: 'Supported Formats',
    description: 'Complete reference of file formats, extensions, MIME types, and which tools accept them.',
    category: 'concept',
    sections: [
      {
        heading: 'Document formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Format', 'Extensions', 'MIME type', 'Used in'],
          rows: [
            ['PDF', '.pdf', 'application/pdf', 'All tools'],
            ['Microsoft Word', '.doc, .docx', 'application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Word to PDF, PDF to Word'],
            ['Microsoft Excel', '.xls, .xlsx', 'application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Excel to PDF, PDF to Excel'],
            ['Microsoft PowerPoint', '.ppt, .pptx', 'application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation', 'PowerPoint to PDF, PDF to PowerPoint'],
            ['HTML', '.html, .htm', 'text/html', 'HTML to PDF, PDF to HTML'],
            ['Plain Text', '.txt', 'text/plain', 'PDF to Text'],
          ],
        },
      },
      {
        heading: 'Image formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Format', 'Extensions', 'MIME type', 'Used in'],
          rows: [
            ['JPEG', '.jpg, .jpeg', 'image/jpeg', 'Image to PDF, Scan to PDF, Watermark (image upload)'],
            ['PNG', '.png', 'image/png', 'Image to PDF, Scan to PDF, PDF to Image, Watermark (image upload)'],
            ['WebP', '.webp', 'image/webp', 'Image to PDF, Scan to PDF'],
          ],
        },
      },
      {
        heading: 'Archival formats',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Format', 'Standard', 'Description', 'Used in'],
          rows: [
            ['PDF/A-2b', 'ISO 19005-2', 'Long-term archival format with embedded fonts and metadata', 'PDF to PDF/A'],
          ],
        },
      },
      {
        heading: 'Output-only formats',
        content: 'Some formats appear only as outputs and cannot be uploaded:',
        type: 'list',
        items: [
          'ZIP — used when a tool produces multiple files (e.g., Split PDF, PDF to Image)',
          'HTML in ZIP — PDF to HTML produces an HTML file with embedded images bundled in a ZIP archive',
        ],
      },
    ],
  },
  {
    slug: 'file-limits',
    title: 'File Limits',
    description: 'Maximum file sizes, file counts, and an explanation of why limits exist.',
    category: 'concept',
    sections: [
      {
        heading: 'Limits by tool',
        content: 'Each tool has specific limits on file size and the number of files you can process at once:',
        type: 'table',
        tableData: {
          headers: ['Tool', 'Max file size', 'Max files'],
          rows: [
            ['Merge PDF', '50 MB', '20'],
            ['Split PDF', '50 MB', '1'],
            ['Reorder Pages', '50 MB', '1'],
            ['Remove Pages', '50 MB', '1'],
            ['Extract Pages', '50 MB', '1'],
            ['Scan to PDF', '20 MB', '20'],
            ['Compress PDF', '50 MB', '10'],
            ['Repair PDF', '50 MB', '1'],
            ['OCR PDF', '50 MB', '5'],
            ['Image to PDF', '20 MB', '20'],
            ['Word/Excel/PPT to PDF', '50 MB', '5'],
            ['HTML to PDF', '50 MB', '5'],
            ['PDF to Word/Excel/PPT/Image/Text', '50 MB', '5'],
            ['PDF to PDF/A', '50 MB', '5'],
            ['Rotate Pages', '50 MB', '1'],
            ['Add Page Numbers', '50 MB', '1'],
            ['Add Watermark', '50 MB', '10'],
            ['Edit PDF', '50 MB', '1'],
            ['Unlock PDF', '50 MB', '10'],
            ['Protect PDF', '50 MB', '10'],
            ['Sign PDF', '50 MB', '1'],
          ],
        },
      },
      {
        heading: 'Why limits exist',
        content: 'File size and count limits exist to ensure reliable processing for all users:',
        type: 'list',
        items: [
          'Server memory: each file is loaded into memory during processing. Very large files or too many concurrent files can exhaust available RAM.',
          'Processing time: operations like OCR at 600 DPI or compressing a 50 MB file take significant CPU time. Limits prevent individual jobs from blocking the queue.',
          'Upload reliability: large files are more likely to encounter network timeouts or interruptions during upload.',
        ],
      },
      {
        heading: 'What happens when limits are exceeded',
        content: 'If you try to upload a file that exceeds the size limit, or more files than the tool allows, the upload is rejected before it starts. You will see an error message indicating which limit was exceeded. The file is not sent to the server — the check happens in your browser.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'security-privacy',
    title: 'Security & Privacy',
    description: 'How Fyredocs protects your files during upload, processing, and storage.',
    category: 'concept',
    sections: [
      {
        heading: 'Encrypted transfers',
        content: 'All file uploads and downloads travel over HTTPS (TLS 1.2+). Your files are encrypted in transit between your browser and our servers. No file data is ever sent in the clear.',
        type: 'paragraph',
      },
      {
        heading: 'Isolated processing',
        content: 'Each file is processed in an isolated server instance. Your files are not accessible to other users or other processing jobs. Once processing completes, the working files are cleaned up.',
        type: 'paragraph',
      },
      {
        heading: 'Automatic deletion',
        content: 'Files are automatically deleted on a schedule based on your account type:',
        type: 'list',
        items: [
          'Guest users (no account): files are deleted 2 hours after upload',
          'Registered users: files are retained according to plan retention period, then automatically deleted',
          'Files are never kept indefinitely — all files have a deletion deadline',
        ],
      },
      {
        heading: 'What we never do',
        content: '',
        type: 'list',
        items: [
          'We never read, analyze, or index your document content',
          'We never share your files with any third party',
          'We never use your files for AI training, analytics, or any purpose beyond processing your request',
          'We never sell or monetize your data in any form',
          'We never serve ads based on your document content',
        ],
      },
      {
        heading: 'Server security',
        content: 'Our servers are secured with industry-standard practices including firewalls, access controls, and regular security audits. All processing happens in isolated environments with no persistent storage of document content beyond the retention period.',
        type: 'paragraph',
      },
    ],
  },
  {
    slug: 'accounts-plans',
    title: 'Accounts & Plans',
    description: 'Compare guest access and free accounts — features, retention, and limitations.',
    category: 'concept',
    sections: [
      {
        heading: 'Guest access',
        content: 'You can use every tool on Fyredocs without creating an account. Guest sessions are identified by a temporary browser token. You get full access to all tools with the same processing capabilities as registered users. The main limitation is that your files are automatically deleted after 2 hours and you have no job history.',
        type: 'paragraph',
      },
      {
        heading: 'Free account',
        content: 'Create a free account with just an email and password. A free account gives you longer file retention, a persistent job history so you can re-download results, and a consistent experience across devices and sessions. All tools remain free — there are no paywalled features.',
        type: 'paragraph',
      },
      {
        heading: 'Feature comparison',
        content: '',
        type: 'table',
        tableData: {
          headers: ['Feature', 'Guest', 'Free Account'],
          rows: [
            ['Access to all tools', 'Yes', 'Yes'],
            ['File size limits', 'Same as registered', 'Same as guest'],
            ['File retention', '2 hours', 'Longer (plan-based)'],
            ['Job history', 'No — lost when session ends', 'Yes — accessible across sessions'],
            ['Re-download results', 'Only during retention window', 'Yes, from job history'],
            ['Cross-device access', 'No — tied to browser token', 'Yes — login from any device'],
            ['Account required', 'No', 'Yes — email + password signup'],
          ],
        },
      },
    ],
  },

  // ──────────────────────────────────────
  // Activity History
  // ──────────────────────────────────────
  {
    slug: 'activity-history',
    title: 'Activity History',
    description: 'See your recent tool runs, sign-ins, and account changes in one place.',
    category: 'concept',
    sections: [
      {
        heading: 'What is tracked',
        content: 'When you are signed in, Fyredocs keeps a personal activity trail: tool jobs you start (with their outcome — completed, failed, or cancelled), sign-ins and sign-outs, plan changes, share links you create, and security-relevant events such as password resets. Open it from your profile menu under "My Activity". Events are grouped by day and can be filtered by category.',
        type: 'paragraph',
      },
      {
        heading: 'What is never stored',
        content: 'Activity entries record what happened, not what your files contain. Fyredocs never stores document contents, extracted text, passwords, or tokens in your activity history. Tool entries carry only the tool name, timing, outcome, and technical context such as file counts.',
        type: 'paragraph',
      },
      {
        heading: 'Guests',
        content: 'Guest sessions contribute anonymous usage events, but there is no personal activity page for guests — a signed-in account is what makes the trail yours. Create a free account to keep a history you can revisit.',
        type: 'tip',
      },
    ],
  },

  // ──────────────────────────────────────
  // FAQ
  // ──────────────────────────────────────
  {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Answers to the most common questions about Fyredocs.',
    category: 'faq',
    sections: [
      {
        heading: 'Is Fyredocs free?',
        content: 'Yes. Every tool on Fyredocs is free to use, with no hidden limits or paywalled features. You can process files as a guest without creating an account.',
        type: 'paragraph',
      },
      {
        heading: 'Are my files safe?',
        content: 'Yes. All files are uploaded over HTTPS, processed in isolated server instances, and automatically deleted after processing (2 hours for guests, longer for registered users). We never read, share, analyze, or index your document content. See the Security & Privacy page for the full details.',
        type: 'paragraph',
      },
      {
        heading: 'Do I need an account?',
        content: 'No. Guest mode gives you full access to every tool. Creating a free account (email + password) gives you longer file retention and a persistent job history, but it is entirely optional.',
        type: 'paragraph',
      },
      {
        heading: 'What is the maximum file size?',
        content: 'Most tools accept files up to 50 MB. Image-based tools (Image to PDF, Scan to PDF) accept up to 20 MB per image. See the File Limits page for the complete per-tool breakdown.',
        type: 'paragraph',
      },
      {
        heading: 'How long are files stored?',
        content: 'Guest files are automatically deleted 2 hours after upload. Registered users get longer retention based on their plan. No files are stored indefinitely.',
        type: 'paragraph',
      },
      {
        heading: 'Can I process multiple files at once?',
        content: 'Yes. Most tools support batch processing — Merge accepts up to 20 files, Compress up to 10, conversion tools up to 5, and so on. The exact limit varies by tool. Check the tool documentation or the File Limits page for specifics.',
        type: 'paragraph',
      },
      {
        heading: 'What browsers are supported?',
        content: 'Fyredocs works in all modern browsers: Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser for the best experience. Internet Explorer is not supported.',
        type: 'paragraph',
      },
      {
        heading: 'Why does my converted file look different from the original?',
        content: 'Conversions between formats (especially PDF to Word, PDF to PowerPoint) rely on heuristics to reconstruct editable elements from a fixed-layout format. Complex layouts with overlapping elements, custom fonts not available on the server, or heavy graphics may shift or change. Simple, text-heavy documents with standard layouts convert best. If exact fidelity is critical, try exporting directly from the originating application instead.',
        type: 'paragraph',
      },
      {
        heading: 'Why is processing slow?',
        content: 'Most operations complete in under 30 seconds. However, large files (40+ MB), complex operations like OCR at 600 DPI, or batch jobs with many files take longer. OCR in particular is CPU-intensive because it renders each page as a high-resolution image and then analyzes every character. If speed is a priority, try reducing DPI for OCR or using a lower compression level.',
        type: 'paragraph',
      },
      {
        heading: 'Can I process password-protected PDFs?',
        content: 'Only with the Unlock PDF tool, and only if you know the current password. All other tools cannot read encrypted PDF files. Unlock the file first, then use whatever tool you need on the unlocked version.',
        type: 'paragraph',
      },
      {
        heading: 'What happens if I close the browser during processing?',
        content: 'Processing continues on the server regardless of your browser state. If you have a registered account, you can reopen the site and check your job history to download the result. Guest users without an account will lose access to the result if they close the browser, since the session token is stored in the browser.',
        type: 'paragraph',
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export const getDocBySlug = (slug: string): DocEntry | undefined => {
  return docs.find((doc) => doc.slug === slug);
};

export const getDocsByCategory = (category: DocCategory): DocEntry[] => {
  return docs.filter((doc) => doc.category === category);
};
