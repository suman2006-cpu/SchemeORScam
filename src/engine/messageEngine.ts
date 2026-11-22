import { REGISTRY_SEED } from '../data/registrySeed';
import { analyzeUrl, type LinkEngineOptions } from './linkEngine';
import { extractMessageEntities, extractUrls, normalizeText } from './normalize';
import type {
  CheckResult,
  DestinationInfo,
  FlagId,
  FlagItem,
  Language,
  LinkAnalysisResult,
  LocalizedText,
  MessageAuthenticityResult,
  MessageAuthenticityStatus,
  OfficialPathInfo,
  ReasonItem,
  RequestedAction,
  SchemeEntry,
  StatusTone,
  StructuredMessageExtraction,
  Verdict,
  WebsiteTrustResult,
} from './types';

/**
 * Templated reason text in all 6 supported languages (English, Telugu, Hindi, Tamil, Malayalam, Kannada).
 * Plain, everyday rural-friendly wording.
 */
const REASON_TEMPLATES: Record<FlagId, LocalizedText> = {
  H1_DOWNLOAD_FILE: {
    en: 'This link downloads an app or archive file (.apk / .zip). Official government schemes never send install files over messages.',
    te: 'ఈ లింక్ ఫోన్‌లో యాప్ లేదా ఫైల్ (.apk / .zip) డౌన్‌లోడ్ చేస్తుంది. ప్రభుత్వ పథకాల కోసం ఇలాంటి ఫైల్స్ పంపరు.',
    hi: 'यह लिंक फोन में ऐप या फाइल (.apk / .zip) डाउनलोड करता है। सरकारी योजनाओं के लिए संदेश में ऐसी फाइल नहीं भेजी जाती।',
    ta: 'இந்த இணைப்பு உங்கள் தொலைபேசியில் செயலி அல்லது கோப்பை (.apk / .zip) பதிவிறக்கும். அரசு திட்டங்கள் இப்படி கோப்புகளை அனுப்புவதில்லை.',
    ml: 'ഈ ലിങ്ക് ഫോണിലേക്ക് ആപ്പ് അല്ലെങ്കിൽ ഫയൽ (.apk / .zip) ഡൗൺലോഡ് ചെയ്യുന്നു. സർക്കാർ പദ്ധതികൾ ഇങ്ങനെ ഫയലുകൾ അയക്കാറില്ല.',
    kn: 'ಈ ಲಿಂಕ್ ಫೋನ್‌ನಲ್ಲಿ ಆ್ಯಪ್ ಅಥವಾ ಫೈಲ್ (.apk / .zip) ಡೌನ್‌ಲೋಡ್ ಮಾಡುತ್ತದೆ. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಹೀಗೆ ಫೈಲ್ ಕಳುಹಿಸುವುದಿಲ್ಲ.',
  },
  H2_SCHEME_TOKEN_NON_OFFICIAL: {
    en: 'The website name uses a scheme or e-KYC keyword, but it is not an official (.gov.in / .nic.in) government site.',
    te: 'వెబ్‌సైట్ పేరులో పథకం లేదా e-KYC పేరు ఉంది, కానీ ఇది ప్రభుత్వ (.gov.in / .nic.in) సైట్ కాదు.',
    hi: 'वेबसाइट के नाम में योजना या e-KYC शब्द है, लेकिन यह आधिकारिक सरकारी (.gov.in / .nic.in) वेबसाइट नहीं है।',
    ta: 'இணையதளப் பெயரில் அரசு திட்டம் அல்லது e-KYC பெயர் உள்ளது, ஆனால் இது அதிகாரப்பூர்வ அரசு (.gov.in / .nic.in) தளம் அல்ல.',
    ml: 'വെബ്‌സൈറ്റ് പേരിൽ പദ്ധതിയുടെയോ e-KYC-യുടെയോ പേരുണ്ട്, പക്ഷേ ഇത് ഔദ്യോഗിക സർക്കാർ (.gov.in / .nic.in) സൈറ്റല്ല.',
    kn: 'ವೆಬ್‌ಸೈಟ್ ಹೆಸರಿನಲ್ಲಿ ಯೋಜನೆ ಅಥವಾ e-KYC ಪದವಿದೆ, ಆದರೆ ಇದು ಅಧಿಕೃತ ಸರ್ಕಾರಿ (.gov.in / .nic.in) ತಾಣವಲ್ಲ.',
  },
  H3_LOOKALIKE_DOMAIN: {
    en: 'This address mimics an official government or trusted company website. Check the highlighted real destination domain.',
    te: 'ఇది అధికారిక ప్రభుత్వ లేదా ప్రముఖ సంస్థ వెబ్‌సైట్‌లా కనిపించే నకిలీ పేరు. అసలు చివరి డొమైన్ వేరేది.',
    hi: 'यह पता किसी आधिकारिक सरकारी या जानी-मानी कंपनी की वेबसाइट की नकल करता है। असली डोमेन अलग है।',
    ta: 'இந்த முகவரி அரசு அல்லது நம்பகமான நிறுவனத்தின் இணையதளத்தைப் போல் போலியாகத் தெரிகிறது. உண்மையான டொமைன் வேறு.',
    ml: 'ഈ വിലാസം ഔദ്യോഗിക സർക്കാർ അല്ലെങ്കിൽ വിശ്വസ്ത കമ്പനിയുടെ വെബ്‌സൈറ്റിനെ അനുകരിക്കുന്നു. യഥാർത്ഥ ഡൊമെയ്ൻ വേറെയാണ്.',
    kn: 'ಈ ವಿಳಾಸವು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಅಥವಾ ನಂಬಿಕಸ್ತ ಕಂಪನಿಯ ವೆಬ್‌ಸೈಟ್‌ನಂತೆ ನಕಲು ಮಾಡುತ್ತಿದೆ. ನಿಜವಾದ ಡೊಮೇನ್ ಬೇರೆಯಾಗಿದೆ.',
  },
  H4_PUNYCODE_OR_MIXED_SCRIPT: {
    en: 'This web address uses mixed-script lookalike characters or encoded punycode to disguise the real site.',
    te: 'ఈ లింక్ పేరులో అనుమానాస్పద వేరే భాష అక్షరాలు లేదా దాచిన కోడ్ (punycode) ఉంది.',
    hi: 'इस वेबसाइट के नाम में धोखा देने वाले अलग अक्षर या छिपा हुआ कोड (punycode) इस्तेमाल किया गया है।',
    ta: 'இந்த இணைய முகவரியில் ஏமாற்றும் வகையான வேறு மொழி எழுத்துகள் அல்லது மறைக்கப்பட்ட குறியீடு (punycode) உள்ளது.',
    ml: 'ഈ വെബ് വിലാസത്തിൽ തെറ്റിദ്ധരിപ്പിക്കുന്ന അക്ഷരങ്ങളോ ഒളിപ്പിച്ച കോഡോ (punycode) ഉപയോഗിച്ചിരിക്കുന്നു.',
    kn: 'ಈ ವೆಬ್ ವಿಳಾಸದಲ್ಲಿ ಮೋಸಗೊಳಿಸುವ ಬೇರೆ ಅಕ್ಷರಗಳು ಅಥವಾ ಅಡಗಿಸಿದ ಕೋಡ್ (punycode) ಬಳಸಲಾಗಿದೆ.',
  },
  H5_USERINFO_IP_OR_PORT: {
    en: 'This link uses a raw IP address, an "@" redirect trick, or a non-standard port. Official sites do not use these.',
    te: 'ఈ లింక్‌లో నేరుగా IP నంబర్, "@" గుర్తు లేదా అసాధారణ పోర్ట్ ఉంది. అధికారిక సైట్లు ఇలా ఉండవు.',
    hi: 'इस लिंक में सीधा IP नंबर, "@" चिह्न या असामान्य पोर्ट है। आधिकारिक वेबसाइटें ऐसा नहीं करतीं।',
    ta: 'இந்த இணைப்பில் நேரடி IP எண், "@" குறியீடு அல்லது வழக்கத்திற்கு மாறான போர்ட் உள்ளது. அதிகாரப்பூர்வ தளங்கள் இப்படி இருக்காது.',
    ml: 'ഈ ലിങ്കിൽ നേരിട്ടുള്ള IP നമ്പർ, "@" ചിഹ്നം, അല്ലെങ്കിൽ അസാധാരണ പോർട്ട് ഉണ്ട്. ഔദ്യോഗിക സൈറ്റുകൾ ഇങ്ങനെയല്ല.',
    kn: 'ಈ ಲಿಂಕ್‌ನಲ್ಲಿ ನೇರ IP ಸಂಖ್ಯೆ, "@" ಚಿಹ್ನೆ ಅಥವಾ ಅಸಾಮಾನ್ಯ ಪೋರ್ಟ್ ಇದೆ. ಅಧಿಕೃತ ತಾಣಗಳು ಹೀಗಿರುವುದಿಲ್ಲ.',
  },
  H6_UNSAFE_ASK: {
    en: 'This message asks you to share an OTP/PIN, pay a fee to release a benefit, share your screen, or install an app from a link.',
    te: 'ఈ మెసేజ్ OTP/PIN చెప్పమని, రుసుము కట్టమని, స్క్రీన్ షేర్ చేయమని లేదా తెలియని యాప్ ఇన్‌స్టాల్ చేయమని అడుగుతోంది.',
    hi: 'यह संदेश OTP/PIN बताने, लाभ पाने के लिए शुल्क देने, स्क्रीन शेयर करने या लिंक से ऐप इंस्टॉल करने को कह रहा है।',
    ta: 'இந்தச் செய்தி OTP/PIN பகிர, கட்டணம் செலுத்த, திரைப் பகிர்வு செய்ய அல்லது இணைப்பிலிருந்து செயலி நிறுவக் கேட்கிறது.',
    ml: 'ഈ സന്ദേശം OTP/PIN പങ്കിടാനോ, ഫീസ് അടയ്ക്കാനോ, സ്ക്രീൻ ഷെയർ ചെയ്യാനോ, ലിങ്കിൽ നിന്ന് ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാനോ ആവശ്യപ്പെടുന്നു.',
    kn: 'ಈ ಸಂದೇಶವು OTP/PIN ಹಂಚಿಕೊಳ್ಳಲು, ಶುಲ್ಕ ಪಾವತಿಸಲು, ಸ್ಕ್ರೀನ್ ಶೇರ್ ಮಾಡಲು ಅಥವಾ ಲಿಂಕ್‌ನಿಂದ ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಲು ಕೇಳುತ್ತಿದೆ.',
  },
  H7_FORWARD_CHAIN: {
    en: 'This message asks you to forward it to contacts or groups to claim a benefit. No official scheme requires forwarding.',
    te: 'సహాయం పొందాలంటే ఎక్కువ మందికి లేదా గ్రూపులకు ఫార్వర్డ్ చేయమని అడుగుతోంది. ఏ అధికారిక పథకమూ ఇలా అడగదు.',
    hi: 'लाभ पाने के लिए इसे और लोगों या ग्रुप में फॉरवर्ड करने को कहा गया है। कोई भी सरकारी योजना ऐसा नहीं कहती।',
    ta: 'உதவி பெற இதை பலருக்கும் குழுக்களுக்கும் பகிரச் சொல்கிறது. எந்த அரசு திட்டமும் இப்படி கேட்பதில்லை.',
    ml: 'ആനുകൂല്യം ലഭിക്കാൻ മറ്റുള്ളവർക്കും ഗ്രൂപ്പുകളിലേക്കും ഫോർവേഡ് ചെയ്യാൻ ആവശ്യപ്പെടുന്നു. ഒരു സർക്കാർ പദ്ധതിയും ഇത് ആവശ്യപ്പെടില്ല.',
    kn: 'ಸಹಾಯ ಪಡೆಯಲು ಇದನ್ನು ಇತರರಿಗೆ ಅಥವಾ ಗುಂಪುಗಳಿಗೆ ಫಾರ್ವರ್ಡ್ ಮಾಡಲು ಕೇಳುತ್ತಿದೆ. ಯಾವುದೇ ಸರ್ಕಾರಿ ಯೋಜನೆ ಹೀಗೆ ಕೇಳುವುದಿಲ್ಲ.',
  },
  H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE: {
    en: 'This link tries to launch an app directly or points to an app store entry not in the verified registry.',
    te: 'ఇది నేరుగా తెలియని యాప్ లేదా ధృవీకరించని స్టోర్ లింక్‌ను తెరుస్తుంది.',
    hi: 'यह लिंक सीधे किसी अनजान ऐप या असत्यापित ऐप स्टोर पेज को खोलने की कोशिश करता है।',
    ta: 'இந்த இணைப்பு நேரடியாக அறியப்படாத செயலி அல்லது சரிபார்க்கப்படாத ஆப் ஸ்டோர் பக்கத்தைத் திறக்கிறது.',
    ml: 'ഈ ലിങ്ക് നേരിട്ട് അറിയപ്പെടാത്ത ആപ്പോ പരിശോധിക്കാത്ത ആപ്പ് സ്റ്റോർ പേജോ തുറക്കാൻ ശ്രമിക്കുന്നു.',
    kn: 'ಈ ಲಿಂಕ್ ನೇರವಾಗಿ ತಿಳಿಯದ ಆ್ಯಪ್ ಅಥವಾ ಪರಿಶೀಲಿಸದ ಆ್ಯಪ್ ಸ್ಟೋರ್ ಪುಟವನ್ನು ತೆರೆಯಲು ಪ್ರಯತ್ನಿಸುತ್ತದೆ.',
  },
  H9_SHORTENER_TO_MALICIOUS: {
    en: 'This shortened link redirects to a dangerous or lookalike website.',
    te: 'ఈ చిన్న (shortened) లింక్ తెరిచినప్పుడు ప్రమాదకరమైన నకిలీ వెబ్‌సైట్‌కు తీసుకెళ్తుంది.',
    hi: 'यह छोटा (shortened) लिंक खोलने पर खतरनाक या नकली वेबसाइट पर ले जाता है।',
    ta: 'இந்தச் சுருக்கப்பட்ட இணைப்பு ஆபத்தான அல்லது போலி இணையதளத்திற்கு அழைத்துச் செல்கிறது.',
    ml: 'ഈ ചുരുക്കിയ ലിങ്ക് അപകടകരമായ അല്ലെങ്കിൽ വ്യാജ വെബ്‌സൈറ്റിലേക്കാണ് പോകുന്നത്.',
    kn: 'ಈ ಚಿಕ್ಕ (shortened) ಲಿಂಕ್ ಅಪಾಯಕಾರಿ ಅಥವಾ ನಕಲಿ ವೆಬ್‌ಸೈಟ್‌ಗೆ ಕರೆದೊಯ್ಯುತ್ತದೆ.',
  },
  H10_SAFE_BROWSING_MATCH: {
    en: 'This link is flagged as unsafe on Google Safe Browsing.',
    te: 'ఈ లింక్ మోసపూరిత సైట్‌గా భద్రతా జాబితాలో నమోదైంది.',
    hi: 'यह लिंक सुरक्षा सूची (Google Safe Browsing) में खतरनाक के रूप में दर्ज है।',
    ta: 'இந்த இணைப்பு பாதுகாப்புப் பட்டியலில் (Google Safe Browsing) ஆபத்தானது எனக் குறிக்கப்பட்டுள்ளது.',
    ml: 'ഈ ലിങ്ക് Google Safe Browsing സുരക്ഷാ പട്ടികയിൽ അപകടകരമായി രേഖപ്പെടുത്തിയിരിക്കുന്നു.',
    kn: 'ಈ ಲಿಂಕ್ Google Safe Browsing ಭದ್ರತಾ ಪಟ್ಟಿಯಲ್ಲಿ ಅಪಾಯಕಾರಿ ಎಂದು ಗುರುತಿಸಲ್ಪಟ್ಟಿದೆ.',
  },
  S1_NEW_DOMAIN: {
    en: 'This website domain was registered very recently (under 90 days ago). Treat it with caution.',
    te: 'ఈ వెబ్‌సైట్ ఇటీవలే (90 రోజుల లోపు) నమోదు చేయబడింది. జాగ్రత్తగా ఉండండి.',
    hi: 'यह वेबसाइट हाल ही में (90 दिनों के भीतर) बनाई गई है। सावधान रहें।',
    ta: 'இந்த இணையதளம் சமீபத்தில் (90 நாட்களுக்குள்) பதிவு செய்யப்பட்டது. கவனமாக இருங்கள்.',
    ml: 'ഈ വെബ്‌സൈറ്റ് അടുത്തിടെ (90 ദിവസത്തിനുള്ളിൽ) രജിസ്റ്റർ ചെയ്തതാണ്. ജാഗ്രത പാലിക്കുക.',
    kn: 'ಈ ವೆಬ್‌ಸೈಟ್ ಇತ್ತೀಚೆಗೆ (90 ದಿನಗಳ ಒಳಗೆ) ನೋಂದಾಯಿಸಲಾಗಿದೆ. ಎಚ್ಚರಿಕೆಯಿಂದಿರಿ.',
  },
  S2_NON_HTTPS: {
    en: 'This link does not use a secure HTTPS connection.',
    te: 'ఈ లింక్ సురక్షితమైన HTTPS కనెక్షన్ వాడటం లేదు.',
    hi: 'यह लिंक सुरक्षित HTTPS कनेक्शन का उपयोग नहीं करता है।',
    ta: 'இந்த இணைப்பு பாதுகாப்பான HTTPS இணைப்பைப் பயன்படுத்தவில்லை.',
    ml: 'ഈ ലിങ്ക് സുരക്ഷിതമായ HTTPS കണക്ഷൻ ഉപയോഗിക്കുന്നില്ല.',
    kn: 'ಈ ಲಿಂಕ್ ಸುರಕ್ಷಿತ HTTPS ಸಂಪರ್ಕವನ್ನು ಬಳಸುತ್ತಿಲ್ಲ.',
  },
  S3_UNRESOLVED_SHORTENER: {
    en: 'This is a shortened link and its final destination could not be confirmed. Do not click it.',
    te: 'ఇది చిన్న (shortened) లింక్ — అసలు వెబ్‌సైట్ ఏదో నిర్ధారణ కాలేదు. క్లిక్ చేయకండి.',
    hi: 'यह छोटा (shortened) लिंक है और इसकी असली वेबसाइट की पुष्टि नहीं हो सकी। क्लिक न करें।',
    ta: 'இது சுருக்கப்பட்ட இணைப்பு — இதன் உண்மையான இணையதளத்தை உறுதிப்படுத்த முடியவில்லை. கிளிக் செய்யாதீர்கள்.',
    ml: 'ഇത് ചുരുക്കിയ ലിങ്കാണ് — യഥാർത്ഥ വെബ്‌സൈറ്റ് സ്ഥിരീകരിക്കാനായില്ല. ക്ലിക്ക് ചെയ്യരുത്.',
    kn: 'ಇದು ಚಿಕ್ಕ (shortened) ಲಿಂಕ್ — ಇದರ ನಿಜವಾದ ವೆಬ್‌ಸೈಟ್ ದೃಢಪಟ್ಟಿಲ್ಲ. ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ.',
  },
  S4_HIGH_ABUSE_TLD: {
    en: 'This web ending (such as .xyz or .top) is commonly used in fake scheme links.',
    te: 'ఈ వెబ్‌సైట్ చివరి పేరు (.xyz, .top వంటివి) మోసపు లింకుల్లో ఎక్కువగా కనిపిస్తుంది.',
    hi: 'इस वेबसाइट का अंतिम हिस्सा (.xyz, .top आदि) अक्सर नकली लिंक में इस्तेमाल होता है।',
    ta: 'இந்த இணையதள முடிவு (.xyz, .top போன்றவை) போலி இணைப்புகளில் அதிகம் பயன்படுத்தப்படுகிறது.',
    ml: 'ഈ വെബ്‌സൈറ്റ് അവസാന ഭാഗം (.xyz, .top പോലുള്ളവ) വ്യാജ ലിങ്കുകളിൽ സാധാരണയായി കാണപ്പെടുന്നു.',
    kn: 'ಈ ವೆಬ್‌ಸೈಟ್ ಅಂತ್ಯ (.xyz, .top ಮುಂತಾದವು) ನಕಲಿ ಲಿಂಕ್‌ಗಳಲ್ಲಿ ಹೆಚ್ಚಾಗಿ ಕಾಣಸಿಗುತ್ತದೆ.',
  },
  S5_UNKNOWN_DOMAIN: {
    en: 'This website is not in our verified government or recognized company records. Unknown does not automatically mean fake — verify independently before sharing personal details.',
    te: 'ఈ వెబ్‌సైట్ మా అధికారిక ప్రభుత్వ లేదా గుర్తింపు పొందిన సంస్థల జాబితాలో లేదు. తెలియని సైట్ అయినంత మాత్రాన మోసం కానవసరం లేదు — కానీ వివరాలు ఇచ్చే ముందు జాగ్రత్తగా నిర్ధారించుకోండి.',
    hi: 'यह वेबसाइट हमारे सत्यापित सरकारी या जानी-मानी कंपनियों के रिकॉर्ड में नहीं है। अनजान होने का मतलब अपने आप नकली नहीं है — लेकिन जानकारी देने से पहले खुद जांचें।',
    ta: 'இந்த இணையதளம் எங்கள் சரிபார்க்கப்பட்ட அரசு அல்லது அறியப்பட்ட நிறுவனப் பட்டியலில் இல்லை. அறியப்படாதது என்பதால் தானாகவே போலி என்று அர்த்தமில்லை — தனிப்பட்ட விவரங்களைப் பகிரும் முன் சரிபார்க்கவும்.',
    ml: 'ഈ വെബ്‌സൈറ്റ് ഞങ്ങളുടെ സ്ഥിരീകരിച്ച സർക്കാർ അല്ലെങ്കിൽ അറിയപ്പെടുന്ന കമ്പനികളുടെ പട്ടികയിലില്ല. അറിയാത്തത് കൊണ്ട് മാത്രം വ്യാജമാകണമെന്നില്ല — വിവരങ്ങൾ നൽകുന്നതിന് മുമ്പ് സ്വയം പരിശോധിക്കുക.',
    kn: 'ಈ ವೆಬ್‌ಸೈಟ್ ನಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಸರ್ಕಾರಿ ಅಥವಾ ಗುರುತಿಸಲ್ಪಟ್ಟ ಕಂಪನಿಗಳ ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲ. ತಿಳಿಯದ ತಾಣವಾದ ಮಾತ್ರಕ್ಕೆ ನಕಲಿ ಎಂದಲ್ಲ — ವಿವರಗಳನ್ನು ನೀಡುವ ಮೊದಲು ಸ್ವತಂತ್ರವಾಗಿ ಪರಿಶೀಲಿಸಿ.',
  },
  S6_SCHEME_DOMAIN_MISMATCH: {
    en: 'This website is NOT the official government portal for the scheme or service mentioned in the message.',
    te: 'మెసేజ్‌లో చెప్పిన ప్రభుత్వ పథకం లేదా సేవ యొక్క అధికారిక వెబ్‌సైట్ ఇది కాదు.',
    hi: 'संदेश में बताई गई सरकारी योजना या सेवा की आधिकारिक वेबसाइट यह नहीं है।',
    ta: 'செய்தியில் குறிப்பிடப்பட்டுள்ள அரசு திட்டம் அல்லது சேவையின் அதிகாரப்பூர்வ இணையதளம் இது அல்ல.',
    ml: 'സന്ദേശത്തിൽ പറഞ്ഞിരിക്കുന്ന സർക്കാർ പദ്ധതിയുടെയോ സേവനത്തിന്റെയോ ഔദ്യോഗിക വെബ്‌സൈറ്റ് ഇതല്ല.',
    kn: 'ಸಂದೇಶದಲ್ಲಿ ಹೇಳಲಾದ ಸರ್ಕಾರಿ ಯೋಜನೆ ಅಥವಾ ಸೇವೆಯ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಇದಲ್ಲ.',
  },
  S7_NO_URL_UNVERIFIED_CLAIM: {
    en: 'No official government website link was found in this message. Confirm directly with your village secretariat or agriculture officer.',
    te: 'ఈ మెసేజ్‌లో అధికారిక వెబ్‌సైట్ లింక్ లేదు. గ్రామ సచివాలయంలో లేదా వ్యవసాయ అధికారిని అడిగి నిర్ధారించుకోండి.',
    hi: 'इस संदेश में कोई आधिकारिक सरकारी वेबसाइट लिंक नहीं है। अपने ग्राम सचिवालय या कृषि अधिकारी से सीधे पुष्टि करें।',
    ta: 'இந்தச் செய்தியில் அதிகாரப்பூர்வ அரசு இணையதள இணைப்பு இல்லை. உங்கள் கிராம செயலகம் அல்லது வேளாண்மை அலுவலரிடம் நேரடியாக உறுதிப்படுத்தவும்.',
    ml: 'ഈ സന്ദേശത്തിൽ ഔദ്യോഗിക സർക്കാർ വെബ്‌സൈറ്റ് ലിങ്ക് ഇല്ല. നിങ്ങളുടെ വില്ലേജ് ഓഫീസിലോ കൃഷി ഓഫീസറിലോ നേരിട്ട് അന്വേഷിച്ച് ഉറപ്പാക്കുക.',
    kn: 'ಈ ಸಂದೇಶದಲ್ಲಿ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ವೆಬ್‌ಸೈಟ್ ಲಿಂಕ್ ಇಲ್ಲ. ನಿಮ್ಮ ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಥವಾ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ನೇರವಾಗಿ ಕೇಳಿ ದೃಢಪಡಿಸಿಕೊಳ್ಳಿ.',
  },
  INFO_OFFICIAL_GOV_DOMAIN: {
    en: 'This link belongs to an official Indian government domain (.gov.in / .nic.in).',
    te: 'ఈ లింక్ అధికారిక భారత ప్రభుత్వ డొమైన్ (.gov.in / .nic.in) లో ఉంది.',
    hi: 'यह लिंक भारत सरकार के आधिकारिक डोमेन (.gov.in / .nic.in) से जुड़ा है।',
    ta: 'இந்த இணைப்பு அதிகாரப்பூர்வ இந்திய அரசு டொமைனுக்கு (.gov.in / .nic.in) சொந்தமானது.',
    ml: 'ഈ ലിങ്ക് ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ ഡൊമെയ്‌നിൽ (.gov.in / .nic.in) ഉൾപ്പെടുന്നു.',
    kn: 'ಈ ಲಿಂಕ್ ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಡೊಮೇನ್ (.gov.in / .nic.in) ಗೆ ಸೇರಿದೆ.',
  },
  INFO_OFFICIAL_REGISTRY_DOMAIN: {
    en: 'This link matches the official government scheme domain and has no red flags.',
    te: 'ఈ లింక్ ధృవీకరించబడిన అధికారిక పథకం డొమైన్‌తో సరిపోలుతోంది మరియు ప్రమాదకర గుర్తులు లేవు.',
    hi: 'यह लिंक आधिकारिक सरकारी योजना के डोमेन से मेल खाता है और इसमें कोई खतरा नहीं दिखा।',
    ta: 'இந்த இணைப்பு அதிகாரப்பூர்வ அரசு திட்ட டொமைனுடன் பொருந்துகிறது; எந்த ஆபத்தான அறிகுறியும் இல்லை.',
    ml: 'ഈ ലിങ്ക് ഔദ്യോഗിക സർക്കാർ പദ്ധതി ഡൊമെയ്‌നുമായി പൊരുത്തപ്പെടുന്നു; അപകട സൂചനകളൊന്നുമില്ല.',
    kn: 'ಈ ಲಿಂಕ್ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಯೋಜನೆಯ ಡೊಮೇನ್‌ಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಅಪಾಯದ ಸೂಚನೆ ಇಲ್ಲ.',
  },
  INFO_RECOGNIZED_COMPANY: {
    en: 'This is a recognized legitimate private company website — not an Indian government website.',
    te: 'ఇది గుర్తింపు పొందిన నిజమైన ప్రైవేట్ సంస్థ వెబ్‌సైట్ — భారత ప్రభుత్వ వెబ్‌సైట్ కాదు.',
    hi: 'यह एक जानी-मानी असली निजी कंपनी की वेबसाइट है — भारत सरकार की वेबसाइट नहीं है।',
    ta: 'இது அறியப்பட்ட உண்மையான தனியார் நிறுவன இணையதளம் — இந்திய அரசு இணையதளம் அல்ல.',
    ml: 'ഇത് അറിയപ്പെടുന്ന ഒരു യഥാർത്ഥ സ്വകാര്യ കമ്പനി വെബ്‌സൈറ്റാണ് — ഇന്ത്യൻ സർക്കാർ വെബ്‌സൈറ്റല്ല.',
    kn: 'ಇದು ಗುರುತಿಸಲ್ಪಟ್ಟ ನಿಜವಾದ ಖಾಸಗಿ ಕಂಪನಿ ವೆಬ್‌ಸೈಟ್ — ಭಾರತ ಸರ್ಕಾರದ ವೆಬ್‌ಸೈಟ್ ಅಲ್ಲ.',
  },
};

