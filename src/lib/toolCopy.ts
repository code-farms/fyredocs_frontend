/**
 * Per-tool "When to use", "Tips" and tool-specific FAQs for the tool pages
 * that do not carry them inline in toolSeo.ts OVERRIDES. Unique copy per tool
 * keeps the pages from looking like near-duplicates to Google.
 *
 * Every fact here must match the real tool (options panels in
 * src/components/tools/options, the backend processor, and the guest plan:
 * limits from src/config/planLimits.ts, files deleted ~30 min after processing).
 *
 * Pure: imported by toolSeo.ts, which vite.config.ts uses at build time.
 */
import { PLAN_LIMIT_FALLBACKS as PLAN } from '../config/planLimits';
import type { Faq } from './toolSeo';

export interface ToolCopy {
  useCases: string[];
  tips: string[];
  /** Tool-specific FAQs, added after any inline FAQs and before the shared one. */
  faqs: Faq[];
}

const LOCAL_NOTE =
  'Turn on “Process in browser” and files up to 25 MB never leave your device — handy for private documents.';

export const TOOL_COPY: Record<string, ToolCopy> = {
  'pdf-to-excel': {
    useCases: [
      'Turning a bank statement PDF into a spreadsheet to total expenses, filter UPI payments or prepare an ITR.',
      'Pulling GST invoice tables or price lists out of a PDF to calculate, sort or import into accounting software.',
      'Converting result sheets, merit lists or attendance reports so you can search and sort by name or roll number.',
      'Reusing tables from reports and research papers without retyping every row.',
    ],
    tips: [
      'Works best on PDFs with real, selectable text. If you cannot select the text in your PDF, it is a scan — run OCR PDF first.',
      'Unlock a password-protected statement before converting it.',
      'Check totals and merged header cells after converting; complex layouts can split one column into two.',
    ],
    faqs: [
      {
        q: 'Does it work with scanned bank statements?',
        a: 'Scanned pages are images, so there is no text to extract. Run the file through OCR PDF first to add a text layer, then convert it to Excel.',
      },
      {
        q: 'Will each table go into its own sheet?',
        a: 'Fyredocs detects the tables on each page and writes them into an .xlsx workbook you can open in Excel, Google Sheets or LibreOffice Calc. Review the layout before using the numbers.',
      },
      {
        q: 'Can I convert several PDFs at once?',
        a: `Yes — guests can upload up to ${PLAN.guest.maxFilesPerJob} files per job, and each produces its own Excel file.`,
      },
    ],
  },
  'unlock-pdf': {
    useCases: [
      'Bank e-statements, credit card bills and mutual fund CAS that ask for a password every single time you open them.',
      'Salary slips and Form 16 from your employer that you need to upload to a loan, rental or visa portal that rejects locked files.',
      'Old PDFs you protected yourself years ago and now want to merge, compress or print without typing the password.',
      'Sending a statement to your CA or family: unlock it, then add one password of your own with Protect PDF.',
    ],
    tips: [
      'Passwords are case sensitive — many banks use part of your name in lowercase plus your date of birth; the statement email usually says the exact format.',
      `You can unlock up to ${PLAN.guest.maxFilesPerJob} files at a time as a guest if they share the same password.`,
      'After unlocking, keep the copy somewhere private: anyone who gets the file can now open it.',
    ],
    faqs: [
      {
        q: 'Can I unlock a PDF without knowing the password?',
        a: 'No. Unlock PDF removes a password you enter; it does not guess or crack unknown passwords. If you have forgotten it, download a fresh copy from the source (for example your bank’s net banking) or ask them for the password format.',
      },
      {
        q: 'What is the password for my bank statement PDF?',
        a: 'It depends on the bank. Some publish it — for example HDFC downloaded statements use your Customer ID — while many state the format only in the statement email. Our guide on bank statement passwords lists the officially published formats.',
      },
      {
        q: 'Will unlocking change the content of my PDF?',
        a: 'No. Text, images, layout and page count stay exactly the same; only the password requirement is removed.',
      },
    ],
  },
  'password-protect': {
    useCases: [
      'Emailing Aadhaar, PAN, passport or marksheet scans to an agent, college or employer.',
      'Sharing salary slips, bank statements or ITR acknowledgements with a CA or loan officer.',
      'Sending offer letters, invoices or contracts that only the recipient should open.',
      'Keeping personal documents in cloud storage or on a shared family computer.',
    ],
    tips: [
      'Choose AES-256 (the default) — use RC4-128 only if the reader has a very old PDF viewer.',
      'Send the password through a different channel than the file, for example the PDF by email and the password by SMS or a call.',
      'Use a long password that is not your date of birth or phone number, which are the first things people try.',
    ],
    faqs: [
      {
        q: 'Can I stop people from printing or copying my PDF?',
        a: 'Yes. Along with the open password you can set permissions — allow or block printing, copying text and images, editing, page changes, and comments or form filling. Note that permissions are enforced by PDF viewers, so treat the open password as the real protection.',
      },
      {
        q: 'Which encryption should I choose?',
        a: 'AES-256 is the strongest and works in all modern viewers, so it is the default. AES-128 is also secure; RC4-128 exists only for very old software.',
      },
      {
        q: 'What if I forget the password I set?',
        a: 'There is no way to recover it from the protected file, so keep your original unprotected copy or store the password in a password manager.',
      },
    ],
  },
  'extract-pages': {
    useCases: [
      'Saving just the marksheet page from a long result PDF to upload to a form.',
      'Sending one chapter or a few slides to a classmate instead of the whole book or deck.',
      'Pulling a single statement month, invoice or receipt out of a combined PDF.',
      'Keeping only the signed pages of an agreement for your records.',
    ],
    tips: [
      'Type pages and ranges separated by commas: 2,4,6-8 keeps pages 2, 4, 6, 7 and 8.',
      'The original file is not changed — you download a new PDF with only the pages you chose.',
      'Need every page as its own file instead? Use Split PDF.',
    ],
    faqs: [
      {
        q: 'How do I select which pages to extract?',
        a: 'Enter page numbers and ranges separated by commas, for example 1,3,5-9. Pages are saved in the order of the original document.',
      },
      {
        q: 'What is the difference between Extract Pages and Remove Pages?',
        a: 'Extract Pages keeps only the pages you list; Remove Pages keeps everything except the pages you list. Use whichever list is shorter.',
      },
      {
        q: 'Does extracting reduce the file size?',
        a: 'Usually yes, because the new PDF contains fewer pages. For a further reduction, run it through Compress PDF.',
      },
    ],
  },
  reorder: {
    useCases: [
      'Fixing scans where the back of a page came before the front, or pages were fed into the scanner out of order.',
      'Putting certificates in the order a form asks for — for example Class 10 before Class 12 before graduation.',
      'Moving a cover page, index or annexure to the right place after merging several PDFs.',
      'Rearranging slides or chapters before printing or submitting.',
    ],
    tips: [
      'Type the full new order as page numbers separated by commas — for example 3,1,2 puts page 3 first.',
      'Use the prefill button to start from 1,2,3… and then just move the numbers you need.',
      'Pages scanned sideways or upside down? Fix them with Rotate Pages after reordering.',
    ],
    faqs: [
      {
        q: 'How do I change the order of pages?',
        a: 'Enter every page number in the new order, separated by commas — for example 2,1,3,4 swaps the first two pages. The tool shows how many pages your PDF has.',
      },
      {
        q: 'Can I remove pages while reordering?',
        a: 'Reorder keeps every page. To drop pages, use Remove Pages first, then reorder the rest.',
      },
      {
        q: 'Will reordering affect quality?',
        a: 'No. Pages are moved as they are; text, images and resolution do not change.',
      },
    ],
  },
  'add-page-numbers': {
    useCases: [
      'Project reports, dissertations and theses that must have page numbers before submission.',
      'Combined application files — certificates, forms and annexures merged into one PDF — so the office can refer to “page 7”.',
      'Legal and RTI documents, tender bids and annexure sets where every page must be numbered.',
      'Printed notes and handouts that are easier to keep in order once numbered.',
    ],
    tips: [
      'Merge all your files first, then add numbers once, so the numbering runs continuously.',
      'Use “Page 1 of N” for official submissions — the reader can tell at a glance that no page is missing.',
      'Numbering a second part of a document? Set the starting number to continue from where part one ended (for example start at 25).',
    ],
    faqs: [
      {
        q: 'Where can I place the page numbers?',
        a: 'Six positions: top or bottom, each at the left, centre or right. Bottom centre is the most common choice for reports.',
      },
      {
        q: 'Which number formats are available?',
        a: 'Plain numbers (1, 2, 3), “Page 1”, “Page 1 of N”, and dashed (- 1 -). You can also choose the starting number and the font size.',
      },
      {
        q: 'Will adding numbers cover my content?',
        a: 'Numbers sit in the page margin. If your pages have content right at the edge, pick a different position or a smaller font size.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // Organize / optimize
  // ---------------------------------------------------------------------------
  merge: {
    useCases: [
      'Combining marksheets, certificates and ID proofs into the single PDF an admission or job portal asks for.',
      'Putting six monthly bank statements together for a loan, visa or rental application.',
      'Joining scanned pages that your phone saved as separate PDFs into one document.',
      'Building one assignment or project file from chapters written separately.',
    ],
    tips: [
      'Arrange the files in the order you want before merging — the result follows that order.',
      LOCAL_NOTE,
      'Merged scans get big quickly; run the result through Compress PDF if the portal has a size limit.',
    ],
    faqs: [
      {
        q: 'How many PDFs can I merge at once?',
        a: `Guests can merge up to ${PLAN.guest.maxFilesPerJob} files per job, each up to ${PLAN.guest.maxFileSizeMb} MB. A free account raises both limits.`,
      },
      {
        q: 'Can I merge password-protected PDFs?',
        a: 'Remove the password first with Unlock PDF (you need to know it), then merge the unlocked copies.',
      },
      {
        q: 'Will merging reduce quality?',
        a: 'No. Pages are copied as they are — text, images and resolution are unchanged.',
      },
    ],
  },
  split: {
    useCases: [
      'Breaking a combined scan into separate files — marksheet, certificate and ID — for portals with one upload slot each.',
      'Sending only the chapters or pages someone needs instead of a heavy full document.',
      'Cutting a long PDF into parts that fit under an email or upload size limit.',
      'Turning a multi-page statement or report into one file per page.',
    ],
    tips: [
      'Four modes: every page as its own file, custom ranges (e.g. 1-3, 5, 7-10), a fixed number of pages per file, or a set number of equal parts.',
      'Need just one new PDF with a few pages instead of many files? Extract Pages is quicker.',
      'Multiple output files download together as a ZIP.',
    ],
    faqs: [
      {
        q: 'How do I split a PDF by page range?',
        a: 'Choose “Split by range” and type ranges separated by commas, for example 1-3, 5, 7-10. Each range becomes its own PDF.',
      },
      {
        q: 'Can I split a PDF into equal parts?',
        a: 'Yes. Choose “Split into equal parts” and enter how many PDFs you want, or “Split by page count” to put a fixed number of pages in each file.',
      },
      {
        q: 'Does splitting change the pages?',
        a: 'No. Pages are copied without re-compressing, so quality and text stay exactly the same.',
      },
    ],
  },
  'remove-pages': {
    useCases: [
      'Deleting blank pages that a scanner or phone app added between your documents.',
      'Removing instruction pages, ads or terms pages before uploading a form or statement.',
      'Dropping duplicate pages after merging several files.',
      'Taking out a page with personal details before sharing the rest of a document.',
    ],
    tips: [
      'Type the pages to delete separated by commas, with ranges allowed — for example 2,4,6-8.',
      LOCAL_NOTE,
      'If you want to keep only a few pages, Extract Pages is the shorter list to type.',
    ],
    faqs: [
      {
        q: 'How do I choose which pages to remove?',
        a: 'Enter page numbers and ranges separated by commas, for example 1,3,10-12. Everything else is kept in its original order.',
      },
      {
        q: 'Is the original file changed?',
        a: 'No. You download a new PDF without the removed pages; your original stays as it was.',
      },
      {
        q: 'Does removing pages make the file smaller?',
        a: 'Usually, yes — especially for scanned PDFs, where every page is a heavy image.',
      },
    ],
  },
  'scan-to-pdf': {
    useCases: [
      'Turning phone photos of marksheets, certificates and receipts into one clean PDF.',
      'Digitising handwritten notes or a signed form when you have no scanner.',
      'Making an ID card or business card into a properly sized PDF page.',
      'Creating a searchable PDF from photographed pages with OCR.',
    ],
    tips: [
      '“Clean background (paper → white)” and “Deep shadow removal” fix most phone photos; you can also remove fingers at the edges, punch holes and glare.',
      'Pick the page size: Auto fits each image, or choose A4, Letter, ID card or Business card.',
      'Turn on OCR (English, Hindi or both) if you need to search or copy the text later.',
    ],
    faqs: [
      {
        q: 'What is the difference between Scan to PDF and JPG to PDF?',
        a: 'Scan to PDF cleans up photos of paper — white background, no shadows or fingers — while JPG to PDF keeps images exactly as they are.',
      },
      {
        q: 'Does it recognise Hindi text?',
        a: 'Yes. With OCR on, choose English, Hindi or English + Hindi to add a searchable text layer.',
      },
      {
        q: 'How many photos can I add?',
        a: `Guests can add up to ${PLAN.guest.maxFilesPerJob} images per job. A free account allows more.`,
      },
    ],
  },
  ocr: {
    useCases: [
      'Making scanned books, notes or question papers searchable with Ctrl+F.',
      'Copying text out of a scanned letter, notice or certificate instead of retyping it.',
      'Getting plain text out of a scanned PDF: run OCR, then PDF to Text.',
      'Making scanned Hindi documents searchable.',
    ],
    tips: [
      'Choose the document language — English, Hindi or English + Hindi — for the best accuracy.',
      'Raise the resolution (300, 400 or 600 DPI) for small print; higher DPI takes longer.',
      'Clean, straight, well-lit scans give far better results than skewed photos.',
    ],
    faqs: [
      {
        q: 'Does OCR change how my PDF looks?',
        a: 'No. The page images stay the same; OCR adds an invisible text layer on top so you can search, select and copy.',
      },
      {
        q: 'Which languages are supported?',
        a: 'English, Hindi, and English + Hindi for documents that mix both.',
      },
      {
        q: 'My scan has more pages than my plan allows in one OCR run. What now?',
        a: `Fyredocs offers to split it for you: the scan is cut into parts that each fit your plan (guests: ${PLAN.guest.maxOcrPages} pages per run) right in your browser, all parts are OCR'd together, and you can download them merged back into one searchable PDF. You can also OCR just the first pages.`,
      },
      {
        q: 'Can I OCR several PDFs at once?',
        a: `Yes — OCR supports batch processing, up to ${PLAN.guest.maxFilesPerJob} files per job for guests.`,
      },
    ],
  },
  compress: {
    useCases: [
      'Getting a scanned certificate or marksheet under a portal’s 100–500 KB limit.',
      'Shrinking a large PDF so it can be sent on WhatsApp or email.',
      'Saving space on your phone or cloud drive with dozens of scanned documents.',
      'Making a heavy presentation or report PDF faster to open and share.',
    ],
    tips: [
      'Levels: Low (~10–20% smaller), Medium (~30–50%), High (~50–70%) and Extreme (~70–90%) — typical ranges, not guarantees.',
      'Check that signatures and stamps are still readable after compressing; go one level lower if not.',
      `Compress several PDFs in one batch — up to ${PLAN.guest.maxFilesPerJob} files per job as a guest.`,
    ],
    faqs: [
      {
        q: 'How much smaller will my PDF get?',
        a: 'It depends on the content. Scanned and image-heavy PDFs often shrink by 50–90%; text-only PDFs are usually small already and shrink less.',
      },
      {
        q: 'Will compression reduce quality?',
        a: 'Text and vector graphics stay sharp. Images are re-encoded at a lower resolution, which is usually not noticeable on screen.',
      },
      {
        q: 'Can I compress a PDF to an exact size like 100 KB?',
        a: 'Compression makes files smaller but cannot hit an exact number. Pick Extreme for tight limits; if it is still over, remove pages or re-scan in grayscale. Our guide on compressing PDFs for online forms has more tricks.',
      },
    ],
  },
  'repair-pdf': {
    useCases: [
      'A PDF that shows “file is damaged” or will not open after an interrupted download.',
      'Portal uploads that fail with a “corrupt” or “invalid PDF” error.',
      'Old PDFs that open in one app but not in another.',
      'Files that print blank pages or missing fonts.',
    ],
    tips: [
      'Repair rebuilds the file structure; it can recover what is readable but cannot restore content that is truly lost.',
      'If the file came from email or the web, try downloading it again first — that often fixes it.',
      'After repairing, open the result and check every page before submitting it.',
    ],
    faqs: [
      {
        q: 'Can every damaged PDF be repaired?',
        a: 'Not always. Repair rewrites the document and recovers readable pages and content, but data that is missing from the file cannot be brought back.',
      },
      {
        q: 'Will repairing change my document?',
        a: 'The content should look the same; the file is rebuilt internally, which can also fix issues that made portals reject it.',
      },
      {
        q: 'Is the repaired file safe to upload to a portal?',
        a: 'Yes — it is a standard PDF. Check that all pages are present before you upload.',
      },
    ],
  },
  rotate: {
    useCases: [
      'Fixing scanned pages that came out sideways or upside down.',
      'Turning landscape tables or certificates to read correctly.',
      'Correcting double-sided scans where every other page is upside down.',
      'Preparing a PDF to look right before printing or uploading.',
    ],
    tips: [
      'Choose 90° (clockwise), 180° or 270° (counter-clockwise).',
      'Rotate every page, or only odd or even pages — perfect for double-sided scans.',
      LOCAL_NOTE,
    ],
    faqs: [
      {
        q: 'Can I rotate only some pages?',
        a: 'You can rotate every page, only odd pages or only even pages. For other combinations, split the file, rotate the part you need and merge it back.',
      },
      {
        q: 'Is rotation permanent?',
        a: 'Yes. The downloaded PDF opens with the new orientation in every viewer.',
      },
      {
        q: 'Does rotating reduce quality?',
        a: 'No. Pages are turned without re-compressing, so nothing is lost.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // Edit / security
  // ---------------------------------------------------------------------------
  'edit-pdf': {
    useCases: [
      'Filling in your name, date or roll number on a PDF form that has no fillable fields.',
      'Adding a short note, reference number or “Received” line to a document.',
      'Correcting or adding a small detail before printing.',
      'Labelling pages of a combined file (e.g. “Annexure A”).',
    ],
    tips: [
      'Add a text annotation, pick the page, then choose one of seven positions and the font size.',
      'For signatures use Sign PDF instead — it lets you draw or upload one.',
      'Edit PDF adds text on top of the page; it does not change the original text underneath.',
    ],
    faqs: [
      {
        q: 'Can I change existing text in a PDF?',
        a: 'Edit PDF adds new text on top of the page; it does not rewrite text that is already there. To edit the original text, convert the PDF to Word.',
      },
      {
        q: 'Where can I place the text?',
        a: 'Choose a page and one of seven positions — top left, centre or right; the centre of the page; or bottom left, centre or right — and set the font size.',
      },
      {
        q: 'Can I add text to several pages?',
        a: 'Yes. Add an annotation for each page you need, then download the edited PDF once.',
      },
    ],
  },
  'sign-pdf': {
    useCases: [
      'Signing internship letters, NOCs and declarations without printing and scanning.',
      'Adding your signature to rent receipts or simple forms that the receiver accepts electronically.',
      'Signing a document on your phone while travelling.',
      'Placing the same signature on several pages of an agreement.',
    ],
    tips: [
      'Draw with your finger or mouse, or upload a photo of your signature on white paper.',
      'Drag and resize the signature to fit the signature line, then place it on each page that needs it.',
      'When the receiver asks for Aadhaar eSign or a DSC, use those instead — a signature image is not the same thing.',
    ],
    faqs: [
      {
        q: 'Is a drawn signature legally valid?',
        a: 'It is widely accepted for everyday documents when the other side agrees, but it is not an Aadhaar eSign or a Digital Signature Certificate. Our guide on signing PDFs explains when you need those.',
      },
      {
        q: 'Can I upload my signature instead of drawing it?',
        a: 'Yes. Upload a clear photo of your signature on plain white paper, then position and resize it.',
      },
      {
        q: 'Is my signature stored?',
        a: 'Guest files are deleted automatically about 30 minutes after processing. Keep your own signature image private.',
      },
    ],
  },
  watermark: {
    useCases: [
      'Marking copies “For verification only” or “Not valid for any other purpose” before sharing ID proofs.',
      'Stamping “Confidential” or “Draft” on reports and proposals.',
      'Adding your logo to brochures, price lists or notes you distribute.',
      'Discouraging reuse of question papers, designs or study material.',
    ],
    tips: [
      'Choose text or an image (like a logo), then place it in the centre, diagonally or tiled across the page.',
      'Lower the opacity so the content underneath stays readable; adjust font size, colour or image scale.',
      'Watermarking ID copies with the purpose and date makes misuse harder.',
    ],
    faqs: [
      {
        q: 'Can I add my logo as a watermark?',
        a: 'Yes. Switch to the image option, upload your logo and set its position, scale and opacity.',
      },
      {
        q: 'Can the watermark be removed later?',
        a: 'It is drawn onto the pages, so it cannot be switched off like a layer, but a watermark is a deterrent rather than strong protection. Use Protect PDF for access control.',
      },
      {
        q: 'Can I watermark several PDFs at once?',
        a: `Yes — watermarking supports batch processing, up to ${PLAN.guest.maxFilesPerJob} files per job for guests.`,
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // Convert from PDF
  // ---------------------------------------------------------------------------
  'pdf-to-word': {
    useCases: [
      'Editing a resume or CV you only have as a PDF.',
      'Updating an old notice, letter or affidavit format instead of retyping it.',
      'Reusing paragraphs and tables from reports, notes or research papers.',
      'Fixing typos in a document before printing it again.',
    ],
    tips: [
      'Text-based PDFs convert best. A scanned PDF comes out as page pictures in Word, not editable text.',
      'Unlock password-protected PDFs before converting.',
      'Check headers, footers and tables after converting — complex layouts may need small touch-ups.',
    ],
    faqs: [
      {
        q: 'Will the Word file keep my formatting?',
        a: 'Yes. Text, fonts, tables, images and page layout are kept as closely as possible. Complex magazine-style layouts may need small touch-ups.',
      },
      {
        q: 'Can I convert a scanned PDF to Word?',
        a: 'A scanned PDF is a picture of text, so Word gets the page as an image you cannot edit. To get the words, run OCR PDF, then PDF to Text, and paste the text into Word.',
      },
      {
        q: 'Can I edit the Word file in Google Docs or on my phone?',
        a: 'Yes. The output is a standard .docx file that opens in Microsoft Word, Google Docs, WPS Office and LibreOffice Writer.',
      },
    ],
  },
  'pdf-to-image': {
    useCases: [
      'Getting a lossless image of a chart, diagram or table to put in slides.',
      'Saving pages with fine print or line drawings where JPG would blur edges.',
      'Making page previews for a website or document library.',
      'Printing a single page as an image at good quality.',
    ],
    tips: [
      'PNG keeps sharp text and lines; use PDF to JPG instead when you need smaller files for sharing.',
      'A multi-page PDF downloads as a ZIP with one PNG per page.',
      'Extract the pages you need first to avoid converting a long document.',
    ],
    faqs: [
      {
        q: 'What resolution are the images?',
        a: 'Pages are rendered at 150 DPI by default — sharp on screen and fine for most printing.',
      },
      {
        q: 'Why are PNG files bigger than JPG?',
        a: 'PNG is lossless: it keeps every pixel exactly, which makes files larger. JPG trades a little sharpness for much smaller files.',
      },
      {
        q: 'Do I get one image per page?',
        a: 'Yes. A one-page PDF gives a single PNG; more pages give a ZIP with one PNG per page, in order.',
      },
    ],
  },
  'pdf-to-jpg': {
    useCases: [
      'Posting a result, ticket or certificate page on WhatsApp status or Instagram.',
      'Uploading a document page to a form that only accepts JPG.',
      'Sharing one page of a long PDF quickly in a chat.',
      'Adding PDF pages to a photo album, slideshow or video.',
    ],
    tips: [
      'JPG gives small files that open everywhere; choose PDF to PNG for lossless quality.',
      'Extract only the pages you need first so you do not have to dig through a ZIP.',
      'Cover or crop personal details before posting a document page publicly.',
    ],
    faqs: [
      {
        q: 'What do I get for a PDF with several pages?',
        a: 'Each page becomes its own JPG. A one-page PDF downloads as a single JPG; a multi-page PDF downloads as a ZIP file with one JPG per page, in order.',
      },
      {
        q: 'Should I choose JPG or PNG?',
        a: 'JPG files are smaller and ideal for sharing and uploading. Choose PDF to PNG when you need lossless quality for sharp text or diagrams.',
      },
      {
        q: 'What resolution are the JPG images?',
        a: 'Pages are rendered at 150 DPI by default, which keeps normal text readable on a phone.',
      },
    ],
  },
  'pdf-to-ppt': {
    useCases: [
      'Updating slides from a PDF deck when you no longer have the original PowerPoint file.',
      'Presenting a PDF report or handout in PowerPoint or Google Slides, and fixing a few lines of text first.',
      'Reusing pages of a PDF in a new presentation with your own notes and slides around them.',
      'Projecting a PDF in a classroom or meeting room where only PowerPoint is available.',
    ],
    tips: [
      '“Editable text” (the default) turns text into text boxes — expect roughly one box per line and some font substitution, so tidy the layout after converting.',
      'Choose “Exact look” when appearance matters more than editing: each page becomes a picture on its slide.',
      'Scanned pages and Hindi or other Indian-language text always come out as image slides, because editable import cannot keep them correct.',
    ],
    faqs: [
      {
        q: 'Can I edit the text on the slides?',
        a: 'Yes, in the default Editable text mode — text becomes text boxes you can change. In Exact look mode each slide is an image of the page, so the text cannot be edited.',
      },
      {
        q: 'Why did my slides come out as images?',
        a: 'Scanned PDFs have no text to edit, and Hindi or other Indian-language text gets scrambled by the editable import, so those PDFs are converted as image slides to keep them readable. You also get images if you choose Exact look.',
      },
      {
        q: 'Will it open in Google Slides?',
        a: 'Yes. The .pptx file opens in PowerPoint, Google Slides, Keynote and LibreOffice Impress, with one slide per PDF page.',
      },
    ],
  },
  'pdf-to-html': {
    useCases: [
      'Publishing a PDF notice or brochure as a web page.',
      'Making a PDF readable in any browser without a PDF viewer.',
      'Getting text and images out of a PDF for a website or CMS.',
      'Archiving documents in a format search engines can read.',
    ],
    tips: [
      'You get a ZIP with the HTML page and its images — keep them together when uploading.',
      'Text-based PDFs convert best; scanned pages come out as images unless you run OCR first.',
      'Expect to tidy up styling; PDFs are fixed-layout, so the HTML will not be a perfect responsive page.',
    ],
    faqs: [
      {
        q: 'What is inside the download?',
        a: 'A ZIP containing the HTML file and the images it uses. Open the HTML file in a browser to view it.',
      },
      {
        q: 'Will the web page look exactly like the PDF?',
        a: 'Close, but not identical — fonts and spacing may differ because HTML reflows, while PDF pages are fixed.',
      },
      {
        q: 'Does it work with scanned PDFs?',
        a: 'Scans are images, so there is no text to convert. Run OCR PDF first for searchable text.',
      },
    ],
  },
  'pdf-to-text': {
    useCases: [
      'Copying all the text from a PDF to paste into notes, email or a chatbot.',
      'Getting plain text for search, word counts or translation.',
      'Pulling data out of a text-heavy report for analysis.',
      'Making a lightweight copy of an e-book or notes to read anywhere.',
    ],
    tips: [
      'The layout of columns and spacing is kept as closely as plain text allows.',
      'For scanned PDFs, run OCR PDF first — otherwise there is no text to extract.',
      'Images, colours and formatting are dropped; use PDF to Word if you need them.',
    ],
    faqs: [
      {
        q: 'What format is the output?',
        a: 'A plain .txt file that opens in any text editor, phone or computer.',
      },
      {
        q: 'Why is my text file empty?',
        a: 'The PDF is probably a scan, which contains images rather than text. Run OCR PDF first, then convert.',
      },
      {
        q: 'Does it keep tables?',
        a: 'Rows and columns are kept as spaced plain text. For tables you can calculate with, use PDF to Excel.',
      },
    ],
  },
  'pdf-to-pdfa': {
    useCases: [
      'Submitting documents to court e-filing, government or institutional portals that require PDF/A.',
      'Archiving contracts, certificates and records for the long term.',
      'Meeting a records-management or audit requirement for archival PDFs.',
      'Making sure a document will look the same years from now on any viewer.',
    ],
    tips: [
      'Output is PDF/A-2b, the archival standard most portals ask for.',
      'Fonts are embedded and active content is removed, so files can get slightly larger.',
      'Remove any password first — encrypted PDFs cannot be PDF/A.',
    ],
    faqs: [
      {
        q: 'What is PDF/A?',
        a: 'An ISO standard for long-term archiving. Everything needed to display the document — fonts, colours — is embedded, so it looks the same in the future.',
      },
      {
        q: 'Which PDF/A version do I get?',
        a: 'PDF/A-2b, the level most e-filing and archival systems accept.',
      },
      {
        q: 'Can a password-protected PDF be converted?',
        a: 'PDF/A does not allow encryption. Unlock the file first, then convert.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // Convert to PDF
  // ---------------------------------------------------------------------------
  'word-to-pdf': {
    useCases: [
      'Submitting a resume, cover letter or assignment as a PDF so the layout cannot shift.',
      'Sending an application, affidavit draft or letter that must print the same everywhere.',
      'Sharing a document that opens on any phone without Word installed.',
      'Preparing a project report for printing or binding.',
    ],
    tips: [
      'Both .doc and .docx are supported.',
      'Unusual custom fonts may be replaced if they are not available on the server — use common fonts for exact results.',
      'Convert up to 5 documents per job as a guest.',
    ],
    faqs: [
      {
        q: 'Will my fonts and layout stay the same?',
        a: 'Standard fonts, images, tables and page breaks are kept. Rare custom fonts may be substituted, so check the PDF before sending.',
      },
      {
        q: 'Can I convert Google Docs?',
        a: 'Download the document as .docx from Google Docs (File → Download), then convert it.',
      },
      {
        q: 'Are hyperlinks kept?',
        a: 'Links in the document generally stay clickable in the PDF.',
      },
    ],
  },
  'excel-to-pdf': {
    useCases: [
      'Sending an invoice, quotation or price list that the customer cannot accidentally edit.',
      'Attaching a fee sheet, timetable or budget to an email or form.',
      'Printing a spreadsheet report with consistent layout.',
      'Sharing results or attendance sheets as a read-only document.',
    ],
    tips: [
      'Set the print area and page orientation in Excel first — wide sheets fit better in landscape.',
      'Both .xls and .xlsx are supported.',
      'Each sheet with content can become one or more PDF pages, so hide sheets you do not want.',
    ],
    faqs: [
      {
        q: 'Why is my sheet split across pages?',
        a: 'Wide sheets are cut where the page ends. Set landscape orientation or “fit to page width” in Excel’s page setup before converting.',
      },
      {
        q: 'Are formulas kept?',
        a: 'A PDF shows the calculated values, not the formulas — that is what makes it safe to share.',
      },
      {
        q: 'Can I convert Google Sheets?',
        a: 'Download the sheet as .xlsx, then convert it.',
      },
    ],
  },
  'image-to-pdf': {
    useCases: [
      'Combining photos of documents into the single PDF a form asks for.',
      'Turning screenshots of receipts, tickets or e-certificates into one file.',
      'Making a PDF portfolio of drawings, designs or photos.',
      'Sending several photos as one attachment instead of many.',
    ],
    tips: [
      'JPG, PNG and WEBP images are supported; each image becomes one page.',
      LOCAL_NOTE,
      'Photos of paper look cleaner through Scan to PDF, which whitens the background and removes shadows.',
    ],
    faqs: [
      {
        q: 'How many images can I add?',
        a: `Guests can add up to ${PLAN.guest.maxFilesPerJob} images per job. A free account allows more.`,
      },
      {
        q: 'Can I change the order of images?',
        a: 'Arrange them in the order you want before converting; if needed, fix the order afterwards with Reorder Pages.',
      },
      {
        q: 'Will the images be compressed?',
        a: 'Images are placed as they are. If the PDF is too big for a portal, run it through Compress PDF.',
      },
    ],
  },
  'powerpoint-to-pdf': {
    useCases: [
      'Submitting a college presentation or seminar slides as a PDF.',
      'Sharing a pitch deck that opens on any device without PowerPoint.',
      'Printing handouts of your slides.',
      'Sending slides that should not be edited.',
    ],
    tips: [
      'Both .ppt and .pptx are supported; each slide becomes one page.',
      'Animations and transitions are not kept in a PDF — the final state of each slide is shown.',
      'Use common fonts so the PDF matches your slides exactly.',
    ],
    faqs: [
      {
        q: 'Are animations and videos kept?',
        a: 'No. A PDF is static, so each slide appears in its final state and embedded videos do not play.',
      },
      {
        q: 'Can I convert Google Slides?',
        a: 'Download the presentation as .pptx (File → Download), then convert it.',
      },
      {
        q: 'Are speaker notes included?',
        a: 'No, only the slides themselves are converted.',
      },
    ],
  },
  'html-to-pdf': {
    useCases: [
      'Saving an HTML receipt, booking confirmation or report as a PDF.',
      'Archiving a saved web page you downloaded as an .html file.',
      'Turning an HTML email template or invoice into a printable document.',
      'Converting HTML exports from other software into PDF.',
    ],
    tips: [
      'Upload an .html file — this tool converts files, not live website URLs.',
      'Images and styles linked from the internet may not load; save the page with its files for best results.',
      'Complex, script-driven pages may look different from the browser view.',
    ],
    faqs: [
      {
        q: 'Can I convert a website by pasting its URL?',
        a: 'No. Save the page as an .html file first (Ctrl+S in your browser), then upload it.',
      },
      {
        q: 'Why are some images missing?',
        a: 'Images and styles that the HTML loads from the internet may not be fetched. Use a page saved with its files, or embed the images.',
      },
      {
        q: 'Will JavaScript on the page run?',
        a: 'Pages that build their content with JavaScript may convert without that content. Static HTML converts best.',
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // LibreOffice / OpenDocument
  // ---------------------------------------------------------------------------
  'pdf-to-odt': {
    useCases: [
      'Editing a PDF in LibreOffice Writer on Linux or on government and school PCs that use LibreOffice.',
      'Working with open formats when your office or institution prefers ODF over Microsoft formats.',
      'Updating an old PDF letter or form when you do not have Microsoft Word.',
      'Keeping documents in an open, vendor-neutral format for archiving.',
    ],
    tips: [
      'Text-based PDFs convert best; run OCR PDF first for scanned pages.',
      'Complex layouts may arrive as positioned text boxes — check spacing before printing.',
      'Need a .docx for Microsoft Word instead? Use PDF to Word.',
    ],
    faqs: [
      {
        q: 'What is an ODT file?',
        a: 'OpenDocument Text — the open-standard word-processing format used by LibreOffice Writer. Google Docs and Microsoft Word can open it too.',
      },
      {
        q: 'Will the ODT look exactly like the PDF?',
        a: 'Simple documents come out close. Multi-column or design-heavy PDFs may need adjustment, because a PDF stores fixed positions rather than flowing text.',
      },
      {
        q: 'Can I convert a scanned PDF to ODT?',
        a: 'Scans contain images, not text. Run OCR PDF first, then convert.',
      },
    ],
  },
  'pdf-to-ods': {
    useCases: [
      'Working with tables from a PDF in LibreOffice Calc.',
      'Pulling a bank statement or price list into an open-format spreadsheet.',
      'Analysing report tables on Linux or LibreOffice-only computers.',
      'Keeping extracted data in an open, archival format.',
    ],
    tips: [
      'Tables are detected and extracted first, then saved as .ods — so it works best on PDFs with real, selectable text.',
      'Run OCR PDF first for scanned statements.',
      'Prefer Excel? PDF to Excel gives an .xlsx from the same tables.',
    ],
    faqs: [
      {
        q: 'What is an ODS file?',
        a: 'OpenDocument Spreadsheet — the open format used by LibreOffice Calc. Excel and Google Sheets can open it as well.',
      },
      {
        q: 'Does it keep my table structure?',
        a: 'Rows and columns from the detected tables are kept. Check merged header cells and totals after converting.',
      },
      {
        q: 'What if my PDF has no tables?',
        a: 'Only tables are extracted. For plain paragraphs use PDF to ODT or PDF to Text.',
      },
    ],
  },
  'pdf-to-odp': {
    useCases: [
      'Presenting a PDF in LibreOffice Impress.',
      'Reusing pages of a PDF deck in an open-format presentation.',
      'Adding notes and new slides around existing PDF pages on a LibreOffice computer.',
      'Classrooms and offices that standardise on LibreOffice.',
    ],
    tips: [
      'Each PDF page becomes one slide showing that page as an image; the text is not editable.',
      'Add titles, notes and new slides around the converted pages in Impress.',
      'Need PowerPoint instead? Use PDF to PowerPoint.',
    ],
    faqs: [
      {
        q: 'What is an ODP file?',
        a: 'OpenDocument Presentation — the open format used by LibreOffice Impress. PowerPoint and Google Slides can open it too.',
      },
      {
        q: 'Can I edit the text on the Impress slides?',
        a: 'No. Each slide is an image of the PDF page, so the look is exact but the words are not editable.',
      },
      {
        q: 'How many slides does the ODP file have?',
        a: 'One slide per PDF page, in the same order.',
      },
    ],
  },
  'word-to-odt': {
    useCases: [
      'Moving Word documents to LibreOffice Writer for good.',
      'Submitting documents to offices or institutions that require OpenDocument format.',
      'Archiving files in an open standard that does not depend on one company.',
      'Sharing documents with people who use LibreOffice.',
    ],
    tips: [
      'Both .doc and .docx are converted.',
      'Complex Word features — macros, SmartArt, some form fields — may look different or be dropped.',
      'Open the ODT once in LibreOffice to check tables and page breaks.',
    ],
    faqs: [
      {
        q: 'Why convert Word to ODT?',
        a: 'ODT is an open ISO standard. Some governments and institutions require it, and it opens natively in LibreOffice.',
      },
      {
        q: 'Will formatting be preserved?',
        a: 'Text, styles, tables and images usually carry over well. Macros and some advanced Word features may not.',
      },
      {
        q: 'Can I convert back to Word later?',
        a: 'Yes — LibreOffice and Word can both save ODT files as .docx.',
      },
    ],
  },
  'excel-to-ods': {
    useCases: [
      'Moving spreadsheets from Excel to LibreOffice Calc.',
      'Meeting a requirement to submit data in OpenDocument format.',
      'Sharing spreadsheets with LibreOffice users without layout surprises.',
      'Archiving financial or survey data in an open standard.',
    ],
    tips: [
      'Both .xls and .xlsx are converted.',
      'Formulas are carried over; check any Excel-only functions or macros after converting.',
      'Charts and conditional formatting usually survive, but give them a quick look.',
    ],
    faqs: [
      {
        q: 'Do my Excel formulas still work in Calc?',
        a: 'Yes, formulas are converted. A few Excel-specific functions and VBA macros may not work the same in Calc.',
      },
      {
        q: 'Will all my sheets be converted?',
        a: 'Yes, every sheet in the workbook is kept in the .ods file.',
      },
      {
        q: 'Can Excel open ODS files?',
        a: 'Yes, Excel can open and save ODS files.',
      },
    ],
  },
  'powerpoint-to-odp': {
    useCases: [
      'Presenting PowerPoint decks in LibreOffice Impress.',
      'Submitting presentations to institutions that require ODF.',
      'Sharing slides with LibreOffice users.',
      'Archiving presentations in an open format.',
    ],
    tips: [
      'Both .ppt and .pptx are converted.',
      'Some animations, transitions and SmartArt may look different in Impress — preview before presenting.',
      'Embedded videos may need to be re-linked.',
    ],
    faqs: [
      {
        q: 'Will animations be kept?',
        a: 'Basic animations and transitions usually carry over; complex PowerPoint effects may be simplified.',
      },
      {
        q: 'Are speaker notes kept?',
        a: 'Yes, notes are normally converted with the slides.',
      },
      {
        q: 'Can PowerPoint open ODP files?',
        a: 'Yes, PowerPoint can open and save ODP presentations.',
      },
    ],
  },
  'odt-to-pdf': {
    useCases: [
      'Sharing a LibreOffice Writer document with someone who does not use LibreOffice.',
      'Submitting an ODT assignment or application to a portal that only accepts PDF.',
      'Printing a document with a fixed, reliable layout.',
      'Sending a final version that should not be edited.',
    ],
    tips: [
      'Use common fonts so the PDF matches your document exactly.',
      'Convert up to 5 documents per job as a guest.',
      'Check page breaks and headers in the PDF before submitting.',
    ],
    faqs: [
      {
        q: 'Will the PDF look the same as my ODT?',
        a: 'Yes — conversion uses LibreOffice itself, so layout, styles and images are kept. Rare custom fonts may be substituted.',
      },
      {
        q: 'Can I convert several ODT files at once?',
        a: `Yes, up to ${PLAN.guest.maxFilesPerJob} files per job as a guest; each becomes its own PDF.`,
      },
      {
        q: 'Are links kept?',
        a: 'Hyperlinks in the document generally stay clickable in the PDF.',
      },
    ],
  },
  'ods-to-pdf': {
    useCases: [
      'Sharing a LibreOffice Calc sheet as a read-only document.',
      'Sending invoices, budgets or timetables made in Calc.',
      'Printing spreadsheet reports with consistent layout.',
      'Attaching data to a form that only accepts PDF.',
    ],
    tips: [
      'Set print ranges and landscape orientation in Calc first so wide sheets fit the page.',
      'The PDF shows calculated values, not formulas.',
      'Hide sheets you do not want in the PDF before converting.',
    ],
    faqs: [
      {
        q: 'Why is my sheet cut across pages?',
        a: 'Wide sheets break where the page ends. Use Calc’s page format to set landscape or scale to fit width, then convert.',
      },
      {
        q: 'Are formulas visible in the PDF?',
        a: 'No, only the calculated results are shown.',
      },
      {
        q: 'Are all sheets converted?',
        a: 'Sheets with content are included; hide any you want to leave out.',
      },
    ],
  },
  'odp-to-pdf': {
    useCases: [
      'Sharing LibreOffice Impress slides with anyone, on any device.',
      'Submitting a presentation to a portal or teacher that wants PDF.',
      'Printing slide handouts.',
      'Sending a final deck that should not be edited.',
    ],
    tips: [
      'Each slide becomes one PDF page.',
      'Animations and transitions are not kept — each slide shows its final state.',
      'Use common fonts so slides look identical in the PDF.',
    ],
    faqs: [
      {
        q: 'Are animations kept?',
        a: 'No. PDFs are static, so each slide appears in its final state.',
      },
      {
        q: 'Do my Impress speaker notes appear in the PDF?',
        a: 'No, only the slides are converted.',
      },
      {
        q: 'Can I convert several presentations at once?',
        a: `Yes, up to ${PLAN.guest.maxFilesPerJob} files per job as a guest.`,
      },
    ],
  },
};
