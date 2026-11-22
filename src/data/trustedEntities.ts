import type { LocalizedText, RecognizedEntityMatch } from '../engine/types';

export interface TrustedEntityRecord {
  id: string;
  kind: 'gov' | 'company';
  domains: string[];
  /** Brand tokens used ONLY to catch impersonation on unrelated domains (never to grant trust). */
  impersonationTokens: string[];
  name: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
}

function makeCompanyDesc(
  nameEn: string,
  nameTe: string,
  nameHi: string,
  nameTa: string,
  nameMl: string,
  nameKn: string,
): LocalizedText {
  return {
    en: `This is ${nameEn}'s legitimate official website. It is a private company website, not an Indian government website.`,
    te: `ఇది ${nameTe} యొక్క నిజమైన అధికారిక వెబ్‌సైట్. ఇది ప్రైవేట్ సంస్థ వెబ్‌సైట్, భారత ప్రభుత్వ వెబ్‌సైట్ కాదు.`,
    hi: `यह ${nameHi} की असली आधिकारिक वेबसाइट है। यह एक निजी कंपनी की वेबसाइट है, भारत सरकार की वेबसाइट नहीं है।`,
    ta: `இது ${nameTa} நிறுவனத்தின் உண்மையான அதிகாரப்பூர்வ இணையதளம். இது தனியார் நிறுவன தளம், இந்திய அரசு இணையதளம் அல்ல.`,
    ml: `ഇത് ${nameMl}-ന്റെ യഥാർത്ഥ ഔദ്യോഗിക വെബ്‌സൈറ്റാണ്. ഇത് ഒരു സ്വകാര്യ കമ്പനി വെബ്‌സൈറ്റാണ്, ഇന്ത്യൻ സർക്കാർ വെബ്‌സൈറ്റല്ല.`,
    kn: `ಇದು ${nameKn} ನ ನಿಜವಾದ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಆಗಿದೆ. ಇದು ಖಾಸಗಿ ಕಂಪನಿ ವೆಬ್‌ಸೈಟ್, ಭಾರತ ಸರ್ಕಾರದ ವೆಬ್‌ಸೈಟ್ ಅಲ್ಲ.`,
  };
}

function makeGovDesc(
  nameEn: string,
  nameTe: string,
  nameHi: string,
  nameTa: string,
  nameMl: string,
  nameKn: string,
): LocalizedText {
  return {
    en: `Official Indian government domain belonging to ${nameEn}.`,
    te: `${nameTe} కు చెందిన అధికారిక భారత ప్రభుత్వ వెబ్‌సైట్ డొమైన్.`,
    hi: `${nameHi} का आधिकारिक भारत सरकार का डोमेन।`,
    ta: `${nameTa} அமைப்புக்குச் சொந்தமான அதிகாரப்பூர்வ இந்திய அரசு இணையதளம்.`,
    ml: `${nameMl}-ന്റേതായ ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ വെബ്‌സൈറ്റ് ഡൊമെയ്ൻ.`,
    kn: `${nameKn} ಗೆ ಸೇರಿದ ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ವೆಬ್‌ಸೈಟ್ ಡೊಮೇನ್.`,
  };
}