export function renderReason(flag: FlagItem): ReasonItem {
  const tpl = REASON_TEMPLATES[flag.id];
  return {
    id: flag.id,
    severity: flag.severity,
    en: tpl.en,
    te: tpl.te,
    hi: tpl.hi,
    ta: tpl.ta,
    ml: tpl.ml,
    kn: tpl.kn,
    evidence: flag.evidence,
  };
}

export function getReasonText(reason: ReasonItem, lang: Language): string {
  return reason[lang] || reason.en;
}

/**
 * Deterministic keyword/regex message extractor supporting all 6 languages
 * (English, Telugu, Hindi, Tamil, Malayalam, Kannada).
 */
export function deterministicExtractMessage(
  rawText: string,
  registry: SchemeEntry[] = REGISTRY_SEED,
): StructuredMessageExtraction {
  const text = normalizeText(rawText);
  const lower = text.toLowerCase();

  // Language detection across all 6 scripts
  let language: StructuredMessageExtraction['language'] = 'en';
  if (/[\u0C00-\u0C7F]/.test(text)) {
    language = 'te';
  } else if (/[\u0900-\u097F]/.test(text)) {
    language = 'hi';
  } else if (/[\u0B80-\u0BFF]/.test(text)) {
    language = 'ta';
  } else if (/[\u0D00-\u0D7F]/.test(text)) {
    language = 'ml';
  } else if (/[\u0C80-\u0CFF]/.test(text)) {
    language = 'kn';
  }

  // Scheme detection across all 6 languages
  let schemeMentioned: string | null = null;
  for (const scheme of registry) {
    const terms = [scheme.nameEn, scheme.nameTe, ...scheme.aliases];
    if (terms.some((term) => term && lower.includes(term.toLowerCase()))) {
      schemeMentioned = scheme.id;
      break;
    }
  }
  if (
    !schemeMentioned &&
    /(?:scholarship|స్కాలర్‌షిప్|విద్యార్థి\s*వేతనం|छात्रवृत्ति|கல்வி\s*உதவித்தொகை|സ്കോളർഷിപ്പ്|ವಿದ್ಯಾರ್ಥಿವೇತನ)/i.test(
      text,
    )
  ) {
    schemeMentioned = 'scholarship';
  }
  if (
    !schemeMentioned &&
    /(?:cyclone|flood|relief|తుఫాను|వరద|సహాయం|राहत|வெள்ளம்|നിവാരണം|പ്രളയ|ಪರಿಹಾರ)/i.test(
      text,
    )
  ) {
    schemeMentioned = 'cyclone-relief';
  }
  if (
    !schemeMentioned &&
    /(?:pension|ration|subsidy|yojana|government\s*scheme|govt\s*scheme|ప్రభుత్వ\s*పథకం|రేషన్|పింఛన్|सरकारी\s*योजना|राशन|पेंशन|அரசு\s*திட்டம்|ரேஷன்|ஓய்வூதியம்|സർക്കാർ\s*പദ്ധതി|റേഷൻ|പെൻഷൻ|ಸರ್ಕಾರಿ\s*ಯೋಜನೆ|ಪಡಿತರ|ಪಿಂಚಣಿ)/i.test(
      text,
    )
  ) {
    schemeMentioned = 'government-scheme';
  }

  const requestedActions = new Set<RequestedAction>();

  if (
    /\b(?:e[\s-]?kyc|kyc)\b|ఈ-?కెవైసీ|కెవైసీ|केवाईसी|கேஒய்சி|ഇ-?കെവൈസി|ಇ-?ಕೆವೈಸಿ/i.test(
      text,
    )
  ) {
    requestedActions.add('ekyc');
  }
  if (
    /\b(?:register|registration|apply|enroll|update)\b|నమోదు|దరఖాస్తు|రిజిస్ట్రేషన్|అప్‌డేట్|पंजीकरण|आवेदन|अपडेट|பதிவு|விண்ணப்பிக்க|புதுப்பிக்க|രജിസ്റ്റർ|അപേക്ഷിക്കുക|അപ്ഡേറ്റ്|ನೋಂದಣಿ|ಅರ್ಜಿ|ನವೀಕರಿಸಿ/i.test(
      text,
    )
  ) {
    requestedActions.add('register');
  }
  if (
    /\b(?:claim|collect|receive|credit|installment|subsidy|benefit|scholarship)\b|సబ్సిడీ|విడత|సహాయం|క్లెయిమ్|किस्त|सब्सिडी|लाभ|छात्रवृत्ति|மானியம்|உதவித்தொகை|സബ്സിഡി|ആനുകൂല്യം|ಸಬ್ಸಿಡಿ|ಕಂತು|ಸೌಲಭ್ಯ/i.test(
      text,
    )
  ) {
    requestedActions.add('claim');
  }

  // Fee to release benefit
  const asksFee =
    /(?:pay|send|deposit|transfer|fee|charge|processing|registration\s*fee|qr|upi\s*pay|కట్టండి|చెల్లించండి|ఫీజు|రుసుము|పంపండి|शुल्क|फीस|भुगतान|கட்டணம்|செலுத்த|ഫീസ്|അടയ്ക്കുക|ಶುಲ್ಕ|ಪಾವತಿಸಿ)/i.test(
      text,
    ) &&
    /(?:₹|rs\.?|inr|రూ\.?|fee|charge|upi|qr|ఫీజు|రుసుము|రూపాయలు|रुपये|शुल्क|फीस|ரூபாய்|கட்டணம்|രൂപ|ഫീസ്|ರೂಪಾಯಿ|ಶುಲ್ಕ)/i.test(
      text,
    );
  if (asksFee) {
    requestedActions.add('pay_fee');
  }

  // OTP shared with a person (phone call / reply / WhatsApp / tell me)
  const mentionsOtpOrPin =
    /\b(?:otp|upi\s*pin|atm\s*pin|cvv|password|mpin)\b|ఓటీపీ|ఓటిపి|పిన్|పాస్‌వర్డ్|ओटीपी|पिन|ஓடிபி|பின்|ഒടിപി|പിൻ|ಒಟಿಪಿ|ಪಿನ್/i.test(
      text,
    );
  const asksShareWithPerson =
    mentionsOtpOrPin &&
    /(?:tell|read\s*out|share|send\s*(?:me|us|back|here|on\s*whatsapp)|reply|call\s*and\s*give|give\s*(?:me|us|your)|చెప్పండి|పంపండి|షేర్|తెలియజేయండి|बताएं|भेजें|शेयर|சொல்லுங்கள்|அனுப்புங்கள்|பகிரவும்|പറയുക|അയയ്ക്കുക|പങ്കിടുക|ಹೇಳಿ|ಕಳುಹಿಸಿ|ಹಂಚಿಕೊಳ್ಳಿ)/i.test(
      text,
    );
  if (asksShareWithPerson) {
    requestedActions.add('share_otp_with_person');
  } else if (mentionsOtpOrPin) {
    requestedActions.add('enter_otp_on_page');
  }

  // Screen sharing / remote access
  if (
    /(?:anydesk|teamviewer|quicksupport|rustdesk|screen\s*shar|స్క్రీన్\s*షేర్|ఎనీడెస్క్|स्क्रीन\s*शेयर|திரை\s*பகிர்வு|സ്ക്രീൻ\s*ഷെയർ|ಸ್ಕ್ರೀನ್\s*ಶೇರ್)/i.test(
      text,
    )
  ) {
    requestedActions.add('install_app');
  }

  // Install app from file or link
  if (
    /(?:install|download\s*(?:the\s*)?app|\.apk|యాప్\s*ఇన్‌స్టాల్|డౌన్‌లోడ్\s*చేయండి|ఇన్‌స్టాల్\s*చేయండి|ऐप\s*इंस्टॉल|डाउनलोड\s*करें|செயலி\s*நிறுவ|பதிவிறக்க|ആപ്പ്\s*ഇൻസ്റ്റാൾ|ഡൗൺലോഡ്|ಆ್ಯಪ್\s*ಇನ್‌ಸ್ಟಾಲ್|ಡೌನ್‌ಲೋಡ್)/i.test(
      text,
    )
  ) {
    requestedActions.add('install_app');
  }

  // Enter bank or card details
  if (
    /(?:bank\s*(?:account|details)|debit\s*card|credit\s*card|card\s*number|ifsc|cvv|బ్యాంక్\s*వివరాలు|ఖాతా\s*నంబర్|కార్డ్\s*నంబర్|बैंक\s*विवरण|खाता\s*नंबर|வங்கி\s*விவரம்|கணக்கு\s*எண்|ബാങ്ക്\s*വിവരങ്ങൾ|അക്കൗണ്ട്\s*നമ്പർ|ಬ್ಯಾಂಕ್\s*ವಿವರ|ಖಾತೆ\s*ಸಂಖ್ಯೆ)/i.test(
      text,
    )
  ) {
    requestedActions.add('enter_bank_details');
  }

  // Forward chain
  const asksToForward =
    /(?:forward|share)\s*(?:this|it|message|link)?\s*(?:to|with)?\s*(?:\d+\s*(?:groups?|contacts?|friends?|people|members)|all\s*groups|everyone)|(?:ఫార్వర్డ్|షేర్)\s*చేయండి|(?:మందికి|గ్రూపులకు|గ్రూపుల్లో)\s*(?:పంపండి|ఫార్వర్డ్|షేర్)|(?:\d+\s*(?:మందికి|గ్రూపులకు|लोगों|ग्रुप|நபர்களுக்கு|குழுக்களுக்கு|പേർക്ക്|ഗ്രൂപ്പുകളിലേക്ക്|ಜನರಿಗೆ|ಗುಂಪುಗಳಿಗೆ))/i.test(
      text,
    );
  if (asksToForward) {
    requestedActions.add('forward');
  }

  // Call number
  if (
    /(?:call\s*(?:now|us|this|immediately)?|ఫోన్\s*చేయండి|కాల్\s*చేయండి|कॉल\s*करें|அழைக்கவும்|വിളിക്കുക|ಕರೆ\s*ಮಾಡಿ)/i.test(
      text,
    )
  ) {
    requestedActions.add('call_number');
  }

  const entities = extractMessageEntities(text);
  const mentionsMoney =
    entities.amounts.length > 0 ||
    /(?:₹|rs\.?|rupees?|money|amount|subsidy|payment|రూ\.?|డబ్బు|సబ్సిడీ|రాయితీ|पैसे|रुपये|ரூபாய்|பணம்|രൂപ|പണം|ರೂಪಾಯಿ|ಹಣ)/i.test(
      text,
    );

  return {
    scheme_mentioned: schemeMentioned,
    claimed_sender: null,
    requested_actions: Array.from(requestedActions),
    urgency_phrases: entities.deadlines.slice(0, 5),
    asks_to_forward: asksToForward,
    mentions_money: mentionsMoney,
    language,
  };
}

