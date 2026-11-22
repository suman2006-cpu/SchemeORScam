import type { SchemeEntry } from '../engine/types';

/**
 * Registry seed per Section 6 of the project brief.
 * Rule: NEVER invent URLs, phone numbers, or scheme process steps.
 * Each seeded entry carries teamVerificationNote and leaves verifiedOn empty
 * until confirmed against the official page by the team via /admin.
 *
 * Note: *.gov.in and *.nic.in domain-level rule is built into the link engine.
 */
export const REGISTRY_SEED: SchemeEntry[] = [
  {
    id: 'cybercrime-portal',
    nameEn: 'National Cyber Crime Reporting Portal & Helpline 1930',
    nameTe: 'నేషనల్ సైబర్ క్రైమ్ పోర్టల్ & 1930 హెల్ప్‌లైన్',
    aliases: ['cybercrime', '1930', 'cyber crime', 'సైబర్ క్రైమ్', 'సైబర్ మోసం'],
    level: 'central',
    officialDomains: ['cybercrime.gov.in'],
    officialApps: [],
    officialChannels: [
      {
        type: 'web',
        value: 'https://cybercrime.gov.in/',
        sourceUrl: 'https://cybercrime.gov.in/',
        verifiedOn: '',
        noteTe: 'అధికారిక సైబర్ క్రైమ్ ఫిర్యాదు పోర్టల్',
        noteEn: 'Official cyber crime complaint portal',
      },
      {
        type: 'helpline',
        value: '1930',
        sourceUrl: 'https://cybercrime.gov.in/',
        verifiedOn: '',
        noteTe: 'ఆర్థిక సైబర్ మోసాల అత్యవసర హెల్ప్‌లైన్',
        noteEn: 'Financial cyber fraud emergency helpline',
      },
    ],
    processes: [],
    status: 'unverified',
    teamVerificationNote: 'team must confirm against the official page before the demo',
  },
  {
    id: 'sanchar-saathi',
    nameEn: 'Sanchar Saathi (Chakshu Reporting)',
    nameTe: 'సంచార్ సాథీ (చక్షు రిపోర్టింగ్)',
    aliases: ['sanchar saathi', 'sancharsaathi', 'chakshu', 'సంచార్ సాథీ', 'చక్షు'],
    level: 'central',
    officialDomains: ['sancharsaathi.gov.in'],
    officialApps: [],
    officialChannels: [
      {
        type: 'web',
        value: 'https://sancharsaathi.gov.in/',
        sourceUrl: 'https://sancharsaathi.gov.in/',
        verifiedOn: '',
        noteTe: 'అనుమానాస్పద కాల్స్, SMS, WhatsApp మెసేజ్‌ల రిపోర్టింగ్',
        noteEn: 'Report suspected fraud calls, SMS, and WhatsApp messages',
      },
    ],
    processes: [],
    status: 'unverified',
    teamVerificationNote: 'team must confirm against the official page before the demo',
  },
  {
    id: 'pm-kisan',
    nameEn: 'PM-KISAN',
    nameTe: 'పిఎం-కిసాన్ (PM-KISAN)',
    aliases: [
      'pmkisan',
      'pm-kisan',
      'pm kisan',
      'kisan samman',
      'పిఎం కిసాన్',
      'పీఎం కిసాన్',
      'కిసాన్ సమ్మాన్',
      'पीएम किसान',
    ],
    level: 'central',
    officialDomains: ['pmkisan.gov.in'],
    officialApps: [],
    officialChannels: [
      {
        type: 'web',
        value: 'https://pmkisan.gov.in/',
        sourceUrl: 'https://pmkisan.gov.in/',
        verifiedOn: '',
        noteTe: 'పిఎం-కిసాన్ అధికారిక వెబ్‌సైట్',
        noteEn: 'PM-KISAN official portal',
      },
    ],
    // Process steps intentionally left empty until sourced & verified per Section 6
    processes: [],
    status: 'unverified',
    teamVerificationNote: 'team must confirm against the official page before the demo',
  },
  {
    id: 'pmfby-crop-insurance',
    nameEn: 'Crop Insurance (PMFBY)',
    nameTe: 'పంట బీమా (PMFBY)',
    aliases: [
      'pmfby',
      'fasal bima',
      'crop insurance',
      'పంట బీమా',
      'ఫసల్ బీమా',
      'फसल बीमा',
    ],
    level: 'central',
    officialDomains: ['pmfby.gov.in'],
    officialApps: [],
    officialChannels: [
      {
        type: 'helpline',
        value: '14447',
        sourceUrl: '',
        verifiedOn: '',
        noteTe: 'పంట బీమా (PMFBY) హెల్ప్‌లైన్',
        noteEn: 'Crop insurance (PMFBY) helpline',
      },
    ],
    processes: [],
    status: 'unverified',
    teamVerificationNote: 'team must confirm against the official page before the demo',
  },
  {
    id: 'bharat-vistaar',
    nameEn: 'Bharat-VISTAAR',
    nameTe: 'భారత్-విస్తార్ (Bharat-VISTAAR)',
    aliases: ['bharat vistaar', 'bharat-vistaar', 'vistaar', 'భారత్ విస్తార్'],
    level: 'central',
    officialDomains: [],
    officialApps: [],
    officialChannels: [
      {
        type: 'helpline',
        value: '155261',
        sourceUrl: '',
        verifiedOn: '',
        noteTe: 'భారత్-విస్తార్ హెల్ప్‌లైన్',
        noteEn: 'Bharat-VISTAAR helpline',
      },
    ],
    processes: [],
    status: 'unverified',
    teamVerificationNote: 'team must confirm against the official page before the demo',
  },
  {
    id: 'ap-mana-mitra',
    nameEn: 'Andhra Pradesh Mana Mitra',
    nameTe: 'ఆంధ్రప్రదేశ్ మన మిత్ర',
    aliases: ['mana mitra', 'manamitra', 'మన మిత్ర', 'ఆంధ్రప్రదేశ్ మన మిత్ర'],
    level: 'state',
    officialDomains: [],
    officialApps: [],
    officialChannels: [
      {
        type: 'helpline',
        value: '9552300009',
        sourceUrl: '',
        verifiedOn: '',
        noteTe: 'ఆంధ్రప్రదేశ్ మన మిత్ర వాట్సాప్ నంబర్',
        noteEn: 'Andhra Pradesh Mana Mitra WhatsApp number',
      },
    ],
    processes: [],
    status: 'unverified',
    teamVerificationNote: 'team must confirm against the official page before the demo',
  },
  {
    id: 'uidai-aadhaar',
    nameEn: 'UIDAI (Aadhaar)',
    nameTe: 'యూఐడీఏఐ (ఆధార్)',
    aliases: [
      'uidai',
      'aadhaar',
      'aadhar',
      'myaadhaar',
      'ఆధార్',
      'आधार',
      'ஆதார்',
      'ആധാർ',
      'ಆಧಾರ್',
    ],
    level: 'central',
    officialDomains: ['uidai.gov.in'],
    officialApps: [],
    officialChannels: [
      {
        type: 'web',
        value: 'https://uidai.gov.in/',
        sourceUrl: 'https://uidai.gov.in/',
        verifiedOn: '',
        noteTe: 'అధికారిక ఆధార్ (UIDAI) వెబ్‌సైట్',
        noteEn: 'Official UIDAI (Aadhaar) portal',
      },
    ],
    processes: [],
    status: 'unverified',
    teamVerificationNote: 'team must confirm against the official page before the demo',
  },
];

/**
 * Domain allowlist derived from Section 6 seed for exact official host matching
 * alongside *.gov.in and *.nic.in.
 */
export const CORE_SEED_DOMAINS: string[] = [
  'pmkisan.gov.in',
  'cybercrime.gov.in',
  'sancharsaathi.gov.in',
  'uidai.gov.in',
  'pmfby.gov.in',
  'scholarships.gov.in',
];
