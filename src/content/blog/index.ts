/**
 * All blog posts, newest first. Pure (relative imports only): vite.config.ts
 * imports this to prerender the blog, sitemap entries and the RSS feed.
 * To add a post: create posts/<slug>.ts and list it here.
 */
import type { BlogPost } from './types';
import bankStatementPdfPassword from './posts/bank-statement-pdf-password';
import convertPdfToWordWithoutLosingFormatting from './posts/convert-pdf-to-word-without-losing-formatting';
import compressPdfForOnlineForms from './posts/compress-pdf-for-online-forms';
import examFormUploadSizeLimits from './posts/exam-form-upload-size-limits';
import rotatePdfPagesPermanently from './posts/rotate-pdf-pages-permanently';
import pdfToJpgForWhatsappAndForms from './posts/pdf-to-jpg-for-whatsapp-and-forms';
import phonePhotosToPdf from './posts/phone-photos-to-pdf';
import signPdfWithoutPrinting from './posts/sign-pdf-without-printing';

const byNewest = (a: BlogPost, b: BlogPost) =>
  b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug);

export const BLOG_POSTS: readonly BlogPost[] = [
  compressPdfForOnlineForms,
  examFormUploadSizeLimits,
  bankStatementPdfPassword,
  phonePhotosToPdf,
  pdfToJpgForWhatsappAndForms,
  signPdfWithoutPrinting,
  rotatePdfPagesPermanently,
  convertPdfToWordWithoutLosingFormatting,
].sort(byNewest);