/**
 * Merges LLM structured extraction with deterministic extraction so prompt
 * injection cannot erase rule-detected dangerous asks (H6 / H7).
 */
export function mergeExtractions(
  deterministic: StructuredMessageExtraction,
  llm?: StructuredMessageExtraction | null,
): StructuredMessageExtraction {
  if (!llm) return deterministic;

  const mergedActions = new Set<RequestedAction>([
    ...deterministic.requested_actions,
    ...llm.requested_actions,
  ]);

  return {
    scheme_mentioned: deterministic.scheme_mentioned ?? llm.scheme_mentioned,
    claimed_sender: llm.claimed_sender ?? deterministic.claimed_sender,
    requested_actions: Array.from(mergedActions),
    urgency_phrases: Array.from(
      new Set([...deterministic.urgency_phrases, ...llm.urgency_phrases]),
    ).slice(0, 5),
    asks_to_forward: deterministic.asks_to_forward || llm.asks_to_forward,
    mentions_money: deterministic.mentions_money || llm.mentions_money,
    language: deterministic.language !== 'en' ? deterministic.language : llm.language,
    ai_explanation: llm.ai_explanation ?? null,
  };
}

function resolveSchemeEntry(
  schemeHint: string | null,
  linkResults: LinkAnalysisResult[],
  registry: SchemeEntry[],
): SchemeEntry | null {
  for (const lr of linkResults) {
    if (lr.matchedSchemeId) {
      const found = registry.find((s) => s.id === lr.matchedSchemeId);
      if (found) return found;
    }
  }
  if (!schemeHint) return null;
  const h = schemeHint.toLowerCase();
  return (
    registry.find(
      (s) =>
        s.id.toLowerCase() === h ||
        s.nameEn.toLowerCase().includes(h) ||
        s.nameTe.toLowerCase().includes(h) ||
        s.aliases.some(
          (a) => h.includes(a.toLowerCase()) || a.toLowerCase().includes(h),
        ),
    ) ?? null
  );
}

