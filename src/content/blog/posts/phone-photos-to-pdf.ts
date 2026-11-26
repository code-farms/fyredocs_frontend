import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'phone-photos-to-pdf',
  category: 'everyday',
  publishedAt: '2026-11-25',
  updatedAt: '2026-11-26',
  readMinutes: 5,
  tools: ['scan-to-pdf', 'image-to-pdf', 'merge', 'reorder', 'add-page-numbers', 'compress'],
  i18n: {
    en: {
      title: 'Turn Phone Photos of Marksheets and Certificates into One Clean PDF',
      metaTitle: 'Phone Photos of Documents to One Clean PDF',
      description:
        'Photographed your marksheets on your phone? Turn them into one clean, white-background PDF — shadows, fingers and glare removed — then shrink it for upload.',
      quickAnswer:
        'Use Scan to PDF for photos of paper — it can whiten the background and remove shadows, fingers at the edges, glare and punch holes. For screenshots or already-clean images, JPG to PDF is enough. Then put pages in order and compress if the form has a size limit.',
      sections: [
        {
          heading: 'Take photos that convert well',
          type: 'list',
          content: 'Two minutes here saves you a blurry, rejected upload later.',
          items: [
            'Daylight near a window beats the ceiling light; turn the flash off to avoid a bright glare spot.',
            'Lay the page flat on a dark, plain surface so the edges stand out.',
            'Hold the phone straight above the page, not at an angle, and fill the frame with the document.',
            'Tap to focus on the text and check the photo is sharp before moving on.',
            'One page per photo — do not fit two certificates into one shot.',
          ],
        },
        {
          heading: 'Scan to PDF or JPG to PDF?',
          type: 'table',
          tableData: {
            headers: ['You have…', 'Use', 'Why'],
            rows: [
              ['Phone photos of paper (shadows, uneven light)', 'Scan to PDF', 'Cleans the background to white and removes shadows, fingers, glare and punch holes'],
              ['Screenshots, e-certificates, already-clean images', 'JPG to PDF', 'Keeps the images exactly as they are, one per page'],
              ['A scanned page you also need to search or copy text from', 'Scan to PDF with OCR', 'Adds a searchable text layer'],
            ],
          },
        },
        {
          heading: 'Make the PDF in four steps',
          type: 'steps',
          items: [
            'Open Scan to PDF and add your photos (guests can add up to 5 files per job).',
            'Tick the clean-ups you need — "Clean background (paper → white)" and "Deep shadow removal" fix most phone photos.',
            'Choose the page size (Auto works for most documents) and run it.',
            'Download the PDF and flip through it: every page upright, readable and in order.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'scan-to-pdf',
          text: 'Turn your document photos into a clean PDF with Scan to PDF',
        },
        {
          heading: 'Several sets? Combine them in the right order',
          type: 'paragraph',
          content:
            'If you made separate PDFs — say Class 10 and Class 12 marksheets — combine them with Merge PDF, then use Reorder Pages to drag any page into place. Many forms expect a specific order (often oldest qualification first), so check the instructions.',
        },
        {
          type: 'toolCta',
          toolId: 'merge',
          text: 'Combine your PDFs into one with Merge PDF',
        },
        {
          type: 'toolCta',
          toolId: 'reorder',
          text: 'Put pages in the order the form asks for with Reorder Pages',
        },
        {
          type: 'toolCta',
          toolId: 'add-page-numbers',
          text: 'Long application file? Number the pages so the office can refer to them',
        },
        {
          heading: 'Shrink it for the upload',
          type: 'paragraph',
          content:
            'Photo-based PDFs are heavy. If the portal has a size limit, run the finished file through Compress PDF — High is a good starting point — and check the result is still readable.',
        },
        {
          type: 'toolCta',
          toolId: 'compress',
          text: 'Compress the finished PDF for your form',
        },
        {
          type: 'mistakes',
          items: [
            'Using the flash — it leaves a white glare patch right over the text.',
            'Cropping off the edges of the certificate; some forms are rejected if the border, seal or serial number is missing.',
            'Sending each page as a separate image when the form asks for one PDF.',
            'Uploading the original without checking the page order.',
          ],
        },
        {
          type: 'checklist',
          items: [
            'Each photo is sharp, straight and fills the frame',
            'Background is white and no fingers or shadows are visible',
            'Pages are upright and in the order the form asks for',
            'Seals, signatures and serial numbers are fully visible',
            'Final size is under the portal’s limit',
          ],
        },
      ],
      faqs: [
        {
          q: 'Can I convert photos to PDF on my phone?',
          a: 'Yes. Scan to PDF and JPG to PDF run in your phone’s browser — pick photos straight from your gallery, no app needed.',
        },
        {
          q: 'Will the PDF look like a real scan?',
          a: 'With "Clean background" and "Deep shadow removal" on, most phone photos come out close to a flatbed scan: white paper and dark text.',
        },
        {
          q: 'How many photos can I add at once?',
          a: 'Guests can add up to 5 files per job. A free account raises the limits.',
        },
        {
          q: 'Are my documents kept on your servers?',
          a: 'Guest files are deleted automatically about 30 minutes after processing, and files are encrypted in transit.',
        },
      ],
    },
    hi: {
      title: 'फ़ोन से खींची मार्कशीट और सर्टिफ़िकेट की फ़ोटो को एक साफ़ PDF में बदलें',
      metaTitle: 'डॉक्यूमेंट की फ़ोटो से एक साफ़ PDF बनाएँ',
      description:
        'मार्कशीट की फ़ोटो फ़ोन से खींची है? फ़ोटो को एक साफ़, सफ़ेद बैकग्राउंड वाली PDF में बदलें — परछाई, उँगलियाँ और चमक हटाकर — फिर अपलोड के लिए छोटा करें।',
      quickAnswer:
        'काग़ज़ की फ़ोटो के लिए Scan to PDF इस्तेमाल करें — ये बैकग्राउंड सफ़ेद कर सकता है और परछाई, किनारे पर उँगलियाँ, चमक और पंच के छेद हटा सकता है। स्क्रीनशॉट या पहले से साफ़ इमेज के लिए JPG to PDF काफ़ी है। फिर पेज क्रम में लगाएँ और लिमिट हो तो कंप्रेस करें।',
      sections: [
        {
          heading: 'ऐसी फ़ोटो लें जो अच्छी तरह बदलें',
          type: 'list',
          content: 'यहाँ दो मिनट लगाने से बाद में धुंधली, रिजेक्ट हुई फ़ाइल से बच जाते हैं।',
          items: [
            'छत की लाइट से बेहतर खिड़की के पास की दिन की रोशनी है; फ़्लैश बंद रखें ताकि चमकदार धब्बा न आए।',
            'पेज को गहरे रंग की सादी सतह पर सीधा रखें ताकि किनारे साफ़ दिखें।',
            'फ़ोन को पेज के ठीक ऊपर सीधा पकड़ें, तिरछा नहीं, और फ़्रेम में सिर्फ़ डॉक्यूमेंट रखें।',
            'टेक्स्ट पर टैप करके फ़ोकस करें और आगे बढ़ने से पहले देख लें कि फ़ोटो साफ़ है।',
            'एक फ़ोटो में एक ही पेज — दो सर्टिफ़िकेट एक फ़ोटो में न लें।',
          ],
        },
        {
          heading: 'Scan to PDF या JPG to PDF?',
          type: 'table',
          tableData: {
            headers: ['आपके पास है…', 'इस्तेमाल करें', 'क्यों'],
            rows: [
              ['काग़ज़ की फ़ोन से खींची फ़ोटो (परछाई, असमान रोशनी)', 'Scan to PDF', 'बैकग्राउंड सफ़ेद करता है और परछाई, उँगलियाँ, चमक और पंच के छेद हटाता है'],
              ['स्क्रीनशॉट, ई-सर्टिफ़िकेट, पहले से साफ़ इमेज', 'JPG to PDF', 'इमेज को जैसी हैं वैसी रखता है, हर पेज पर एक'],
              ['स्कैन किया पेज जिसमें टेक्स्ट खोजना या कॉपी करना हो', 'OCR के साथ Scan to PDF', 'खोजने लायक टेक्स्ट की परत जोड़ता है'],
            ],
          },
        },
        {
          heading: 'चार स्टेप में PDF बनाएँ',
          type: 'steps',
          items: [
            'Scan to PDF खोलें और फ़ोटो डालें (गेस्ट एक बार में 5 फ़ाइलें डाल सकते हैं)।',
            'जो सफ़ाई चाहिए वो चुनें — "Clean background (paper → white)" और "Deep shadow removal" ज़्यादातर फ़ोन फ़ोटो ठीक कर देते हैं।',
            'पेज साइज़ चुनें (ज़्यादातर डॉक्यूमेंट के लिए Auto ठीक है) और चलाएँ।',
            'PDF डाउनलोड करके हर पेज देखें: सीधा, साफ़ पढ़ने लायक और सही क्रम में।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'scan-to-pdf',
          text: 'Scan to PDF से डॉक्यूमेंट की फ़ोटो को साफ़ PDF बनाएँ',
        },
        {
          heading: 'कई सेट हैं? सही क्रम में जोड़ें',
          type: 'paragraph',
          content:
            'अगर अलग-अलग PDF बनाई हैं — जैसे 10वीं और 12वीं की मार्कशीट — तो Merge PDF से जोड़ें, फिर Reorder Pages से किसी भी पेज को खींचकर सही जगह लगाएँ। कई फ़ॉर्म एक तय क्रम चाहते हैं (अक्सर सबसे पुरानी योग्यता पहले), इसलिए निर्देश देख लें।',
        },
        {
          type: 'toolCta',
          toolId: 'merge',
          text: 'Merge PDF से अपनी PDF एक में जोड़ें',
        },
        {
          type: 'toolCta',
          toolId: 'reorder',
          text: 'Reorder Pages से पेज फ़ॉर्म के माँगे क्रम में लगाएँ',
        },
        {
          type: 'toolCta',
          toolId: 'add-page-numbers',
          text: 'लंबी आवेदन फ़ाइल है? पेज नंबर डालें ताकि दफ़्तर उनका हवाला दे सके',
        },
        {
          heading: 'अपलोड के लिए छोटा करें',
          type: 'paragraph',
          content:
            'फ़ोटो से बनी PDF भारी होती है। पोर्टल पर साइज़ लिमिट हो तो तैयार फ़ाइल को Compress PDF से गुज़ारें — High से शुरुआत अच्छी है — और देख लें कि फ़ाइल अब भी साफ़ पढ़ी जा रही है।',
        },
        {
          type: 'toolCta',
          toolId: 'compress',
          text: 'फ़ॉर्म के लिए तैयार PDF कंप्रेस करें',
        },
        {
          type: 'mistakes',
          items: [
            'फ़्लैश इस्तेमाल करना — टेक्स्ट के ठीक ऊपर सफ़ेद चमक का धब्बा आ जाता है।',
            'सर्टिफ़िकेट के किनारे काट देना; बॉर्डर, मुहर या सीरियल नंबर न दिखने पर कुछ फ़ॉर्म रिजेक्ट हो जाते हैं।',
            'जहाँ एक PDF माँगी है, वहाँ हर पेज अलग इमेज में भेजना।',
            'पेज का क्रम जाँचे बिना फ़ाइल अपलोड कर देना।',
          ],
        },
        {
          type: 'checklist',
          items: [
            'हर फ़ोटो साफ़, सीधी है और फ़्रेम भरती है',
            'बैकग्राउंड सफ़ेद है, उँगलियाँ या परछाई नहीं दिख रहीं',
            'पेज सीधे हैं और फ़ॉर्म के माँगे क्रम में हैं',
            'मुहर, सिग्नेचर और सीरियल नंबर पूरे दिख रहे हैं',
            'फ़ाइनल साइज़ पोर्टल की लिमिट से कम है',
          ],
        },
      ],
      faqs: [
        {
          q: 'क्या फ़ोन पर ही फ़ोटो को PDF बना सकते हैं?',
          a: 'हाँ। Scan to PDF और JPG to PDF फ़ोन के ब्राउज़र में चलते हैं — गैलरी से सीधे फ़ोटो चुनें, कोई ऐप नहीं चाहिए।',
        },
        {
          q: 'क्या PDF असली स्कैन जैसी दिखेगी?',
          a: '"Clean background" और "Deep shadow removal" चालू रखने पर ज़्यादातर फ़ोन फ़ोटो स्कैनर जैसी दिखती हैं: सफ़ेद काग़ज़ और गहरा टेक्स्ट।',
        },
        {
          q: 'एक बार में कितनी फ़ोटो डाल सकते हैं?',
          a: 'गेस्ट एक बार में 5 फ़ाइलें डाल सकते हैं। मुफ़्त अकाउंट से लिमिट बढ़ जाती है।',
        },
        {
          q: 'क्या मेरे डॉक्यूमेंट आपके सर्वर पर रहते हैं?',
          a: 'गेस्ट की फ़ाइलें प्रोसेसिंग के करीब 30 मिनट बाद अपने-आप डिलीट हो जाती हैं, और ट्रांसफ़र के दौरान एन्क्रिप्ट रहती हैं।',
        },
      ],
    },
  },
};

export default post;
