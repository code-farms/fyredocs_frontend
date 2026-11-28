import type { BlogPost } from '../types';

const CHECKED = '2026-11-28';

const SRC = {
  msEdit: { label: 'Microsoft Support — Edit a PDF (in Word)', url: 'https://support.microsoft.com/en-us/office/edit-a-pdf-b2d1d729-6b79-499a-bcdb-233379c2f63a' },
  msAddPdf: { label: 'Microsoft Support — Add a PDF to your Office file', url: 'https://support.microsoft.com/en-us/office/add-a-pdf-to-your-office-file-74819342-8f00-4ab4-bcbe-0f3df15ab0dc' },
  gdocs: { label: 'Google Drive Help — Convert PDF and photo files to text', url: 'https://support.google.com/drive/answer/176692' },
  lo: { label: 'The Document Foundation — Why are PDFs opened in Draw?', url: 'https://wiki.documentfoundation.org/Faq/Draw/118/en' },
};

const post: BlogPost = {
  slug: 'convert-pdf-to-word-without-losing-formatting',
  category: 'how-to',
  publishedAt: '2026-11-28',
  updatedAt: '2026-11-28',
  readMinutes: 6,
  tools: ['pdf-to-word', 'ocr', 'pdf-to-text', 'unlock-pdf', 'word-to-pdf'],
  i18n: {
    en: {
      title: 'How to Convert PDF to Word (Free, No Sign-up) — and Why Formatting Sometimes Breaks',
      metaTitle: 'How to Convert PDF to Word Free (No Sign-up)',
      description:
        'Convert a PDF to an editable Word file in a minute, and know what to do when it is scanned, password-locked, in Hindi, or the tables come out messy.',
      quickAnswer:
        'If you can select and copy text in your PDF, upload it to PDF to Word and download an editable .docx — no sign-up. If it is password-locked, unlock it first. If it is a scan (a photo of paper), Word will only get a picture of the page; run OCR PDF and then PDF to Text to get the words, and paste them into Word.',
      sections: [
        {
          heading: 'First, find out which PDF you have',
          type: 'table',
          content: 'Open the PDF and try to select a sentence with your finger or mouse.',
          tableData: {
            headers: ['What you see', 'What it means', 'What to do'],
            rows: [
              ['Text highlights word by word', 'A text PDF (made from Word, a website or an app)', 'Convert directly with PDF to Word'],
              ['The whole page highlights like one picture, or nothing highlights', 'A scanned or photographed PDF — it has no real text', 'OCR PDF → PDF to Text, then paste into Word'],
              ['It asks for a password when you open it', 'A locked PDF (common for bank statements)', 'Unlock PDF with the password, then convert'],
            ],
          },
        },
        {
          heading: 'Convert a text PDF to Word',
          type: 'steps',
          items: [
            'Open PDF to Word and upload your PDF (guests can add up to 5 files, 20 MB each).',
            'Wait a few seconds while it converts.',
            'Download the .docx file. It opens in Microsoft Word, Google Docs, WPS Office and LibreOffice.',
            'Scroll through once and fix anything that moved — especially tables, headers and footers.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-word',
          text: 'Convert your PDF to Word now — free, no sign-up',
        },
        {
          heading: 'Why the formatting sometimes breaks',
          type: 'paragraph',
          content:
            'A PDF does not store paragraphs. It stores letters and their exact positions on the page, like a printed sheet. A converter has to guess where a paragraph starts, which lines belong to a table and which text is a header. Simple one-column documents come out almost perfect; brochures, multi-column newspapers and forms with boxes are where the guesses go wrong.',
        },
        {
          heading: 'Other free ways, compared',
          type: 'dataTable',
          content: 'What each option’s own help page says about converting PDFs.',
          headers: ['Option', 'What the source says'],
          rows: [
            ['Microsoft Word (open the PDF in Word)', 'Word converts the PDF into an editable document while keeping as much of the layout as it can. The result may not match the original page for page — lines and pages can break in different places. Works best with documents that are mostly text.'],
            ['Google Docs (Open with → Google Docs)', 'Uses OCR, so it can read scans. The file should be 2 MB or smaller; bold, italics and font size are likely kept, but lists, tables, columns, footnotes and endnotes are not likely to be detected.'],
            ['LibreOffice', 'PDFs open in Draw, not Writer, because LibreOffice treats them as graphics; text usually arrives as separate pieces rather than flowing paragraphs.'],
          ],
          sources: [SRC.msEdit, SRC.msAddPdf, SRC.gdocs, SRC.lo],
          checkedOn: CHECKED,
        },
        {
          heading: 'Scanned PDF? Do this instead',
          type: 'steps',
          content:
            'A scan is a photo of text. Any PDF to Word tool that does not read the photo will give you a Word file with the page as an image you cannot edit.',
          items: [
            'Run the file through OCR PDF and pick the language: English, Hindi, or English + Hindi.',
            'Put the OCR’d PDF through PDF to Text to get the words as plain text.',
            'Paste the text into Word or Google Docs and format it there.',
            'Short document under 2 MB with simple layout? Google Docs’ Open with → Google Docs also works.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'ocr',
          text: 'Scanned PDF? Run OCR first (English and Hindi)',
        },
        {
          heading: 'Hindi and other Indian-language PDFs',
          type: 'tip',
          content:
            'PDFs typed in a Unicode Hindi font convert into editable Hindi text in Word. Check the spacing between words and the layout afterwards — Devanagari text can come out with uneven spacing or split into table cells. If the text you copy from the PDF looks like random English letters, the PDF uses an old non-Unicode font (such as Kruti Dev). Converters copy those letters as they are, so the Word file will look just as garbled — ask the sender for the original Word file, or retype it.',
        },
        {
          heading: 'Fix the usual problems fast',
          type: 'list',
          items: [
            'Table lines missing or cells merged: in Word, select the table and use Table Design → Borders, then merge or split cells.',
            'Text in boxes you cannot move: it came in as positioned text frames — copy the text out and paste it into a normal paragraph.',
            'Different font: install the original font or pick a close one and apply it to the whole document (Ctrl+A).',
            'Header or footer repeated in the body: delete the extra copies and put it once in Insert → Header/Footer.',
          ],
        },
        {
          type: 'mistakes',
          items: [
            'Converting a scanned PDF and expecting editable text.',
            'Uploading a locked bank statement without unlocking it first.',
            'Sending the converted Word file without checking tables and numbers line by line.',
            'Editing in Word and forgetting to convert it back to PDF before submitting a form that asks for PDF.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'word-to-pdf',
          text: 'Done editing? Turn the Word file back into a PDF',
        },
      ],
      faqs: [
        {
          q: 'Is PDF to Word on Fyredocs really free without sign-up?',
          a: 'Yes. Guests can convert up to 5 PDFs at a time (20 MB each) with no account and no watermark. Uploaded files are deleted automatically after 30 minutes.',
        },
        {
          q: 'Can I convert a scanned PDF to editable Word?',
          a: 'Not directly — a scan has no text, so Word gets the page as a picture. Run OCR PDF, then PDF to Text, and paste the text into Word.',
        },
        {
          q: 'Will Hindi text stay correct?',
          a: 'Hindi typed in a Unicode font converts to editable Hindi. Check word spacing and layout after converting. PDFs made with old non-Unicode fonts (such as Kruti Dev) come out garbled in any converter — ask for the original file instead.',
        },
        {
          q: 'Why does my converted file have different page breaks?',
          a: 'A PDF stores fixed positions, while Word flows text across pages. Even Microsoft notes that converted documents may not match the original page for page.',
        },
      ],
    },
    hi: {
      title: 'PDF को Word में कैसे बदलें (फ़्री, बिना साइनअप) — और फ़ॉर्मैटिंग कभी-कभी क्यों बिगड़ती है',
      metaTitle: 'PDF को Word में फ़्री कैसे बदलें (बिना साइनअप)',
      description:
        'एक मिनट में PDF को एडिट होने वाली Word फ़ाइल बनाएँ, और जानें कि स्कैन की हुई, पासवर्ड वाली, हिंदी या बिगड़ी टेबल वाली PDF के साथ क्या करें।',
      quickAnswer:
        'अगर PDF में टेक्स्ट सेलेक्ट और कॉपी हो जाता है, तो उसे PDF to Word पर अपलोड करें और एडिट होने वाली .docx डाउनलोड करें — बिना साइनअप। पासवर्ड लगा है तो पहले Unlock करें। अगर ये स्कैन (काग़ज़ की फ़ोटो) है, तो Word को सिर्फ़ पेज की तस्वीर मिलेगी; शब्द पाने के लिए OCR PDF और फिर PDF to Text चलाएँ और टेक्स्ट Word में पेस्ट करें।',
      sections: [
        {
          heading: 'पहले पता करें आपकी PDF कैसी है',
          type: 'table',
          content: 'PDF खोलें और उँगली या माउस से कोई वाक्य सेलेक्ट करके देखें।',
          tableData: {
            headers: ['क्या दिखता है', 'मतलब', 'क्या करें'],
            rows: [
              ['टेक्स्ट शब्द-दर-शब्द हाइलाइट होता है', 'टेक्स्ट वाली PDF (Word, वेबसाइट या ऐप से बनी)', 'सीधे PDF to Word से बदलें'],
              ['पूरा पेज एक तस्वीर की तरह हाइलाइट होता है, या कुछ नहीं होता', 'स्कैन या फ़ोटो वाली PDF — इसमें असली टेक्स्ट नहीं है', 'OCR PDF → PDF to Text, फिर Word में पेस्ट करें'],
              ['खोलते ही पासवर्ड माँगती है', 'लॉक PDF (बैंक स्टेटमेंट में आम)', 'पासवर्ड डालकर Unlock PDF करें, फिर बदलें'],
            ],
          },
        },
        {
          heading: 'टेक्स्ट वाली PDF को Word में बदलें',
          type: 'steps',
          items: [
            'PDF to Word खोलें और PDF अपलोड करें (गेस्ट 5 फ़ाइलें तक, हर एक 20 MB तक, डाल सकते हैं)।',
            'कुछ सेकंड रुकें, फ़ाइल बदल रही है।',
            '.docx फ़ाइल डाउनलोड करें। ये Microsoft Word, Google Docs, WPS Office और LibreOffice में खुलती है।',
            'एक बार पूरी फ़ाइल देखें और जो खिसका है उसे ठीक करें — ख़ासकर टेबल, हेडर और फ़ुटर।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-word',
          text: 'अभी PDF को Word में बदलें — फ़्री, बिना साइनअप',
        },
        {
          heading: 'फ़ॉर्मैटिंग कभी-कभी क्यों बिगड़ती है',
          type: 'paragraph',
          content:
            'PDF में पैराग्राफ़ नहीं होते। उसमें अक्षर और पेज पर उनकी सटीक जगह लिखी होती है, जैसे छपा हुआ काग़ज़। कन्वर्टर को अंदाज़ा लगाना पड़ता है कि पैराग्राफ़ कहाँ शुरू होता है, कौन-सी लाइनें टेबल हैं और कौन-सा टेक्स्ट हेडर है। सीधे एक कॉलम वाले डॉक्यूमेंट लगभग परफ़ेक्ट आते हैं; ब्रोशर, कई कॉलम वाले अख़बार और डिब्बों वाले फ़ॉर्म में अंदाज़े ग़लत होते हैं।',
        },
        {
          heading: 'दूसरे फ़्री तरीके, तुलना',
          type: 'dataTable',
          content: 'हर विकल्प का अपना हेल्प पेज PDF बदलने के बारे में क्या कहता है।',
          headers: ['विकल्प', 'स्रोत क्या कहता है'],
          rows: [
            ['Microsoft Word (PDF को Word में खोलें)', 'Word PDF को एडिट होने वाले डॉक्यूमेंट में बदलता है और जितना हो सके लेआउट बचाता है। नतीजा पेज-दर-पेज मूल जैसा न हो — लाइनें और पेज अलग जगह टूट सकते हैं। ज़्यादातर टेक्स्ट वाले डॉक्यूमेंट के साथ सबसे अच्छा काम करता है।'],
            ['Google Docs (Open with → Google Docs)', 'OCR इस्तेमाल करता है, इसलिए स्कैन पढ़ सकता है। फ़ाइल 2 MB या उससे छोटी होनी चाहिए; बोल्ड, इटैलिक और फ़ॉन्ट साइज़ आमतौर पर बचते हैं, पर लिस्ट, टेबल, कॉलम, फ़ुटनोट और एंडनोट पहचाने जाने की संभावना कम है।'],
            ['LibreOffice', 'PDF Writer में नहीं, Draw में खुलती है, क्योंकि LibreOffice उसे ग्राफ़िक मानता है; टेक्स्ट आमतौर पर बहते पैराग्राफ़ की जगह अलग-अलग टुकड़ों में आता है।'],
          ],
          sources: [SRC.msEdit, SRC.msAddPdf, SRC.gdocs, SRC.lo],
          checkedOn: CHECKED,
        },
        {
          heading: 'स्कैन की हुई PDF? ये करें',
          type: 'steps',
          content:
            'स्कैन टेक्स्ट की फ़ोटो होता है। जो PDF to Word टूल फ़ोटो नहीं पढ़ता, वो आपको ऐसी Word फ़ाइल देगा जिसमें पेज एक तस्वीर है जिसे एडिट नहीं कर सकते।',
          items: [
            'फ़ाइल को OCR PDF से चलाएँ और भाषा चुनें: English, Hindi या English + Hindi।',
            'OCR हुई PDF को PDF to Text से चलाएँ, ताकि शब्द सादे टेक्स्ट में मिलें।',
            'टेक्स्ट को Word या Google Docs में पेस्ट करें और वहीं फ़ॉर्मैट करें।',
            '2 MB से छोटा, सीधे लेआउट वाला डॉक्यूमेंट है? Google Docs का Open with → Google Docs भी काम करता है।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'ocr',
          text: 'स्कैन की हुई PDF? पहले OCR करें (English और Hindi)',
        },
        {
          heading: 'हिंदी और दूसरी भारतीय भाषाओं की PDF',
          type: 'tip',
          content:
            'Unicode हिंदी फ़ॉन्ट में टाइप की गई PDF Word में एडिट होने वाले हिंदी टेक्स्ट में बदलती है। बाद में शब्दों के बीच की जगह और लेआउट ज़रूर जाँचें — देवनागरी टेक्स्ट में कभी जगह ऊपर-नीचे हो जाती है या टेक्स्ट टेबल के ख़ानों में बँट जाता है। अगर PDF से कॉपी किया टेक्स्ट अजीब अंग्रेज़ी अक्षरों जैसा दिखे, तो PDF पुराने नॉन-Unicode फ़ॉन्ट (जैसे Kruti Dev) में है। कन्वर्टर वही अक्षर जैसे-के-तैसे उठाते हैं, इसलिए Word फ़ाइल भी वैसी ही बिगड़ी दिखेगी — भेजने वाले से मूल Word फ़ाइल माँगें या दोबारा टाइप करें।',
        },
        {
          heading: 'आम दिक़्क़तें जल्दी ठीक करें',
          type: 'list',
          items: [
            'टेबल की लाइनें ग़ायब या ख़ाने जुड़ गए: Word में टेबल सेलेक्ट करें, Table Design → Borders लगाएँ, फिर ख़ाने merge या split करें।',
            'टेक्स्ट ऐसे बॉक्स में है जो हिलता नहीं: वो जगह-तय टेक्स्ट फ़्रेम में आया है — टेक्स्ट कॉपी करके सामान्य पैराग्राफ़ में पेस्ट करें।',
            'फ़ॉन्ट अलग है: मूल फ़ॉन्ट इंस्टॉल करें या मिलता-जुलता चुनकर पूरे डॉक्यूमेंट पर लगाएँ (Ctrl+A)।',
            'हेडर या फ़ुटर बीच में बार-बार आ रहा है: फ़ालतू कॉपी हटाएँ और उसे एक बार Insert → Header/Footer में डालें।',
          ],
        },
        {
          type: 'mistakes',
          items: [
            'स्कैन की हुई PDF बदलकर एडिट होने वाले टेक्स्ट की उम्मीद करना।',
            'लॉक बैंक स्टेटमेंट बिना Unlock किए अपलोड करना।',
            'बदली हुई Word फ़ाइल को बिना टेबल और नंबर लाइन-दर-लाइन जाँचे भेज देना।',
            'Word में एडिट करके PDF माँगने वाले फ़ॉर्म में जमा करने से पहले वापस PDF बनाना भूल जाना।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'word-to-pdf',
          text: 'एडिट हो गया? Word फ़ाइल को वापस PDF बनाएँ',
        },
      ],
      faqs: [
        {
          q: 'क्या Fyredocs पर PDF to Word सच में बिना साइनअप फ़्री है?',
          a: 'हाँ। गेस्ट बिना अकाउंट और बिना वॉटरमार्क एक बार में 5 PDF (हर एक 20 MB तक) बदल सकते हैं। अपलोड की गई फ़ाइलें 30 मिनट बाद अपने-आप डिलीट हो जाती हैं।',
        },
        {
          q: 'क्या स्कैन की हुई PDF को एडिट होने वाली Word फ़ाइल बना सकते हैं?',
          a: 'सीधे नहीं — स्कैन में टेक्स्ट नहीं होता, इसलिए Word को पेज की तस्वीर मिलती है। OCR PDF, फिर PDF to Text चलाएँ और टेक्स्ट Word में पेस्ट करें।',
        },
        {
          q: 'क्या हिंदी टेक्स्ट सही रहेगा?',
          a: 'Unicode फ़ॉन्ट में टाइप की गई हिंदी एडिट होने वाली हिंदी में बदलती है। बदलने के बाद शब्दों की जगह और लेआउट जाँचें। पुराने नॉन-Unicode फ़ॉन्ट (जैसे Kruti Dev) वाली PDF किसी भी कन्वर्टर में बिगड़ी आती है — उसकी मूल फ़ाइल माँगें।',
        },
        {
          q: 'बदली हुई फ़ाइल में पेज अलग जगह क्यों टूटते हैं?',
          a: 'PDF में जगहें तय होती हैं, जबकि Word टेक्स्ट को पेजों में बहाता है। Microsoft भी कहता है कि बदले गए डॉक्यूमेंट पेज-दर-पेज मूल जैसे न हों।',
        },
      ],
    },
  },
};

export default post;