function detectGovernmentClaimInText(
  normalized: string,
  extraction: StructuredMessageExtraction,
  scheme: SchemeEntry | null,
): boolean {
  if (scheme || extraction.scheme_mentioned) return true;
  if (
    extraction.claimed_sender &&
    /(?:gov|govt|government|ministry|department|uidai|aadhaar|kisan|collector|secretariat|sarkar|ప్రభుత్వ|सरकार|அரசு|സർക്കാർ|ಸರ್ಕಾರ)/i.test(
      extraction.claimed_sender,
    )
  ) {
    return true;
  }
  return /(?:government|govt\.?|ministry|yojana|scheme|scholarship|subsidy|e[\s-]?kyc|aadhaar|aadhar|ration\s*card|pension|pm[\s-]?kisan|pmfby|ప్రభుత్వ|పథకం|స్కాలర్‌షిప్|सरकार|योजना|छात्रवृत्ति|அரசு|திட்டம்|கல்வி\s*உதவித்தொகை|സർക്കാർ|പദ്ധതി|സ്കോളർഷിപ്പ്|ಸರ್ಕಾರ|ಯೋಜನೆ|ವಿದ್ಯಾರ್ಥಿವೇತನ)/i.test(
    normalized,
  );
}

export interface ExpandedUrlInfo {
  originalUrl: string;
  finalUrl: string;
  wasShortener: boolean;
  unresolved?: boolean;
  serverContentType?: string;
  serverAttachmentFilename?: string;
  safeBrowsingMatch?: boolean;
  domainAgeDays?: number | null;
}

