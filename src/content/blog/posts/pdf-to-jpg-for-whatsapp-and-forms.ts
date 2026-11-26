import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'pdf-to-jpg-for-whatsapp-and-forms',
  category: 'how-to',
  publishedAt: '2026-11-24',
  updatedAt: '2026-11-26',
  readMinutes: 4,
  tools: ['pdf-to-jpg', 'pdf-to-image', 'extract-pages', 'image-to-pdf'],
  i18n: {
    en: {
      title: 'PDF to JPG for WhatsApp, Instagram and Forms — and When PNG Is Better',
      metaTitle: 'PDF to JPG for WhatsApp, Instagram & Forms',
      description:
        'Share one page of a PDF as a picture: convert PDF to JPG for WhatsApp status, Instagram or a form that wants an image — and know when PNG is the better pick.',
      quickAnswer:
        'Open PDF to JPG, upload the PDF and download. A one-page PDF gives you one JPG; a multi-page PDF gives a ZIP with one JPG per page. Choose PDF to PNG instead when small text, charts or line drawings must stay razor-sharp.',
      sections: [
        {
          heading: 'Why turn a PDF into a picture?',
          type: 'list',
          items: [
            'WhatsApp status and Instagram posts only take images.',
            'A JPG preview opens instantly in any chat, while a PDF needs a tap and a viewer.',
            'Some forms ask for a document as a JPG (for example an ID card or a single certificate page).',
            'You want to share just one page — a result, a ticket, a receipt — not the whole file.',
          ],
        },
        {
          heading: 'Convert in three steps',
          type: 'steps',
          items: [
            'If you only need one or two pages, first keep just those with Extract Pages — it saves unzipping later.',
            'Open PDF to JPG and upload the PDF.',
            'Download: one page gives a single JPG, several pages give a ZIP with one JPG per page, in order.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-jpg',
          text: 'Convert your PDF to JPG now',
        },
        {
          heading: 'JPG or PNG?',
          type: 'table',
          tableData: {
            headers: ['', 'JPG', 'PNG'],
            rows: [
              ['File size', 'Small — easy to send and upload', 'Larger'],
              ['Photos and scans', 'Looks great', 'Looks great, bigger file'],
              ['Small text, charts, diagrams', 'Edges can look slightly soft', 'Pixel-perfect, lossless'],
              ['Best for', 'WhatsApp, Instagram, most forms', 'Printing, slides, documents with fine detail'],
            ],
          },
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-image',
          text: 'Need lossless quality? Use PDF to PNG',
        },
        {
          type: 'tip',
          content:
            'Posting a page on Instagram? It crops tall images, so a portrait A4 page works best as a 4:5 post or a story. Check the preview before sharing so the edges are not cut off.',
        },
        {
          heading: 'Going the other way',
          type: 'paragraph',
          content:
            'Received a set of photos but the form wants one PDF? JPG to PDF puts them back into a single document, one image per page.',
        },
        {
          type: 'toolCta',
          toolId: 'image-to-pdf',
          text: 'Turn JPGs back into a PDF with JPG to PDF',
        },
        {
          type: 'mistakes',
          items: [
            'Taking a screenshot of the PDF instead — screenshots include your phone’s status bar and come out at screen resolution, so text gets blurry when zoomed.',
            'Converting a 40-page PDF when you need one page — extract the page first.',
            'Posting a document with personal details (address, phone, ID numbers) publicly — crop or cover them first.',
          ],
        },
      ],
      faqs: [
        {
          q: 'What do I get from a multi-page PDF?',
          a: 'A ZIP file with one JPG per page, numbered in order. A one-page PDF downloads as a single JPG.',
        },
        {
          q: 'Will the JPG be good enough to read?',
          a: 'Yes — pages are rendered at 150 DPI by default, which keeps normal text readable on a phone. For very fine print or diagrams, PDF to PNG is lossless and stays sharper.',
        },
        {
          q: 'Does it work on a phone?',
          a: 'Yes. It runs in your phone’s browser, and the JPG goes straight to your downloads or gallery.',
        },
        {
          q: 'Is it free?',
          a: 'Yes, with no sign-up and no watermark on the images.',
        },
      ],
    },
    hi: {
      title: 'WhatsApp, Instagram और फ़ॉर्म के लिए PDF को JPG बनाएँ — और PNG कब बेहतर है',
      metaTitle: 'WhatsApp और फ़ॉर्म के लिए PDF को JPG बनाएँ',
      description:
        'PDF का एक पेज फ़ोटो की तरह शेयर करें: WhatsApp स्टेटस, Instagram या इमेज माँगने वाले फ़ॉर्म के लिए PDF को JPG बनाएँ — और जानें कि PNG कब बेहतर है।',
      quickAnswer:
        'PDF to JPG खोलें, PDF अपलोड करें और डाउनलोड करें। एक पेज की PDF से एक JPG मिलती है; कई पेज की PDF से ZIP मिलती है जिसमें हर पेज की अलग JPG होती है। छोटे अक्षर, चार्ट या लाइन ड्रॉइंग बिल्कुल साफ़ चाहिए हों तो PDF to PNG चुनें।',
      sections: [
        {
          heading: 'PDF को फ़ोटो क्यों बनाएँ?',
          type: 'list',
          items: [
            'WhatsApp स्टेटस और Instagram पोस्ट सिर्फ़ इमेज लेते हैं।',
            'चैट में JPG तुरंत दिख जाती है, जबकि PDF खोलने के लिए टैप और व्यूअर चाहिए।',
            'कुछ फ़ॉर्म डॉक्यूमेंट को JPG में माँगते हैं (जैसे ID कार्ड या सर्टिफ़िकेट का एक पेज)।',
            'आपको पूरी फ़ाइल नहीं, सिर्फ़ एक पेज भेजना है — रिज़ल्ट, टिकट या रसीद।',
          ],
        },
        {
          heading: 'तीन स्टेप में बदलें',
          type: 'steps',
          items: [
            'सिर्फ़ एक-दो पेज चाहिए तो पहले Extract Pages से वही पेज रखें — बाद में ZIP खोलने की झंझट बचती है।',
            'PDF to JPG खोलें और PDF अपलोड करें।',
            'डाउनलोड करें: एक पेज से एक JPG, कई पेज से ZIP जिसमें हर पेज की JPG क्रम से होती है।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-jpg',
          text: 'अभी PDF को JPG में बदलें',
        },
        {
          heading: 'JPG या PNG?',
          type: 'table',
          tableData: {
            headers: ['', 'JPG', 'PNG'],
            rows: [
              ['फ़ाइल साइज़', 'छोटी — भेजना और अपलोड करना आसान', 'बड़ी'],
              ['फ़ोटो और स्कैन', 'बढ़िया दिखती है', 'बढ़िया, पर फ़ाइल बड़ी'],
              ['छोटे अक्षर, चार्ट, डायग्राम', 'किनारे थोड़े नरम दिख सकते हैं', 'पिक्सल-परफ़ेक्ट, बिना क्वालिटी खोए'],
              ['सबसे अच्छा', 'WhatsApp, Instagram, ज़्यादातर फ़ॉर्म', 'प्रिंट, स्लाइड, बारीक डिटेल वाले डॉक्यूमेंट'],
            ],
          },
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-image',
          text: 'बिना क्वालिटी खोए चाहिए? PDF to PNG इस्तेमाल करें',
        },
        {
          type: 'tip',
          content:
            'Instagram पर पेज पोस्ट कर रहे हैं? वो लंबी इमेज काटता है, इसलिए A4 पेज 4:5 पोस्ट या स्टोरी में सबसे अच्छा आता है। शेयर से पहले प्रीव्यू देख लें कि किनारे कटे न हों।',
        },
        {
          heading: 'उल्टा भी कर सकते हैं',
          type: 'paragraph',
          content:
            'फ़ोटो का सेट मिला है पर फ़ॉर्म एक PDF माँगता है? JPG to PDF उन्हें फिर से एक डॉक्यूमेंट में जोड़ देता है, हर पेज पर एक इमेज।',
        },
        {
          type: 'toolCta',
          toolId: 'image-to-pdf',
          text: 'JPG to PDF से JPG को फिर PDF बनाएँ',
        },
        {
          type: 'mistakes',
          items: [
            'इसकी जगह PDF का स्क्रीनशॉट लेना — उसमें फ़ोन का स्टेटस बार आ जाता है और रेज़ोल्यूशन स्क्रीन जितना होता है, इसलिए ज़ूम करने पर टेक्स्ट धुंधला दिखता है।',
            'एक पेज चाहिए और पूरी 40 पेज की PDF बदल देना — पहले पेज अलग करें।',
            'पता, फ़ोन या ID नंबर वाला डॉक्यूमेंट सार्वजनिक रूप से पोस्ट करना — पहले उन्हें काटें या छिपाएँ।',
          ],
        },
      ],
      faqs: [
        {
          q: 'कई पेज की PDF से क्या मिलेगा?',
          a: 'एक ZIP फ़ाइल जिसमें हर पेज की JPG क्रम से नंबर के साथ होती है। एक पेज की PDF से सीधे एक JPG डाउनलोड होती है।',
        },
        {
          q: 'क्या JPG पढ़ने लायक साफ़ होगी?',
          a: 'हाँ — पेज डिफ़ॉल्ट रूप से 150 DPI पर बनते हैं, जिससे सामान्य टेक्स्ट फ़ोन पर आराम से पढ़ा जाता है। बहुत बारीक अक्षर या डायग्राम के लिए PDF to PNG बिना क्वालिटी खोए ज़्यादा साफ़ रहता है।',
        },
        {
          q: 'क्या ये फ़ोन पर चलता है?',
          a: 'हाँ। ये फ़ोन के ब्राउज़र में चलता है और JPG सीधे डाउनलोड या गैलरी में चली जाती है।',
        },
        {
          q: 'क्या ये मुफ़्त है?',
          a: 'हाँ, बिना साइन-अप और इमेज पर बिना वॉटरमार्क के।',
        },
      ],
    },
  },
};

export default post;
