import type { BlogPost } from '../types';

const CHECKED = '2026-11-26';

const SRC = {
  itAct: { label: 'Information Technology Act, 2000 (India Code)', url: 'https://www.indiacode.nic.in/bitstream/123456789/13116/1/it_act_2000_updated.pdf' },
  esignGsr: { label: 'G.S.R. 61(E), 27 Jan 2015 (Aadhaar e-KYC eSign)', url: 'https://cca.gov.in/sites/files/pdf/ACT/GSR61-62.pdf' },
  firstSchedule: { label: 'S.O. 4720(E), 26 Sep 2022 (First Schedule amended)', url: 'https://cca.gov.in/sites/files/pdf/ACT/SO4720.pdf' },
  cca: { label: 'CCA eSign service FAQ', url: 'https://cca.gov.in/eSign_service_faq.html' },
  dsc: { label: 'CCA — Digital Signature Certificates', url: 'https://cca.gov.in/digital_signature.html' },
  itr: { label: 'Income Tax e-filing DSC FAQ', url: 'https://www.incometax.gov.in/iec/foportal/help/how-to-register-e-filing-dsc-faq' },
  mca: { label: 'MCA — Digital Signature Certificate', url: 'https://www.mca.gov.in/mca/html/mcav2_en/home/helpandfaq/dsc/digitalsignaturecertificate/digitalsignaturecertificate.html' },
};