export interface AssembleCheckInput {
  rawText: string;
  targetLang?: Language;
  registry?: SchemeEntry[];
  llmExtraction?: StructuredMessageExtraction | null;
  expandedUrls?: Map<string, ExpandedUrlInfo>;
  engineMode?: 'rules+llm' | 'rules-only';
}

const FLAG_PRIORITY: Record<FlagId, number> = {
  H1_DOWNLOAD_FILE: 1,
  H6_UNSAFE_ASK: 2,
  H3_LOOKALIKE_DOMAIN: 3,
  H2_SCHEME_TOKEN_NON_OFFICIAL: 4,
  H9_SHORTENER_TO_MALICIOUS: 5,
  H4_PUNYCODE_OR_MIXED_SCRIPT: 6,
  H5_USERINFO_IP_OR_PORT: 7,
  H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE: 8,
  H7_FORWARD_CHAIN: 9,
  H10_SAFE_BROWSING_MATCH: 10,
  S6_SCHEME_DOMAIN_MISMATCH: 11,
  S3_UNRESOLVED_SHORTENER: 12,
  S1_NEW_DOMAIN: 13,
  S4_HIGH_ABUSE_TLD: 14,
  S2_NON_HTTPS: 15,
  S5_UNKNOWN_DOMAIN: 16,
  S7_NO_URL_UNVERIFIED_CLAIM: 17,
  INFO_OFFICIAL_REGISTRY_DOMAIN: 18,
  INFO_OFFICIAL_GOV_DOMAIN: 19,
  INFO_RECOGNIZED_COMPANY: 20,
};

