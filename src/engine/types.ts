export type Verdict =
  | 'OFFICIAL'
  | 'RECOGNIZED_COMPANY'
  | 'NOT_VERIFIED'
  | 'LIKELY_FAKE';

export type Language = 'en' | 'te' | 'hi' | 'ta' | 'ml' | 'kn';

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  'en',
  'te',
  'hi',
  'ta',
  'ml',
  'kn',
] as const;

export const LANGUAGE_META: Record<
  Language,
  { nativeName: string; englishName: string; locale: string }
> = {
  en: { nativeName: 'English', englishName: 'English', locale: 'en-IN' },
  te: { nativeName: 'తెలుగు', englishName: 'Telugu', locale: 'te-IN' },
  hi: { nativeName: 'हिन्दी', englishName: 'Hindi', locale: 'hi-IN' },
  ta: { nativeName: 'தமிழ்', englishName: 'Tamil', locale: 'ta-IN' },
  ml: { nativeName: 'മലയാളം', englishName: 'Malayalam', locale: 'ml-IN' },
  kn: { nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', locale: 'kn-IN' },
};

export type LocalizedText = Record<Language, string>;

export type WebsiteTrustCategory =
  | 'OFFICIAL_GOV'
  | 'RECOGNIZED_COMPANY'
  | 'UNKNOWN_UNCONFIRMED'
  | 'POTENTIALLY_UNSAFE'
  | 'NO_URL';

export type MessageAuthenticityStatus =
  | 'SUPPORTED_OFFICIAL'
  | 'UNVERIFIED_CLAIM'
  | 'SUSPICIOUS_OR_FAKE'
  | 'NO_MESSAGE_CLAIM';

export type StatusTone = 'green' | 'amber' | 'red' | 'neutral';

export type FlagSeverity = 'hard' | 'soft' | 'info';

export type FlagId =
  | 'H1_DOWNLOAD_FILE'
  | 'H2_SCHEME_TOKEN_NON_OFFICIAL'
  | 'H3_LOOKALIKE_DOMAIN'
  | 'H4_PUNYCODE_OR_MIXED_SCRIPT'
  | 'H5_USERINFO_IP_OR_PORT'
  | 'H6_UNSAFE_ASK'
  | 'H7_FORWARD_CHAIN'
  | 'H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE'
  | 'H9_SHORTENER_TO_MALICIOUS'
  | 'H10_SAFE_BROWSING_MATCH'
  | 'S1_NEW_DOMAIN'
  | 'S2_NON_HTTPS'
  | 'S3_UNRESOLVED_SHORTENER'
  | 'S4_HIGH_ABUSE_TLD'
  | 'S5_UNKNOWN_DOMAIN'
  | 'S6_SCHEME_DOMAIN_MISMATCH'
  | 'S7_NO_URL_UNVERIFIED_CLAIM'
  | 'INFO_OFFICIAL_GOV_DOMAIN'
  | 'INFO_OFFICIAL_REGISTRY_DOMAIN'
  | 'INFO_RECOGNIZED_COMPANY';

export interface FlagItem {
  id: FlagId;
  severity: FlagSeverity;
  evidence?: string;
}

export interface ReasonItem {
  id: FlagId;
  severity: FlagSeverity;
  te: string;
  en: string;
  hi: string;
  ta: string;
  ml: string;
  kn: string;
  evidence?: string;
}

export interface OfficialChannel {
  type: 'web' | 'helpline' | 'office';
  value: string;
  sourceUrl: string;
  verifiedOn: string;
  noteTe?: string;
  noteEn?: string;
}

export interface SchemeProcess {
  action: RequestedAction;
  stepsTe: string[];
  stepsEn: string[];
  sourceUrl: string;
  verifiedOn: string;
}

export interface SchemeEntry {
  id: string;
  nameEn: string;
  nameTe: string;
  aliases: string[];
  level: 'central' | 'state';
  officialDomains: string[];
  officialApps: string[];
  officialChannels: OfficialChannel[];
  processes: SchemeProcess[];
  status: 'verified' | 'unverified';
  teamVerificationNote: string;
}

export type RequestedAction =
  | 'ekyc'
  | 'register'
  | 'claim'
  | 'pay_fee'
  | 'share_otp_with_person'
  | 'enter_otp_on_page'
  | 'enter_bank_details'
  | 'install_app'
  | 'forward'
  | 'call_number'
  | 'other';

export interface StructuredMessageExtraction {
  scheme_mentioned: string | null;
  claimed_sender: string | null;
  requested_actions: RequestedAction[];
  urgency_phrases: string[];
  asks_to_forward: boolean;
  mentions_money: boolean;
  language: Language | 'other';
  /** Optional concise AI summary in the user's selected language (never decides verdict). */
  ai_explanation?: string | null;
}

export interface RecognizedEntityMatch {
  kind: 'gov' | 'company';
  id: string;
  name: LocalizedText;
  domain: string;
  category: LocalizedText;
  description: LocalizedText;
}

export interface DestinationInfo {
  originalInputUrl: string;
  finalUrl: string;
  hostname: string;
  subdomain: string;
  registrableDomain: string;
  isOfficialDomain: boolean;
  isRecognizedCompany: boolean;
  trustCategory: WebsiteTrustCategory;
  recognizedEntity?: RecognizedEntityMatch | null;
  wasShortener: boolean;
  expandedFrom?: string;
}

export interface WebsiteTrustResult {
  category: WebsiteTrustCategory;
  tone: StatusTone;
  domain: string;
  hostname: string;
  subdomain: string;
  organizationName: LocalizedText | null;
  categoryLabel: LocalizedText | null;
  description: LocalizedText;
  matchesMentionedScheme: boolean | null;
  flags: ReasonItem[];
}

export interface MessageAuthenticityResult {
  status: MessageAuthenticityStatus;
  tone: StatusTone;
  hasGovernmentClaim: boolean;
  detectedLanguage: Language | 'other';
  summary: LocalizedText;
  aiExplanationByLang?: Partial<Record<Language, string>>;
  flags: ReasonItem[];
}

export interface OfficialPathInfo {
  schemeId: string;
  schemeNameTe: string;
  schemeNameEn: string;
  action?: RequestedAction;
  stepsTe: string[];
  stepsEn: string[];
  channels: OfficialChannel[];
  sourceUrl: string;
  verifiedOn: string;
  domainOnlyNotice: boolean;
}

export interface LinkAnalysisResult {
  rawUrl: string;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  subdomain: string;
  registrableDomain: string;
  isOfficial: boolean;
  isRecognizedCompany: boolean;
  trustCategory: WebsiteTrustCategory;
  recognizedEntity: RecognizedEntityMatch | null;
  isShortener: boolean;
  matchedSchemeId: string | null;
  flags: FlagItem[];
  verdict: Verdict;
}

export interface CheckResult {
  verdict: Verdict;
  websiteTrust: WebsiteTrustResult;
  messageAuthenticity: MessageAuthenticityResult;
  reasons: ReasonItem[];
  allReasons: ReasonItem[];
  destination: DestinationInfo | null;
  allDestinations: DestinationInfo[];
  officialPath: OfficialPathInfo | null;
  schemeMatched: {
    id: string;
    nameTe: string;
    nameEn: string;
  } | null;
  actionDetected: RequestedAction | null;
  engineMode: 'rules+llm' | 'rules-only';
  checkedAt: string;
  extractedPhones: string[];
  originalMessageSnippet?: string;
}

export interface DistrictItem {
  code: string;
  state: 'AP' | 'TS';
  nameTe: string;
  nameEn: string;
}

export interface RadarCluster {
  id: string;
  districtCode: string;
  districtTe: string;
  districtEn: string;
  registrableDomain: string;
  schemeId: string;
  schemeTe: string;
  schemeEn: string;
  actionType: string;
  verdict: Verdict;
  count: number;
  dailyCounts14d: number[];
  isSample: boolean;
  lastSeenBucket: string;
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  targetId: string;
  summary: string;
}

export interface HealthResponse {
  ok: boolean;
  storageMode: 'memory' | 'supabase';
  providers: {
    llm: string;
    ocr: string;
    asr: string;
    tts: string;
    safeBrowsing: boolean;
  };
  radarMinCount: number;
}
