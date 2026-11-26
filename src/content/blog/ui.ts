import type { BlogCategory, BlogLang } from './types';

/** Interface strings for blog pages in each language. Pure: also used at build time. */
export const BLOG_UI = {
  en: {
    blog: 'Blog',
    indexTitle: 'Fyredocs Blog',
    indexIntro: 'Practical guides for the PDFs and photos you actually deal with — exam forms, bank statements, scans and signatures.',
    indexMetaTitle: 'PDF Guides for Exam Forms, Banks & More',
    indexDescription:
      'Practical PDF guides for India: exam form upload sizes, bank statement passwords, phone scans, signing and converting PDFs — free, step by step.',
    all: 'All',
    quickAnswer: 'Quick answer',
    onThisPage: 'On this page',
    minRead: 'min read',
    updated: 'Updated',
    faq: 'Frequently asked questions',
    checklist: 'Before you upload',
    mistakes: 'Common mistakes',
    source: 'Source',
    checkedOn: 'Checked on',
    verifyNote: 'Rules change with every notification — always confirm on the official page before you submit.',
    relatedPosts: 'Keep reading',
    toolsUsed: 'Tools in this guide',
    readInOther: 'हिंदी में पढ़ें',
    home: 'Home',
    guides: 'Guides',
    open: 'Open',
  },
  hi: {
    blog: 'ब्लॉग',
    indexTitle: 'Fyredocs ब्लॉग',
    indexIntro: 'रोज़ काम आने वाले PDF और फ़ोटो के लिए आसान गाइड — परीक्षा फ़ॉर्म, बैंक स्टेटमेंट, स्कैन और सिग्नेचर।',
    indexMetaTitle: 'परीक्षा फ़ॉर्म, बैंक और PDF के लिए आसान गाइड',
    indexDescription:
      'परीक्षा फ़ॉर्म की अपलोड साइज़, बैंक स्टेटमेंट PDF पासवर्ड, फ़ोन से स्कैन और PDF साइन करने की आसान, मुफ़्त गाइड — हिंदी में, स्टेप बाय स्टेप।',
    all: 'सभी',
    quickAnswer: 'झटपट जवाब',
    onThisPage: 'इस पेज पर',
    minRead: 'मिनट',
    updated: 'अपडेट',
    faq: 'अक्सर पूछे जाने वाले सवाल',
    checklist: 'अपलोड करने से पहले',
    mistakes: 'आम गलतियाँ',
    source: 'स्रोत',
    checkedOn: 'जाँचा गया',
    verifyNote: 'हर नोटिफ़िकेशन के साथ नियम बदल सकते हैं — सबमिट करने से पहले आधिकारिक पेज पर ज़रूर जाँच लें।',
    relatedPosts: 'और पढ़ें',
    toolsUsed: 'इस गाइड में इस्तेमाल हुए टूल',
    readInOther: 'Read in English',
    home: 'होम',
    guides: 'गाइड',
    open: 'खोलें',
  },
} as const satisfies Record<BlogLang, Record<string, string>>;

export const BLOG_CATEGORY_LABELS: Record<BlogCategory, Record<BlogLang, string>> = {
  'exam-forms': { en: 'Exam forms', hi: 'परीक्षा फ़ॉर्म' },
  banking: { en: 'Banking', hi: 'बैंकिंग' },
  everyday: { en: 'Everyday PDFs', hi: 'रोज़ के PDF' },
  'how-to': { en: 'How-to', hi: 'कैसे करें' },
};

/** "26 Nov 2026" / "26 नव॰ 2026" from YYYY-MM-DD, without timezone drift. */
export const formatBlogDate = (iso: string, lang: BlogLang): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