function buildWebsiteTrustResult(
  primaryLr: LinkAnalysisResult | null,
  matchesMentionedScheme: boolean | null,
): WebsiteTrustResult {
  if (!primaryLr) {
    return {
      category: 'NO_URL',
      tone: 'neutral',
      domain: '',
      hostname: '',
      subdomain: '',
      organizationName: null,
      categoryLabel: null,
      description: {
        en: 'No website link was found in this submission. Only the message text was analyzed.',
        te: 'ఈ మెసేజ్‌లో వెబ్‌సైట్ లింక్ లేదు. మెసేజ్ వివరాలు మాత్రమే పరిశీలించబడ్డాయి.',
        hi: 'इस संदेश में कोई वेबसाइट लिंक नहीं मिला। केवल संदेश के शब्दों की जांच की गई।',
        ta: 'இந்தச் செய்தியில் எந்த இணையதள இணைப்பும் இல்லை. செய்தியின் உள்ளடக்கம் மட்டுமே சரிபார்க்கப்பட்டது.',
        ml: 'ഈ സന്ദേശത്തിൽ വെബ്‌സൈറ്റ് ലിങ്കുകളൊന്നും കണ്ടെത്തിയില്ല. സന്ദേശത്തിലെ വിവരങ്ങൾ മാത്രം പരിശോധിച്ചു.',
        kn: 'ಈ ಸಂದೇಶದಲ್ಲಿ ಯಾವುದೇ ವೆಬ್‌ಸೈಟ್ ಲಿಂಕ್ ಕಂಡುಬಂದಿಲ್ಲ. ಸಂದೇಶದ ಪಠ್ಯವನ್ನು ಮಾತ್ರ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.',
      },
      matchesMentionedScheme: null,
      flags: [],
    };
  }

  const domain = primaryLr.registrableDomain || primaryLr.hostname;
  const urlReasonItems = primaryLr.flags.map(renderReason);

  if (primaryLr.trustCategory === 'OFFICIAL_GOV') {
    const entity = primaryLr.recognizedEntity;
    return {
      category: 'OFFICIAL_GOV',
      tone: 'green',
      domain,
      hostname: primaryLr.hostname,
      subdomain: primaryLr.subdomain,
      organizationName: entity
        ? entity.name
        : {
            en: 'Official Indian Government Portal',
            te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్',
            hi: 'आधिकारिक भारत सरकार पोर्टल',
            ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம்',
            ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ',
            kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್',
          },
      categoryLabel: entity
        ? entity.category
        : {
            en: 'Official Government Website (.gov.in / .nic.in)',
            te: 'అధికారిక ప్రభుత్వ వెబ్‌సైట్ (.gov.in / .nic.in)',
            hi: 'आधिकारिक सरकारी वेबसाइट (.gov.in / .nic.in)',
            ta: 'அதிகாரப்பூர்வ அரசு இணையதளம் (.gov.in / .nic.in)',
            ml: 'ഔദ്യോഗിക സർക്കാർ വെബ്‌സൈറ്റ് (.gov.in / .nic.in)',
            kn: 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ವೆಬ್‌ಸೈಟ್ (.gov.in / .nic.in)',
          },
      description: entity
        ? entity.description
        : {
            en: `${domain} is an official Indian government domain (.gov.in / .nic.in).`,
            te: `${domain} అనేది అధికారిక భారత ప్రభుత్వ డొమైన్ (.gov.in / .nic.in).`,
            hi: `${domain} भारत सरकार का आधिकारिक डोमेन (.gov.in / .nic.in) है।`,
            ta: `${domain} என்பது அதிகாரப்பூர்வ இந்திய அரசு டொமைன் (.gov.in / .nic.in).`,
            ml: `${domain} ഒരു ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ ഡൊമെയ്‌നാണ് (.gov.in / .nic.in).`,
            kn: `${domain} ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಡೊಮೇನ್ ಆಗಿದೆ (.gov.in / .nic.in).`,
          },
      matchesMentionedScheme,
      flags: urlReasonItems,
    };
  }

  if (primaryLr.trustCategory === 'RECOGNIZED_COMPANY' && primaryLr.recognizedEntity) {
    const entity = primaryLr.recognizedEntity;
    return {
      category: 'RECOGNIZED_COMPANY',
      tone: 'green',
      domain,
      hostname: primaryLr.hostname,
      subdomain: primaryLr.subdomain,
      organizationName: entity.name,
      categoryLabel: entity.category,
      description: entity.description,
      matchesMentionedScheme,
      flags: urlReasonItems,
    };
  }

  if (primaryLr.trustCategory === 'POTENTIALLY_UNSAFE') {
    return {
      category: 'POTENTIALLY_UNSAFE',
      tone: 'red',
      domain,
      hostname: primaryLr.hostname,
      subdomain: primaryLr.subdomain,
      organizationName: null,
      categoryLabel: {
        en: 'Potentially Unsafe or Impersonating Website',
        te: 'ప్రమాదకర లేదా నకిలీ వెబ్‌సైట్ అవకాశం',
        hi: 'संभावित असुरक्षित या नकली वेबसाइट',
        ta: 'ஆபத்தான அல்லது போலி இணையதளம் இருக்கலாம்',
        ml: 'അപകടകരമായ അല്ലെങ്കിൽ വ്യാജ വെബ്‌സൈറ്റ് ആകാൻ സാധ്യത',
        kn: 'ಅಪಾಯಕಾರಿ ಅಥವಾ ನಕಲಿ ವೆಬ್‌ಸೈಟ್ ಸಾಧ್ಯತೆ',
      },
      description: {
        en: `Warning: ${primaryLr.hostname} shows strong danger or impersonation signs. Do not proceed without verifying through the official website.`,
        te: `హెచ్చరిక: ${primaryLr.hostname} లో నకిలీ లేదా ప్రమాదకర గుర్తులు ఉన్నాయి. అధికారిక వెబ్‌సైట్ ద్వారా నిర్ధారించకుండా ముందుకు వెళ్ళకండి.`,
        hi: `चेतावनी: ${primaryLr.hostname} में नकल या खतरे के स्पष्ट संकेत हैं। आधिकारिक वेबसाइट से पुष्टि किए बिना आगे न बढ़ें।`,
        ta: `எச்சரிக்கை: ${primaryLr.hostname} தளத்தில் ஆபத்தான அல்லது போலி அறிகுறிகள் உள்ளன. அதிகாரப்பூர்வ தளத்தில் உறுதிப்படுத்தாமல் தொடர வேண்டாம்.`,
        ml: `മുന്നറിയിപ്പ്: ${primaryLr.hostname} സൈറ്റിൽ വ്യാജമോ അപകടകരമോ ആയ സൂചനകളുണ്ട്. ഔദ്യോഗിക വെബ്‌സൈറ്റ് വഴി ഉറപ്പാക്കാതെ മുന്നോട്ട് പോകരുത്.`,
        kn: `ಎಚ್ಚರಿಕೆ: ${primaryLr.hostname} ತಾಣದಲ್ಲಿ ನಕಲಿ ಅಥವಾ ಅಪಾಯದ ಸ್ಪಷ್ಟ ಸೂಚನೆಗಳಿವೆ. ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ದೃಢಪಡಿಸದೆ ಮುಂದುವರಿಯಬೇಡಿ.`,
      },
      matchesMentionedScheme,
      flags: urlReasonItems,
    };
  }

  // UNKNOWN_UNCONFIRMED (AMBER — never automatically fraudulent)
  return {
    category: 'UNKNOWN_UNCONFIRMED',
    tone: 'amber',
    domain,
    hostname: primaryLr.hostname,
    subdomain: primaryLr.subdomain,
    organizationName: null,
    categoryLabel: {
      en: 'Unknown or Unconfirmed Website',
      te: 'నిర్ధారణ కాని వెబ్‌సైట్',
      hi: 'अज्ञात या असत्यापित वेबसाइट',
      ta: 'அறியப்படாத அல்லது உறுதிப்படுத்தப்படாத தளம்',
      ml: 'അറിയപ്പെടാത്ത അല്ലെങ്കിൽ സ്ഥിരീകരിക്കാത്ത വെബ്‌സൈറ്റ്',
      kn: 'ತಿಳಿಯದ ಅಥವಾ ದೃಢಪಡದ ವೆಬ್‌ಸೈಟ್',
    },
    description: {
      en: `The identity of ${domain || primaryLr.hostname} could not be confirmed in our official government or recognized company records. Unknown does not automatically mean malicious — verify the website independently before entering personal details.`,
      te: `${domain || primaryLr.hostname} మా అధికారిక ప్రభుత్వ లేదా గుర్తింపు పొందిన సంస్థల జాబితాలో నిర్ధారణ కాలేదు. తెలియని సైట్ అయినంత మాత్రాన మోసం కానవసరం లేదు — కానీ వ్యక్తిగత వివరాలు ఇచ్చే ముందు స్వయంగా నిర్ధారించుకోండి.`,
      hi: `${domain || primaryLr.hostname} की पहचान हमारे आधिकारिक सरकारी या जानी-मानी कंपनी के रिकॉर्ड में नहीं हो सकी। अनजान वेबसाइट अपने आप खतरनाक नहीं होती — लेकिन निजी जानकारी देने से पहले खुद जांचें।`,
      ta: `${domain || primaryLr.hostname} தளத்தின் அடையாளம் எங்கள் அரசு அல்லது அறியப்பட்ட நிறுவனப் பட்டியலில் உறுதிப்படுத்தப்படவில்லை. அறியப்படாதது என்பதால் தானாகவே மோசடி என்று அர்த்தமில்லை — தனிப்பட்ட தகவல்களை உள்ளிடும் முன் தனியாக சரிபார்க்கவும்.`,
      ml: `${domain || primaryLr.hostname} ഞങ്ങളുടെ ഔദ്യോഗിക സർക്കാർ അല്ലെങ്കിൽ അറിയപ്പെടുന്ന കമ്പനി പട്ടികയിൽ സ്ഥിരീകരിക്കാനായില്ല. അറിയാത്തത് കൊണ്ട് മാത്രം അപകടമാകണമെന്നില്ല — വ്യക്തിഗത വിവരങ്ങൾ നൽകുന്നതിന് മുമ്പ് സ്വതಂತ್ರമായി പരിശോധിക്കുക.`,
      kn: `${domain || primaryLr.hostname} ನಮ್ಮ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಅಥವಾ ಗುರುತಿಸಲ್ಪಟ್ಟ ಕಂಪನಿಗಳ ಪಟ್ಟಿಯಲ್ಲಿ ದೃಢಪಟ್ಟಿಲ್ಲ. ತಿಳಿಯದ ವೆಬ್‌ಸೈಟ್ ಎಂದರೆ ತಾನಾಗಿಯೇ ಮೋಸ ಎಂದಲ್ಲ — ವೈಯಕ್ತಿಕ ವಿವರಗಳನ್ನು ನೀಡುವ ಮೊದಲು ಸ್ವತಂತ್ರವಾಗಿ ಪರಿಶೀಲಿಸಿ.`,
    },
    matchesMentionedScheme,
    flags: urlReasonItems,
  };
}

