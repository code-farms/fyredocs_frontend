import type { BlogPost } from '../types';
import { PLAN_LIMIT_FALLBACKS as PLAN } from '../../../config/planLimits';

const post: BlogPost = {
  slug: 'compress-pdf-for-online-forms',
  category: 'exam-forms',
  publishedAt: '2026-11-26',
  updatedAt: '2026-11-26',
  readMinutes: 6,
  tools: ['compress', 'split', 'image-to-pdf', 'extract-pages'],
  i18n: {
    en: {
      title: 'How to Compress a PDF to Under 100 KB, 200 KB or 500 KB for Online Forms',
      metaTitle: 'Compress PDF to Under 100, 200 or 500 KB',
      description:
        'Portal says "file too large"? Shrink a PDF below 100, 200 or 500 KB for exam, job and government forms — free, in your browser, without making it unreadable.',
      quickAnswer:
        'Open Fyredocs Compress PDF, pick High (or Extreme if you need under 100 KB) and download. If it is still too big, the PDF is almost always made of photos — re-scan at a lower resolution, remove pages you do not need, or split it into parts.',
      sections: [
        {
          heading: 'Why the portal keeps saying "file too large"',
          type: 'paragraph',
          content:
            'Most exam, job and government portals cap document uploads at a few hundred kilobytes, while a PDF made on a phone is easily 2–8 MB. The size almost never comes from the text — it comes from the photos inside. A single phone photo of a certificate can be 3 MB on its own, so a 4-page scan quickly becomes 10 MB. Shrinking a PDF is mostly about making those images smaller.',
        },
        {
          heading: 'Step by step: get under the limit',
          type: 'steps',
          items: [
            'Check the exact limit on the portal (for example "max 200 KB, PDF only") and note the minimum too — some portals also reject files that are too small.',
            `Open Compress PDF and upload your file. Guests can upload files up to ${PLAN.guest.maxFileSizeMb} MB, no sign-up needed.`,
            'Choose a level: Medium usually shaves 30–50%, High 50–70% and Extreme 70–90% (these are typical ranges, not guarantees).',
            'Download the result and check its size in your file manager before uploading.',
            'Open the compressed PDF and zoom in on small text, signatures and stamps. If you cannot read them, go one level lower.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'compress',
          text: 'Compress your PDF now — pick High, check the size, upload',
        },
        {
          heading: 'Which level for which limit?',
          type: 'table',
          content: 'A rough guide for a typical scanned document. Text-only PDFs are small already and shrink less.',
          tableData: {
            headers: ['Your limit', 'Start with', 'If it is still too big'],
            rows: [
              ['500 KB or more', 'Medium', 'High'],
              ['200–300 KB', 'High', 'Extreme, or remove extra pages'],
              ['100 KB or less', 'Extreme', 'Re-scan at lower resolution, or split into parts'],
            ],
          },
        },
        {
          heading: 'Still too big? Four things that actually work',
          type: 'list',
          items: [
            'Remove what the form does not ask for: blank back pages, instruction pages and duplicate copies. Every page of a scan costs space — use Extract Pages to keep only what is needed.',
            'Re-scan smarter: in your scanner app choose "document" or black-and-white mode and a lower resolution. A page scanned in grayscale is far smaller than a colour photo of the same page.',
            'Split it: some portals have separate upload slots (for example marksheet and certificate). Upload each part separately instead of one big file.',
            'Start from photos, not a PDF: if you only have photos, turn them into a PDF with JPG to PDF first, then compress — this usually beats compressing an already bloated PDF.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'extract-pages',
          text: 'Keep only the pages the form needs with Extract Pages',
        },
        {
          type: 'mistakes',
          items: [
            'Taking a screenshot of the PDF to make it "smaller" — screenshots are images, often larger, and blurry when printed.',
            'Zipping the PDF — portals that ask for a PDF reject .zip files.',
            'Renaming a .jpg to .pdf — the file is still a JPG inside, and validation will fail.',
            'Compressing so hard that the signature, photo or stamp becomes unreadable — the form can be rejected later even if the upload succeeds.',
          ],
        },
        {
          type: 'checklist',
          items: [
            'File size is below the maximum (and above the minimum, if the portal has one)',
            'Format is exactly what the portal asks for (PDF, not JPG or ZIP)',
            'Every page is the right way up and in the right order',
            'Text, signature and stamps are readable when you zoom in',
            'Only the pages the form asks for are included',
          ],
        },
      ],
      faqs: [
        {
          q: 'Can I compress a PDF to exactly 100 KB?',
          a: 'Compression tools aim for smaller, not an exact number. Pick Extreme, check the size, and if you are just over the limit remove a page or re-scan in grayscale. Being under the limit is what matters.',
        },
        {
          q: 'Will compressing make my document blurry?',
          a: 'Text stays sharp because it is not an image. Photos and scans are re-encoded at lower quality, which is usually fine on screen. Always zoom in on signatures and stamps before uploading.',
        },
        {
          q: 'Is it safe to upload my marksheet or ID?',
          a: 'Files are encrypted in transit and, for guests, deleted automatically about 30 minutes after processing. Fyredocs never shares your documents.',
        },
        {
          q: 'Does it work on my phone?',
          a: 'Yes. Compress PDF runs in any modern browser on Android and iPhone — nothing to install.',
        },
      ],
    },
    hi: {
      title: 'ऑनलाइन फ़ॉर्म के लिए PDF को 100 KB, 200 KB या 500 KB से छोटा कैसे करें',
      metaTitle: 'PDF को 100, 200 या 500 KB से छोटा करें',
      description:
        'पोर्टल पर "file too large" आ रहा है? परीक्षा, नौकरी और सरकारी फ़ॉर्म के लिए PDF को 100, 200 या 500 KB से छोटा करें — मुफ़्त, ब्राउज़र में, बिना धुंधला किए।',
      quickAnswer:
        'Fyredocs के Compress PDF में फ़ाइल डालें, High चुनें (100 KB से कम चाहिए तो Extreme) और डाउनलोड करें। फिर भी बड़ी है तो लगभग हमेशा वजह PDF के अंदर की फ़ोटो होती हैं — कम रेज़ोल्यूशन में दोबारा स्कैन करें, फालतू पेज हटाएँ या फ़ाइल को हिस्सों में बाँटें।',
      sections: [
        {
          heading: 'पोर्टल बार-बार "file too large" क्यों कहता है',
          type: 'paragraph',
          content:
            'ज़्यादातर परीक्षा, नौकरी और सरकारी पोर्टल डॉक्यूमेंट को कुछ सौ KB तक ही लेते हैं, जबकि फ़ोन से बनी PDF आसानी से 2–8 MB की हो जाती है। साइज़ टेक्स्ट से नहीं, अंदर की फ़ोटो से बढ़ता है। एक सर्टिफ़िकेट की एक फ़ोटो ही 3 MB की हो सकती है, इसलिए 4 पेज का स्कैन 10 MB तक पहुँच जाता है। PDF छोटी करने का मतलब असल में इन्हीं फ़ोटो को छोटा करना है।',
        },
        {
          heading: 'स्टेप बाय स्टेप: लिमिट से नीचे लाएँ',
          type: 'steps',
          items: [
            'पोर्टल पर सही लिमिट देखें (जैसे "max 200 KB, PDF only") और कम से कम साइज़ भी — कुछ पोर्टल बहुत छोटी फ़ाइल भी नहीं लेते।',
            `Compress PDF खोलें और फ़ाइल अपलोड करें। गेस्ट ${PLAN.guest.maxFileSizeMb} MB तक की फ़ाइल डाल सकते हैं, साइन-अप की ज़रूरत नहीं।`,
            'लेवल चुनें: Medium से आमतौर पर 30–50%, High से 50–70% और Extreme से 70–90% साइज़ घटता है (ये अंदाज़न आँकड़े हैं, गारंटी नहीं)।',
            'नतीजा डाउनलोड करें और अपलोड से पहले फ़ाइल मैनेजर में साइज़ जाँच लें।',
            'कंप्रेस हुई PDF खोलकर छोटे अक्षर, सिग्नेचर और मुहर ज़ूम करके देखें। साफ़ न दिखें तो एक लेवल कम चुनें।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'compress',
          text: 'अभी PDF कंप्रेस करें — High चुनें, साइज़ देखें, अपलोड करें',
        },
        {
          heading: 'किस लिमिट के लिए कौन-सा लेवल?',
          type: 'table',
          content: 'आम स्कैन किए गए डॉक्यूमेंट के लिए मोटा अंदाज़ा। सिर्फ़ टेक्स्ट वाली PDF पहले से छोटी होती है और कम घटती है।',
          tableData: {
            headers: ['आपकी लिमिट', 'शुरुआत करें', 'फिर भी बड़ी हो तो'],
            rows: [
              ['500 KB या ज़्यादा', 'Medium', 'High'],
              ['200–300 KB', 'High', 'Extreme, या फालतू पेज हटाएँ'],
              ['100 KB या कम', 'Extreme', 'कम रेज़ोल्यूशन में दोबारा स्कैन करें या हिस्सों में बाँटें'],
            ],
          },
        },
        {
          heading: 'फिर भी बड़ी है? ये चार तरीके सच में काम करते हैं',
          type: 'list',
          items: [
            'जो फ़ॉर्म में नहीं माँगा, उसे हटाएँ: खाली पिछले पेज, निर्देश वाले पेज और डुप्लिकेट कॉपी। स्कैन का हर पेज जगह लेता है — Extract Pages से सिर्फ़ ज़रूरी पेज रखें।',
            'समझदारी से दोबारा स्कैन करें: स्कैनर ऐप में "document" या ब्लैक-एंड-व्हाइट मोड और कम रेज़ोल्यूशन चुनें। ग्रेस्केल पेज उसी पेज की रंगीन फ़ोटो से कहीं छोटा होता है।',
            'हिस्सों में बाँटें: कई पोर्टल पर अलग-अलग अपलोड स्लॉट होते हैं (जैसे मार्कशीट और सर्टिफ़िकेट)। एक बड़ी फ़ाइल की जगह हर हिस्सा अलग डालें।',
            'PDF नहीं, फ़ोटो से शुरू करें: अगर आपके पास सिर्फ़ फ़ोटो हैं, तो पहले JPG to PDF से PDF बनाएँ, फिर कंप्रेस करें — ये पहले से भारी PDF को कंप्रेस करने से अक्सर बेहतर रहता है।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'extract-pages',
          text: 'Extract Pages से सिर्फ़ ज़रूरी पेज रखें',
        },
        {
          type: 'mistakes',
          items: [
            'PDF का स्क्रीनशॉट लेकर उसे "छोटा" करना — स्क्रीनशॉट इमेज होते हैं, अक्सर बड़े होते हैं और प्रिंट में धुंधले आते हैं।',
            'PDF को ZIP करना — जहाँ PDF माँगी गई है, वहाँ .zip फ़ाइल नहीं चलती।',
            '.jpg का नाम बदलकर .pdf करना — फ़ाइल अंदर से अब भी JPG ही रहती है और जाँच में फ़ेल हो जाती है।',
            'इतना कंप्रेस करना कि सिग्नेचर, फ़ोटो या मुहर पढ़ी न जाए — अपलोड हो जाने पर भी फ़ॉर्म बाद में रिजेक्ट हो सकता है।',
          ],
        },
        {
          type: 'checklist',
          items: [
            'फ़ाइल साइज़ अधिकतम लिमिट से कम है (और न्यूनतम लिमिट हो तो उससे ज़्यादा)',
            'फ़ॉर्मेट वही है जो पोर्टल माँगता है (PDF, JPG या ZIP नहीं)',
            'हर पेज सीधा है और सही क्रम में है',
            'ज़ूम करने पर टेक्स्ट, सिग्नेचर और मुहर साफ़ दिखते हैं',
            'सिर्फ़ वही पेज हैं जो फ़ॉर्म में माँगे गए हैं',
          ],
        },
      ],
      faqs: [
        {
          q: 'क्या PDF को ठीक 100 KB का बना सकते हैं?',
          a: 'कंप्रेस टूल फ़ाइल को छोटा करते हैं, कोई तय नंबर नहीं देते। Extreme चुनें, साइज़ देखें, और अगर लिमिट से थोड़ी ऊपर है तो एक पेज हटाएँ या ग्रेस्केल में दोबारा स्कैन करें। ज़रूरी बस इतना है कि फ़ाइल लिमिट से नीचे हो।',
        },
        {
          q: 'क्या कंप्रेस करने से डॉक्यूमेंट धुंधला हो जाएगा?',
          a: 'टेक्स्ट इमेज नहीं होता, इसलिए साफ़ रहता है। फ़ोटो और स्कैन थोड़ी कम क्वालिटी में सेव होते हैं, जो स्क्रीन पर आमतौर पर ठीक लगते हैं। अपलोड से पहले सिग्नेचर और मुहर ज़ूम करके ज़रूर देखें।',
        },
        {
          q: 'क्या मार्कशीट या ID अपलोड करना सुरक्षित है?',
          a: 'फ़ाइलें ट्रांसफ़र के दौरान एन्क्रिप्ट रहती हैं और गेस्ट की फ़ाइलें प्रोसेसिंग के करीब 30 मिनट बाद अपने-आप डिलीट हो जाती हैं। Fyredocs आपके डॉक्यूमेंट किसी से शेयर नहीं करता।',
        },
        {
          q: 'क्या ये फ़ोन पर चलता है?',
          a: 'हाँ। Compress PDF Android और iPhone के किसी भी नए ब्राउज़र में चलता है — कुछ इंस्टॉल नहीं करना पड़ता।',
        },
      ],
    },
  },
};

export default post;
