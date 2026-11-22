import { parse as parseTld } from 'tldts';
import highAbuseTlds from '../data/highAbuseTlds.json';
import { CORE_SEED_DOMAINS, REGISTRY_SEED } from '../data/registrySeed';
import {
  ALL_BRAND_IMPERSONATION_DOMAINS,
  ALL_BRAND_IMPERSONATION_TOKENS,
  matchOfficialGovEntity,
  matchRecognizedCompany,
} from '../data/trustedEntities';
import { normalizeText } from './normalize';
import type {
  FlagItem,
  LinkAnalysisResult,
  SchemeEntry,
  Verdict,
  WebsiteTrustCategory,
} from './types';

const DOWNLOAD_EXT_RE = /\.(?:apk|xapk|zip|rar|exe)(?:$|[?#&/])/i;

const SHORTENER_DOMAINS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'rb.gy',
  'cutt.ly',
  'is.gd',
  'shorturl.at',
  'tiny.cc',
  'ow.ly',
  'rebrand.ly',
  'buff.ly',
  's.id',
  'v.gd',
  'short.io',
  'bl.ink',
  'lnkd.in',
  'shrtco.de',
]);

const UNOFFICIAL_APP_STORE_DOMAINS = new Set([
  'apkpure.com',
  'apkcombo.com',
  'apkmirror.com',
  'aptoide.com',
  'uptodown.com',
  'play.google.com',
  'apps.apple.com',
]);

const HIGH_ABUSE_TLD_SET = new Set<string>(
  (highAbuseTlds as string[]).map((t) => t.toLowerCase()),
);

const SCHEME_KEYWORDS = [
  'pmkisan',
  'kisan',
  'pmfby',
  'fasalbima',
  'manamitra',
  'sancharsaathi',
  'cybercrime',
  'uidai',
  'ekyc',
  'kyc',
  'yojana',
  'subsidy',
  'refund',
  'relief',
  'claim',
  'beneficiary',
  'aadhaar',
  'aadhar',
  'ration',
  'pension',
  'scholarship',
  'bharathvistaar',
  'bharatvistaar',
];

export interface LinkEngineOptions {
  registry?: SchemeEntry[];
  extraAllowlist?: string[];
  resolvedFromShortener?: boolean;
  serverContentType?: string;
  serverAttachmentFilename?: string;
  safeBrowsingMatch?: boolean;
  domainAgeDays?: number | null;
  shortenerUnresolved?: boolean;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function getScriptCategory(cp: number): string | null {
  if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) return 'Latin';
  if (cp >= 0x00c0 && cp <= 0x024f) return 'Latin';
  if (cp >= 0x0400 && cp <= 0x04ff) return 'Cyrillic';
  if (cp >= 0x0370 && cp <= 0x03ff) return 'Greek';
  if (cp >= 0x0c00 && cp <= 0x0c7f) return 'Telugu';
  if (cp >= 0x0900 && cp <= 0x097f) return 'Devanagari';
  if (cp >= 0x0b80 && cp <= 0x0bff) return 'Tamil';
  if (cp >= 0x0d00 && cp <= 0x0d7f) return 'Malayalam';
  if (cp >= 0x0c80 && cp <= 0x0cff) return 'Kannada';
  if (cp >= 0x0600 && cp <= 0x06ff) return 'Arabic';
  if (cp >= 0x4e00 && cp <= 0x9fff) return 'Han';
  return null;
}

export function hasMixedScriptLabel(rawHost: string): boolean {
  const labels = rawHost.split('.');
  for (const label of labels) {
    const scripts = new Set<string>();
    for (const ch of label) {
      const cp = ch.codePointAt(0);
      if (cp === undefined) continue;
      const script = getScriptCategory(cp);
      if (script) scripts.add(script);
    }
    if (scripts.size > 1) return true;
  }
  return false;
}

export function isIpHostname(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, '');
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(h)) {
    const parts = h.split('.').map(Number);
    if (parts.every((p) => p >= 0 && p <= 255)) return true;
  }
  if (h.includes(':')) return true;
  if (/^(?:0x[0-9a-f]+|\d+)$/i.test(h)) return true;
  return false;
}