function buildMessageAuthenticityResult(params: {
  hasNonUrlProse: boolean;
  hasGovernmentClaim: boolean;
  allLinksOfficial: boolean;
  linkCount: number;
  hasRecognizedCompanyLink: boolean;
  messageFlags: FlagItem[];
  detectedLanguage: Language | 'other';
  aiExplanation?: string | null;
  targetLang: Language;
  hasUnsafeUrl: boolean;
}): MessageAuthenticityResult {
  const {
    hasNonUrlProse,
    hasGovernmentClaim,
    allLinksOfficial,
    linkCount,
    hasRecognizedCompanyLink,
    messageFlags,
    detectedLanguage,
    aiExplanation,
    targetLang,
    hasUnsafeUrl,
  } = params;

  const reasonItems = messageFlags.map(renderReason);
  const hasMessageHard = messageFlags.some((f) => f.severity === 'hard');
  const hasMismatch = messageFlags.some((f) => f.id === 'S6_SCHEME_DOMAIN_MISMATCH');

  let status: MessageAuthenticityStatus;
  let tone: StatusTone;
  let summary: LocalizedText;

  if (!hasNonUrlProse && !hasGovernmentClaim && !hasMessageHard) {
    status = 'NO_MESSAGE_CLAIM';
    tone = 'neutral';
    summary = {
      en: 'Only a website link was entered without a scheme message. Review the Website Trust result above.',
      te: 'మెసేజ్ లేకుండా కేవలం వెబ్‌సైట్ లింక్ మాత్రమే ఇచ్చారు. పైన ఉన్న వెబ్‌సైట్ నమ్మక స్థాయిని చూడండి.',
      hi: 'केवल वेबसाइट लिंक दिया गया है, कोई सरकारी संदेश नहीं। ऊपर वेबसाइट की विश्वसनीयता देखें।',
      ta: 'செய்தி இல்லாமல் இணையதள இணைப்பு மட்டுமே கொடுக்கப்பட்டுள்ளது. மேலே உள்ள இணையதள நம்பகத்தன்மையைப் பார்க்கவும்.',
      ml: 'സന്ദേശമില്ലാതെ വെബ്‌സൈറ്റ് ലിങ്ക് മാത്രമാണ് നൽകിയത്. മുകളിലെ വെബ്‌സൈറ്റ് വിശ്വാസ്യത പരിശോധിക്കുക.',
      kn: 'ಯಾವುದೇ ಸಂದೇಶವಿಲ್ಲದೆ ಕೇವಲ ವೆಬ್‌ಸೈಟ್ ಲಿಂಕ್ ನೀಡಲಾಗಿದೆ. ಮೇಲಿನ ವೆಬ್‌ಸೈಟ್ ನಂಬಿಕೆಯನ್ನು ನೋಡಿ.',
    };
  } else if (hasMessageHard || (hasGovernmentClaim && hasUnsafeUrl)) {
    status = 'SUSPICIOUS_OR_FAKE';
    tone = 'red';
    summary = {
      en: 'This message shows strong signs of a scam or false government claim. Do not follow its instructions or share personal details.',
      te: 'ఈ మెసేజ్‌లో మోసం లేదా నకిలీ ప్రభుత్వ ప్రకటనకు బలమైన గుర్తులు ఉన్నాయి. ఇందులోని సూచనలు పాటించకండి, వివరాలు ఇవ్వకండి.',
      hi: 'इस संदेश में धोखाधड़ी या झूठे सरकारी दावे के मजबूत संकेत हैं। इसके निर्देश न मानें और निजी जानकारी साझा न करें।',
      ta: 'இந்தச் செய்தியில் மோசடி அல்லது போலி அரசு அறிவிப்பிற்கான வலுவான அறிகுறிகள் உள்ளன. இதன் அறிவுறுத்தல்களைப் பின்பற்ற வேண்டாம்.',
      ml: 'ഈ സന്ദേശത്തിൽ തട്ടിപ്പിന്റെയോ വ്യാജ സർക്കാർ അവകാശവാദത്തിന്റെയോ ശക്തമായ സൂചനകളുണ്ട്. ഇതിലെ നിർദ്ദേശങ്ങൾ പാലിക്കരുത്.',
      kn: 'ಈ ಸಂದೇಶದಲ್ಲಿ ಮೋಸ ಅಥವಾ ನಕಲಿ ಸರ್ಕಾರಿ ಪ್ರಕಟಣೆಯ ಬಲವಾದ ಸೂಚನೆಗಳಿವೆ. ಇದರ ಸೂಚನೆಗಳನ್ನು ಪಾಲಿಸಬೇಡಿ ಮತ್ತು ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.',
    };
  } else if (hasGovernmentClaim && hasRecognizedCompanyLink && !allLinksOfficial) {
    status = 'SUSPICIOUS_OR_FAKE';
    tone = 'red';
    summary = {
      en: 'Warning: Although the website link belongs to a recognized private company, it is NOT an official government portal. A message claiming an official government action via a private company link is likely misleading or fraudulent.',
      te: 'హెచ్చరిక: ఈ లింక్ నిజమైన ప్రైవేట్ సంస్థది అయినప్పటికీ, ఇది ప్రభుత్వ పోర్టల్ కాదు. ప్రైవేట్ సంస్థ లింక్ ద్వారా ప్రభుత్వ పథకం అప్‌డేట్ చేయమనే మెసేజ్ నకిలీ లేదా తప్పుదారి పట్టించేది కావచ్చు.',
      hi: 'चेतावनी: भले ही लिंक किसी असली निजी कंपनी की वेबसाइट का है, लेकिन यह सरकारी पोर्टल नहीं है। निजी कंपनी के लिंक के जरिए सरकारी योजना का काम करने वाला संदेश भ्रामक या नकली हो सकता है।',
      ta: 'எச்சரிக்கை: இணைப்பு உண்மையான தனியார் நிறுவனத்தின் தளமாக இருந்தாலும், அது அரசு தளம் அல்ல. தனியார் நிறுவன இணைப்பு மூலம் அரசு திட்ட அறிவிப்பு கூறுவது ஏமாற்றும் செய்தியாக இருக்கலாம்.',
      ml: 'മുന്നറിയിപ്പ്: ഈ ലിങ്ക് ഒരു യഥാർത്ഥ സ്വകാര്യ കമ്പനിയുടേതാണെങ്കിലും ഇത് ഔദ്യോഗിക സർക്കാർ പോർട്ടലല്ല. സ്വകാര്യ കമ്പനി ലിങ്ക് വഴി സർക്കാർ പദ്ധതി നടപടി ആവശ്യപ്പെടുന്ന സന്ദേശം വ്യാജമാകാൻ സാധ്യതയുണ്ട്.',
      kn: 'ಎಚ್ಚರಿಕೆ: ಈ ಲಿಂಕ್ ನಿಜವಾದ ಖಾಸಗಿ ಕಂಪನಿಯದಾಗಿದ್ದರೂ, ಇದು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್ ಅಲ್ಲ. ಖಾಸಗಿ ಕಂಪನಿ ಲಿಂಕ್ ಮೂಲಕ ಸರ್ಕಾರಿ ಯೋಜನೆ ಅಪ್‌ಡೇಟ್ ಕೇಳುವ ಸಂದೇಶವು ಮೋಸದ್ದಾಗಿರಬಹುದು.',
    };
  } else if (
    hasGovernmentClaim &&
    linkCount > 0 &&
    allLinksOfficial &&
    !hasMismatch
  ) {
    status = 'SUPPORTED_OFFICIAL';
    tone = 'green';
    summary = {
      en: 'The message points to an official Indian government domain (.gov.in / .nic.in) with no red flags detected.',
      te: 'ఈ మెసేజ్ అధికారిక భారత ప్రభుత్వ డొమైన్ (.gov.in / .nic.in) కు తీసుకెళ్తుంది మరియు ప్రమాదకర గుర్తులు లేవు.',
      hi: 'यह संदेश भारत सरकार की आधिकारिक वेबसाइट (.gov.in / .nic.in) पर ले जाता है और इसमें कोई खतरनाक संकेत नहीं है।',
      ta: 'இந்தச் செய்தி அதிகாரப்பூர்வ இந்திய அரசு இணையதளத்திற்கு (.gov.in / .nic.in) அழைத்துச் செல்கிறது; ஆபத்தான அறிகுறிகள் இல்லை.',
      ml: 'ഈ സന്ദേശം ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ വെബ്‌സൈറ്റിലേക്കാണ് (.gov.in / .nic.in) പോകുന്നത്; അപകട സൂചനകളൊന്നുമില്ല.',
      kn: 'ಈ ಸಂದೇಶವು ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ವೆಬ್‌ಸೈಟ್ (.gov.in / .nic.in) ಗೆ ಕರೆದೊಯ್ಯುತ್ತದೆ ಮತ್ತು ಯಾವುದೇ ಅಪಾಯದ ಸೂಚನೆಗಳಿಲ್ಲ.',
    };
  } else {
    status = 'UNVERIFIED_CLAIM';
    tone = 'amber';
    summary = {
      en: 'This message claim could not be confirmed against authoritative government records. Verify at your village secretariat or official government portal before taking action.',
      te: 'ఈ మెసేజ్‌లోని విషయాన్ని అధికారిక ప్రభుత్వ రికార్డులతో నిర్ధారించలేకపోయాము. ఏ చర్య తీసుకునే ముందు గ్రామ సచివాలయంలో లేదా అధికారిక పోర్టల్‌లో అడిగి నిర్ధారించుకోండి.',
      hi: 'इस संदेश के दावे की पुष्टि आधिकारिक सरकारी रिकॉर्ड से नहीं हो सकी। कोई कदम उठाने से पहले ग्राम सचिवालय या आधिकारिक सरकारी पोर्टल पर जांचें।',
      ta: 'இந்தச் செய்தியின் தகவலை அதிகாரப்பூர்வ அரசு பதிவுகளுடன் உறுதிப்படுத்த முடியவில்லை. செயல்படும் முன் கிராம செயலகம் அல்லது அதிகாரப்பூர்வ அரசு தளத்தில் சரிபார்க்கவும்.',
      ml: 'ഈ സന്ദേശത്തിലെ അവകാശവാദം ഔദ്യോഗിക സർക്കാർ രേഖകളുമായി സ്ഥിരീകരിക്കാനായില്ല. നടപടിയെടുക്കുന്നതിന് മുമ്പ് വില്ലേജ് ഓഫീസിലോ ഔദ്യോഗിക സർക്കാർ പോർട്ടലിലോ ഉറപ്പാക്കുക.',
      kn: 'ಈ ಸಂದೇಶದ ಮಾಹಿತಿಯನ್ನು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳೊಂದಿಗೆ ದೃಢಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ಯಾವುದೇ ಕ್ರಮ ಕೈಗೊಳ್ಳುವ ಮೊದಲು ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಥವಾ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.',
    };
  }

  return {
    status,
    tone,
    hasGovernmentClaim,
    detectedLanguage,
    summary,
    aiExplanationByLang: aiExplanation ? { [targetLang]: aiExplanation } : undefined,
    flags: reasonItems,
  };
}

/**
 * Deterministic Verdict Assembly with Independent Website Trust & Message Authenticity.
 * The LLM NEVER overrides or decides trust classifications or verdicts.
 */