export const OFFICIAL_GOV_ENTITIES: TrustedEntityRecord[] = [
  {
    id: 'uidai',
    kind: 'gov',
    domains: ['uidai.gov.in'],
    impersonationTokens: ['uidai', 'myaadhaar'],
    name: {
      en: 'Unique Identification Authority of India (UIDAI / Aadhaar)',
      te: 'భారత విశిష్ట గుర్తింపు ప్రాధికార సంస్థ (UIDAI / ఆధార్)',
      hi: 'भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI / आधार)',
      ta: 'இந்திய தனித்துவ அடையாள ஆணையம் (UIDAI / ஆதார்)',
      ml: 'യുണീക്ക് ഐഡന്റിഫിക്കേഷൻ അതോറിറ്റി ഓഫ് ഇന്ത്യ (UIDAI / ആധാർ)',
      kn: 'ಭಾರತೀಯ ವಿಶಿಷ್ಟ ಗುರುತು ಪ್ರಾಧಿಕಾರ (UIDAI / ಆಧಾರ್)',
    },
    category: {
      en: 'Official Indian Government Portal — Identity / Aadhaar',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — ఆధార్',
      hi: 'आधिकारिक भारत सरकार पोर्टल — आधार',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — ஆதார்',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — ആധാർ',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ಆಧಾರ್',
    },
    description: makeGovDesc(
      'UIDAI (Aadhaar)',
      'UIDAI (ఆధార్)',
      'UIDAI (आधार)',
      'UIDAI (ஆதார்)',
      'UIDAI (ആധാർ)',
      'UIDAI (ಆಧಾರ್)',
    ),
  },
  {
    id: 'pm-kisan',
    kind: 'gov',
    domains: ['pmkisan.gov.in'],
    impersonationTokens: ['pmkisan'],
    name: {
      en: 'PM-KISAN — Ministry of Agriculture & Farmers Welfare',
      te: 'పిఎం-కిసాన్ — వ్యవసాయ మరియు రైతు సంక్షేమ మంత్రిత్వ శాఖ',
      hi: 'पीएम-किसान — कृषि एवं किसान कल्याण मंत्रालय',
      ta: 'பிஎம்-கிசான் — வேளாண்மை மற்றும் விவசாயிகள் நல அமைச்சகம்',
      ml: 'പിഎം-കിസാൻ — കൃഷി, കർഷക ക്ഷേമ മന്ത്രാലയം',
      kn: 'ಪಿಎಂ-ಕಿಸಾನ್ — ಕೃಷಿ ಮತ್ತು ರೈತ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ',
    },
    category: {
      en: 'Official Indian Government Portal — Farmer Scheme',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — రైతు పథకం',
      hi: 'आधिकारिक भारत सरकार पोर्टल — किसान योजना',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — விவசாயி திட்டம்',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — കർഷക പദ്ധതി',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ರೈತ ಯೋಜನೆ',
    },
    description: makeGovDesc(
      'PM-KISAN (Ministry of Agriculture)',
      'పిఎం-కిసాన్ (వ్యవసాయ శాఖ)',
      'पीएम-किसान (कृषि मंत्रालय)',
      'பிஎம்-கிசான் (வேளாண்மைத் துறை)',
      'പിഎം-കിസാൻ (കൃഷി മന്ത്രാലയം)',
      'ಪಿಎಂ-ಕಿಸಾನ್ (ಕೃಷಿ ಸಚಿವಾಲಯ)',
    ),
  },
  {
    id: 'pmfby',
    kind: 'gov',
    domains: ['pmfby.gov.in'],
    impersonationTokens: ['pmfby', 'fasalbima'],
    name: {
      en: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      te: 'ప్రధాన మంత్రి పంట బీమా యోజన (PMFBY)',
      hi: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
      ta: 'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY)',
      ml: 'പ്രധാനമന്ത്രി ഫസൽ ബീമാ യോജന (PMFBY)',
      kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (PMFBY)',
    },
    category: {
      en: 'Official Indian Government Portal — Crop Insurance',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — పంట బీమా',
      hi: 'आधिकारिक भारत सरकार पोर्टल — फसल बीमा',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — பயிர் காப்பீடு',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — വിള ഇൻഷുറൻസ്',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ಬೆಳೆ ವಿಮೆ',
    },
    description: makeGovDesc(
      'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      'ప్రధాన మంత్రి పంట బీమా యోజన (PMFBY)',
      'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
      'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY)',
      'പ്രധാനമന്ത്രി ഫസൽ ബീമാ യോജന (PMFBY)',
      'ಪ್ರಧಾನ ಮಂತ್ರಿ ಫಸಲ್ ಬಿಮಾ ಯೋಜನೆ (PMFBY)',
    ),
  },
  {
    id: 'cybercrime',
    kind: 'gov',
    domains: ['cybercrime.gov.in'],
    impersonationTokens: ['cybercrime'],
    name: {
      en: 'National Cyber Crime Reporting Portal (Ministry of Home Affairs)',
      te: 'నేషనల్ సైబర్ క్రైమ్ రిపోర్టింగ్ పోర్టల్ (హోం మంత్రిత్వ శాఖ)',
      hi: 'राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल (गृह मंत्रालय)',
      ta: 'தேசிய சைபர் குற்றப் புகார் தளம் (உள்துறை அமைச்சகம்)',
      ml: 'നാഷണൽ സൈബർ ക്രൈം റിപ്പോർട്ടിംഗ് പോർട്ടൽ (ആഭ്യന്തര മന്ത്രാലയം)',
      kn: 'ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಅಪರಾಧ ವರದಿ ಪೋರ್ಟಲ್ (ಗೃಹ ಸಚಿವಾಲಯ)',
    },
    category: {
      en: 'Official Indian Government Portal — Cyber Safety',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — సైబర్ భద్రత',
      hi: 'आधिकारिक भारत सरकार पोर्टल — साइबर सुरक्षा',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — சைபர் பாதுகாப்பு',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — സൈബർ സുരക്ഷ',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ಸೈಬರ್ ಸುರಕ್ಷತೆ',
    },
    description: makeGovDesc(
      'National Cyber Crime Reporting Portal',
      'నేషనల్ సైబర్ క్రైమ్ రిపోర్టింగ్ పోర్టల్',
      'राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल',
      'தேசிய சைபர் குற்றப் புகார் தளம்',
      'നാഷണൽ സൈബർ ക്രൈം റിപ്പോർട്ടിംഗ് പോർട്ടൽ',
      'ರಾಷ್ಟ್ರೀಯ ಸೈಬರ್ ಅಪರಾಧ ವರದಿ ಪೋರ್ಟಲ್',
    ),
  },
  {
    id: 'sancharsaathi',
    kind: 'gov',
    domains: ['sancharsaathi.gov.in'],
    impersonationTokens: ['sancharsaathi'],
    name: {
      en: 'Sanchar Saathi — Department of Telecommunications',
      te: 'సంచార్ సాథీ — టెలికమ్యూనికేషన్స్ విభాగం',
      hi: 'संचार साथी — दूरसंचार विभाग',
      ta: 'சஞ்சார் சாத்தி — தொலைத்தொடர்புத் துறை',
      ml: 'സഞ്ചാർ സാഥി — ടെലികമ്മ്യൂണിക്കേഷൻസ് വകുപ്പ്',
      kn: 'ಸಂಚಾರ್ ಸಾಥಿ — ದೂರಸಂಪರ್ಕ ಇಲಾಖೆ',
    },
    category: {
      en: 'Official Indian Government Portal — Telecom Fraud Reporting',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — టెలికాం ఫిర్యాదు',
      hi: 'आधिकारिक भारत सरकार पोर्टल — टेलीकॉम शिकायत',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — தொலைத்தொடர்பு புகார்',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — ടെലികോം പരാതി',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ಟೆಲಿಕಾಂ ದೂರು',
    },
    description: makeGovDesc(
      'Sanchar Saathi (DoT)',
      'సంచార్ సాథీ (DoT)',
      'संचार साथी (DoT)',
      'சஞ்சார் சாத்தி (DoT)',
      'സഞ്ചാർ സാഥി (DoT)',
      'ಸಂಚಾರ್ ಸಾಥಿ (DoT)',
    ),
  },
  {
    id: 'nsp',
    kind: 'gov',
    domains: ['scholarships.gov.in'],
    impersonationTokens: [],
    name: {
      en: 'National Scholarship Portal (Government of India)',
      te: 'నేషనల్ స్కాలర్‌షిప్ పోర్టల్ (భారత ప్రభుత్వం)',
      hi: 'राष्ट्रीय छात्रवृत्ति पोर्टल (भारत सरकार)',
      ta: 'தேசிய கல்வி உதவித்தொகை தளம் (இந்திய அரசு)',
      ml: 'നാഷണൽ സ്കോളർഷിപ്പ് പോർട്ടൽ (ഇന്ത്യൻ സർക്കാർ)',
      kn: 'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ (ಭಾರತ ಸರ್ಕಾರ)',
    },
    category: {
      en: 'Official Indian Government Portal — Scholarships',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — స్కాలర్‌షిప్',
      hi: 'आधिकारिक भारत सरकार पोर्टल — छात्रवृत्ति',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — கல்வி உதவித்தொகை',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — സ്കോളർഷിപ്പ്',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ವಿದ್ಯಾರ್ಥಿವೇತನ',
    },
    description: makeGovDesc(
      'National Scholarship Portal',
      'నేషనల్ స్కాలర్‌షిప్ పోర్టల్',
      'राष्ट्रीय छात्रवृत्ति पोर्टल',
      'தேசிய கல்வி உதவித்தொகை தளம்',
      'നാഷണൽ സ്കോളർഷിപ്പ് പോർട്ടൽ',
      'ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್',
    ),
  },
  {
    id: 'digilocker',
    kind: 'gov',
    domains: ['digilocker.gov.in'],
    impersonationTokens: ['digilocker'],
    name: {
      en: 'DigiLocker — Ministry of Electronics & IT',
      te: 'డిజీలాకర్ — ఎలక్ట్రానిక్స్ & ఐటీ మంత్రిత్వ శాఖ',
      hi: 'डिजिलॉकर — इलेक्ट्रॉनिक्स और आईटी मंत्रालय',
      ta: 'டிஜிலாக்கர் — மின்னணு மற்றும் தகவல் தொழில்நுட்ப அமைச்சகம்',
      ml: 'ഡിജിലോക്കർ — ഇലക്ട്രോണിക്സ് & ഐടി മന്ത്രാലയം',
      kn: 'ಡಿಜಿಲಾಕರ್ — ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಮತ್ತು ಐಟಿ ಸಚಿವಾಲಯ',
    },
    category: {
      en: 'Official Indian Government Portal — Digital Documents',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — డిజిటల్ పత్రాలు',
      hi: 'आधिकारिक भारत सरकार पोर्टल — डिजिटल दस्तावेज़',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — டிஜிட்டல் ஆவணங்கள்',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — ഡിജിറ്റൽ രേഖകൾ',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ಡಿಜಿಟಲ್ ದಾಖಲೆಗಳು',
    },
    description: makeGovDesc(
      'DigiLocker',
      'డిజీలాకర్',
      'डिजिलॉकर',
      'டிஜிலாக்கர்',
      'ഡിജിലോക്കർ',
      'ಡಿಜಿಲಾಕರ್',
    ),
  },
  {
    id: 'incometax',
    kind: 'gov',
    domains: ['incometax.gov.in'],
    impersonationTokens: ['incometax'],
    name: {
      en: 'Income Tax Department of India',
      te: 'భారత ఆదాయపు పన్ను శాఖ',
      hi: 'भारतीय आयकर विभाग',
      ta: 'இந்திய வருமான வரித் துறை',
      ml: 'ഇന്ത്യൻ ആദായനികുതി വകുപ്പ്',
      kn: 'ಭಾರತೀಯ ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ',
    },
    category: {
      en: 'Official Indian Government Portal — Taxation',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్ — ఆదాయపు పన్ను',
      hi: 'आधिकारिक भारत सरकार पोर्टल — आयकर',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம் — வருமான வரி',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ — ആദായനികുതി',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್ — ಆದಾಯ ತೆರಿಗೆ',
    },
    description: makeGovDesc(
      'Income Tax Department of India',
      'భారత ఆదాయపు పన్ను శాఖ',
      'भारतीय आयकर विभाग',
      'இந்திய வருமான வரித் துறை',
      'ഇന്ത്യൻ ആദായനികുതി വകുപ്പ്',
      'ಭಾರತೀಯ ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ',
    ),
  },
  {
    id: 'india-gov',
    kind: 'gov',
    domains: ['india.gov.in', 'mygov.in', 'umang.gov.in'],
    impersonationTokens: [],
    name: {
      en: 'Government of India Portal',
      te: 'భారత ప్రభుత్వ పోర్టల్',
      hi: 'भारत सरकार पोर्टल',
      ta: 'இந்திய அரசு இணையதளம்',
      ml: 'ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ',
      kn: 'ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್',
    },
    category: {
      en: 'Official Indian Government Portal',
      te: 'అధికారిక భారత ప్రభుత్వ పోర్టల్',
      hi: 'आधिकारिक भारत सरकार पोर्टल',
      ta: 'அதிகாரப்பூர்வ இந்திய அரசு தளம்',
      ml: 'ഔദ്യോഗിക ഇന്ത്യൻ സർക്കാർ പോർട്ടൽ',
      kn: 'ಅಧಿಕೃತ ಭಾರತ ಸರ್ಕಾರದ ಪೋರ್ಟಲ್',
    },
    description: makeGovDesc(
      'Government of India',
      'భారత ప్రభుత్వం',
      'भारत सरकार',
      'இந்திய அரசு',
      'ഇന്ത്യൻ സർക്കാർ',
      'ಭಾರತ ಸರ್ಕಾರ',
    ),
  },
];