export function isOfficialHostname(
  hostname: string,
  allowlist: string[],
): boolean {
  const clean = hostname.toLowerCase().replace(/\.$/, '');
  if (!clean) return false;

  // Built-in Indian government domains (exact or leading-dot suffix)
  if (
    clean === 'gov.in' ||
    clean.endsWith('.gov.in') ||
    clean === 'nic.in' ||
    clean.endsWith('.nic.in')
  ) {
    return true;
  }

  for (const allowed of allowlist) {
    const target = allowed.toLowerCase().replace(/\.$/, '');
    if (!target) continue;
    if (clean === target || clean.endsWith('.' + target)) {
      return true;
    }
  }
  return false;
}

function getAllowlistedDomains(registry: SchemeEntry[], extra?: string[]): string[] {
  const set = new Set<string>(CORE_SEED_DOMAINS);
  for (const entry of registry) {
    for (const dom of entry.officialDomains) {
      const d = dom.toLowerCase().replace(/\.$/, '');
      if (
        entry.status === 'verified' ||
        d.endsWith('.gov.in') ||
        d.endsWith('.nic.in')
      ) {
        set.add(d);
      }
    }
  }
  if (extra) {
    for (const d of extra) set.add(d.toLowerCase().replace(/\.$/, ''));
  }
  return Array.from(set);
}

function getAllowlistedApps(registry: SchemeEntry[]): Set<string> {
  const set = new Set<string>();
  for (const entry of registry) {
    if (entry.status === 'verified') {
      for (const app of entry.officialApps) {
        set.add(app.toLowerCase());
      }
    }
  }
  return set;
}

function matchSchemeByDomain(hostname: string, registry: SchemeEntry[]): string | null {
  const clean = hostname.toLowerCase().replace(/\.$/, '');
  for (const entry of registry) {
    for (const dom of entry.officialDomains) {
      const target = dom.toLowerCase().replace(/\.$/, '');
      if (clean === target || clean.endsWith('.' + target)) {
        return entry.id;
      }
    }
  }
  return null;
}