export function evaluateMessageAndLinks(input: AssembleCheckInput): CheckResult {
  const registry = input.registry ?? REGISTRY_SEED;
  const targetLang: Language = input.targetLang ?? 'te';
  const normalized = normalizeText(input.rawText);
  const entities = extractMessageEntities(normalized);
  const rawUrls = extractUrls(normalized);

  const deterministic = deterministicExtractMessage(normalized, registry);
  const extraction = mergeExtractions(deterministic, input.llmExtraction);

  const linkResults: LinkAnalysisResult[] = [];
  const destinations: DestinationInfo[] = [];

  for (const rawUrl of rawUrls) {
    const exp = input.expandedUrls?.get(rawUrl);
    const urlToAnalyze = exp && !exp.unresolved ? exp.finalUrl : rawUrl;
    const opts: LinkEngineOptions = {
      registry,
      resolvedFromShortener: Boolean(exp?.wasShortener && !exp?.unresolved),
      shortenerUnresolved: Boolean(exp?.unresolved),
      serverContentType: exp?.serverContentType,
      serverAttachmentFilename: exp?.serverAttachmentFilename,
      safeBrowsingMatch: exp?.safeBrowsingMatch,
      domainAgeDays: exp?.domainAgeDays ?? null,
    };

    const lr = analyzeUrl(urlToAnalyze, opts);
    linkResults.push(lr);

    destinations.push({
      originalInputUrl: rawUrl,
      finalUrl: lr.normalizedUrl,
      hostname: lr.hostname,
      subdomain: lr.subdomain,
      registrableDomain: lr.registrableDomain || lr.hostname,
      isOfficialDomain: lr.isOfficial,
      isRecognizedCompany: lr.isRecognizedCompany,
      trustCategory: lr.trustCategory,
      recognizedEntity: lr.recognizedEntity,
      wasShortener: Boolean(exp?.wasShortener || lr.isShortener),
      expandedFrom: exp?.wasShortener && !exp.unresolved ? rawUrl : undefined,
    });
  }

  // Separate URL flags vs Message flags
  const allFlags: FlagItem[] = [];
  const messageFlags: FlagItem[] = [];
  const pushFlag = (flag: FlagItem, isMessageFlag = false) => {
    if (!allFlags.some((f) => f.id === flag.id)) {
      allFlags.push(flag);
    }
    if (isMessageFlag && !messageFlags.some((f) => f.id === flag.id)) {
      messageFlags.push(flag);
    }
  };

  for (const lr of linkResults) {
    for (const f of lr.flags) {
      pushFlag(f, false);
    }
  }

  const allLinksOfficial =
    linkResults.length > 0 && linkResults.every((lr) => lr.isOfficial);
  const allLinksRecognizedCompany =
    linkResults.length > 0 && linkResults.every((lr) => lr.isRecognizedCompany);
  const hasRecognizedCompanyLink = linkResults.some((lr) => lr.isRecognizedCompany);
  const hasUnsafeUrl = linkResults.some(
    (lr) => lr.trustCategory === 'POTENTIALLY_UNSAFE',
  );

  // H6: Unsafe asks with OTP nuance
  const actions = extraction.requested_actions;
  const hasAlwaysUnsafeAsk =
    actions.includes('share_otp_with_person') ||
    actions.includes('pay_fee') ||
    actions.includes('install_app') ||
    /(?:anydesk|teamviewer|quicksupport|rustdesk|screen\s*shar|స్క్రీన్\s*షేర్|स्क्रीन\s*शेयर|திரை\s*பகிர்வு|സ്ക്രീൻ\s*ഷെയർ|ಸ್ಕ್ರೀನ್\s*ಶೇರ್)/i.test(
      normalized,
    );

  const hasOtpOnNonOfficialPage =
    actions.includes('enter_otp_on_page') &&
    linkResults.length > 0 &&
    !allLinksOfficial;

  const hasBankDetailsOnNonOfficialPage =
    actions.includes('enter_bank_details') &&
    linkResults.length > 0 &&
    !allLinksOfficial;

  if (
    hasAlwaysUnsafeAsk ||
    hasOtpOnNonOfficialPage ||
    hasBankDetailsOnNonOfficialPage
  ) {
    const evidenceParts: string[] = [];
    if (actions.includes('share_otp_with_person')) evidenceParts.push('OTP');
    if (actions.includes('pay_fee')) evidenceParts.push('fee');
    if (actions.includes('install_app')) evidenceParts.push('app-install');
    if (hasOtpOnNonOfficialPage) evidenceParts.push('OTP on non-official site');
    if (hasBankDetailsOnNonOfficialPage) {
      evidenceParts.push('bank details on non-official site');
    }
    pushFlag(
      {
        id: 'H6_UNSAFE_ASK',
        severity: 'hard',
        evidence: evidenceParts.join(', '),
      },
      true,
    );
  }

  // H7: Forward chain
  if (extraction.asks_to_forward || actions.includes('forward')) {
    pushFlag(
      {
        id: 'H7_FORWARD_CHAIN',
        severity: 'hard',
        evidence: 'forward',
      },
      true,
    );
  }

  // Registry resolver & Government claim detection
  const scheme = resolveSchemeEntry(extraction.scheme_mentioned, linkResults, registry);
  const hasGovernmentClaim = detectGovernmentClaimInText(
    normalized,
    extraction,
    scheme,
  );

  // Check if message mentions a government scheme/service while link is NOT its official gov domain
  let matchesMentionedScheme: boolean | null = null;
  if (hasGovernmentClaim && linkResults.length > 0) {
    if (scheme && scheme.officialDomains.length > 0) {
      const matchesSchemeDomain = linkResults.every((lr) =>
        scheme.officialDomains.some(
          (d) => lr.hostname === d || lr.hostname.endsWith('.' + d),
        ),
      );
      matchesMentionedScheme = matchesSchemeDomain;
      if (!matchesSchemeDomain) {
        pushFlag(
          {
            id: 'S6_SCHEME_DOMAIN_MISMATCH',
            severity: 'soft',
            evidence: scheme.officialDomains[0],
          },
          true,
        );
      }
    } else {
      matchesMentionedScheme = allLinksOfficial;
      if (!allLinksOfficial) {
        pushFlag(
          {
            id: 'S6_SCHEME_DOMAIN_MISMATCH',
            severity: 'soft',
            evidence: '.gov.in / .nic.in',
          },
          true,
        );
      }
    }
  }

  // No URL in message and no hard flags -> NOT_VERIFIED with guidance
  const hasAnyHard = allFlags.some((f) => f.severity === 'hard');
  if (linkResults.length === 0 && !hasAnyHard) {
    pushFlag(
      {
        id: 'S7_NO_URL_UNVERIFIED_CLAIM',
        severity: 'soft',
      },
      true,
    );
  }

  // Determine whether input had meaningful non-URL prose
  let proseOnly = normalized;
  for (const u of rawUrls) proseOnly = proseOnly.replace(u, ' ');
  const hasNonUrlProse = proseOnly.replace(/[^\p{L}\p{N}]+/gu, '').length >= 8;

  // Choose primary LinkAnalysisResult: prioritize unsafe > unknown > recognized company > official
  const primaryLr =
    linkResults.find((lr) => lr.trustCategory === 'POTENTIALLY_UNSAFE') ??
    linkResults.find((lr) => lr.trustCategory === 'UNKNOWN_UNCONFIRMED') ??
    linkResults.find((lr) => lr.trustCategory === 'RECOGNIZED_COMPANY') ??
    linkResults[0] ??
    null;

  const websiteTrust = buildWebsiteTrustResult(primaryLr, matchesMentionedScheme);
  const messageAuthenticity = buildMessageAuthenticityResult({
    hasNonUrlProse,
    hasGovernmentClaim,
    allLinksOfficial,
    linkCount: linkResults.length,
    hasRecognizedCompanyLink,
    messageFlags,
    detectedLanguage: extraction.language,
    aiExplanation: extraction.ai_explanation,
    targetLang,
    hasUnsafeUrl,
  });

  // Overall top-level verdict:
  // - Any hard flag OR fake government claim on a non-gov site -> LIKELY_FAKE
  // - All links official gov with no soft flags -> OFFICIAL
  // - All links recognized legitimate company with NO government claim and NO flags -> RECOGNIZED_COMPANY
  // - Otherwise -> NOT_VERIFIED
  let verdict: Verdict;
  if (
    hasAnyHard ||
    messageAuthenticity.status === 'SUSPICIOUS_OR_FAKE'
  ) {
    verdict = 'LIKELY_FAKE';
  } else if (
    linkResults.length > 0 &&
    allLinksOfficial &&
    !allFlags.some((f) => f.severity === 'soft')
  ) {
    verdict = 'OFFICIAL';
  } else if (
    linkResults.length > 0 &&
    allLinksRecognizedCompany &&
    !hasGovernmentClaim &&
    !allFlags.some((f) => f.severity === 'soft')
  ) {
    verdict = 'RECOGNIZED_COMPANY';
  } else {
    verdict = 'NOT_VERIFIED';
  }

  // Sort flags by severity and priority
  const severityWeight = { hard: 0, soft: 1, info: 2 };
  const sortedFlags = [...allFlags].sort((a, b) => {
    const sw = severityWeight[a.severity] - severityWeight[b.severity];
    if (sw !== 0) return sw;
    return (FLAG_PRIORITY[a.id] ?? 99) - (FLAG_PRIORITY[b.id] ?? 99);
  });

  // Keep INFO_RECOGNIZED_COMPANY even if message is fake so Website Trust stays visible,
  // but hide INFO_OFFICIAL_* when verdict is LIKELY_FAKE.
  const filteredFlags =
    verdict === 'LIKELY_FAKE'
      ? sortedFlags.filter(
          (f) =>
            f.id !== 'INFO_OFFICIAL_GOV_DOMAIN' &&
            f.id !== 'INFO_OFFICIAL_REGISTRY_DOMAIN',
        )
      : sortedFlags;

  const allReasons = filteredFlags.map(renderReason);
  const reasons = allReasons.slice(0, 3);

  const primaryDestination =
    destinations.find((d) => d.trustCategory === 'POTENTIALLY_UNSAFE') ??
    destinations.find((d) => d.trustCategory === 'UNKNOWN_UNCONFIRMED') ??
    destinations.find((d) => d.trustCategory === 'RECOGNIZED_COMPANY') ??
    destinations[0] ??
    null;

  // Build Official Path from registry
  const primaryAction: RequestedAction | null = actions[0] ?? null;
  let officialPath: OfficialPathInfo | null = null;

  if (scheme) {
    const verifiedProcess = scheme.processes.find(
      (p) =>
        Boolean(p.sourceUrl && p.verifiedOn) &&
        (!primaryAction || p.action === primaryAction),
    );
    const verifiedChannels = scheme.officialChannels.filter((c) =>
      Boolean(c.value),
    );

    if (verifiedProcess) {
      officialPath = {
        schemeId: scheme.id,
        schemeNameTe: scheme.nameTe,
        schemeNameEn: scheme.nameEn,
        action: verifiedProcess.action,
        stepsTe: verifiedProcess.stepsTe,
        stepsEn: verifiedProcess.stepsEn,
        channels: verifiedChannels,
        sourceUrl: verifiedProcess.sourceUrl,
        verifiedOn: verifiedProcess.verifiedOn,
        domainOnlyNotice: false,
      };
    } else if (
      verifiedChannels.length > 0 ||
      scheme.officialDomains.length > 0
    ) {
      const firstSource =
        verifiedChannels.find((c) => c.sourceUrl)?.sourceUrl ?? '';
      const firstVerifiedOn =
        verifiedChannels.find((c) => c.verifiedOn)?.verifiedOn ?? '';
      officialPath = {
        schemeId: scheme.id,
        schemeNameTe: scheme.nameTe,
        schemeNameEn: scheme.nameEn,
        action: primaryAction ?? undefined,
        stepsTe: [],
        stepsEn: [],
        channels: verifiedChannels,
        sourceUrl: firstSource,
        verifiedOn: firstVerifiedOn,
        domainOnlyNotice: true,
      };
    }
  }

  return {
    verdict,
    websiteTrust,
    messageAuthenticity,
    reasons,
    allReasons,
    destination: primaryDestination,
    allDestinations: destinations,
    officialPath,
    schemeMatched: scheme
      ? { id: scheme.id, nameTe: scheme.nameTe, nameEn: scheme.nameEn }
      : null,
    actionDetected: primaryAction,
    engineMode: input.engineMode ?? 'rules-only',
    checkedAt: new Date().toISOString(),
    extractedPhones: entities.phones,
    originalMessageSnippet: normalized.slice(0, 280),
  };
}