export const RECOGNIZED_COMPANIES: TrustedEntityRecord[] = [
  {
    id: 'google',
    kind: 'company',
    domains: ['google.com', 'google.co.in', 'gmail.com', 'youtube.com'],
    impersonationTokens: ['google', 'gmail'],
    name: {
      en: 'Google',
      te: 'గూగుల్ (Google)',
      hi: 'गूगल (Google)',
      ta: 'கூகுள் (Google)',
      ml: 'ഗൂഗിൾ (Google)',
      kn: 'ಗೂಗಲ್ (Google)',
    },
    category: {
      en: 'Technology / Search Engine',
      te: 'టెక్నాలజీ / సెర్చ్ ఇంజిన్',
      hi: 'प्रौद्योगिकी / सर्च इंजन',
      ta: 'தொழில்நுட்பம் / தேடுபொறி',
      ml: 'സാങ്കേതികവിദ്യ / സെർച്ച് എഞ്ചിൻ',
      kn: 'ತಂತ್ರಜ್ಞಾನ / ಹುಡುಕಾಟ ಎಂಜಿನ್',
    },
    description: makeCompanyDesc(
      'Google',
      'గూగుల్ (Google)',
      'गूगल (Google)',
      'கூகுள் (Google)',
      'ഗൂഗിൾ (Google)',
      'ಗೂಗಲ್ (Google)',
    ),
  },
  {
    id: 'microsoft',
    kind: 'company',
    domains: ['microsoft.com', 'outlook.com', 'live.com', 'office.com'],
    impersonationTokens: ['microsoft'],
    name: {
      en: 'Microsoft',
      te: 'మైక్రోసాఫ్ట్ (Microsoft)',
      hi: 'माइक्रोसॉफ्ट (Microsoft)',
      ta: 'மைக்ரோசாப்ட் (Microsoft)',
      ml: 'മൈക്രോസോഫ്റ്റ് (Microsoft)',
      kn: 'ಮೈಕ್ರೋಸಾಫ್ಟ್ (Microsoft)',
    },
    category: {
      en: 'Technology / Software',
      te: 'టెక్నాలజీ / సాఫ్ట్‌వేర్',
      hi: 'प्रौद्योगिकी / सॉफ्टवेयर',
      ta: 'தொழில்நுட்பம் / மென்பொருள்',
      ml: 'സാങ്കേതികവിദ്യ / സോഫ്റ്റ്‌വെയർ',
      kn: 'ತಂತ್ರಜ್ಞಾನ / ಸಾಫ್ಟ್‌ವೇರ್',
    },
    description: makeCompanyDesc(
      'Microsoft',
      'మైక్రోసాఫ్ట్ (Microsoft)',
      'माइक्रोसॉफ्ट (Microsoft)',
      'மைக்ரோசாப்ட் (Microsoft)',
      'മൈക്രോസോഫ്റ്റ് (Microsoft)',
      'ಮೈಕ್ರೋಸಾಫ್ಟ್ (Microsoft)',
    ),
  },
  {
    id: 'apple',
    kind: 'company',
    domains: ['apple.com'],
    impersonationTokens: ['apple', 'icloud'],
    name: {
      en: 'Apple',
      te: 'ఆపిల్ (Apple)',
      hi: 'एप्पल (Apple)',
      ta: 'ஆப்பிள் (Apple)',
      ml: 'ആപ്പിൾ (Apple)',
      kn: 'ಆಪಲ್ (Apple)',
    },
    category: {
      en: 'Technology / Consumer Electronics',
      te: 'టెక్నాలజీ / ఎలక్ట్రానిక్స్',
      hi: 'प्रौद्योगिकी / इलेक्ट्रॉनिक्स',
      ta: 'தொழில்நுட்பம் / மின்னணு சாதனங்கள்',
      ml: 'സാങ്കേതികവിദ്യ / ഇലക്ട്രോണിക്സ്',
      kn: 'ತಂತ್ರಜ್ಞಾನ / ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್',
    },
    description: makeCompanyDesc(
      'Apple',
      'ఆపిల్ (Apple)',
      'एप्पल (Apple)',
      'ஆப்பிள் (Apple)',
      'ആപ്പിൾ (Apple)',
      'ಆಪಲ್ (Apple)',
    ),
  },
  {
    id: 'amazon',
    kind: 'company',
    domains: ['amazon.in', 'amazon.com'],
    impersonationTokens: ['amazon'],
    name: {
      en: 'Amazon',
      te: 'అమెజాన్ (Amazon)',
      hi: 'अमेज़न (Amazon)',
      ta: 'அமேசான் (Amazon)',
      ml: 'ആമസോൺ (Amazon)',
      kn: 'ಅಮೆಜಾನ್ (Amazon)',
    },
    category: {
      en: 'E-Commerce / Online Shopping',
      te: 'ఆన్‌లైన్ షాపింగ్',
      hi: 'ई-कॉमर्स / ऑनलाइन शॉपिंग',
      ta: 'ஆன்லைன் வணிகம்',
      ml: 'ഓൺലൈൻ ഷോപ്പിംഗ്',
      kn: 'ಆನ್‌ಲೈನ್ ಶಾಪಿಂಗ್',
    },
    description: makeCompanyDesc(
      'Amazon',
      'అమెజాన్ (Amazon)',
      'अमेज़न (Amazon)',
      'அமேசான் (Amazon)',
      'ആമസോൺ (Amazon)',
      'ಅಮೆಜಾನ್ (Amazon)',
    ),
  },
  {
    id: 'whatsapp',
    kind: 'company',
    domains: ['whatsapp.com'],
    impersonationTokens: ['whatsapp'],
    name: {
      en: 'WhatsApp (Meta)',
      te: 'వాట్సాప్ (WhatsApp)',
      hi: 'व्हाट्सएप (WhatsApp)',
      ta: 'வாட்ஸ்அப் (WhatsApp)',
      ml: 'വാട്സ്ആപ്പ് (WhatsApp)',
      kn: 'ವಾಟ್ಸಾಪ್ (WhatsApp)',
    },
    category: {
      en: 'Messaging Platform',
      te: 'మెసేజింగ్ ప్లాట్‌ఫారమ్',
      hi: 'मैसेजिंग प्लेटफॉर्म',
      ta: 'செய்தித் தளம்',
      ml: 'മെസേജിംഗ് പ്ലാറ്റ്‌ഫോം',
      kn: 'ಸಂದೇಶ ವೇದಿಕೆ',
    },
    description: makeCompanyDesc(
      'WhatsApp',
      'వాట్సాప్ (WhatsApp)',
      'व्हाट्सएप (WhatsApp)',
      'வாட்ஸ்அப் (WhatsApp)',
      'വാട്സ്ആപ്പ് (WhatsApp)',
      'ವಾಟ್ಸಾಪ್ (WhatsApp)',
    ),
  },
  {
    id: 'wikipedia',
    kind: 'company',
    domains: ['wikipedia.org'],
    impersonationTokens: [],
    name: {
      en: 'Wikipedia',
      te: 'వికీపీడియా (Wikipedia)',
      hi: 'विकिपीडिया (Wikipedia)',
      ta: 'விக்கிப்பீடியா (Wikipedia)',
      ml: 'വിക്കിപീഡിയ (Wikipedia)',
      kn: 'ವಿಕಿಪೀಡಿಯಾ (Wikipedia)',
    },
    category: {
      en: 'Reference / Online Encyclopedia',
      te: 'సమాచార విజ్ఞానకోశం',
      hi: 'ऑनलाइन विश्वकोश',
      ta: 'இணைய கலைக்களஞ்சியம்',
      ml: 'ഓൺലൈൻ വിജ്ഞാനകോശം',
      kn: 'ಆನ್‌ಲೈನ್ ವಿಶ್ವಕೋಶ',
    },
    description: makeCompanyDesc(
      'Wikipedia',
      'వికీపీడియా (Wikipedia)',
      'विकिपीडिया (Wikipedia)',
      'விக்கிப்பீடியா (Wikipedia)',
      'വിക്കിപീഡിയ (Wikipedia)',
      'ವಿಕಿಪೀಡಿಯಾ (Wikipedia)',
    ),
  },
  {
    id: 'github',
    kind: 'company',
    domains: ['github.com'],
    impersonationTokens: [],
    name: {
      en: 'GitHub',
      te: 'గిట్‌హబ్ (GitHub)',
      hi: 'गिटहब (GitHub)',
      ta: 'கிட்ஹப் (GitHub)',
      ml: 'ഗിറ്റ്ഹബ് (GitHub)',
      kn: 'ಗಿಟ್‌ಹಬ್ (GitHub)',
    },
    category: {
      en: 'Technology / Software Platform',
      te: 'టెక్నాలజీ / సాఫ్ట్‌వేర్',
      hi: 'प्रौद्योगिकी / सॉफ्टवेयर प्लेटफॉर्म',
      ta: 'தொழில்நுட்பம் / மென்பொருள் தளம்',
      ml: 'സാങ്കേതികവിദ്യ / സോഫ്റ്റ്‌വെയർ പ്ലാറ്റ്‌ഫോം',
      kn: 'ತಂತ್ರಜ್ಞಾನ / ಸಾಫ್ಟ್‌ವೇರ್ ವೇದಿಕೆ',
    },
    description: makeCompanyDesc(
      'GitHub',
      'గిట్‌హబ్ (GitHub)',
      'गिटहब (GitHub)',
      'கிட்ஹப் (GitHub)',
      'ഗിറ്റ്ഹബ് (GitHub)',
      'ಗಿಟ್‌ಹಬ್ (GitHub)',
    ),
  },
  {
    id: 'sbi',
    kind: 'company',
    domains: ['sbi.co.in', 'onlinesbi.sbi'],
    impersonationTokens: ['onlinesbi', 'yonosbi'],
    name: {
      en: 'State Bank of India (SBI)',
      te: 'స్టేట్ బ్యాంక్ ఆఫ్ ఇండియా (SBI)',
      hi: 'भारतीय स्टेट बैंक (SBI)',
      ta: 'ஸ்டேட் பேங்க் ஆப் இந்தியா (SBI)',
      ml: 'സ്റ്റേറ്റ് ബാങ്ക് ഓഫ് ഇന്ത്യ (SBI)',
      kn: 'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
    },
    category: {
      en: 'Banking / Financial Services',
      te: 'బ్యాంకింగ్ సేవలు',
      hi: 'बैंकिंग / वित्तीय सेवाएं',
      ta: 'வங்கிச் சேவைகள்',
      ml: 'ബാങ്കിംഗ് സേവനങ്ങൾ',
      kn: 'ಬ್ಯಾಂಕಿಂಗ್ ಸೇವೆಗಳು',
    },
    description: makeCompanyDesc(
      'State Bank of India (SBI)',
      'స్టేట్ బ్యాంక్ ఆఫ్ ఇండియా (SBI)',
      'भारतीय स्टेट बैंक (SBI)',
      'ஸ்டேட் பேங்க் ஆப் இந்தியா (SBI)',
      'സ്റ്റേറ്റ് ബാങ്ക് ഓഫ് ഇന്ത്യ (SBI)',
      'ಸ್ಟೇಟ್ ಬ್ಯಾಂಕ್ ಆಫ್ ಇಂಡಿಯಾ (SBI)',
    ),
  },
  {
    id: 'hdfc',
    kind: 'company',
    domains: ['hdfcbank.com'],
    impersonationTokens: ['hdfcbank'],
    name: {
      en: 'HDFC Bank',
      te: 'హెచ్‌డిఎఫ్‌సి బ్యాంక్ (HDFC Bank)',
      hi: 'एचडीएफसी बैंक (HDFC Bank)',
      ta: 'எச்டிஎப்சி வங்கி (HDFC Bank)',
      ml: 'എച്ച്ഡിഎഫ്സി ബാങ്ക് (HDFC Bank)',
      kn: 'ಎಚ್‌ಡಿಎಫ್‌ಸಿ ಬ್ಯಾಂಕ್ (HDFC Bank)',
    },
    category: {
      en: 'Banking / Financial Services',
      te: 'బ్యాంకింగ్ సేవలు',
      hi: 'बैंकिंग / वित्तीय सेवाएं',
      ta: 'வங்கிச் சேவைகள்',
      ml: 'ബാങ്കിംഗ് സേവനങ്ങൾ',
      kn: 'ಬ್ಯಾಂಕಿಂಗ್ ಸೇವೆಗಳು',
    },
    description: makeCompanyDesc(
      'HDFC Bank',
      'హెచ్‌డిఎఫ్‌సి బ్యాంక్',
      'एचडीएफसी बैंक',
      'எச்டிஎப்சி வங்கி',
      'എച്ച്ഡിഎഫ്സി ബാങ്ക്',
      'ಎಚ್‌ಡಿಎಫ್‌ಸಿ ಬ್ಯಾಂಕ್',
    ),
  },
  {
    id: 'icici',
    kind: 'company',
    domains: ['icicibank.com'],
    impersonationTokens: ['icicibank'],
    name: {
      en: 'ICICI Bank',
      te: 'ఐసిఐసిఐ బ్యాంక్ (ICICI Bank)',
      hi: 'आईसीआईसीआई बैंक (ICICI Bank)',
      ta: 'ஐசிஐசிஐ வங்கி (ICICI Bank)',
      ml: 'ഐസിഐസിഐ ബാങ്ക് (ICICI Bank)',
      kn: 'ಐಸಿಐಸಿಐ ಬ್ಯಾಂಕ್ (ICICI Bank)',
    },
    category: {
      en: 'Banking / Financial Services',
      te: 'బ్యాంకింగ్ సేవలు',
      hi: 'बैंकिंग / वित्तीय सेवाएं',
      ta: 'வங்கிச் சேவைகள்',
      ml: 'ബാങ്കിംഗ് സേവനങ്ങൾ',
      kn: 'ಬ್ಯಾಂಕಿಂಗ್ ಸೇವೆಗಳು',
    },
    description: makeCompanyDesc(
      'ICICI Bank',
      'ఐసిఐసిఐ బ్యాంక్',
      'आईसीआईसीआई बैंक',
      'ஐசிஐசிஐ வங்கி',
      'ഐസിഐസിഐ ബാങ്ക്',
      'ಐಸಿಐಸಿಐ ಬ್ಯಾಂಕ್',
    ),
  },
  {
    id: 'npci',
    kind: 'company',
    domains: ['npci.org.in'],
    impersonationTokens: [],
    name: {
      en: 'National Payments Corporation of India (NPCI / UPI)',
      te: 'నేషనల్ పేమెంట్స్ కార్పొరేషన్ ఆఫ్ ఇండియా (NPCI / UPI)',
      hi: 'भारतीय राष्ट्रीय भुगतान निगम (NPCI / UPI)',
      ta: 'இந்திய தேசிய கொடுப்பனவு கழகம் (NPCI / UPI)',
      ml: 'നാഷണൽ പേയ്‌മെന്റ്സ് കോർപ്പറേഷൻ ഓഫ് ഇന്ത്യ (NPCI / UPI)',
      kn: 'ನ್ಯಾಷನಲ್ ಪೇಮೆಂಟ್ಸ್ ಕಾರ್ಪೊರೇಷನ್ ಆಫ್ ಇಂಡಿಯಾ (NPCI / UPI)',
    },
    category: {
      en: 'Payments Infrastructure (UPI)',
      te: 'డిజిటల్ చెల్లింపుల సంస్థ (UPI)',
      hi: 'डिजिटल भुगतान संस्था (UPI)',
      ta: 'டிஜிட்டல் பணப்பரிமாற்ற அமைப்பு (UPI)',
      ml: 'ഡിജിറ്റൽ പേയ്‌മെന്റ് സ്ഥാപനം (UPI)',
      kn: 'ಡಿಜಿಟಲ್ ಪಾವತಿ ಸಂಸ್ಥೆ (UPI)',
    },
    description: makeCompanyDesc(
      'NPCI',
      'NPCI',
      'NPCI',
      'NPCI',
      'NPCI',
      'NPCI',
    ),
  },
  {
    id: 'irctc',
    kind: 'company',
    domains: ['irctc.co.in'],
    impersonationTokens: ['irctc'],
    name: {
      en: 'IRCTC (Indian Railway Catering and Tourism)',
      te: 'ఐఆర్‌సిటిసి (IRCTC — రైల్వే టికెట్లు)',
      hi: 'आईआरसीटीसी (IRCTC — रेलवे टिकट)',
      ta: 'ஐஆர்சிடிசி (IRCTC — ரயில் டிக்கெட்)',
      ml: 'ഐആർസിടിസി (IRCTC — റെയിൽവേ ടിക്കറ്റ്)',
      kn: 'ಐಆರ್‌ಸಿಟಿಸಿ (IRCTC — ರೈಲ್ವೆ ಟಿಕೆಟ್)',
    },
    category: {
      en: 'Railway Ticketing / Travel',
      te: 'రైల్వే టికెట్లు / ప్రయాణం',
      hi: 'रेलवे टिकट / यात्रा',
      ta: 'ரயில் டிக்கெட் / பயணம்',
      ml: 'റെയിൽവേ ടിക്കറ്റ് / യാത്ര',
      kn: 'ರೈಲ್ವೆ ಟಿಕೆಟ್ / ಪ್ರಯಾಣ',
    },
    description: makeCompanyDesc(
      'IRCTC',
      'IRCTC',
      'IRCTC',
      'IRCTC',
      'IRCTC',
      'IRCTC',
    ),
  },
  {
    id: 'flipkart',
    kind: 'company',
    domains: ['flipkart.com'],
    impersonationTokens: ['flipkart'],
    name: {
      en: 'Flipkart',
      te: 'ఫ్లిప్‌కార్ట్ (Flipkart)',
      hi: 'फ्लिपकार्ट (Flipkart)',
      ta: 'பிளிப்கார்ட் (Flipkart)',
      ml: 'ഫ്ലിപ്കാർട്ട് (Flipkart)',
      kn: 'ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ (Flipkart)',
    },
    category: {
      en: 'E-Commerce / Online Shopping',
      te: 'ఆన్‌లైన్ షాపింగ్',
      hi: 'ई-कॉमर्स / ऑनलाइन शॉपिंग',
      ta: 'ஆன்லைன் வணிகம்',
      ml: 'ഓൺലൈൻ ഷോപ്പിംഗ്',
      kn: 'ಆನ್‌ಲೈನ್ ಶಾಪಿಂಗ್',
    },
    description: makeCompanyDesc(
      'Flipkart',
      'ఫ్లిప్‌కార్ట్ (Flipkart)',
      'फ्लिपकार्ट (Flipkart)',
      'பிளிப்கார்ட் (Flipkart)',
      'ഫ്ലിപ്കാർട്ട് (Flipkart)',
      'ಫ್ಲಿಪ್‌ಕಾರ್ಟ್ (Flipkart)',
    ),
  },
  {
    id: 'phonepe',
    kind: 'company',
    domains: ['phonepe.com'],
    impersonationTokens: ['phonepe'],
    name: {
      en: 'PhonePe',
      te: 'ఫోన్‌పే (PhonePe)',
      hi: 'फोनपे (PhonePe)',
      ta: 'போன்பே (PhonePe)',
      ml: 'ഫോൺപേ (PhonePe)',
      kn: 'ಫೋನ್‌ಪೇ (PhonePe)',
    },
    category: {
      en: 'Digital Payments',
      te: 'డిజిటల్ చెల్లింపులు',
      hi: 'डिजिटल भुगतान',
      ta: 'டிஜிட்டல் பணப்பரிமாற்றம்',
      ml: 'ഡിജിറ്റൽ പേയ്‌മെന്റ്',
      kn: 'ಡಿಜಿಟಲ್ ಪಾವತಿ',
    },
    description: makeCompanyDesc(
      'PhonePe',
      'ఫోన్‌పే (PhonePe)',
      'फोनपे (PhonePe)',
      'போன்பே (PhonePe)',
      'ഫോൺപേ (PhonePe)',
      'ಫೋನ್‌ಪೇ (PhonePe)',
    ),
  },
  {
    id: 'paytm',
    kind: 'company',
    domains: ['paytm.com'],
    impersonationTokens: ['paytm'],
    name: {
      en: 'Paytm',
      te: 'పేటీఎం (Paytm)',
      hi: 'पेटीएम (Paytm)',
      ta: 'பேடிஎம் (Paytm)',
      ml: 'പേടിഎം (Paytm)',
      kn: 'ಪೇಟಿಎಂ (Paytm)',
    },
    category: {
      en: 'Digital Payments',
      te: 'డిజిటల్ చెల్లింపులు',
      hi: 'डिजिटल भुगतान',
      ta: 'டிஜிட்டல் பணப்பரிமாற்றம்',
      ml: 'ഡിജിറ്റൽ പേയ്‌മെന്റ്',
      kn: 'ಡಿಜಿಟಲ್ ಪಾವತಿ',
    },
    description: makeCompanyDesc(
      'Paytm',
      'పేటీఎం (Paytm)',
      'पेटीएम (Paytm)',
      'பேடிஎம் (Paytm)',
      'പേടിഎം (Paytm)',
      'ಪೇಟಿಎಂ (Paytm)',
    ),
  },
];

