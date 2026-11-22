/**
 * Pure normalization, regex extraction, and PII redaction utilities.
 * Zero network calls, zero AI dependency.
 */

const TELUGU_DIGITS_MAP: Record<string, string> = {
  '౦': '0',
  '౧': '1',
  '౨': '2',
  '౩': '3',
  '౪': '4',
  '౫': '5',
  '౬': '6',
  '౭': '7',
  '౮': '8',
  '౯': '9',
};

const DEVANAGARI_DIGITS_MAP: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

export function convertIndicDigitsToAscii(input: string): string {
  return input
    .replace(/[౦-౯]/g, (ch) => TELUGU_DIGITS_MAP[ch] ?? ch)
    .replace(/[०-९]/g, (ch) => DEVANAGARI_DIGITS_MAP[ch] ?? ch);
}

/**
 * Collapses obvious obfuscation spaces inside URLs such as:
 * "https : // pmkisan . gov . in / ekyc" or "pmkisan . gov . in"
 * while leaving natural language sentences untouched.
 */
export function collapseSpacedUrls(input: string): string {
  let out = input;

  // Fix spaced scheme separators: "https : // " -> "https://"
  out = out.replace(/\b(https?|intent|market)\s*:\s*\/\s*\/\s*/gi, '$1://');

  // Repeatedly collapse ASCII label + dot (with at least one surrounding space) + ASCII TLD/domain label
  const spacedDomainRe =
    /\b([a-z0-9][a-z0-9-]{0,62})(?:\s+\.\s*|\s*\.\s+)(gov|nic|in|com|org|net|xyz|top|co|ly|io|info|site|online|click|app|apk|zip|exe|rar|me|cc|gd|gy|gl|at|id|tk|ml|ga|cf|gq|edu|ac|uk|us|biz|shop|live|loan|vip|icu|buzz|sbs|cyou|cfd|store)\b/gi;

  let prev = '';
  let guard = 0;
  while (out !== prev && guard < 6) {
    prev = out;
    out = out.replace(spacedDomainRe, '$1.$2');
    guard++;
  }

  // Collapse space right before/after a path slash attached to a domain: "pmkisan.gov.in / apply" -> "pmkisan.gov.in/apply"
  out = out.replace(
    /\b([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:\s+\/\s*|\s*\/\s+)([a-z0-9._~:/?#[\]@!$&'()*+,;=%-]+)/gi,
    '$1/$2',
  );

  return out;
}

export function normalizeText(raw: string): string {
  const nfc = raw.normalize('NFC').trim();
  const asciiDigits = convertIndicDigitsToAscii(nfc);
  return collapseSpacedUrls(asciiDigits);
}

function stripTrailingPunctuation(candidate: string): string {
  // Remove trailing sentence punctuation and unmatched brackets/quotes
  let s = candidate.trim();
  while (s.length > 0 && /[.,;:!?'"\u2018\u2019\u201C\u201D\u0964\u0965<>)\]}]+$/.test(s)) {
    const last = s[s.length - 1];
    if (last === ')' && (s.match(/\(/g)?.length ?? 0) >= (s.match(/\)/g)?.length ?? 0)) {
      break;
    }
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * Extracts http(s) URLs, intent:// and market:// deep-links, www. domains, and bare domains.
 */
export function extractUrls(rawInput: string): string[] {
  const text = normalizeText(rawInput);
  const found: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (u: string) => {
    const cleaned = stripTrailingPunctuation(u);
    if (!cleaned) return;
    // Skip email addresses like name@domain.com unless there is an explicit scheme (userinfo phishing)
    if (
      !/^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned) &&
      cleaned.includes('@') &&
      !cleaned.includes('/')
    ) {
      return;
    }
    const key = cleaned.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      found.push(cleaned);
    }
  };

  // 1. Explicit schemes: http://, https://, intent://, market://
  const schemeRe = /\b(?:https?|intent|market):\/\/[^\s<>"{}|\\^`[\]]+/gi;
  let match: RegExpExecArray | null;
  while ((match = schemeRe.exec(text)) !== null) {
    pushUnique(match[0]);
  }

  // Mask already matched scheme URLs so bare regex doesn't double-extract substrings
  const masked = text.replace(schemeRe, ' ');

  // 2. www. forms
  const wwwRe = /\bwww\.[a-z0-9\u00A0-\uFFFF-]+(?:\.[a-z0-9\u00A0-\uFFFF-]+)+(?:\/[^\s<>"{}|\\^`[\]]*)?/gi;
  while ((match = wwwRe.exec(masked)) !== null) {
    pushUnique(match[0]);
  }
  const masked2 = masked.replace(wwwRe, ' ');

  // Mask emails before bare domain extraction
  const maskedNoEmails = masked2.replace(
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
    ' ',
  );

  // 3. Bare domains (including IPv4 with path and IDN domains)
  const bareDomainRe =
    /(?:^|[\s([{"'])((?:[a-z0-9\u00A0-\uFFFF](?:[a-z0-9\u00A0-\uFFFF-]{0,61}[a-z0-9\u00A0-\uFFFF])?\.)+(?:gov\.in|nic\.in|ac\.in|co\.in|org\.in|net\.in|in|com|org|net|xyz|top|click|tk|ml|ga|cf|gq|buzz|icu|vip|work|live|loan|cfd|sbs|cyou|shop|online|site|store|ly|co|gl|gy|gd|cc|me|at|id|io|info|biz|app|edu)(?::\d{1,5})?(?:\/[^\s<>"{}|\\^`[\]]*)?)/gi;

  while ((match = bareDomainRe.exec(maskedNoEmails)) !== null) {
    if (match[1]) {
      pushUnique(match[1]);
    }
  }

  // 4. Bare IPv4 with optional port/path (e.g. 203.0.113.10/pmkisan)
  const bareIpRe =
    /(?:^|[\s([{"'])((?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?(?:\/[^\s<>"{}|\\^`[\]]*)?)/g;
  while ((match = bareIpRe.exec(maskedNoEmails)) !== null) {
    const candidate = match[1];
    if (candidate) {
      const octets = candidate.split(/[/:]/)[0].split('.').map(Number);
      if (octets.length === 4 && octets.every((o) => o >= 0 && o <= 255)) {
        pushUnique(candidate);
      }
    }
  }

  return found;
}

export interface RegexMessageEntities {
  urls: string[];
  phones: string[];
  upiIds: string[];
  amounts: string[];
  aadhaarLike: string[];
  accountLike: string[];
  ifscCodes: string[];
  otpMentions: boolean;
  deadlines: string[];
}

export function extractMessageEntities(rawInput: string): RegexMessageEntities {
  const text = normalizeText(rawInput);
  const urls = extractUrls(text);

  // Indian mobile numbers (+91 or 10 digits starting 6-9) and short helplines (1930, 14447, 155261)
  const phoneMatches = new Set<string>();
  const mobileRe = /(?:\+91[\s-]?)?\b([6-9]\d{9})\b/g;
  let m: RegExpExecArray | null;
  while ((m = mobileRe.exec(text)) !== null) {
    phoneMatches.add(m[1]);
  }
  const helplineRe = /\b(1930|14447|155261|1800[\s-]?\d{3}[\s-]?\d{4})\b/g;
  while ((m = helplineRe.exec(text)) !== null) {
    phoneMatches.add(m[1].replace(/\s+/g, ''));
  }

  // UPI IDs (e.g. name@oksbi, number@ybl, help@paytm)
  const upiIds: string[] = [];
  const upiRe =
    /\b[a-z0-9._-]{2,}@(?:oksbi|okhdfcbank|okicici|okaxis|ybl|ibl|axl|paytm|upi|apl|sbi|hdfcbank|icici|barodampay|pnb|kotak|federal|indus|airtel|jio|fbl)\b/gi;
  while ((m = upiRe.exec(text)) !== null) {
    upiIds.push(m[0]);
  }

  // Amounts (₹, Rs., INR, రూ.)
  const amounts: string[] = [];
  const amountRe = /(?:₹|Rs\.?|INR|రూ\.?)\s*\d[\d,]*(?:\.\d{1,2})?/gi;
  while ((m = amountRe.exec(text)) !== null) {
    amounts.push(m[0].trim());
  }

  // 12-digit Aadhaar-like numbers (with optional spaces/hyphens)
  const aadhaarLike: string[] = [];
  const aadhaarRe = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  while ((m = aadhaarRe.exec(text)) !== null) {
    aadhaarLike.push(m[0]);
  }

  // Bank account-like numbers (9-18 digits excluding 10-digit mobiles & 12-digit Aadhaar)
  const accountLike: string[] = [];
  const accountRe = /\b\d{9,18}\b/g;
  while ((m = accountRe.exec(text)) !== null) {
    const val = m[0];
    if (val.length !== 10 && val.length !== 12) {
      accountLike.push(val);
    }
  }

  // IFSC codes (4 letters + 0 + 6 alphanumeric)
  const ifscCodes: string[] = [];
  const ifscRe = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;
  while ((m = ifscRe.exec(text)) !== null) {
    ifscCodes.push(m[0]);
  }

  const otpMentions = /\b(?:otp|one[\s-]?time[\s-]?password|ఓటీపీ|ఓటిపి|ओटीपी)\b/i.test(text);

  const deadlines: string[] = [];
  const deadlineRe =
    /\b(?:today|tonight|within\s+\d+\s*(?:hours?|mins?|minutes?|days?)|last\s+date|urgent|immediately|expire[sd]?|blocked|suspended)\b|(?:ఈరోజు|ఈ రాత్రి|తక్షణమే|అత్యవసరం|చివరి తేదీ|నిలిపివేయబడుతుంది|గంటల్లో|నిమిషాల్లో|आज|तुरंत|बंद हो जाएगा)/gi;
  while ((m = deadlineRe.exec(text)) !== null) {
    deadlines.push(m[0]);
  }

  return {
    urls,
    phones: Array.from(phoneMatches),
    upiIds,
    amounts,
    aadhaarLike,
    accountLike,
    ifscCodes,
    otpMentions,
    deadlines,
  };
}

/**
 * Redacts PII and URL query strings/fragments BEFORE any LLM call.
 * Per Section 5B step 3:
 * Aadhaar-like numbers, mobile numbers, account numbers, IFSC, UPI IDs, emails,
 * OTP digits, and URL query strings/fragments are replaced with typed placeholders.
 */
export function redactForLlm(rawInput: string): string {
  let out = normalizeText(rawInput);

  // Strip URL query strings and fragments while keeping scheme + host + path
  out = out.replace(
    /(\b(?:https?|intent|market):\/\/[^\s?#]+)(?:\?[^\s#]*)?(?:#[^\s]*)?/gi,
    (_m, base: string, offset: number, full: string) => {
      const slice = full.slice(offset);
      const hasQueryOrFrag = /^\S*[?#]/.test(slice);
      return hasQueryOrFrag ? `${base}[REDACTED_URL_PARAMS]` : base;
    },
  );

  // Emails & UPI IDs
  out = out.replace(
    /\b[a-z0-9._-]{2,}@(?:oksbi|okhdfcbank|okicici|okaxis|ybl|ibl|axl|paytm|upi|apl|sbi|hdfcbank|icici|barodampay|pnb|kotak|federal|indus|airtel|jio|fbl)\b/gi,
    '[REDACTED_UPI]',
  );
  out = out.replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, '[REDACTED_EMAIL]');

  // IFSC codes
  out = out.replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[REDACTED_IFSC]');

  // Aadhaar-like 12-digit numbers (spaced or solid)
  out = out.replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, '[REDACTED_AADHAAR]');
  out = out.replace(/\b\d{12}\b/g, '[REDACTED_AADHAAR]');

  // Account numbers (9-18 digits, non-10-digit)
  out = out.replace(/\b\d{13,18}\b/g, '[REDACTED_ACCOUNT]');
  out = out.replace(/\b\d{11}\b/g, '[REDACTED_ACCOUNT]');
  out = out.replace(/\b\d{9}\b/g, '[REDACTED_ACCOUNT]');

  // Mobile numbers (+91 optional, 10 digits starting 6-9)
  out = out.replace(/(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]');

  // OTP digits near OTP / PIN / CVV keywords (4 to 8 digits)
  out = out.replace(
    /(\b(?:otp|pin|cvv|code|ఓటీపీ|ఓటిపి|ओटीपी)\s*(?:is|:|-|నంబర్|కోడ్)?\s*)(\d{4,8})\b/gi,
    '$1[REDACTED_OTP]',
  );
  out = out.replace(
    /\b(\d{4,8})(\s*(?:is\s+your\s+|మీ\s+)?(?:otp|pin|cvv|ఓటీపీ|ఓటిపి|ओटीपी)\b)/gi,
    '[REDACTED_OTP]$2',
  );

  return out;
}