function extractRawHostBeforePunycode(urlStr: string): string {
  const match = urlStr.match(/^[a-z][a-z0-9+.-]*:\/\/(?:[^/@\s]+@)?([^/?#:\s]+)/i);
  return match ? match[1] : '';
}

function addFlag(flags: FlagItem[], flag: FlagItem) {
  if (!flags.some((f) => f.id === flag.id)) {
    flags.push(flag);
  }
}

export function analyzeUrl(
  rawUrlInput: string,
  options: LinkEngineOptions = {},
): LinkAnalysisResult {
  const registry = options.registry ?? REGISTRY_SEED;
  const allowlist = getAllowlistedDomains(registry, options.extraAllowlist);
  const allowlistedApps = getAllowlistedApps(registry);

  const normalized = normalizeText(rawUrlInput).trim();
  const flags: FlagItem[] = [];

  // Detect app deep-link schemes immediately (H8)
  if (/^(?:intent|market):\/\//i.test(normalized)) {
    addFlag(flags, {
      id: 'H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE',
      severity: 'hard',
      evidence: normalized.slice(0, 80),
    });
    const proto = normalized.split('://')[0].toLowerCase() + ':';
    return {
      rawUrl: rawUrlInput,
      normalizedUrl: normalized,
      protocol: proto,
      hostname: normalized.split('://')[1]?.split(/[/?#]/)[0]?.toLowerCase() ?? '',
      subdomain: '',
      registrableDomain: '',
      isOfficial: false,
      isRecognizedCompany: false,
      trustCategory: 'POTENTIALLY_UNSAFE',
      recognizedEntity: null,
      isShortener: false,
      matchedSchemeId: null,
      flags,
      verdict: 'LIKELY_FAKE',
    };
  }

  // Ensure URL has a scheme for WHATWG URL parsing
  const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(normalized);
  const urlToParse = hasExplicitScheme ? normalized : `https://${normalized}`;

  let parsed: URL;
  try {
    parsed = new URL(urlToParse);
  } catch {
    addFlag(flags, {
      id: 'S5_UNKNOWN_DOMAIN',
      severity: 'soft',
      evidence: normalized.slice(0, 80),
    });
    return {
      rawUrl: rawUrlInput,
      normalizedUrl: normalized,
      protocol: '',
      hostname: '',
      subdomain: '',
      registrableDomain: '',
      isOfficial: false,
      isRecognizedCompany: false,
      trustCategory: 'UNKNOWN_UNCONFIRMED',
      recognizedEntity: null,
      isShortener: false,
      matchedSchemeId: null,
      flags,
      verdict: 'NOT_VERIFIED',
    };
  }

  const rawHostBeforePunycode = extractRawHostBeforePunycode(urlToParse);
  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const tldInfo = parseTld(hostname, { allowPrivateDomains: true });
  const registrableDomain = (tldInfo.domain ?? hostname).toLowerCase();
  const subdomain = (tldInfo.subdomain ?? '').toLowerCase();
  const publicSuffix = (tldInfo.publicSuffix ?? '').toLowerCase();
  const domainWithoutSuffix = (tldInfo.domainWithoutSuffix ?? '').toLowerCase();

  const isOfficial = isOfficialHostname(hostname, allowlist);
  const isShortener = SHORTENER_DOMAINS.has(registrableDomain);
  const matchedSchemeId = isOfficial ? matchSchemeByDomain(hostname, registry) : null;

  // Check if host is an unofficial/unverified app store link before recognized company match
  const isAppStoreHost =
    UNOFFICIAL_APP_STORE_DOMAINS.has(registrableDomain) ||
    UNOFFICIAL_APP_STORE_DOMAINS.has(hostname);

  const govEntity = isOfficial ? matchOfficialGovEntity(hostname) : null;
  const companyEntity =
    !isOfficial && !isAppStoreHost ? matchRecognizedCompany(hostname) : null;
  const isRecognizedCompany = Boolean(companyEntity);
  const recognizedEntity = govEntity ?? companyEntity;

  // H1: Download link (.apk/.xapk/.zip/.rar/.exe in path or query, or Android MIME / attachment filename)
  let decodedPathAndQuery = parsed.pathname + parsed.search;
  try {
    decodedPathAndQuery = decodeURIComponent(decodedPathAndQuery);
  } catch {
    // keep raw if malformed percent-encoding
  }
  if (
    DOWNLOAD_EXT_RE.test(parsed.pathname) ||
    DOWNLOAD_EXT_RE.test(parsed.search) ||
    DOWNLOAD_EXT_RE.test(decodedPathAndQuery) ||
    (options.serverContentType &&
      /application\/vnd\.android\.package-archive/i.test(options.serverContentType)) ||
    (options.serverAttachmentFilename &&
      DOWNLOAD_EXT_RE.test(options.serverAttachmentFilename))
  ) {
    addFlag(flags, {
      id: 'H1_DOWNLOAD_FILE',
      severity: 'hard',
      evidence:
        options.serverAttachmentFilename ||
        parsed.pathname.slice(-40) ||
        parsed.search.slice(-40),
    });
  }

  // H4: Punycode or mixed-script host
  if (
    hostname.split('.').some((label) => label.startsWith('xn--')) ||
    hasMixedScriptLabel(rawHostBeforePunycode) ||
    /[^\x00-\x7F]/.test(rawHostBeforePunycode)
  ) {
    addFlag(flags, {
      id: 'H4_PUNYCODE_OR_MIXED_SCRIPT',
      severity: 'hard',
      evidence: hostname,
    });
  }

  // H5: Userinfo "@", IP-address host, or non-standard port
  const hasUserinfo = Boolean(
    parsed.username || parsed.password || /\/\/[^/?#]*@/.test(urlToParse),
  );
  const isIp = isIpHostname(hostname);
  const hasNonStandardPort =
    Boolean(parsed.port) &&
    !(
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    );

  if (hasUserinfo || isIp || hasNonStandardPort) {
    addFlag(flags, {
      id: 'H5_USERINFO_IP_OR_PORT',
      severity: 'hard',
      evidence: hasUserinfo ? '@' : isIp ? hostname : `:${parsed.port}`,
    });
  }

  // H8: App store link not in verified registry
  if (isAppStoreHost) {
    const fullLower = parsed.href.toLowerCase();
    const isAllowedStoreApp = Array.from(allowlistedApps).some((appId) =>
      fullLower.includes(appId),
    );
    if (!isAllowedStoreApp) {
      addFlag(flags, {
        id: 'H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE',
        severity: 'hard',
        evidence: hostname,
      });
    }
  }

  if (!isOfficial && !isRecognizedCompany) {
    const compactHost = hostname.replace(/-/g, '');
    const compactLabel = domainWithoutSuffix.replace(/-/g, '');

    // H2: Scheme token or kyc/yojana/subsidy/etc. in a non-official HOSTNAME (NOT path!)
    const matchedSchemeToken = SCHEME_KEYWORDS.find((token) =>
      compactHost.includes(token),
    );
    if (matchedSchemeToken) {
      addFlag(flags, {
        id: 'H2_SCHEME_TOKEN_NON_OFFICIAL',
        severity: 'hard',
        evidence: `${matchedSchemeToken} -> ${hostname}`,
      });
    }

    // H3: Lookalike domain check (official gov domains + recognized trusted companies)
    let lookalikeEvidence: string | null = null;

    // (a) Official suffix spoofing without leading dot: e.g. evilgov.in, pmkisan-gov.in, uidai-gov-in.example.com
    if (
      /(?:^|[^.])gov\.in$/i.test(hostname) ||
      /(?:^|[^.])nic\.in$/i.test(hostname) ||
      /(?:^|[.-])gov-in(?:\.|$)/i.test(hostname) ||
      /(?:^|[.-])nic-in(?:\.|$)/i.test(hostname) ||
      (compactLabel.endsWith('gov') && publicSuffix === 'in') ||
      (compactLabel.endsWith('nic') && publicSuffix === 'in')
    ) {
      lookalikeEvidence = hostname;
    }

    // (b) Official gov OR recognized brand domain appearing inside subdomain or path of an unrelated domain
    //     e.g. google.com.attacker.example, pmkisan.gov.in.verify-now.xyz, uidai.gov.in.evil.com
    const fullPathLower = decodedPathAndQuery.toLowerCase();
    const impersonatedDomainPatterns = [
      ...allowlist,
      ...ALL_BRAND_IMPERSONATION_DOMAINS,
      'gov.in',
      'nic.in',
    ];
    if (!lookalikeEvidence) {
      for (const trustedDom of impersonatedDomainPatterns) {
        if (
          subdomain === trustedDom ||
          subdomain.endsWith('.' + trustedDom) ||
          subdomain.includes(trustedDom) ||
          hostname.includes(trustedDom + '.') ||
          (trustedDom.endsWith('.gov.in') || trustedDom.endsWith('.nic.in')
            ? fullPathLower.includes(trustedDom)
            : false)
        ) {
          lookalikeEvidence = `${trustedDom} inside ${hostname}`;
          break;
        }
      }
    }

    // (c) Impersonation of well-known brand or gov token in subdomain or deceptive domain label
    //     e.g. uidai-gov-in.example.com, google-verify.xyz, microsoft-login.top
    if (!lookalikeEvidence) {
      for (const item of ALL_BRAND_IMPERSONATION_TOKENS) {
        const ownsDomain = item.entityDomains.some(
          (d) => hostname === d || hostname.endsWith('.' + d),
        );
        if (ownsDomain) continue;
        if (compactHost.includes(item.token)) {
          lookalikeEvidence = `${item.token} inside ${hostname}`;
          break;
        }
      }
    }

    // (d) Edit distance <= 2 to an allowlisted registrable label (hyphens removed)
    //     OR contains an allowlisted registrable label as substring
    if (!lookalikeEvidence && compactLabel.length >= 4) {
      const protectedLabels = new Set<string>();
      for (const dom of [...allowlist, ...ALL_BRAND_IMPERSONATION_DOMAINS]) {
        const p = parseTld(dom, { allowPrivateDomains: true });
        const lbl = (p.domainWithoutSuffix ?? dom.split('.')[0])
          .replace(/-/g, '')
          .toLowerCase();
        if (lbl.length >= 5) protectedLabels.add(lbl);
      }

      for (const lbl of protectedLabels) {
        if (compactLabel.includes(lbl)) {
          lookalikeEvidence = `${hostname} ~ ${lbl}`;
          break;
        }
        if (
          Math.abs(compactLabel.length - lbl.length) <= 2 &&
          levenshtein(compactLabel, lbl) <= 2
        ) {
          lookalikeEvidence = `${hostname} ~ ${lbl}`;
          break;
        }
      }
    }

    if (lookalikeEvidence) {
      addFlag(flags, {
        id: 'H3_LOOKALIKE_DOMAIN',
        severity: 'hard',
        evidence: lookalikeEvidence,
      });
    }
  }

  // H10: Google Safe Browsing match
  if (options.safeBrowsingMatch) {
    addFlag(flags, {
      id: 'H10_SAFE_BROWSING_MATCH',
      severity: 'hard',
      evidence: hostname,
    });
  }

  // H9: Shortener resolved to any H1-H5 or H8 hard target
  const hasHardPreH9 = flags.some((f) => f.severity === 'hard');
  if (options.resolvedFromShortener && hasHardPreH9) {
    addFlag(flags, {
      id: 'H9_SHORTENER_TO_MALICIOUS',
      severity: 'hard',
      evidence: hostname,
    });
  }

  // SOFT flags (push to NOT_VERIFIED, never to OFFICIAL or RECOGNIZED_COMPANY)
  if (
    hasExplicitScheme &&
    parsed.protocol === 'http:' &&
    !isOfficial &&
    !isRecognizedCompany
  ) {
    addFlag(flags, {
      id: 'S2_NON_HTTPS',
      severity: 'soft',
      evidence: 'http://',
    });
  }

  if (isShortener || options.shortenerUnresolved) {
    addFlag(flags, {
      id: 'S3_UNRESOLVED_SHORTENER',
      severity: 'soft',
      evidence: registrableDomain,
    });
  }

  if (
    !isOfficial &&
    !isRecognizedCompany &&
    publicSuffix &&
    HIGH_ABUSE_TLD_SET.has(publicSuffix)
  ) {
    addFlag(flags, {
      id: 'S4_HIGH_ABUSE_TLD',
      severity: 'soft',
      evidence: `.${publicSuffix}`,
    });
  }

  if (
    !isOfficial &&
    !isRecognizedCompany &&
    typeof options.domainAgeDays === 'number' &&
    options.domainAgeDays < 90
  ) {
    addFlag(flags, {
      id: 'S1_NEW_DOMAIN',
      severity: 'soft',
      evidence: `${options.domainAgeDays}d`,
    });
  }

  if (!isOfficial && !isRecognizedCompany && !hasHardPreH9 && !isShortener) {
    addFlag(flags, {
      id: 'S5_UNKNOWN_DOMAIN',
      severity: 'soft',
      evidence: registrableDomain || hostname,
    });
  }

  // Informational notes when clean
  const anyHard = flags.some((f) => f.severity === 'hard');
  if (isOfficial && !anyHard) {
    addFlag(flags, {
      id: matchedSchemeId
        ? 'INFO_OFFICIAL_REGISTRY_DOMAIN'
        : 'INFO_OFFICIAL_GOV_DOMAIN',
      severity: 'info',
      evidence: hostname,
    });
  } else if (isRecognizedCompany && !anyHard) {
    addFlag(flags, {
      id: 'INFO_RECOGNIZED_COMPANY',
      severity: 'info',
      evidence: registrableDomain,
    });
  }

  let trustCategory: WebsiteTrustCategory;
  let verdict: Verdict;
  if (anyHard) {
    trustCategory = 'POTENTIALLY_UNSAFE';
    verdict = 'LIKELY_FAKE';
  } else if (isOfficial) {
    trustCategory = 'OFFICIAL_GOV';
    verdict = 'OFFICIAL';
  } else if (isRecognizedCompany) {
    trustCategory = 'RECOGNIZED_COMPANY';
    verdict = 'RECOGNIZED_COMPANY';
  } else {
    trustCategory = 'UNKNOWN_UNCONFIRMED';
    verdict = 'NOT_VERIFIED';
  }

  return {
    rawUrl: rawUrlInput,
    normalizedUrl: parsed.href,
    protocol: parsed.protocol,
    hostname,
    subdomain,
    registrableDomain,
    isOfficial,
    isRecognizedCompany,
    trustCategory,
    recognizedEntity,
    isShortener,
    matchedSchemeId,
    flags,
    verdict,
  };
}

export function isShortenerHost(hostname: string): boolean {
  const clean = hostname.toLowerCase().replace(/\.$/, '');
  const p = parseTld(clean, { allowPrivateDomains: true });
  return SHORTENER_DOMAINS.has((p.domain ?? clean).toLowerCase());
}
