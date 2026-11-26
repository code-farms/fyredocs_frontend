import type { BlogPost } from '../types';

const CHECKED = '2026-11-26';

const SRC = {
  ssc: { label: 'SSC CGL 2026 notice (21 May 2026)', url: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf' },
  upsc: { label: 'UPSC Technical FAQs, Q42–Q46', url: 'https://upsconline.gov.in/upsc/OTRP/candidate/FAQs.pdf' },
  ibps: { label: 'IBPS CRP PO/MT-XVI notification, Annexure III', url: 'https://www.ibps.in/wp-content/uploads/Detailed-Notification_CRP-PO-XVI_Final_V1_30.06.2026.pdf' },
  neet: { label: 'NTA NEET (UG) 2026 Information Bulletin, pp. 16–17', url: 'https://cdnbbsr.s3waas.gov.in/s37bc1ec1d9c3426357e69acd5bf320061/uploads/2026/02/202602231394640855.pdf' },
  jee: { label: 'NTA JEE (Main) 2027 Information Bulletin, pp. 8–9', url: 'https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/10/202610241890224107.pdf' },
};

const post: BlogPost = {
  slug: 'exam-form-upload-size-limits',
  category: 'exam-forms',
  publishedAt: '2026-11-26',
  updatedAt: '2026-11-26',
  readMinutes: 7,
  tools: ['compress', 'image-to-pdf', 'pdf-to-jpg', 'extract-pages'],
  i18n: {
    en: {
      title: 'Exam Form Upload Sizes: SSC, UPSC, IBPS, NEET and JEE Main (Photo, Signature, Documents)',
      metaTitle: 'Exam Form Upload Sizes: SSC, UPSC, IBPS, NEET',
      description:
        'Photo, signature and document size limits for SSC, UPSC, IBPS, NEET and JEE Main forms — taken from the official notices, with links and the date we checked.',
      quickAnswer:
        'Signatures are small everywhere (10–20 KB for SSC and IBPS, up to 100 KB for NTA exams). Photos range from 20–50 KB (IBPS) to 10–200 KB (NEET, JEE) and 20–300 KB (UPSC). Certificates are PDFs of 50–300 KB for NTA and UPSC, and up to 500 KB for IBPS. SSC no longer takes a photo upload — it captures a live photo.',
      sections: [
        {
          heading: 'Read this first',
          type: 'paragraph',
          content:
            'Every number below comes from the official notice or FAQ of each exam, linked under its table, and was checked on 26 Nov 2026. Commissions repeat these rules in every new notification and sometimes change them, so treat this page as a cheat sheet and confirm against the notice you are actually applying under. Where an official document contradicts itself, we say so instead of picking one number.',
        },
        {
          heading: 'SSC (CGL 2026)',
          type: 'dataTable',
          content:
            'SSC no longer asks for an uploaded photograph: the photo is captured live through your webcam or phone while you fill the form.',
          headers: ['Item', 'Format', 'Size', 'Dimensions'],
          rows: [
            ['Photograph', 'Live capture, no upload', '—', '—'],
            ['Signature', 'JPG / JPEG', '10–20 KB', 'About 6.0 × 2.0 cm (the same notice also says 4.0 × 2.0 cm in Annexure-IV)'],
          ],
          sources: [SRC.ssc],
          checkedOn: CHECKED,
        },
        {
          heading: 'UPSC (online application portal)',
          type: 'dataTable',
          content: 'From UPSC’s own technical FAQ for upsconline. UPSC also states it will not cancel a candidature over pixel size alone.',
          headers: ['Item', 'Format', 'Size', 'Dimensions'],
          rows: [
            ['Photograph', 'JPG / JPEG', '20–300 KB', '550 × 550 px to 1000 × 1000 px'],
            ['Signature', 'JPG / JPEG', '20–300 KB', '350 × 350 px to 500 × 500 px'],
            ['Photo ID / PwBD certificate', 'PDF', '50–300 KB', 'Not stated'],
          ],
          sources: [SRC.upsc],
          checkedOn: CHECKED,
        },
        {
          heading: 'IBPS (PO and Clerk)',
          type: 'dataTable',
          content:
            'The PO/MT-XVI and Clerk CSA-XVI notifications carry identical specs. IBPS also asks you to scan at 200 DPI or more, in colour, and captures a live photo.',
          headers: ['Item', 'Format', 'Size', 'Dimensions'],
          rows: [
            ['Photograph', 'JPG / JPEG', '20–50 KB', '4.5 × 3.5 cm (200 × 230 px preferred)'],
            ['Signature', 'JPG / JPEG', '10–20 KB', '140 × 60 px preferred'],
            ['Left thumb impression', 'JPG / JPEG', '20–50 KB', '3 × 3 cm (240 × 240 px at 200 DPI)'],
            ['Handwritten declaration', 'JPG / JPEG', '50–100 KB', '10 × 5 cm (800 × 400 px at 200 DPI)'],
            ['10th certificate', 'PDF (A4)', 'Up to 500 KB', 'Not stated'],
          ],
          sources: [SRC.ibps],
          checkedOn: CHECKED,
        },
        {
          heading: 'NEET (UG) 2026',
          type: 'dataTable',
          content:
            'NTA also captures a live photo. The bulletin gives two different ranges for finger and thumb impressions (10–200 KB on p. 16, 50–300 KB on p. 17) — a file between 50 and 200 KB satisfies both.',
          headers: ['Item', 'Format', 'Size', 'Dimensions'],
          rows: [
            ['Passport photo', 'JPG / JPEG', '10–200 KB', 'Not stated (face ~80%, white background)'],
            ['Signature', 'JPG / JPEG', '10–100 KB', 'Not stated'],
            ['Finger and thumb impressions', 'JPG / JPEG', '10–200 KB or 50–300 KB (see above)', 'Not stated'],
            ['Category, Class X, PwD and other certificates', 'PDF', '50–300 KB', 'Not stated'],
          ],
          sources: [SRC.neet],
          checkedOn: CHECKED,
        },
        {
          heading: 'JEE (Main) 2027',
          type: 'dataTable',
          content: 'The bulletin gives file sizes but no pixel dimensions; the cm sizes you may see quoted elsewhere are not in the official bulletin.',
          headers: ['Item', 'Format', 'Size', 'Dimensions'],
          rows: [
            ['Passport photo', 'JPG / JPEG', '10–200 KB', 'Not stated (colour, face ~80% with ears visible, white background)'],
            ['Signature', 'JPG / JPEG', '10–100 KB', 'Not stated'],
            ['Class 10 certificate / marksheet', 'PDF', '50–300 KB', 'Not stated'],
            ['Disability / UDID and other certificates', 'PDF', '50–300 KB', 'Not stated'],
          ],
          sources: [SRC.jee],
          checkedOn: CHECKED,
        },
        {
          heading: 'Getting your certificate PDF into range',
          type: 'steps',
          items: [
            'Photograph or scan the certificate in good light, flat, with nothing else in the frame.',
            'If you have photos, combine them into one PDF with JPG to PDF.',
            'Compress the PDF: High usually lands a one-page scan under 300 KB; use Extreme for tighter limits.',
            'Check the size is above the minimum too — NTA and UPSC reject PDFs under 50 KB.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'compress',
          text: 'Bring your certificate PDF under 300 KB with Compress PDF',
        },
        {
          heading: 'If the portal wants a JPG of a page',
          type: 'paragraph',
          content:
            'Some forms ask for a document as an image instead of a PDF. Convert the page with PDF to JPG, then check the file size against the limit before uploading.',
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-jpg',
          text: 'Turn a PDF page into a JPG with PDF to JPG',
        },
        {
          type: 'mistakes',
          items: [
            'Using a size limit from a coaching site or an old year — the official numbers often differ (for example, NTA signatures are 10–100 KB, not 4–30 KB).',
            'Forgetting the minimum size: a 30 KB PDF fails a 50–300 KB rule just like a 400 KB one.',
            'Uploading a selfie with a busy background where a white background is required.',
            'Renaming a PNG to .jpg — the portal checks the real file type.',
          ],
        },
        {
          type: 'checklist',
          items: [
            'I opened the notice I am applying under and matched each limit',
            'Each file is between the minimum and maximum size',
            'Photo and signature are JPG/JPEG; certificates are PDF',
            'Photo has a plain light background and the face is clearly visible',
            'Signature is in dark ink and fully inside the frame',
          ],
        },
      ],
      faqs: [
        {
          q: 'Does SSC still ask me to upload a photograph?',
          a: 'Not under the CGL 2026 notice. The photograph is captured live through a webcam or phone while you fill the form; you still upload a signature of 10–20 KB.',
        },
        {
          q: 'What is the UPSC photo size limit?',
          a: 'UPSC’s technical FAQ says 20–300 KB in JPG, with 550 × 550 to 1000 × 1000 pixels. The signature is also 20–300 KB, at 350 × 350 to 500 × 500 pixels.',
        },
        {
          q: 'My NEET bulletin shows two sizes for thumb impressions. Which one is right?',
          a: 'The 2026 bulletin says 10–200 KB on page 16 and 50–300 KB on page 17. Keeping the file between 50 and 200 KB satisfies both.',
        },
        {
          q: 'Can Fyredocs resize my photo to an exact KB range?',
          a: 'Fyredocs currently compresses and converts PDFs and images to PDF or JPG. Use Compress PDF for certificates and PDF to JPG when a page must be an image, then check the size before uploading.',
        },
      ],
    },
    hi: {
      title: 'परीक्षा फ़ॉर्म अपलोड साइज़: SSC, UPSC, IBPS, NEET और JEE Main (फ़ोटो, सिग्नेचर, डॉक्यूमेंट)',
      metaTitle: 'परीक्षा फ़ॉर्म अपलोड साइज़: SSC, UPSC, IBPS, NEET',
      description:
        'SSC, UPSC, IBPS, NEET और JEE Main फ़ॉर्म में फ़ोटो, सिग्नेचर और डॉक्यूमेंट की साइज़ लिमिट — आधिकारिक नोटिस से, लिंक और जाँच की तारीख़ के साथ।',
      quickAnswer:
        'सिग्नेचर हर जगह छोटा होता है (SSC और IBPS में 10–20 KB, NTA परीक्षाओं में 100 KB तक)। फ़ोटो 20–50 KB (IBPS) से 10–200 KB (NEET, JEE) और 20–300 KB (UPSC) तक है। सर्टिफ़िकेट NTA और UPSC में 50–300 KB की PDF और IBPS में 500 KB तक। SSC अब फ़ोटो अपलोड नहीं लेता — लाइव फ़ोटो खींचता है।',
      sections: [
        {
          heading: 'पहले ये पढ़ें',
          type: 'paragraph',
          content:
            'नीचे का हर आँकड़ा उस परीक्षा के आधिकारिक नोटिस या FAQ से लिया गया है, जिसका लिंक टेबल के नीचे है, और 26 नवंबर 2026 को जाँचा गया। हर नए नोटिफ़िकेशन में ये नियम दोहराए जाते हैं और कभी-कभी बदल भी जाते हैं, इसलिए इस पेज को चीट-शीट की तरह इस्तेमाल करें और जिस नोटिस के तहत अप्लाई कर रहे हैं, उससे मिलान ज़रूर करें। जहाँ आधिकारिक डॉक्यूमेंट में ही दो अलग बातें लिखी हैं, वहाँ हमने दोनों बताई हैं।',
        },
        {
          heading: 'SSC (CGL 2026)',
          type: 'dataTable',
          content: 'SSC अब फ़ोटो अपलोड नहीं माँगता: फ़ॉर्म भरते समय वेबकैम या फ़ोन से लाइव फ़ोटो ली जाती है।',
          headers: ['चीज़', 'फ़ॉर्मेट', 'साइज़', 'माप'],
          rows: [
            ['फ़ोटो', 'लाइव कैप्चर, अपलोड नहीं', '—', '—'],
            ['सिग्नेचर', 'JPG / JPEG', '10–20 KB', 'लगभग 6.0 × 2.0 cm (इसी नोटिस के Annexure-IV में 4.0 × 2.0 cm भी लिखा है)'],
          ],
          sources: [SRC.ssc],
          checkedOn: CHECKED,
        },
        {
          heading: 'UPSC (ऑनलाइन आवेदन पोर्टल)',
          type: 'dataTable',
          content: 'upsconline के UPSC के अपने टेक्निकल FAQ से। UPSC ये भी कहता है कि सिर्फ़ पिक्सल साइज़ की वजह से उम्मीदवारी रद्द नहीं होगी।',
          headers: ['चीज़', 'फ़ॉर्मेट', 'साइज़', 'माप'],
          rows: [
            ['फ़ोटो', 'JPG / JPEG', '20–300 KB', '550 × 550 px से 1000 × 1000 px'],
            ['सिग्नेचर', 'JPG / JPEG', '20–300 KB', '350 × 350 px से 500 × 500 px'],
            ['फ़ोटो ID / PwBD सर्टिफ़िकेट', 'PDF', '50–300 KB', 'नहीं बताया'],
          ],
          sources: [SRC.upsc],
          checkedOn: CHECKED,
        },
        {
          heading: 'IBPS (PO और Clerk)',
          type: 'dataTable',
          content:
            'PO/MT-XVI और Clerk CSA-XVI नोटिफ़िकेशन में नियम एक जैसे हैं। IBPS 200 DPI या ज़्यादा पर रंगीन स्कैन माँगता है और लाइव फ़ोटो भी लेता है।',
          headers: ['चीज़', 'फ़ॉर्मेट', 'साइज़', 'माप'],
          rows: [
            ['फ़ोटो', 'JPG / JPEG', '20–50 KB', '4.5 × 3.5 cm (200 × 230 px बेहतर)'],
            ['सिग्नेचर', 'JPG / JPEG', '10–20 KB', '140 × 60 px बेहतर'],
            ['बाएँ अंगूठे का निशान', 'JPG / JPEG', '20–50 KB', '3 × 3 cm (200 DPI पर 240 × 240 px)'],
            ['हाथ से लिखा घोषणा-पत्र', 'JPG / JPEG', '50–100 KB', '10 × 5 cm (200 DPI पर 800 × 400 px)'],
            ['10वीं का सर्टिफ़िकेट', 'PDF (A4)', '500 KB तक', 'नहीं बताया'],
          ],
          sources: [SRC.ibps],
          checkedOn: CHECKED,
        },
        {
          heading: 'NEET (UG) 2026',
          type: 'dataTable',
          content:
            'NTA लाइव फ़ोटो भी लेता है। बुलेटिन में उँगलियों और अंगूठे के निशान की दो अलग रेंज दी हैं (पेज 16 पर 10–200 KB, पेज 17 पर 50–300 KB) — 50 से 200 KB के बीच की फ़ाइल दोनों नियम पूरे करती है।',
          headers: ['चीज़', 'फ़ॉर्मेट', 'साइज़', 'माप'],
          rows: [
            ['पासपोर्ट फ़ोटो', 'JPG / JPEG', '10–200 KB', 'नहीं बताया (चेहरा ~80%, सफ़ेद बैकग्राउंड)'],
            ['सिग्नेचर', 'JPG / JPEG', '10–100 KB', 'नहीं बताया'],
            ['उँगलियों और अंगूठे के निशान', 'JPG / JPEG', '10–200 KB या 50–300 KB (ऊपर देखें)', 'नहीं बताया'],
            ['कैटेगरी, 10वीं, PwD और अन्य सर्टिफ़िकेट', 'PDF', '50–300 KB', 'नहीं बताया'],
          ],
          sources: [SRC.neet],
          checkedOn: CHECKED,
        },
        {
          heading: 'JEE (Main) 2027',
          type: 'dataTable',
          content: 'बुलेटिन में फ़ाइल साइज़ दी है, पिक्सल माप नहीं; कहीं और दिखने वाले cm माप आधिकारिक बुलेटिन में नहीं हैं।',
          headers: ['चीज़', 'फ़ॉर्मेट', 'साइज़', 'माप'],
          rows: [
            ['पासपोर्ट फ़ोटो', 'JPG / JPEG', '10–200 KB', 'नहीं बताया (रंगीन, चेहरा ~80% और कान दिखें, सफ़ेद बैकग्राउंड)'],
            ['सिग्नेचर', 'JPG / JPEG', '10–100 KB', 'नहीं बताया'],
            ['10वीं का सर्टिफ़िकेट / मार्कशीट', 'PDF', '50–300 KB', 'नहीं बताया'],
            ['दिव्यांगता / UDID और अन्य सर्टिफ़िकेट', 'PDF', '50–300 KB', 'नहीं बताया'],
          ],
          sources: [SRC.jee],
          checkedOn: CHECKED,
        },
        {
          heading: 'सर्टिफ़िकेट की PDF को सही साइज़ में लाएँ',
          type: 'steps',
          items: [
            'सर्टिफ़िकेट को अच्छी रोशनी में, सीधा रखकर, फ़्रेम में कुछ और लिए बिना फ़ोटो या स्कैन करें।',
            'अगर फ़ोटो हैं, तो JPG to PDF से एक PDF बनाएँ।',
            'PDF कंप्रेस करें: High से एक पेज का स्कैन आमतौर पर 300 KB से नीचे आ जाता है; कम लिमिट के लिए Extreme चुनें।',
            'न्यूनतम साइज़ भी देखें — NTA और UPSC 50 KB से छोटी PDF नहीं लेते।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'compress',
          text: 'Compress PDF से सर्टिफ़िकेट की PDF 300 KB से छोटी करें',
        },
        {
          heading: 'अगर पोर्टल पेज की JPG माँगे',
          type: 'paragraph',
          content:
            'कुछ फ़ॉर्म डॉक्यूमेंट को PDF की जगह इमेज के रूप में माँगते हैं। PDF to JPG से पेज को बदलें और अपलोड से पहले फ़ाइल साइज़ लिमिट से मिला लें।',
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-jpg',
          text: 'PDF to JPG से PDF पेज को JPG बनाएँ',
        },
        {
          type: 'mistakes',
          items: [
            'कोचिंग साइट या पुराने साल की लिमिट मान लेना — आधिकारिक आँकड़े अक्सर अलग होते हैं (जैसे NTA में सिग्नेचर 10–100 KB है, 4–30 KB नहीं)।',
            'न्यूनतम साइज़ भूल जाना: 50–300 KB के नियम में 30 KB की PDF भी उतनी ही फ़ेल होती है जितनी 400 KB की।',
            'जहाँ सफ़ेद बैकग्राउंड चाहिए, वहाँ भीड़-भाड़ वाले बैकग्राउंड की सेल्फ़ी डालना।',
            'PNG का नाम बदलकर .jpg करना — पोर्टल असली फ़ाइल टाइप जाँचता है।',
          ],
        },
        {
          type: 'checklist',
          items: [
            'मैंने जिस नोटिस के तहत अप्लाई कर रहा/रही हूँ, उसे खोलकर हर लिमिट मिलाई',
            'हर फ़ाइल न्यूनतम और अधिकतम साइज़ के बीच है',
            'फ़ोटो और सिग्नेचर JPG/JPEG हैं; सर्टिफ़िकेट PDF हैं',
            'फ़ोटो का बैकग्राउंड सादा और हल्का है, चेहरा साफ़ दिखता है',
            'सिग्नेचर गहरी स्याही में है और पूरा फ़्रेम के अंदर है',
          ],
        },
      ],
      faqs: [
        {
          q: 'क्या SSC अब भी फ़ोटो अपलोड करने को कहता है?',
          a: 'CGL 2026 नोटिस के तहत नहीं। फ़ॉर्म भरते समय वेबकैम या फ़ोन से लाइव फ़ोटो ली जाती है; 10–20 KB का सिग्नेचर अब भी अपलोड करना होता है।',
        },
        {
          q: 'UPSC में फ़ोटो की साइज़ लिमिट क्या है?',
          a: 'UPSC के टेक्निकल FAQ के अनुसार JPG में 20–300 KB, 550 × 550 से 1000 × 1000 पिक्सल। सिग्नेचर भी 20–300 KB, 350 × 350 से 500 × 500 पिक्सल।',
        },
        {
          q: 'NEET बुलेटिन में अंगूठे के निशान की दो साइज़ लिखी हैं। कौन-सी सही है?',
          a: '2026 के बुलेटिन में पेज 16 पर 10–200 KB और पेज 17 पर 50–300 KB लिखा है। फ़ाइल 50 से 200 KB के बीच रखें तो दोनों नियम पूरे हो जाते हैं।',
        },
        {
          q: 'क्या Fyredocs मेरी फ़ोटो को तय KB में बदल सकता है?',
          a: 'अभी Fyredocs PDF को कंप्रेस करता है और इमेज को PDF या JPG में बदलता है। सर्टिफ़िकेट के लिए Compress PDF और पेज को इमेज बनाने के लिए PDF to JPG इस्तेमाल करें, फिर अपलोड से पहले साइज़ जाँच लें।',
        },
      ],
    },
  },
};

export default post;
