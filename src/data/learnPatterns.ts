import type { LocalizedText } from '../engine/types';

export const VERBATIM_PROBLEM_STATEMENT =
  "Rural families get scheme messages daily, and the real ones and the fake ones often ask for the same action, such as an e-KYC update. Today's tools mostly answer 'is this spam?' for strangers, in English, on premium phones, or take reports after the money is gone. None tells a Telugu-speaking farmer, in the moment, whether this exact request is genuine, how to do it the official way, and what to do in the first 60 minutes if they already clicked.";

export interface LearnPattern {
  id: string;
  number: string;
  illustrationKey: 'apk' | 'otp' | 'fee' | 'lookalike' | 'forward' | 'cyclone';
  title: LocalizedText;
  howItLooks: LocalizedText;
  redFlag: LocalizedText;
  safeAction: LocalizedText;
}

/**
 * Six common scam patterns paraphrased from public police advisories,
 * available across all 6 supported languages.
 */
export const LEARN_PATTERNS: LearnPattern[] = [
  {
    id: 'pattern-pmkisan-apk',
    number: '01',
    illustrationKey: 'apk',
    title: {
      en: 'PM-KISAN e-KYC .apk app download file',
      te: 'పిఎం-కిసాన్ e-KYC పేరుతో .apk యాప్ ఫైల్',
      hi: 'पीएम-किसान e-KYC के नाम पर .apk ऐप फाइल',
      ta: 'பிஎம்-கிசான் e-KYC பெயரில் .apk செயலி கோப்பு',
      ml: 'പിഎം-കിസാൻ e-KYC എന്ന പേരിൽ .apk ആപ്പ് ഫയൽ',
      kn: 'ಪಿಎಂ-ಕಿಸಾನ್ e-KYC ಹೆಸರಿನಲ್ಲಿ .apk ಆ್ಯಪ್ ಫೈಲ್',
    },
    howItLooks: {
      en: 'A WhatsApp message sends an .apk file or link claiming your PM-KISAN installment will stop unless you install the app right away.',
      te: 'వాట్సాప్‌లో "PM-KISAN e-KYC ఇప్పుడే పూర్తి చేయండి, ఈ ఫైల్ ఇన్‌స్టాల్ చేయండి" అని .apk ఫైల్ లేదా లింక్ వస్తుంది.',
      hi: 'व्हाट्सएप पर एक .apk फाइल या लिंक आता है कि अभी ऐप इंस्टॉल न करने पर पीएम-किसान की किस्त रुक जाएगी।',
      ta: 'உடனே இந்த .apk செயலியை நிறுவாவிட்டால் பிஎம்-கிசான் பணம் நின்றுவிடும் என வாட்ஸ்அப் செய்தி வரும்.',
      ml: 'ഉടൻ ഈ .apk ഫയൽ ഇൻസ്റ്റാൾ ചെയ്തില്ലെങ്കിൽ പിഎം-കിസാൻ പണം നിലയ്ക്കും എന്ന വാട്സ്ആപ്പ് സന്ദേശം വരുന്നു.',
      kn: 'ಈ .apk ಫೈಲ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡದಿದ್ದರೆ ಪಿಎಂ-ಕಿಸಾನ್ ಕಂತು ನಿಂತುಹೋಗುತ್ತದೆ ಎಂದು ವಾಟ್ಸಾಪ್ ಸಂದೇಶ ಬರುತ್ತದೆ.',
    },
    redFlag: {
      en: 'Official schemes never send .apk install files over chat. Installing one can expose your SMS messages and bank OTPs.',
      te: 'అధికారిక పథకాల కోసం వాట్సాప్‌లో .apk ఫైల్ పంపరు. అలాంటి ఫైల్ ఇన్‌స్టాల్ చేస్తే ఫోన్‌లోని OTPలు ఇతరులకు వెళ్లే ప్రమాదం ఉంది.',
      hi: 'आधिकारिक योजनाएं कभी व्हाट्सएप पर .apk फाइल नहीं भेजतीं। इसे इंस्टॉल करने से आपके SMS और बैंक OTP चोरी हो सकते हैं।',
      ta: 'அரசு திட்டங்கள் ஒருபோதும் வாட்ஸ்அப்பில் .apk கோப்புகளை அனுப்புவதில்லை. அதை நிறுவினால் SMS மற்றும் வங்கி OTP திருடப்படலாம்.',
      ml: 'ഔദ്യോഗിക പദ്ധതികൾ ഒരിക്കലും ചാറ്റിലൂടെ .apk ഫയലുകൾ അയക്കില്ല. ഇത് ഇൻസ്റ്റാൾ ചെയ്താൽ നിങ്ങളുടെ SMS, ബാങ്ക് OTP എന്നിവ ചോരാം.',
      kn: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಎಂದಿಗೂ ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ .apk ಫೈಲ್ ಕಳುಹಿಸುವುದಿಲ್ಲ. ಇದನ್ನು ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿದರೆ SMS ಮತ್ತು ಬ್ಯಾಂಕ್ OTP ಕಳುವಾಗಬಹುದು.',
    },
    safeAction: {
      en: 'Do not install the file. Visit pmkisan.gov.in directly or ask your village secretariat or agriculture officer.',
      te: 'ఫైల్‌ను ఓపెన్ చేయకండి. పిఎం-కిసాన్ సమాచారం కోసం నేరుగా pmkisan.gov.in చూడండి లేదా గ్రామ సచివాలయంలో అడగండి.',
      hi: 'फाइल न खोलें। सीधे pmkisan.gov.in देखें या अपने ग्राम सचिवालय / कृषि अधिकारी से पूछें।',
      ta: 'கோப்பைத் திறக்க வேண்டாம். நேரடியாக pmkisan.gov.in செல்லவும் அல்லது கிராம செயலகத்தில் கேட்கவும்.',
      ml: 'ഫയൽ തുറക്കരുത്. നേരിട്ട് pmkisan.gov.in സന്ദർശിക്കുകയോ വില്ലേജ് ഓഫീസിലോ കൃഷി ഓഫീസറിലോ അന്വേഷിക്കുകയോ ചെയ്യുക.',
      kn: 'ಫೈಲ್ ತೆರೆಯಬೇಡಿ. ನೇರವಾಗಿ pmkisan.gov.in ನೋಡಿ ಅಥವಾ ಗ್ರಾಮ ಪಂಚಾಯತಿ / ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಕೇಳಿ.',
    },
  },
  {
    id: 'pattern-otp-readout',
    number: '02',
    illustrationKey: 'otp',
    title: {
      en: 'Phone call asking you to read out an OTP or UPI PIN',
      te: 'ఫోన్ చేసి OTP లేదా PIN అడగడం',
      hi: 'फोन कॉल पर OTP या UPI PIN पूछना',
      ta: 'தொலைபேசியில் OTP அல்லது UPI PIN கேட்பது',
      ml: 'ഫോണിൽ വിളിച്ച് OTP അല്ലെങ്കിൽ UPI PIN ചോദിക്കുന്നത്',
      kn: 'ಫೋನ್ ಕರೆ ಮಾಡಿ OTP ಅಥವಾ UPI PIN ಕೇಳುವುದು',
    },
    howItLooks: {
      en: 'Someone claiming to be an officer calls and asks you to read out a 6-digit OTP or enter a UPI PIN to receive crop-insurance money.',
      te: 'వ్యవసాయ లేదా బ్యాంకు అధికారిలా మాట్లాడి, "పంట బీమా డబ్బు జమ కావాలంటే మీ ఫోన్‌కు వచ్చిన 6 అంకెల OTP చెప్పండి" అంటారు.',
      hi: 'कोई व्यक्ति अधिकारी बनकर फोन करता है और फसल बीमा का पैसा पाने के लिए 6 अंकों का OTP या UPI PIN बताने को कहता है।',
      ta: 'அதிகாரி போல் பேசி, பயிர் காப்பீட்டுப் பணம் வர உங்கள் போனுக்கு வந்த 6 இலக்க OTP-ஐச் சொல்லச் சொல்வார்கள்.',
      ml: 'ഉദ്യോഗസ്ഥനെന്ന് പറഞ്ഞ് വിളിച്ച്, വിള ഇൻഷുറൻസ് പണം ലഭിക്കാൻ ഫോണിൽ വന്ന 6 അക്ക OTP പറയാൻ ആവശ്യപ്പെടുന്നു.',
      kn: 'ಅಧಿಕಾರಿಯಂತೆ ಕರೆ ಮಾಡಿ, ಬೆಳೆ ವಿಮೆ ಹಣ ಬರಲು ಫೋನ್‌ಗೆ ಬಂದ 6 ಅಂಕಿಯ OTP ಅಥವಾ UPI PIN ಹೇಳಲು ಕೇಳುತ್ತಾರೆ.',
    },
    redFlag: {
      en: 'Typing an OTP on an official .gov.in page is normal, but reading an OTP to a caller or entering a UPI PIN to receive money is always a trap.',
      te: 'అధికారిక వెబ్‌సైట్‌లో మీరే టైప్ చేసే OTP వేరు; ఫోన్‌లో వేరొకరికి చెప్పే OTP వేరు. డబ్బు రావడానికి UPI PIN ఎప్పుడూ అవసరం లేదు.',
      hi: 'आधिकारिक .gov.in साइट पर खुद OTP डालना सामान्य है, लेकिन कॉल पर किसी को OTP बताना या पैसे पाने के लिए UPI PIN डालना हमेशा धोखा है।',
      ta: 'அதிகாரப்பூர்வ .gov.in தளத்தில் OTP இடுவது வழக்கம்; ஆனால் போனில் OTP சொல்வது அல்லது பணம் பெற UPI PIN இடுவது எப்போதும் மோசடி.',
      ml: 'ഔദ്യോഗിക .gov.in സൈറ്റിൽ OTP നൽകുന്നത് സാധാരണമാണ്; എന്നാൽ വിളിക്കുന്നയാൾക്ക് OTP പറയുന്നതും പണം കിട്ടാൻ UPI PIN നൽകുന്നതും തട്ടിപ്പാണ്.',
      kn: 'ಅಧಿಕೃತ .gov.in ತಾಣದಲ್ಲಿ OTP ಹಾಕುವುದು ಸಹಜ; ಆದರೆ ಕರೆಯಲ್ಲಿ OTP ಹೇಳುವುದು ಅಥವಾ ಹಣ ಪಡೆಯಲು UPI PIN ಹಾಕುವುದು ಯಾವಾಗಲೂ ಮೋಸ.',
    },
    safeAction: {
      en: 'Hang up immediately. Never read out an OTP, UPI PIN, or card CVV to anyone on a call or message.',
      te: 'కాల్ కట్ చేయండి. ఏ OTP, PIN, CVV కూడా ఫోన్‌లో ఎవరికీ చెప్పకండి.',
      hi: 'तुरंत कॉल काट दें। कभी किसी को कॉल या संदेश पर OTP, UPI PIN या CVV न बताएं।',
      ta: 'உடனே அழைப்பைத் துண்டிக்கவும். OTP, UPI PIN, CVV எதையும் யாருக்கும் சொல்லாதீர்கள்.',
      ml: 'ഉടൻ കോൾ കട്ട് ചെയ്യുക. OTP, UPI PIN, CVV എന്നിവ ഒരിക്കലും ആരുമായും പങ്കിടരുത്.',
      kn: 'ತಕ್ಷಣ ಕರೆ ಕಟ್ ಮಾಡಿ. ಯಾರಿಗೂ OTP, UPI PIN ಅಥವಾ CVV ಹೇಳಬೇಡಿ.',
    },
  },
  {
    id: 'pattern-subsidy-fee',
    number: '03',
    illustrationKey: 'fee',
    title: {
      en: 'Small "processing fee" to release a subsidy or benefit',
      te: 'సబ్సిడీ విడుదల చేయడానికి "చిన్న రుసుము" అడగడం',
      hi: 'सब्सिडी या लाभ पाने के लिए "छोटा शुल्क" मांगना',
      ta: 'மானியம் பெற "சிறிய கட்டணம்" செலுத்தக் கேட்பது',
      ml: 'സബ്സിഡി ലഭിക്കാൻ "ചെറിയ ഫീസ്" അടയ്ക്കാൻ പറയുന്നത്',
      kn: 'ಸಬ್ಸಿಡಿ ಬಿಡುಗಡೆಗೆ "ಸಣ್ಣ ಶುಲ್ಕ" ಪಾವತಿಸಲು ಕೇಳುವುದು',
    },
    howItLooks: {
      en: 'A message says your name is approved and asks you to scan a QR code or pay a small registration fee to unlock the scheme money.',
      te: '"మీ పేరు లిస్టులో ఉంది, ₹2,000 రావాలంటే ₹199 రిజిస్ట్రేషన్ ఫీజు UPI చేయండి" అని మెసేజ్ లేదా QR కోడ్ వస్తుంది.',
      hi: 'संदेश कहता है कि आपका नाम सूची में है और योजना का पैसा पाने के लिए QR कोड स्कैन कर छोटा शुल्क भेजें।',
      ta: 'உங்கள் பெயர் பட்டியலில் உள்ளது, உதவித்தொகை பெற QR கோட் ஸ்கேன் செய்து சிறிய கட்டணம் செலுத்துங்கள் என செய்தி வரும்.',
      ml: 'നിങ്ങളുടെ പേര് പട്ടികയിലുണ്ട്, ആനുകൂല്യം കിട്ടാൻ QR കോഡ് സ്കാൻ ചെയ്ത് ചെറിയ രജിസ്ട്രേഷൻ ഫീസ് അടയ്ക്കാൻ സന്ദേശം വരുന്നു.',
      kn: 'ನಿಮ್ಮ ಹೆಸರು ಪಟ್ಟಿಯಲ್ಲಿದೆ, ಹಣ ಬಿಡುಗಡೆಗೆ QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಸಣ್ಣ ನೋಂದಣಿ ಶುಲ್ಕ ಪಾವತಿಸಿ ಎಂದು ಸಂದೇಶ ಬರುತ್ತದೆ.',
    },
    redFlag: {
      en: 'Scheme payouts do not require paying a release fee to a personal UPI ID. Scanning a payment QR deducts money from your account.',
      te: 'ప్రభుత్వ సబ్సిడీ విడుదల చేయడానికి వ్యక్తిగత UPIకి ఫీజు అడగరు. QR కోడ్ స్కాన్ చేస్తే డబ్బు మీ ఖాతా నుండి పోతుంది.',
      hi: 'सरकारी सब्सिडी पाने के लिए किसी निजी UPI पर शुल्क नहीं देना होता। QR स्कैन करने से पैसा आपके खाते से कटता है।',
      ta: 'அரசு மானியம் பெற தனிப்பட்ட UPI-க்கு கட்டணம் செலுத்தத் தேவையில்லை. QR ஸ்கேன் செய்தால் உங்கள் கணக்கிலிருந்து பணம் போகும்.',
      ml: 'സർക്കാർ ആനുകൂല്യം കിട്ടാൻ സ്വകാര്യ UPI-ലേക്ക് ഫീസ് അടയ്ക്കേണ്ടതില്ല. QR സ്കാൻ ചെയ്താൽ നിങ്ങളുടെ അക്കൗണ്ടിൽ നിന്ന് പണം പോകും.',
      kn: 'ಸರ್ಕಾರಿ ಸಬ್ಸಿಡಿ ಪಡೆಯಲು ವೈಯಕ್ತಿಕ UPI ಗೆ ಶುಲ್ಕ ಕಟ್ಟಬೇಕಾಗಿಲ್ಲ. QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿದರೆ ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಹಣ ಕಡಿತವಾಗುತ್ತದೆ.',
    },
    safeAction: {
      en: 'Do not send any money. Confirm with your village agriculture officer or the official scheme helpline.',
      te: 'ఎలాంటి డబ్బు పంపకండి. గ్రామ వ్యవసాయ అధికారి వద్ద లేదా అధికారిక హెల్ప్‌లైన్‌లో నిర్ధారించుకోండి.',
      hi: 'कोई पैसा न भेजें। अपने ग्राम कृषि अधिकारी या आधिकारिक हेल्पलाइन पर पुष्टि करें।',
      ta: 'பணம் எதுவும் அனுப்ப வேண்டாம். கிராம வேளாண்மை அலுவலர் அல்லது அதிகாரப்பூர்வ உதவி எண்ணில் சரிபார்க்கவும்.',
      ml: 'പണം ഒന്നും അയക്കരുത്. വില്ലേജ് കൃഷി ഓഫീസറുമായോ ഔദ്യോഗിക ഹെൽപ്പ്‌ലൈനിലോ ഉറപ്പാക്കുക.',
      kn: 'ಯಾವುದೇ ಹಣ ಕಳುಹಿಸಬೇಡಿ. ನಿಮ್ಮ ಗ್ರಾಮ ಕೃಷಿ ಅಧಿಕಾರಿ ಅಥವಾ ಅಧಿಕೃತ ಸಹಾಯವಾಣಿಯಲ್ಲಿ ದೃಢಪಡಿಸಿ.',
    },
  },
  {
    id: 'pattern-lookalike-domain',
    number: '04',
    illustrationKey: 'lookalike',
    title: {
      en: 'Lookalike website address pretending to be .gov.in',
      te: 'అధికారిక సైట్‌లా కనిపించే నకిలీ వెబ్‌సైట్ పేరు',
      hi: '.gov.in जैसी दिखने वाली नकली वेबसाइट',
      ta: '.gov.in போல் தோற்றமளிக்கும் போலி இணைய முகவரி',
      ml: '.gov.in പോലെ തോന്നിപ്പിക്കുന്ന വ്യാജ വെബ്‌സൈറ്റ് വിലാസം',
      kn: '.gov.in ನಂತೆ ಕಾಣುವ ನಕಲಿ ವೆಬ್‌ಸೈಟ್ ವಿಳಾಸ',
    },
    howItLooks: {
      en: 'Links like pmkisan.gov.in.verify-now.xyz or uidai-gov-in.example.com place official words at the start to look genuine at a glance.',
      te: 'pmkisan.gov.in.verify-now.xyz లేదా uidai-gov-in.example.com లాంటి లింక్ చూసి నిజమైన ప్రభుత్వ సైట్ అనిపించేలా చేస్తారు.',
      hi: 'pmkisan.gov.in.verify-now.xyz या uidai-gov-in.example.com जैसे लिंक शुरू में सरकारी नाम रखकर असली होने का धोखा देते हैं।',
      ta: 'pmkisan.gov.in.verify-now.xyz அல்லது uidai-gov-in.example.com போன்ற இணைப்புகள் முதலில் அரசு பெயரை வைத்து ஏமாற்றுகின்றன.',
      ml: 'pmkisan.gov.in.verify-now.xyz അല്ലെങ്കിൽ uidai-gov-in.example.com പോലുള്ള ലിങ്കുകൾ തുടക്കത്തിൽ സർക്കാർ പേര് നൽകി തെറ്റിദ്ധരിപ്പിക്കുന്നു.',
      kn: 'pmkisan.gov.in.verify-now.xyz ಅಥವಾ uidai-gov-in.example.com ನಂತಹ ಲಿಂಕ್‌ಗಳು ಆರಂಭದಲ್ಲಿ ಸರ್ಕಾರಿ ಹೆಸರನ್ನು ಇಟ್ಟು ಮೋಸ ಮಾಡುತ್ತವೆ.',
    },
    redFlag: {
      en: 'Always check the true domain at the end before the first "/". If another domain follows .gov.in, or uses -gov-in, it is not official.',
      te: 'లింక్ చివరి భాగాన్ని చూడండి. ".gov.in" తర్వాత మళ్లీ వేరే పేరు (.xyz, .com, -gov-in) ఉంటే అది ప్రభుత్వ సైట్ కాదు.',
      hi: 'हमेशा पहले "/" से पहले का असली डोमेन देखें। यदि .gov.in के बाद कोई और नाम (.xyz, .com) या -gov-in है, तो यह सरकारी नहीं है।',
      ta: 'முதல் "/" முன் உள்ள உண்மையான டொமைனைப் பாருங்கள். .gov.in-க்குப் பிறகு வேறு பெயர் (.xyz, .com) அல்லது -gov-in இருந்தால் அது அரசு தளம் அல்ல.',
      ml: 'ആദ്യത്തെ "/" ന് മുമ്പുള്ള യഥാർത്ഥ ഡൊമെയ്ൻ നോക്കുക. .gov.in കഴിഞ്ഞു മറ്റൊരു പേരോ -gov-in എന്നോ ഉണ്ടെങ്കിൽ അത് സർക്കാർ സൈറ്റല്ല.',
      kn: 'ಮೊದಲ "/" ಗಿಂತ ಮುಂಚಿನ ನಿಜವಾದ ಡೊಮೇನ್ ನೋಡಿ. .gov.in ನಂತರ ಬೇರೆ ಹೆಸರು (.xyz, .com) ಅಥವಾ -gov-in ಇದ್ದರೆ ಅದು ಸರ್ಕಾರಿ ತಾಣವಲ್ಲ.',
    },
    safeAction: {
      en: 'Copy the link without opening it and paste it here to highlight the real destination domain.',
      te: 'లింక్ ఓపెన్ చేయకుండా కాపీ చేసి ఈ టూల్‌లో పేస్ట్ చేసి అసలు సైట్ పేరు చూడండి.',
      hi: 'लिंक खोले बिना कॉपी करें और यहां पेस्ट करके असली वेबसाइट का नाम जांचें।',
      ta: 'இணைப்பைத் திறக்காமல் நகலெடுத்து இங்கே ஒட்டி உண்மையான இணையதளத்தைச் சரிபார்க்கவும்.',
      ml: 'ലിങ്ക് തുറക്കാതെ കോപ്പി ചെയ്ത് ഇവിടെ പേസ്റ്റ് ചെയ്ത് യഥാർത്ഥ വെബ്‌സൈറ്റ് പരിശോധിക്കുക.',
      kn: 'ಲಿಂಕ್ ತೆರೆಯದೆ ಕಾಪಿ ಮಾಡಿ ಇಲ್ಲಿ ಪೇಸ್ಟ್ ಮಾಡಿ ನಿಜವಾದ ವೆಬ್‌ಸೈಟ್ ಹೆಸರನ್ನು ಪರಿಶೀಲಿಸಿ.',
    },
  },
  {
    id: 'pattern-forward-chain',
    number: '05',
    illustrationKey: 'forward',
    title: {
      en: '"Forward to 20 contacts" aid chain message',
      te: '"20 మందికి ఫార్వర్డ్ చేస్తే సహాయం వస్తుంది" గొలుసు మెసేజ్',
      hi: '"20 लोगों को फॉरवर्ड करें" वाले चेन संदेश',
      ta: '"20 பேருக்குப் பகிரவும்" சங்கிலிச் செய்தி',
      ml: '"20 പേർക്ക് ഫോർവേഡ് ചെയ്യുക" ചെയിൻ സന്ദേശം',
      kn: '"20 ಜನರಿಗೆ ಫಾರ್ವರ್ಡ್ ಮಾಡಿ" ಸರಪಳಿ ಸಂದೇಶ',
    },
    howItLooks: {
      en: 'Claims you must forward the message to 5 WhatsApp groups or 20 contacts before the benefit form unlocks.',
      te: 'పథకం లేదా సబ్సిడీ పొందాలంటే ఈ లింక్‌ను 5 గ్రూపులకు లేదా 20 మందికి ఫార్వర్డ్ చేయమని అడుగుతుంది.',
      hi: 'दावा करता है कि लाभ का फॉर्म खुलने के लिए इसे 5 व्हाट्सएप ग्रुप या 20 लोगों को फॉरवर्ड करना होगा।',
      ta: 'உதவித்தொகை படிவம் திறக்க 5 வாட்ஸ்அப் குழுக்களுக்கு அல்லது 20 பேருக்குப் பகிர வேண்டும் எனக் கூறுகிறது.',
      ml: 'ആനുകൂല്യ ഫോം തുറക്കാൻ 5 വാട്സ്ആപ്പ് ഗ്രൂപ്പുകളിലേക്കോ 20 പേർക്കോ ഫോർവേഡ് ചെയ്യണമെന്ന് പറയുന്നു.',
      kn: 'ಸೌಲಭ್ಯದ ಫಾರ್ಮ್ ತೆರೆಯಲು 5 ವಾಟ್ಸಾಪ್ ಗುಂಪುಗಳಿಗೆ ಅಥವಾ 20 ಜನರಿಗೆ ಫಾರ್ವರ್ಡ್ ಮಾಡಬೇಕೆಂದು ಹೇಳುತ್ತದೆ.',
    },
    redFlag: {
      en: 'No genuine government scheme ever asks you to forward messages to groups. Scammers use this to spread fake links through trusted family contacts.',
      te: 'ఏ అధికారిక ప్రభుత్వ పథకమూ మెసేజ్‌లు ఫార్వర్డ్ చేయమని అడగదు. ఇది నకిలీ లింక్‌ను వేగంగా పంచడానికి వాడే పద్ధతి.',
      hi: 'कोई भी असली सरकारी योजना संदेश फॉरवर्ड करने को नहीं कहती। ठग भरोसेमंद लोगों के जरिए नकली लिंक फैलाते हैं।',
      ta: 'எந்த உண்மையான அரசு திட்டமும் செய்திகளைப் பகிரச் சொல்வதில்லை. நம்பகமானவர்கள் வழியாகப் போலி இணைப்பைப் பரப்ப இதை பயன்படுத்துகிறார்கள்.',
      ml: 'ഒരു യഥാർത്ഥ സർക്കാർ പദ്ധതിയും സന്ദേശങ്ങൾ ഫോർവേഡ് ചെയ്യാൻ ആവശ്യപ്പെടില്ല. വിശ്വസ്തർ വഴി വ്യാജ ലിങ്ക് പ്രചരിപ്പിക്കാനാണ് ഇത്.',
      kn: 'ಯಾವುದೇ ನಿಜವಾದ ಸರ್ಕಾರಿ ಯೋಜನೆ ಸಂದೇಶ ಫಾರ್ವರ್ಡ್ ಮಾಡಲು ಕೇಳುವುದಿಲ್ಲ. ನಕಲಿ ಲಿಂಕ್ ಹರಡಲು ಮೋಸಗಾರರು ಇದನ್ನು ಬಳಸುತ್ತಾರೆ.',
    },
    safeAction: {
      en: 'Do not forward it. Warn the person who sent it that the link could be fake.',
      te: 'ఫార్వర్డ్ చేయకండి. మీకు పంపిన వారికి కూడా ఇది నకిలీ కావచ్చు అని తెలియజేయండి.',
      hi: 'इसे फॉरवर्ड न करें। भेजने वाले को भी सावधान करें कि यह लिंक नकली हो सकता है।',
      ta: 'அதைப் பகிர வேண்டாம். அனுப்பியவருக்கும் இது போலியாக இருக்கலாம் எனத் தெரிவிக்கவும்.',
      ml: 'ഫോർവേഡ് ചെയ്യരുത്. അയച്ച വ്യക്തിക്കും ഇത് വ്യാജമാകാമെന്ന് മുന്നറിയിപ്പ് നൽകുക.',
      kn: 'ಫಾರ್ವರ್ಡ್ ಮಾಡಬೇಡಿ. ಕಳುಹಿಸಿದವರಿಗೂ ಇದು ನಕಲಿ ಇರಬಹುದು ಎಂದು ಎಚ್ಚರಿಸಿ.',
    },
  },
  {
    id: 'pattern-cyclone-relief',
    number: '06',
    illustrationKey: 'cyclone',
    title: {
      en: 'Urgent cyclone or flood relief claim link',
      te: 'తుఫాను లేదా వరద సహాయం పేరుతో తొందరపెట్టే లింక్',
      hi: 'तूफान या बाढ़ राहत के नाम पर जल्दबाजी वाला लिंक',
      ta: 'புயல் அல்லது வெள்ள நிவாரண அவசர இணைப்பு',
      ml: 'ചുഴലിക്കാറ്റ് അല്ലെങ്കിൽ പ്രളയ ദുരിതാശ്വാസ അടിയന്തര ലിങ്ക്',
      kn: 'ಚಂಡಮಾರುತ ಅಥವಾ ಪ್ರವಾಹ ಪರಿಹಾರದ ತುರ್ತು ಲಿಂಕ್',
    },
    howItLooks: {
      en: 'Right after cyclones or heavy rain, messages warn you will lose relief money unless you submit Aadhaar and bank details on an unknown site tonight.',
      te: 'తుఫాను లేదా భారీ వర్షాల తర్వాత "ఈరోజు రాత్రి లోపు ఈ లింక్‌లో ఆధార్, బ్యాంక్ వివరాలు ఇవ్వకపోతే సహాయం రాదు" అనే మెసేజ్ వస్తుంది.',
      hi: 'बाढ़ या तूफान के बाद संदेश आता है कि आज रात तक अनजान लिंक पर आधार और बैंक विवरण न देने पर राहत राशि नहीं मिलेगी।',
      ta: 'புயல் அல்லது கனமழைக்குப் பின், இன்றிரவுக்குள் அறியாத தளத்தில் ஆதார் மற்றும் வங்கி விவரம் தராவிட்டால் நிவாரணம் கிடைக்காது என செய்தி வரும்.',
      ml: 'കനത്ത മഴയ്ക്കോ പ്രളയത്തിനോ ശേഷം, ഇന്ന് രാത്രിയ്ക്കുള്ളിൽ അറിയാത്ത സൈറ്റിൽ ആധാറും ബാങ്ക് വിവരവും നൽകിയില്ലെങ്കിൽ സഹായം നഷ്ടമാകുമെന്ന് സന്ദേശം വരുന്നു.',
      kn: 'ಭಾರಿ ಮಳೆ ಅಥವಾ ಪ್ರವಾಹದ ನಂತರ, ಇಂದು ರಾತ್ರಿಯೊಳಗೆ ತಿಳಿಯದ ತಾಣದಲ್ಲಿ ಆಧಾರ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ವಿವರ ನೀಡದಿದ್ದರೆ ಪರಿಹಾರ ಸಿಗುವುದಿಲ್ಲ ಎಂದು ಸಂದೇಶ ಬರುತ್ತದೆ.',
    },
    redFlag: {
      en: 'Artificial same-night deadlines pushing you to enter bank details on an unverified site are a classic panic tactic.',
      te: 'అత్యవసర గడువు పెట్టి, ఆలోచించే సమయం ఇవ్వకుండా తెలియని వెబ్‌సైట్‌లో బ్యాంక్ వివరాలు అడగడం స్పష్టమైన హెచ్చరిక.',
      hi: 'जल्दबाजी की समय-सीमा दिखाकर असत्यापित वेबसाइट पर बैंक जानकारी मांगना धोखाधड़ी का साफ तरीका है।',
      ta: 'அவசர காலக்கெடு காட்டி சரிபார்க்கப்படாத தளத்தில் வங்கி விவரங்களைக் கேட்பது தெளிவான மோசடி தந்திரம்.',
      ml: 'ധൃതിപ്പെടുത്തി, സ്ഥിരീകരിക്കാത്ത സൈറ്റിൽ ബാങ്ക് വിവരങ്ങൾ ആവശ്യപ്പെടുന്നത് വ്യക്തമായ തട്ടിപ്പ് രീതിയാണ്.',
      kn: 'ತುರ್ತು ಗಡುವು ತೋರಿಸಿ ಪರಿಶೀಲಿಸದ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಬ್ಯಾಂಕ್ ವಿವರ ಕೇಳುವುದು ಸ್ಪಷ್ಟ ಮೋಸದ ತಂತ್ರ.',
    },
    safeAction: {
      en: 'Pause and do nothing yet. Verify relief announcements through your village secretariat or local revenue office.',
      te: 'తొందరపడకండి. తుఫాను సహాయ వివరాలు గ్రామ సచివాలయం లేదా తహసీల్దార్ కార్యాలయం ద్వారా మాత్రమే తెలుసుకోండి.',
      hi: 'जल्दबाजी न करें। राहत से जुड़ी जानकारी ग्राम सचिवालय या स्थानीय राजस्व कार्यालय से ही पुष्टि करें।',
      ta: 'அவசரப்பட வேண்டாம். நிவாரண அறிவிப்புகளை கிராம செயலகம் அல்லது வருவாய் அலுவலகம் மூலம் மட்டுமே உறுதிப்படுத்தவும்.',
      ml: 'തിടുക്കം കൂട്ടരുത്. ദുരിതാശ്വാസ വിവരങ്ങൾ വില്ലേജ് ഓഫീസ് വഴിയോ റവന്യൂ ഓഫീസ് വഴിയോ മാത്രം ഉറപ്പാക്കുക.',
      kn: 'ಅವಸರಪಡಬೇಡಿ. ಪರಿಹಾರದ ಮಾಹಿತಿಯನ್ನು ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಥವಾ ಸ್ಥಳೀಯ ಕಂದಾಯ ಕಚೇರಿಯ ಮೂಲಕ ಮಾತ್ರ ದೃಢಪಡಿಸಿ.',
    },
  },
];