/**
 * Strictly matches actual hostname (exact match or leading-dot subdomain)
 * against authoritative government entities or recognized companies.
 * Never matches by substring or brand name in path/subdomain of another domain!
 */
export function matchOfficialGovEntity(hostname: string): RecognizedEntityMatch | null {
  const clean = hostname.toLowerCase().replace(/\.$/, '');
  if (!clean) return null;
  for (const entity of OFFICIAL_GOV_ENTITIES) {
    for (const dom of entity.domains) {
      if (clean === dom || clean.endsWith('.' + dom)) {
        return {
          kind: 'gov',
          id: entity.id,
          name: entity.name,
          domain: dom,
          category: entity.category,
          description: entity.description,
        };
      }
    }
  }
  return null;
}

export function matchRecognizedCompany(hostname: string): RecognizedEntityMatch | null {
  const clean = hostname.toLowerCase().replace(/\.$/, '');
  if (!clean) return null;
  for (const entity of RECOGNIZED_COMPANIES) {
    for (const dom of entity.domains) {
      if (clean === dom || clean.endsWith('.' + dom)) {
        return {
          kind: 'company',
          id: entity.id,
          name: entity.name,
          domain: dom,
          category: entity.category,
          description: entity.description,
        };
      }
    }
  }
  return null;
}

export const ALL_BRAND_IMPERSONATION_DOMAINS: string[] = [
  ...OFFICIAL_GOV_ENTITIES.flatMap((e) => e.domains),
  ...RECOGNIZED_COMPANIES.flatMap((e) => e.domains),
];

export const ALL_BRAND_IMPERSONATION_TOKENS: Array<{
  token: string;
  entityDomains: string[];
}> = [...OFFICIAL_GOV_ENTITIES, ...RECOGNIZED_COMPANIES].flatMap((e) =>
  e.impersonationTokens.map((token) => ({
    token,
    entityDomains: e.domains,
  })),
);