const post: BlogPost = {
  slug: 'sign-pdf-without-printing',
  category: 'how-to',
  publishedAt: '2026-11-23',
  updatedAt: '2026-11-26',
  readMinutes: 6,
  tools: ['sign-pdf', 'password-protect', 'edit-pdf', 'merge'],
  i18n: {
    en: {
      title: 'Sign a PDF Without Printing: When a Drawn Signature Is Fine, and When You Need eSign or DSC',
      metaTitle: 'Sign a PDF Without Printing: eSign vs DSC',
      description:
        'Sign forms and letters on your phone without printing or scanning — and know which documents need Aadhaar eSign or a Digital Signature Certificate instead.',
      quickAnswer:
        'For everyday paperwork — internship letters, rent receipts, forms where the other side just wants your signature on the page — draw your signature with Sign PDF and place it. When a law or the receiver requires a legally recognised electronic signature (company filings, GST, some tax returns, e-tenders), use Aadhaar eSign or a Digital Signature Certificate instead. Wills, trusts and most powers of attorney cannot be signed electronically at all.',
      sections: [
        {
          heading: 'Three kinds of "signing a PDF"',
          type: 'table',
          tableData: {
            headers: ['Type', 'What it is', 'Typical use'],
            rows: [
              ['Signature image', 'A picture of your handwritten signature placed on the page (what Sign PDF does)', 'Everyday letters and forms where the receiver accepts it'],
              ['Aadhaar eSign', 'An online electronic signature: after e-KYC, a one-time key signs the document', 'Agreements and applications on services that offer eSign'],
              ['Digital Signature Certificate (DSC)', 'A certificate from a licensed Certifying Authority, usually on a USB token', 'Company (MCA) filings, GST and income-tax filings for companies, e-tenders'],
            ],
          },
        },
        {
          heading: 'What Indian law actually recognises',
          type: 'dataTable',
          content:
            'Plain-language summary of the IT Act, 2000 and the official notifications under it. This is general information, not legal advice.',
          headers: ['Point', 'What the source says'],
          rows: [
            ['Electronic signature', 'The Act recognises an "electronic signature" made with a technique listed in its Second Schedule; a digital signature is one kind of electronic signature (Sections 2(1)(ta), 3, 3A).'],
            ['Where a law needs a signature', 'An electronic signature affixed in the prescribed manner satisfies a legal signature requirement (Section 5).'],
            ['Aadhaar eSign', 'Aadhaar e-KYC based e-authentication was added to the Second Schedule in 2015; eSign is offered only through licensed Certifying Authorities acting as eSign Service Providers.'],
            ['DSC', 'Digital Signature Certificates are issued by Certifying Authorities licensed by the Controller of Certifying Authorities (CCA).'],
            ['Excluded documents', 'Still outside the Act: negotiable instruments other than cheques, most powers of attorney, trusts, and wills. Contracts for sale of immovable property were removed from this list in 2022.'],
            ['Contracts made online', 'A contract is not unenforceable only because it was formed electronically (Section 10A).'],
          ],
          sources: [SRC.itAct, SRC.esignGsr, SRC.cca, SRC.dsc, SRC.firstSchedule],
          checkedOn: CHECKED,
        },
        {
          heading: 'So is a drawn signature on a PDF valid?',
          type: 'paragraph',
          content:
            'A pasted signature image is not one of the techniques the Act lists as an "electronic signature", so it does not automatically satisfy a legal requirement for a signature. In practice it is widely accepted for everyday documents when the other side agrees to it — the proof that you signed comes from context such as the email you sent it from. When the receiver asks for eSign or a DSC, or the stakes are high, use those instead. If in doubt, ask the person or office receiving the document what they accept.',
        },
        {
          heading: 'Where a DSC is required',
          type: 'dataTable',
          headers: ['Where', 'What the official page says'],
          rows: [
            ['Income-tax returns', 'Companies must verify returns with a DSC (EVC is not available to them); the FAQ also covers others who must use a DSC.'],
            ['MCA e-filing', 'Forms are signed with a Class 2 or Class 3 DSC from a licensed Certifying Authority.'],
          ],
          sources: [SRC.itr, SRC.mca],
          checkedOn: CHECKED,
        },
        {
          heading: 'Sign a PDF in a minute (signature image)',
          type: 'steps',
          items: [
            'Open Sign PDF and upload the document.',
            'Draw your signature with your finger or mouse, or upload a photo of it on white paper.',
            'Drag it to the signature line, resize it, and place it on every page that needs it.',
            'Download the signed PDF and check it before sending.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'sign-pdf',
          text: 'Sign your PDF now — draw or upload your signature',
        },
        {
          heading: 'Make it harder to misuse',
          type: 'list',
          items: [
            'Send the signed PDF only to the person who needs it, ideally from your usual email.',
            'Add a password with Protect PDF before emailing anything sensitive, and share the password separately.',
            'Add the date and a short note near your signature with Edit PDF (for example "Signed for internship application only").',
            'Never post a document carrying your signature publicly.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'password-protect',
          text: 'Lock the signed PDF with a password before sharing',
        },
        {
          type: 'mistakes',
          items: [
            'Using a drawn signature where the receiver explicitly asked for Aadhaar eSign or a DSC.',
            'Signing a will, trust deed or power of attorney electronically — these are excluded from the IT Act.',
            'Keeping a high-resolution signature image in a shared folder where anyone can reuse it.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Is a signature drawn on a PDF legally valid in India?',
          a: 'It is not one of the electronic signature techniques the IT Act lists, so it does not automatically meet a legal signature requirement. It is commonly accepted for everyday documents when both sides agree; for anything that legally requires a signature, use Aadhaar eSign or a DSC.',
        },
        {
          q: 'What is the difference between eSign and a DSC?',
          a: 'Aadhaar eSign is an online, one-time electronic signature created after e-KYC. A DSC is a certificate from a licensed Certifying Authority that you keep (usually on a USB token) and reuse for filings.',
        },
        {
          q: 'Can I sign a rent or sale agreement electronically?',
          a: 'Contracts for sale of immovable property were removed from the IT Act’s exclusion list in 2022, but stamp duty and registration rules still apply. Check with the registrar or a lawyer before relying on an electronic signature for property documents.',
        },
        {
          q: 'Does Fyredocs create Aadhaar eSign or DSC signatures?',
          a: 'No. Sign PDF places an image of your signature on the page. For eSign or DSC, use a licensed eSign service or Certifying Authority.',
        },
      ],
    },
    hi: {
      title: 'बिना प्रिंट किए PDF साइन करें: कब हाथ का सिग्नेचर काफ़ी है और कब eSign या DSC चाहिए',
      metaTitle: 'बिना प्रिंट PDF साइन करें: eSign बनाम DSC',
      description:
        'बिना प्रिंट या स्कैन किए फ़ोन पर फ़ॉर्म और लेटर साइन करें — और जानें कि किन डॉक्यूमेंट के लिए Aadhaar eSign या डिजिटल सिग्नेचर सर्टिफ़िकेट चाहिए।',
      quickAnswer:
        'रोज़ के काग़ज़ों के लिए — इंटर्नशिप लेटर, किराया रसीद, ऐसे फ़ॉर्म जहाँ सामने वाला बस पेज पर सिग्नेचर चाहता है — Sign PDF से सिग्नेचर बनाकर लगा दें। जहाँ क़ानून या लेने वाला क़ानूनी मान्यता वाला इलेक्ट्रॉनिक सिग्नेचर माँगे (कंपनी फ़ाइलिंग, GST, कुछ टैक्स रिटर्न, ई-टेंडर), वहाँ Aadhaar eSign या डिजिटल सिग्नेचर सर्टिफ़िकेट इस्तेमाल करें। वसीयत, ट्रस्ट और ज़्यादातर पावर ऑफ़ अटॉर्नी इलेक्ट्रॉनिक रूप से साइन ही नहीं हो सकते।',
      sections: [
        {
          heading: '"PDF साइन करना" के तीन तरीके',
          type: 'table',
          tableData: {
            headers: ['तरीका', 'क्या है', 'आम इस्तेमाल'],
            rows: [
              ['सिग्नेचर इमेज', 'आपके हाथ के सिग्नेचर की तस्वीर जो पेज पर लगाई जाती है (Sign PDF यही करता है)', 'रोज़ के लेटर और फ़ॉर्म जहाँ लेने वाला इसे मानता है'],
              ['Aadhaar eSign', 'ऑनलाइन इलेक्ट्रॉनिक सिग्नेचर: e-KYC के बाद एक बार की key से डॉक्यूमेंट साइन होता है', 'eSign देने वाली सेवाओं पर एग्रीमेंट और आवेदन'],
              ['डिजिटल सिग्नेचर सर्टिफ़िकेट (DSC)', 'लाइसेंस वाली Certifying Authority का सर्टिफ़िकेट, आमतौर पर USB टोकन पर', 'कंपनी (MCA) फ़ाइलिंग, कंपनियों के GST और इनकम-टैक्स फ़ाइलिंग, ई-टेंडर'],
            ],
          },
        },
        {
          heading: 'भारतीय क़ानून असल में क्या मानता है',
          type: 'dataTable',
          content:
            'IT Act, 2000 और उसके तहत जारी आधिकारिक नोटिफ़िकेशन का आसान सार। ये सामान्य जानकारी है, क़ानूनी सलाह नहीं।',
          headers: ['बात', 'स्रोत क्या कहता है'],
          rows: [
            ['इलेक्ट्रॉनिक सिग्नेचर', 'Act उस "इलेक्ट्रॉनिक सिग्नेचर" को मानता है जो उसकी दूसरी अनुसूची (Second Schedule) में दी गई तकनीक से बना हो; डिजिटल सिग्नेचर इलेक्ट्रॉनिक सिग्नेचर का एक प्रकार है (धारा 2(1)(ta), 3, 3A)।'],
            ['जहाँ क़ानून सिग्नेचर माँगे', 'तय तरीके से लगाया गया इलेक्ट्रॉनिक सिग्नेचर क़ानूनी सिग्नेचर की शर्त पूरी करता है (धारा 5)।'],
            ['Aadhaar eSign', 'Aadhaar e-KYC आधारित ई-ऑथेंटिकेशन 2015 में दूसरी अनुसूची में जोड़ा गया; eSign सिर्फ़ लाइसेंस वाली Certifying Authorities ही eSign Service Provider के रूप में देती हैं।'],
            ['DSC', 'डिजिटल सिग्नेचर सर्टिफ़िकेट वे Certifying Authorities जारी करती हैं जिन्हें Controller of Certifying Authorities (CCA) ने लाइसेंस दिया है।'],
            ['जिन डॉक्यूमेंट पर लागू नहीं', 'अब भी Act से बाहर: चेक को छोड़कर अन्य परक्राम्य लिखत (negotiable instruments), ज़्यादातर पावर ऑफ़ अटॉर्नी, ट्रस्ट और वसीयत। अचल संपत्ति की बिक्री के अनुबंध 2022 में इस सूची से हटा दिए गए।'],
            ['ऑनलाइन बने अनुबंध', 'कोई अनुबंध सिर्फ़ इसलिए अमान्य नहीं होता कि वो इलेक्ट्रॉनिक रूप से बना (धारा 10A)।'],
          ],
          sources: [SRC.itAct, SRC.esignGsr, SRC.cca, SRC.dsc, SRC.firstSchedule],
          checkedOn: CHECKED,
        },
        {
          heading: 'तो क्या PDF पर बनाया सिग्नेचर मान्य है?',
          type: 'paragraph',
          content:
            'चिपकाई गई सिग्नेचर इमेज उन तकनीकों में नहीं है जिन्हें Act "इलेक्ट्रॉनिक सिग्नेचर" मानता है, इसलिए ये अपने-आप क़ानूनी सिग्नेचर की शर्त पूरी नहीं करती। व्यवहार में रोज़ के डॉक्यूमेंट के लिए, जब सामने वाला इसे स्वीकार करे, तो ये आम तौर पर चल जाती है — आपने साइन किया, इसका सबूत संदर्भ से मिलता है, जैसे जिस ईमेल से आपने भेजा। जब लेने वाला eSign या DSC माँगे, या मामला बड़ा हो, तो वही इस्तेमाल करें। शक हो तो डॉक्यूमेंट लेने वाले व्यक्ति या दफ़्तर से पूछ लें कि वे क्या स्वीकार करते हैं।',
        },
        {
          heading: 'कहाँ DSC ज़रूरी है',
          type: 'dataTable',
          headers: ['कहाँ', 'आधिकारिक पेज क्या कहता है'],
          rows: [
            ['इनकम-टैक्स रिटर्न', 'कंपनियों को रिटर्न DSC से वेरिफ़ाई करना होता है (उनके लिए EVC नहीं है); FAQ में DSC इस्तेमाल करने वाले बाकी लोगों का भी ज़िक्र है।'],
            ['MCA ई-फ़ाइलिंग', 'फ़ॉर्म लाइसेंस वाली Certifying Authority के Class 2 या Class 3 DSC से साइन होते हैं।'],
          ],
          sources: [SRC.itr, SRC.mca],
          checkedOn: CHECKED,
        },
        {
          heading: 'एक मिनट में PDF साइन करें (सिग्नेचर इमेज)',
          type: 'steps',
          items: [
            'Sign PDF खोलें और डॉक्यूमेंट अपलोड करें।',
            'उँगली या माउस से सिग्नेचर बनाएँ, या सफ़ेद काग़ज़ पर किए सिग्नेचर की फ़ोटो अपलोड करें।',
            'उसे सिग्नेचर वाली लाइन पर खींचें, साइज़ ठीक करें और हर ज़रूरी पेज पर लगाएँ।',
            'साइन की हुई PDF डाउनलोड करें और भेजने से पहले जाँच लें।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'sign-pdf',
          text: 'अभी PDF साइन करें — सिग्नेचर बनाएँ या अपलोड करें',
        },
        {
          heading: 'ग़लत इस्तेमाल से बचाएँ',
          type: 'list',
          items: [
            'साइन की हुई PDF सिर्फ़ उसी को भेजें जिसे ज़रूरत है, हो सके तो अपने रोज़ के ईमेल से।',
            'कुछ संवेदनशील भेजने से पहले Protect PDF से पासवर्ड लगाएँ और पासवर्ड अलग से बताएँ।',
            'Edit PDF से सिग्नेचर के पास तारीख़ और छोटा नोट जोड़ें (जैसे "सिर्फ़ इंटर्नशिप आवेदन के लिए")।',
            'अपने सिग्नेचर वाला डॉक्यूमेंट कभी सार्वजनिक रूप से पोस्ट न करें।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'password-protect',
          text: 'शेयर करने से पहले साइन की हुई PDF पर पासवर्ड लगाएँ',
        },
        {
          type: 'mistakes',
          items: [
            'जहाँ लेने वाले ने साफ़ Aadhaar eSign या DSC माँगा हो, वहाँ हाथ का बना सिग्नेचर लगाना।',
            'वसीयत, ट्रस्ट डीड या पावर ऑफ़ अटॉर्नी इलेक्ट्रॉनिक रूप से साइन करना — ये IT Act से बाहर हैं।',
            'हाई-रेज़ोल्यूशन सिग्नेचर इमेज ऐसे शेयर्ड फ़ोल्डर में रखना जहाँ कोई भी उसे दोबारा इस्तेमाल कर सके।',
          ],
        },
      ],
      faqs: [
        {
          q: 'क्या भारत में PDF पर बनाया सिग्नेचर क़ानूनी रूप से मान्य है?',
          a: 'ये IT Act में दी गई इलेक्ट्रॉनिक सिग्नेचर तकनीकों में नहीं है, इसलिए अपने-आप क़ानूनी सिग्नेचर की शर्त पूरी नहीं करता। दोनों पक्ष सहमत हों तो रोज़ के डॉक्यूमेंट के लिए आम तौर पर स्वीकार किया जाता है; जहाँ क़ानूनन सिग्नेचर ज़रूरी हो, वहाँ Aadhaar eSign या DSC इस्तेमाल करें।',
        },
        {
          q: 'eSign और DSC में क्या फ़र्क है?',
          a: 'Aadhaar eSign e-KYC के बाद बनने वाला ऑनलाइन, एक बार का इलेक्ट्रॉनिक सिग्नेचर है। DSC लाइसेंस वाली Certifying Authority का सर्टिफ़िकेट है जो आप अपने पास (आमतौर पर USB टोकन पर) रखते हैं और फ़ाइलिंग में बार-बार इस्तेमाल करते हैं।',
        },
        {
          q: 'क्या किराया या बिक्री का एग्रीमेंट इलेक्ट्रॉनिक रूप से साइन कर सकते हैं?',
          a: 'अचल संपत्ति की बिक्री के अनुबंध 2022 में IT Act की बाहर रखी गई सूची से हटा दिए गए, लेकिन स्टांप ड्यूटी और रजिस्ट्रेशन के नियम अब भी लागू हैं। संपत्ति के डॉक्यूमेंट के लिए इलेक्ट्रॉनिक सिग्नेचर पर भरोसा करने से पहले रजिस्ट्रार या वकील से पूछ लें।',
        },
        {
          q: 'क्या Fyredocs Aadhaar eSign या DSC सिग्नेचर बनाता है?',
          a: 'नहीं। Sign PDF पेज पर आपके सिग्नेचर की इमेज लगाता है। eSign या DSC के लिए लाइसेंस वाली eSign सेवा या Certifying Authority इस्तेमाल करें।',
        },
      ],
    },
  },
};

export default post;
