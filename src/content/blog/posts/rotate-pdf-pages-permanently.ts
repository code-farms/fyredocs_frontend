import type { BlogPost } from '../types';

const CHECKED = '2026-11-28';

const SRC = {
  adobeView: { label: 'Adobe — Adjusting PDF views (Rotate view)', url: 'https://helpx.adobe.com/acrobat/using/adjusting-pdf-views.html' },
  adobeRotate: { label: 'Adobe — Rotate pages in PDFs using Acrobat on desktop', url: 'https://helpx.adobe.com/acrobat/desktop/edit-documents/organize-pages/rotate-pages.html' },
  applePdfKit: { label: 'Apple PDFKit — PDFPage.rotation', url: 'https://developer.apple.com/documentation/pdfkit/pdfpage/rotation' },
};

const post: BlogPost = {
  slug: 'rotate-pdf-pages-permanently',
  category: 'how-to',
  publishedAt: '2026-11-28',
  updatedAt: '2026-11-28',
  readMinutes: 5,
  tools: ['rotate', 'reorder', 'split', 'merge', 'image-to-pdf'],
  i18n: {
    en: {
      title: 'Rotate PDF Pages Permanently: Fix Sideways Scans So They Stay Fixed',
      metaTitle: 'Rotate PDF Pages Permanently (Free, No Signup)',
      description:
        'Turned a sideways page in your PDF viewer and it opened sideways again? Here is why, and how to rotate PDF pages so the fix is saved in the file.',
      quickAnswer:
        'The rotate button in most PDF viewers only turns the page on your screen — the file itself does not change, so the examiner or bank still sees it sideways. To fix it for everyone, rotate the pages with a tool that saves a new PDF, like Fyredocs Rotate PDF: pick 90°, 180° or 270°, choose all, odd or even pages, and download.',
      sections: [
        {
          heading: 'Why your pages come out sideways',
          type: 'list',
          items: [
            'Phone scanner apps guess the page direction from the camera angle. Shoot a page from the side or from above the table and the guess goes wrong.',
            'Certificates, mark sheets and wide tables are printed in landscape. Scanned into a portrait PDF, they sit sideways.',
            'Double-sided scans on an office scanner often come out with every second page upside down.',
            'Photos joined into a PDF keep whatever orientation the phone saved for each photo.',
          ],
        },
        {
          heading: '"Rotate view" vs. rotating the page',
          type: 'dataTable',
          content:
            'A PDF page carries its own rotation setting. Viewer buttons usually change only your view; saving a rotated page writes the new setting into the file.',
          headers: ['Point', 'What the source says'],
          rows: [
            ['Rotate view in Acrobat', 'View → Rotate View changes how the page is shown on your screen, not the page’s actual orientation.'],
            ['Rotating the page in Acrobat', 'To change the page itself, use the page Rotate option (Organize Pages) and then save the PDF.'],
            ['How a PDF stores it', 'Each page has a rotation value in degrees, applied when the page is displayed or printed; it is a multiple of 90 (0, 90, 180 or 270).'],
          ],
          sources: [SRC.adobeView, SRC.adobeRotate, SRC.applePdfKit],
          checkedOn: CHECKED,
        },
        {
          heading: 'Test: is your rotation really saved?',
          type: 'tip',
          content:
            'Send the PDF to yourself on WhatsApp or email and open it on a different phone or computer. If the page is upright there, the rotation is in the file. If it is sideways again, only your viewer was rotated.',
        },
        {
          heading: 'Rotate PDF pages with Fyredocs',
          type: 'steps',
          items: [
            'Open Rotate PDF and upload your file.',
            'Choose the angle: 90° clockwise, 180° (upside down) or 270° (90° counter-clockwise).',
            'Choose which pages: all pages, only odd pages or only even pages. Odd or even is the quick fix for double-sided scans.',
            'Download the new PDF. The rotation is saved in the file, so it opens the right way in every viewer.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'rotate',
          text: 'Rotate your PDF now — free, no signup',
        },
        {
          heading: 'Only page 3 and page 7 are sideways?',
          type: 'paragraph',
          content:
            'Rotate PDF turns all, odd or even pages. For a few random pages, split the PDF, rotate just the part that needs it, and merge the pieces back in order. If the pages are upright but in the wrong order, use Reorder PDF instead.',
        },
        {
          type: 'toolCta',
          toolId: 'reorder',
          text: 'Pages upright but out of order? Reorder them',
        },
        {
          heading: 'Will rotating spoil the quality?',
          type: 'paragraph',
          content:
            'No. Rotating changes the page’s rotation setting; the text and images are not re-compressed, so the file looks exactly as sharp as before and the size barely changes. For private documents, turn on “Process in browser” and files up to 25 MB never leave your device.',
        },
        {
          heading: 'Before you upload to a form',
          type: 'checklist',
          items: [
            'Every page is upright when opened on a second device.',
            'Landscape certificates read left to right without turning your head.',
            'Pages are in the right order (front side, then back side).',
            'The file is still under the portal’s size limit.',
          ],
        },
        {
          type: 'mistakes',
          items: [
            'Rotating in the viewer, closing it, and uploading the unchanged file.',
            'Taking a screenshot of the rotated view — the text turns into a blurry picture and the file grows.',
            'Rotating all pages when only the even pages were upside down, which flips the good pages instead.',
            'Re-scanning the whole document when a 10-second rotate would do.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Why does my PDF open sideways again after I rotated it?',
          a: 'Most viewers (including the rotate button in browsers and phone apps) only rotate the view and do not save it in the file. Rotate the pages with a tool that downloads a new PDF, then check it on another device.',
        },
        {
          q: 'Can I rotate just one page?',
          a: 'Fyredocs Rotate PDF turns all, odd or even pages. For a single page, split the PDF, rotate that page and merge the parts back.',
        },
        {
          q: 'Does rotating a PDF reduce its quality or increase its size?',
          a: 'No. Only the page’s rotation setting changes; text and images are not re-compressed.',
        },
        {
          q: 'Can I rotate a PDF on my phone?',
          a: 'Yes. Rotate PDF works in your phone’s browser — no app or signup needed.',
        },
      ],
    },
    hi: {
      title: 'PDF पेज हमेशा के लिए रोटेट करें: टेढ़े स्कैन ऐसे ठीक करें कि दोबारा न घूमें',
      metaTitle: 'PDF पेज हमेशा के लिए रोटेट करें (फ़्री)',
      description:
        'PDF व्यूअर में पेज सीधा किया, पर दोबारा खोलने पर फिर टेढ़ा? जानें ऐसा क्यों होता है और पेज ऐसे कैसे घुमाएँ कि बदलाव फ़ाइल में सेव हो।',
      quickAnswer:
        'ज़्यादातर PDF व्यूअर का रोटेट बटन सिर्फ़ आपकी स्क्रीन पर पेज घुमाता है — फ़ाइल नहीं बदलती, इसलिए परीक्षा पोर्टल या बैंक को पेज टेढ़ा ही दिखता है। सबके लिए ठीक करने के लिए ऐसे टूल से घुमाएँ जो नई PDF सेव करे, जैसे Fyredocs Rotate PDF: 90°, 180° या 270° चुनें, सभी, विषम या सम पेज चुनें और डाउनलोड करें।',
      sections: [
        {
          heading: 'पेज टेढ़े क्यों आते हैं',
          type: 'list',
          items: [
            'फ़ोन के स्कैनर ऐप कैमरे के कोण से पेज की दिशा का अंदाज़ा लगाते हैं। बगल से या ऊपर से फ़ोटो ली तो अंदाज़ा ग़लत हो जाता है।',
            'सर्टिफ़िकेट, मार्कशीट और चौड़ी टेबल लैंडस्केप में छपती हैं। पोर्ट्रेट PDF में स्कैन हों तो टेढ़ी दिखती हैं।',
            'ऑफ़िस स्कैनर से दोनों तरफ़ स्कैन करने पर अक्सर हर दूसरा पेज उल्टा आता है।',
            'फ़ोटो से बनी PDF में हर फ़ोटो वैसी ही रहती है जैसी फ़ोन ने सेव की थी।',
          ],
        },
        {
          heading: '"व्यू घुमाना" बनाम पेज घुमाना',
          type: 'dataTable',
          content:
            'PDF के हर पेज में उसका अपना रोटेशन लिखा होता है। व्यूअर के बटन आमतौर पर सिर्फ़ आपका व्यू बदलते हैं; पेज घुमाकर सेव करने से नया रोटेशन फ़ाइल में लिख जाता है।',
          headers: ['बात', 'स्रोत क्या कहता है'],
          rows: [
            ['Acrobat में Rotate View', 'View → Rotate View सिर्फ़ स्क्रीन पर पेज दिखने का तरीका बदलता है, पेज की असली दिशा नहीं।'],
            ['Acrobat में पेज घुमाना', 'पेज को ही बदलने के लिए Organize Pages में Rotate इस्तेमाल करें और फिर PDF सेव करें।'],
            ['PDF इसे कैसे रखती है', 'हर पेज का रोटेशन डिग्री में होता है, जो पेज दिखाते या प्रिंट करते समय लागू होता है; ये 90 का गुणज होता है (0, 90, 180 या 270)।'],
          ],
          sources: [SRC.adobeView, SRC.adobeRotate, SRC.applePdfKit],
          checkedOn: CHECKED,
        },
        {
          heading: 'जाँचें: रोटेशन सच में सेव हुआ?',
          type: 'tip',
          content:
            'PDF ख़ुद को WhatsApp या ईमेल पर भेजें और दूसरे फ़ोन या कंप्यूटर पर खोलें। वहाँ पेज सीधा है तो रोटेशन फ़ाइल में है। फिर से टेढ़ा है तो सिर्फ़ आपका व्यूअर घूमा था।',
        },
        {
          heading: 'Fyredocs से PDF पेज घुमाएँ',
          type: 'steps',
          items: [
            'Rotate PDF खोलें और फ़ाइल अपलोड करें।',
            'कोण चुनें: 90° घड़ी की दिशा में, 180° (उल्टा) या 270° (90° घड़ी की उल्टी दिशा में)।',
            'पेज चुनें: सभी, सिर्फ़ विषम (odd) या सिर्फ़ सम (even)। दोनों तरफ़ के स्कैन के लिए odd/even सबसे जल्दी काम करता है।',
            'नई PDF डाउनलोड करें। रोटेशन फ़ाइल में सेव है, इसलिए हर व्यूअर में सही खुलेगी।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'rotate',
          text: 'अभी PDF रोटेट करें — फ़्री, बिना साइनअप',
        },
        {
          heading: 'सिर्फ़ पेज 3 और 7 टेढ़े हैं?',
          type: 'paragraph',
          content:
            'Rotate PDF सभी, विषम या सम पेज घुमाता है। कुछ अलग-अलग पेजों के लिए PDF को Split करें, जिस हिस्से को ज़रूरत है उसे घुमाएँ और Merge से वापस सही क्रम में जोड़ दें। पेज सीधे हैं पर क्रम ग़लत है, तो Reorder PDF इस्तेमाल करें।',
        },
        {
          type: 'toolCta',
          toolId: 'reorder',
          text: 'पेज सीधे हैं पर क्रम ग़लत? Reorder करें',
        },
        {
          heading: 'क्या घुमाने से क्वालिटी ख़राब होगी?',
          type: 'paragraph',
          content:
            'नहीं। घुमाने से सिर्फ़ पेज का रोटेशन बदलता है; टेक्स्ट और इमेज दोबारा कंप्रेस नहीं होते, इसलिए फ़ाइल उतनी ही साफ़ रहती है और साइज़ लगभग वही रहता है। निजी डॉक्यूमेंट के लिए “Process in browser” चालू करें — 25 MB तक की फ़ाइल आपके डिवाइस से बाहर नहीं जाती।',
        },
        {
          heading: 'फ़ॉर्म में अपलोड करने से पहले',
          type: 'checklist',
          items: [
            'दूसरे डिवाइस पर खोलने पर हर पेज सीधा है।',
            'लैंडस्केप सर्टिफ़िकेट बिना गर्दन घुमाए बाएँ से दाएँ पढ़ा जा सकता है।',
            'पेज सही क्रम में हैं (आगे का हिस्सा, फिर पीछे का)।',
            'फ़ाइल अब भी पोर्टल की साइज़ लिमिट के अंदर है।',
          ],
        },
        {
          type: 'mistakes',
          items: [
            'व्यूअर में घुमाकर बंद कर देना और बिना बदली फ़ाइल अपलोड करना।',
            'घुमाए हुए व्यू का स्क्रीनशॉट लेना — टेक्स्ट धुंधली तस्वीर बन जाता है और फ़ाइल बड़ी हो जाती है।',
            'सिर्फ़ सम पेज उल्टे थे, पर सभी पेज घुमा देना — इससे सही पेज उल्टे हो जाते हैं।',
            '10 सेकंड के रोटेट की जगह पूरा डॉक्यूमेंट दोबारा स्कैन करना।',
          ],
        },
      ],
      faqs: [
        {
          q: 'घुमाने के बाद भी PDF दोबारा टेढ़ी क्यों खुलती है?',
          a: 'ज़्यादातर व्यूअर (ब्राउज़र और फ़ोन ऐप के रोटेट बटन भी) सिर्फ़ व्यू घुमाते हैं, फ़ाइल में सेव नहीं करते। ऐसे टूल से पेज घुमाएँ जो नई PDF डाउनलोड करे, फिर दूसरे डिवाइस पर जाँच लें।',
        },
        {
          q: 'क्या सिर्फ़ एक पेज घुमा सकते हैं?',
          a: 'Fyredocs Rotate PDF सभी, विषम या सम पेज घुमाता है। एक पेज के लिए PDF को Split करें, वो पेज घुमाएँ और हिस्से वापस Merge करें।',
        },
        {
          q: 'क्या PDF घुमाने से क्वालिटी घटती है या साइज़ बढ़ता है?',
          a: 'नहीं। सिर्फ़ पेज का रोटेशन बदलता है; टेक्स्ट और इमेज दोबारा कंप्रेस नहीं होते।',
        },
        {
          q: 'क्या फ़ोन पर PDF घुमा सकते हैं?',
          a: 'हाँ। Rotate PDF फ़ोन के ब्राउज़र में चलता है — कोई ऐप या साइनअप नहीं चाहिए।',
        },
      ],
    },
  },
};

export default post;
