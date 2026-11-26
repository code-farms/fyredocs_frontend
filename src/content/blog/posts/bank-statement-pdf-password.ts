import type { BlogPost } from '../types';

const CHECKED = '2026-11-26';

const SRC = {
  hdfc: { label: 'HDFC Bank NetBanking FAQs', url: 'https://www.hdfc.bank.in/need-help/net-banking-faqs' },
  icici: { label: 'ICICI Bank credit card FAQs', url: 'https://www.icici.bank.in/personal-banking/cards/credit-card/faqs' },
  nsdl: { label: 'NSDL CAS FAQs', url: 'https://investor.nsdl.com/portal/en/kb/articles/faqs-on-cas-26-10-2023' },
  cdsl: { label: 'CDSL CAS FAQ', url: 'https://www.cdslindia.com/CAS/FAQ.html' },
  kfin: { label: 'KFintech consolidated account statement form', url: 'https://mfs.kfintech.com/investor/General/ConsolidatedAccountStatement' },
};

const post: BlogPost = {
  slug: 'bank-statement-pdf-password',
  category: 'banking',
  publishedAt: '2026-11-26',
  updatedAt: '2026-11-26',
  readMinutes: 6,
  tools: ['unlock-pdf', 'password-protect', 'merge', 'pdf-to-excel', 'compress'],
  i18n: {
    en: {
      title: 'Bank Statement PDF Password: What Is It, and How to Remove It',
      metaTitle: 'Bank Statement PDF Password: Find & Remove It',
      description:
        'What password opens your bank statement, credit card bill or CAS PDF — only the formats banks officially publish — and how to remove it once you know it.',
      quickAnswer:
        'Look in the email the statement came with: banks state the password format there. Officially published formats include HDFC downloaded statements (your Customer ID), ICICI credit cards (first 4 letters of your name in lowercase + DDMM of birth) and NSDL/CDSL CAS (your PAN in capitals). Once it opens, Unlock PDF saves a copy without the password.',
      sections: [
        {
          heading: 'Why statements come locked',
          type: 'paragraph',
          content:
            'Bank and investment statements show your account number, balance and transactions, so banks protect the PDF with a password built from details only you should know — usually some mix of your name, date of birth, customer ID or PAN. The annoying part is that every bank uses a different format, and many never publish it outside the statement email.',
        },
        {
          heading: 'Formats the banks themselves publish',
          type: 'dataTable',
          content:
            'We only list a format when the bank or depository states it on its own website. Each row links to that page.',
          headers: ['Statement', 'Password', 'Note'],
          rows: [
            ['HDFC Bank account statement (downloaded from NetBanking or the app)', 'Your Customer ID (the numeric NetBanking user ID)', 'HDFC’s pages cover downloaded statements; check the email for monthly e-statements'],
            ['ICICI Bank credit card e-statement', 'First 4 letters of your name as printed on the card, in lowercase, + date and month of birth (DDMM)', 'Case sensitive, no spaces or special characters'],
            ['NSDL e-CAS', 'PAN of the first/sole holder, in capital letters', '—'],
            ['CDSL e-CAS', 'PAN of the first/sole holder, in capital letters', '—'],
            ['KFintech mutual fund CAS', 'The password you set when requesting the statement', 'Min 8 characters, with upper case, lower case, a number and a special character'],
          ],
          sources: [SRC.hdfc, SRC.icici, SRC.nsdl, SRC.cdsl, SRC.kfin],
          checkedOn: CHECKED,
        },
        {
          heading: 'SBI, Axis, Kotak and others',
          type: 'paragraph',
          content:
            'We could not find an official page from SBI, Axis Bank, Kotak, or for HDFC and SBI Card credit cards, that states the statement password — and websites that claim to know contradict each other. Rather than guess, open the email or SMS the statement came with: it almost always describes the format (for example "first four letters of your name followed by your date of birth"). If it does not, the bank’s customer care can confirm it.',
        },
        {
          heading: 'Remove the password (once you know it)',
          type: 'steps',
          items: [
            'Open Unlock PDF and upload the statement.',
            'Type the password you found above.',
            'Download the unlocked copy — it opens without a password from now on.',
            'Store it somewhere private, or lock it again with your own password before sharing.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'unlock-pdf',
          text: 'Unlock your statement PDF — you will need its current password',
        },
        {
          type: 'warning',
          content:
            'Unlock PDF removes a password you already know; it does not crack unknown passwords. Only unlock documents that belong to you.',
        },
        {
          heading: 'Handy when you need to',
          type: 'list',
          items: [
            'Submit 6 months of statements for a loan or visa: unlock each, then combine them into one file with Merge PDF.',
            'Upload to a portal that rejects password-protected files (many loan and tax portals do).',
            'Share with your CA: unlock, merge, then add one password of your own with Protect PDF and send the password separately.',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'merge',
          text: 'Combine several unlocked statements into one PDF',
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-excel',
          text: 'Need the transactions in a spreadsheet? Convert the unlocked statement with PDF to Excel',
        },
        {
          type: 'mistakes',
          items: [
            'Typing the name part in the wrong case — ICICI card passwords are lowercase, CAS passwords use your PAN in capitals.',
            'Using the full year when the format asks for DDMM only.',
            'Forwarding an unlocked statement on WhatsApp or email without protecting it again.',
            'Trusting a random "password list" website over the bank’s own email.',
          ],
        },
      ],
      faqs: [
        {
          q: 'What is the password for my SBI statement PDF?',
          a: 'SBI does not publish the format on its website, and third-party sites disagree. Check the email or SMS the statement arrived with, or ask SBI customer care.',
        },
        {
          q: 'Can Fyredocs open a statement if I forgot the password?',
          a: 'No. Unlock PDF only removes a password you enter. If you do not know it, download a fresh statement from net banking or ask the bank for the format.',
        },
        {
          q: 'Is it safe to unlock a bank statement online?',
          a: 'Files are encrypted in transit and guest files are deleted automatically about 30 minutes after processing. Keep the unlocked copy private, or re-protect it before sharing.',
        },
        {
          q: 'How do I put a password back on the PDF?',
          a: 'Use Protect PDF to add a password of your choice. Share that password separately from the file.',
        },
      ],
    },
    hi: {
      title: 'बैंक स्टेटमेंट PDF पासवर्ड: क्या होता है और इसे कैसे हटाएँ',
      metaTitle: 'बैंक स्टेटमेंट PDF पासवर्ड: जानें और हटाएँ',
      description:
        'बैंक स्टेटमेंट, क्रेडिट कार्ड बिल या CAS की PDF किस पासवर्ड से खुलती है — सिर्फ़ वही फ़ॉर्मेट जो बैंक आधिकारिक तौर पर बताते हैं — और पता होने पर उसे कैसे हटाएँ।',
      quickAnswer:
        'स्टेटमेंट जिस ईमेल के साथ आया है, उसे देखें: बैंक वहीं पासवर्ड का फ़ॉर्मेट लिखते हैं। आधिकारिक तौर पर बताए गए फ़ॉर्मेट में HDFC का डाउनलोड किया स्टेटमेंट (आपका Customer ID), ICICI क्रेडिट कार्ड (नाम के पहले 4 अक्षर छोटे अक्षरों में + जन्म का DDMM) और NSDL/CDSL CAS (बड़े अक्षरों में PAN) शामिल हैं। फ़ाइल खुल जाए तो Unlock PDF से बिना पासवर्ड वाली कॉपी बना लें।',
      sections: [
        {
          heading: 'स्टेटमेंट लॉक क्यों आते हैं',
          type: 'paragraph',
          content:
            'बैंक और निवेश के स्टेटमेंट में आपका अकाउंट नंबर, बैलेंस और लेन-देन होते हैं, इसलिए बैंक PDF पर ऐसा पासवर्ड लगाते हैं जो सिर्फ़ आपको पता हो — आमतौर पर नाम, जन्मतिथि, कस्टमर ID या PAN का मेल। दिक्कत ये है कि हर बैंक का फ़ॉर्मेट अलग है, और कई बैंक इसे स्टेटमेंट ईमेल के अलावा कहीं नहीं बताते।',
        },
        {
          heading: 'जो फ़ॉर्मेट बैंक ख़ुद बताते हैं',
          type: 'dataTable',
          content: 'हम कोई फ़ॉर्मेट तभी लिखते हैं जब बैंक या डिपॉज़िटरी उसे अपनी वेबसाइट पर बताता है। हर लाइन का स्रोत नीचे लिंक है।',
          headers: ['स्टेटमेंट', 'पासवर्ड', 'नोट'],
          rows: [
            ['HDFC Bank अकाउंट स्टेटमेंट (NetBanking या ऐप से डाउनलोड किया)', 'आपका Customer ID (NetBanking का नंबर वाला यूज़र ID)', 'HDFC के पेज डाउनलोड किए स्टेटमेंट की बात करते हैं; मासिक ई-स्टेटमेंट के लिए ईमेल देखें'],
            ['ICICI Bank क्रेडिट कार्ड ई-स्टेटमेंट', 'कार्ड पर छपे नाम के पहले 4 अक्षर, छोटे अक्षरों में, + जन्म की तारीख़ और महीना (DDMM)', 'केस-सेंसिटिव, बिना स्पेस या स्पेशल कैरेक्टर'],
            ['NSDL e-CAS', 'पहले/अकेले होल्डर का PAN, बड़े अक्षरों में', '—'],
            ['CDSL e-CAS', 'पहले/अकेले होल्डर का PAN, बड़े अक्षरों में', '—'],
            ['KFintech म्यूचुअल फ़ंड CAS', 'स्टेटमेंट माँगते समय आपका रखा हुआ पासवर्ड', 'कम से कम 8 कैरेक्टर, जिसमें बड़ा अक्षर, छोटा अक्षर, अंक और स्पेशल कैरेक्टर हो'],
          ],
          sources: [SRC.hdfc, SRC.icici, SRC.nsdl, SRC.cdsl, SRC.kfin],
          checkedOn: CHECKED,
        },
        {
          heading: 'SBI, Axis, Kotak और बाकी',
          type: 'paragraph',
          content:
            'SBI, Axis Bank, Kotak, या HDFC और SBI Card के क्रेडिट कार्ड के स्टेटमेंट पासवर्ड का कोई आधिकारिक पेज हमें नहीं मिला — और जो वेबसाइटें बताने का दावा करती हैं, वे आपस में मेल नहीं खातीं। अंदाज़ा लगाने की बजाय वो ईमेल या SMS खोलें जिसके साथ स्टेटमेंट आया था: उसमें लगभग हमेशा फ़ॉर्मेट लिखा होता है (जैसे "नाम के पहले चार अक्षर और उसके बाद जन्मतिथि")। न मिले तो बैंक के कस्टमर केयर से पूछ लें।',
        },
        {
          heading: 'पासवर्ड हटाएँ (पता होने के बाद)',
          type: 'steps',
          items: [
            'Unlock PDF खोलें और स्टेटमेंट अपलोड करें।',
            'ऊपर मिला पासवर्ड डालें।',
            'अनलॉक कॉपी डाउनलोड करें — अब ये बिना पासवर्ड खुलेगी।',
            'इसे सुरक्षित जगह रखें, या शेयर करने से पहले अपना पासवर्ड लगा दें।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'unlock-pdf',
          text: 'स्टेटमेंट PDF अनलॉक करें — मौजूदा पासवर्ड चाहिए होगा',
        },
        {
          type: 'warning',
          content:
            'Unlock PDF सिर्फ़ वही पासवर्ड हटाता है जो आपको पता है; अनजान पासवर्ड नहीं तोड़ता। सिर्फ़ अपने ही डॉक्यूमेंट अनलॉक करें।',
        },
        {
          heading: 'ये कब काम आता है',
          type: 'list',
          items: [
            'लोन या वीज़ा के लिए 6 महीने के स्टेटमेंट देने हों: हर एक अनलॉक करें, फिर Merge PDF से एक फ़ाइल बनाएँ।',
            'ऐसे पोर्टल पर अपलोड करना हो जो पासवर्ड वाली फ़ाइल नहीं लेता (कई लोन और टैक्स पोर्टल ऐसा करते हैं)।',
            'CA को भेजना हो: अनलॉक करें, मर्ज करें, फिर Protect PDF से अपना एक पासवर्ड लगाएँ और पासवर्ड अलग से बताएँ।',
          ],
        },
        {
          type: 'toolCta',
          toolId: 'merge',
          text: 'कई अनलॉक स्टेटमेंट को एक PDF में जोड़ें',
        },
        {
          type: 'toolCta',
          toolId: 'pdf-to-excel',
          text: 'लेन-देन स्प्रेडशीट में चाहिए? अनलॉक स्टेटमेंट को PDF to Excel से बदलें',
        },
        {
          type: 'mistakes',
          items: [
            'नाम वाला हिस्सा गलत केस में लिखना — ICICI कार्ड पासवर्ड छोटे अक्षरों में है, CAS पासवर्ड में PAN बड़े अक्षरों में।',
            'जहाँ सिर्फ़ DDMM माँगा है, वहाँ पूरा साल डाल देना।',
            'अनलॉक स्टेटमेंट को बिना दोबारा सुरक्षित किए WhatsApp या ईमेल पर भेज देना।',
            'बैंक के अपने ईमेल की जगह किसी "पासवर्ड लिस्ट" वेबसाइट पर भरोसा करना।',
          ],
        },
      ],
      faqs: [
        {
          q: 'SBI स्टेटमेंट PDF का पासवर्ड क्या है?',
          a: 'SBI अपनी वेबसाइट पर फ़ॉर्मेट नहीं बताता, और दूसरी साइटें अलग-अलग बातें कहती हैं। स्टेटमेंट वाला ईमेल या SMS देखें, या SBI कस्टमर केयर से पूछें।',
        },
        {
          q: 'पासवर्ड भूल गया हूँ, क्या Fyredocs स्टेटमेंट खोल सकता है?',
          a: 'नहीं। Unlock PDF सिर्फ़ आपका डाला हुआ पासवर्ड हटाता है। पासवर्ड न पता हो तो नेट बैंकिंग से नया स्टेटमेंट डाउनलोड करें या बैंक से फ़ॉर्मेट पूछें।',
        },
        {
          q: 'क्या बैंक स्टेटमेंट ऑनलाइन अनलॉक करना सुरक्षित है?',
          a: 'फ़ाइलें ट्रांसफ़र के दौरान एन्क्रिप्ट रहती हैं और गेस्ट की फ़ाइलें प्रोसेसिंग के करीब 30 मिनट बाद अपने-आप डिलीट हो जाती हैं। अनलॉक कॉपी निजी रखें या शेयर करने से पहले फिर से पासवर्ड लगाएँ।',
        },
        {
          q: 'PDF पर दोबारा पासवर्ड कैसे लगाएँ?',
          a: 'Protect PDF से अपनी पसंद का पासवर्ड लगाएँ और वो पासवर्ड फ़ाइल से अलग भेजें।',
        },
      ],
    },
  },
};

export default post;
