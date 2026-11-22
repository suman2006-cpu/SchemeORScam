import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeUrl, type LinkEngineOptions } from './linkEngine';
import { extractUrls } from './normalize';
import type { FlagId, Verdict } from './types';

interface UrlFixture {
  name: string;
  input: string;
  expectedVerdict: Verdict;
  expectedFlags?: FlagId[];
  options?: LinkEngineOptions;
}

const URL_FIXTURES: UrlFixture[] = [
  // --- OFFICIAL (1–22) ---
  { name: '01 PM-KISAN root', input: 'https://pmkisan.gov.in/', expectedVerdict: 'OFFICIAL' },
  { name: '02 Cybercrime root', input: 'https://cybercrime.gov.in/', expectedVerdict: 'OFFICIAL' },
  { name: '03 Sanchar Saathi root', input: 'https://sancharsaathi.gov.in/', expectedVerdict: 'OFFICIAL' },
  { name: '04 PM-KISAN deep eKYC path', input: 'https://pmkisan.gov.in/aadharekyc.aspx', expectedVerdict: 'OFFICIAL' },
  { name: '05 Cybercrime complaint path', input: 'https://cybercrime.gov.in/Webform/Accept.aspx', expectedVerdict: 'OFFICIAL' },
  { name: '06 Sanchar Saathi Chakshu path', input: 'https://sancharsaathi.gov.in/sfc/Home/sfc-complaint.jsp', expectedVerdict: 'OFFICIAL' },
  { name: '07 PM-KISAN subdomain', input: 'https://exlink.pmkisan.gov.in/status', expectedVerdict: 'OFFICIAL' },
  { name: '08 Generic gov.in root', input: 'https://india.gov.in/', expectedVerdict: 'OFFICIAL' },
  { name: '09 Generic nic.in portal', input: 'https://ap.nic.in/schemes', expectedVerdict: 'OFFICIAL' },
  { name: '10 Telangana gov.in portal', input: 'https://telangana.gov.in/departments', expectedVerdict: 'OFFICIAL' },
  { name: '11 AP gov.in portal', input: 'https://ap.gov.in/', expectedVerdict: 'OFFICIAL' },
  { name: '12 PMFBY official gov.in', input: 'https://pmfby.gov.in/', expectedVerdict: 'OFFICIAL' },
  { name: '13 Uppercase official host', input: 'HTTPS://PMKISAN.GOV.IN/BeneficiaryStatus', expectedVerdict: 'OFFICIAL' },
  { name: '14 Trailing dot on official host', input: 'https://pmkisan.gov.in./', expectedVerdict: 'OFFICIAL' },
  { name: '15 Official bare domain without scheme', input: 'pmkisan.gov.in', expectedVerdict: 'OFFICIAL' },
  { name: '16 Official www subdomain', input: 'www.pmkisan.gov.in', expectedVerdict: 'OFFICIAL' },
  { name: '17 Spaces inside official URL', input: 'pmkisan . gov . in', expectedVerdict: 'OFFICIAL' },
  { name: '18 Spaced scheme and official domain', input: 'https : // cybercrime . gov . in / report', expectedVerdict: 'OFFICIAL' },
  { name: '19 Official URL with percent-encoded path', input: 'https://pmkisan.gov.in/Update%20Status/view', expectedVerdict: 'OFFICIAL' },
  { name: '20 Official URL with query params', input: 'https://pmkisan.gov.in/Status?state=AP&dist=GNT', expectedVerdict: 'OFFICIAL' },
  { name: '21 Official URL with Telugu digits in query', input: 'https://pmkisan.gov.in/status?id=౧౨౩౪', expectedVerdict: 'OFFICIAL' },
  { name: '22 Official explicit standard port 443', input: 'https://pmkisan.gov.in:443/home', expectedVerdict: 'OFFICIAL' },

  // --- LIKELY FAKE: H1 Download links (23–32) ---
  {
    name: '23 APK on official domain (H1 still wins)',
    input: 'https://pmkisan.gov.in/app.apk',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '24 APK on unknown domain',
    input: 'https://files.example.org/pmkisan-kyc.apk',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '25 XAPK download',
    input: 'https://cdn.example.net/update.xapk',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '26 ZIP download',
    input: 'https://example.org/beneficiary-list.zip',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '27 RAR download',
    input: 'https://example.org/forms.rar',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '28 EXE download',
    input: 'https://example.org/kyc-tool.exe',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '29 APK in query string',
    input: 'https://example.org/download?file=pmkisan.apk',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '30 Percent-encoded .apk path',
    input: 'https://example.org/app%2Eapk',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
  },
  {
    name: '31 Server returns Android APK MIME',
    input: 'https://files.example.org/get',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
    options: { serverContentType: 'application/vnd.android.package-archive' },
  },
  {
    name: '32 Server returns attachment filename ending .apk',
    input: 'https://files.example.org/get?id=1',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE'],
    options: { serverAttachmentFilename: 'PMKISAN_KYC.apk' },
  },

  // --- LIKELY FAKE: H2 Scheme token in non-official domain (33–43) ---
  {
    name: '33 pm-kisan-ekyc.in',
    input: 'https://pm-kisan-ekyc.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '34 pmkisan-update.com',
    input: 'https://pmkisan-update.com/verify',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '35 kyc-verify.xyz',
    input: 'https://kyc-verify.xyz/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '36 yojana-benefit.in',
    input: 'https://yojana-benefit.in/apply',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '37 subsidy-claim.org',
    input: 'https://subsidy-claim.org/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '38 cyclone-relief-portal.com',
    input: 'https://cyclone-relief-portal.com/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '39 beneficiary-refund.top',
    input: 'https://beneficiary-refund.top/bank',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '40 pmfby-claim.in',
    input: 'https://pmfby-claim.in/status',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '41 sancharsaathi-help.com',
    input: 'https://sancharsaathi-help.com/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '42 ekyc-subdomain on generic host',
    input: 'https://ekyc.myportal.net/start',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },
  {
    name: '43 manamitra-service.in',
    input: 'https://manamitra-service.in/whatsapp',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL'],
  },

  // --- LIKELY FAKE: H3 Lookalike domain (44–54) ---
  {
    name: '44 pmkisan.gov.in in subdomain of xyz',
    input: 'https://pmkisan.gov.in.verify-now.xyz/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '45 evilgov.in (missing dot before gov.in)',
    input: 'https://evilgov.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '46 pmkisan-gov.in',
    input: 'https://pmkisan-gov.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '47 gov.in.evil.com',
    input: 'https://gov.in.evil.com/login',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '48 pmkisann.com (edit distance 1)',
    input: 'https://pmkisann.com/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '49 pnkisan.in (edit distance 1 typo)',
    input: 'https://pnkisan.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '50 cybrcrime.org (edit distance 1 typo)',
    input: 'https://cybrcrime.org/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '51 official hostname inside path of evil.com',
    input: 'https://example-redirect.com/pmkisan.gov.in/login',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '52 nic.in spoof without leading dot',
    input: 'https://apnic.in/portal',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '53 cybercrime.gov.in in subdomain',
    input: 'https://cybercrime.gov.in.supportdesk.net/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },
  {
    name: '54 sancharsaathi typo edit distance 2',
    input: 'https://sancharsathi.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H3_LOOKALIKE_DOMAIN'],
  },

  // --- LIKELY FAKE: H4 Punycode / Mixed script (55–59) ---
  {
    name: '55 Explicit punycode xn-- host',
    input: 'https://xn--pmksan-9ta.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H4_PUNYCODE_OR_MIXED_SCRIPT'],
  },
  {
    name: '56 Cyrillic a homograph in pmkisan',
    input: 'https://pmkis\u0430n.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H4_PUNYCODE_OR_MIXED_SCRIPT'],
  },
  {
    name: '57 Punycode subdomain',
    input: 'https://xn--e1afmkfd.example.com/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H4_PUNYCODE_OR_MIXED_SCRIPT'],
  },
  {
    name: '58 Mixed Telugu + Latin IDN label',
    input: 'https://pmకిసాన్.in/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H4_PUNYCODE_OR_MIXED_SCRIPT'],
  },
  {
    name: '59 Cyrillic e homograph',
    input: 'https://gov\u0435rnment-help.com/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H4_PUNYCODE_OR_MIXED_SCRIPT'],
  },

  // --- LIKELY FAKE: H5 Userinfo @, IP host, non-standard port (60–67) ---
  {
    name: '60 gov.in@evil.com userinfo trick',
    input: 'https://gov.in@evil.com/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },
  {
    name: '61 pmkisan.gov.in@phish.org userinfo',
    input: 'https://pmkisan.gov.in@phish.org/login',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },
  {
    name: '62 IPv4 address host',
    input: 'http://203.0.113.10/pmkisan',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },
  {
    name: '63 IPv4 with Telugu digits',
    input: 'http://౨౦౩.౦.౧౧౩.౧౦/status',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },
  {
    name: '64 IPv6 host',
    input: 'http://[2001:db8::1]/kyc',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },
  {
    name: '65 Non-standard port 8080',
    input: 'https://example.org:8080/portal',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },
  {
    name: '66 Non-standard port 8443 on gov lookalike',
    input: 'https://checkportal.in:8443/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },
  {
    name: '67 Userinfo with password',
    input: 'https://user:pass@example.org/',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H5_USERINFO_IP_OR_PORT'],
  },

  // --- LIKELY FAKE: H8 Deep links & unofficial store links (68–73) ---
  {
    name: '68 intent:// deep link',
    input: 'intent://scan/#Intent;scheme=upi;package=com.fake.app;end',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE'],
  },
  {
    name: '69 market:// deep link',
    input: 'market://details?id=com.fake.pmkisan',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE'],
  },
  {
    name: '70 Unregistered Play Store link',
    input: 'https://play.google.com/store/apps/details?id=com.random.loanapp',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE'],
  },
  {
    name: '71 APKPure third-party store',
    input: 'https://apkpure.com/pm-kisan-helper/com.fake',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE'],
  },
  {
    name: '72 APKCombo third-party store',
    input: 'https://apkcombo.com/ekyc-tool/com.fake',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE'],
  },
  {
    name: '73 Uptodown third-party store',
    input: 'https://en.uptodown.com/android/download',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H8_APP_DEEPLINK_OR_UNOFFICIAL_STORE'],
  },

  // --- LIKELY FAKE: H9 Shortener resolved to malicious & H10 Safe Browsing (74–76) ---
  {
    name: '74 Shortener resolved to fake domain (H9)',
    input: 'https://pm-kisan-ekyc.in/form',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H2_SCHEME_TOKEN_NON_OFFICIAL', 'H9_SHORTENER_TO_MALICIOUS'],
    options: { resolvedFromShortener: true },
  },
  {
    name: '75 Shortener resolved to APK download (H9)',
    input: 'https://cdn.example.org/update.apk',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H1_DOWNLOAD_FILE', 'H9_SHORTENER_TO_MALICIOUS'],
    options: { resolvedFromShortener: true },
  },
  {
    name: '76 Google Safe Browsing match (H10)',
    input: 'https://normal-looking-site.com/page',
    expectedVerdict: 'LIKELY_FAKE',
    expectedFlags: ['H10_SAFE_BROWSING_MATCH'],
    options: { safeBrowsingMatch: true },
  },

  // --- NOT VERIFIED: Unknown domains, news sites, unresolved shorteners, soft flags (77–86) ---
  {
    name: '77 Unknown news site mentioning PM-KISAN in path',
    input: 'https://andhrachronicle.example.org/news/pm-kisan-19th-installment-date',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S5_UNKNOWN_DOMAIN'],
  },
  {
    name: '78 Unresolvable bit.ly shortener',
    input: 'https://bit.ly/3xFakeDemo',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S3_UNRESOLVED_SHORTENER'],
    options: { shortenerUnresolved: true },
  },
  {
    name: '79 Unresolvable tinyurl shortener',
    input: 'https://tinyurl.com/yc9demo',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S3_UNRESOLVED_SHORTENER'],
  },
  {
    name: '80 Unknown bank-like domain',
    input: 'https://grameenbankhelp.example.com/status',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S5_UNKNOWN_DOMAIN'],
  },
  {
    name: '81 Unknown non-HTTPS site',
    input: 'http://villageportal.example.org/notice',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S2_NON_HTTPS', 'S5_UNKNOWN_DOMAIN'],
  },
  {
    name: '82 High-abuse TLD without scheme token',
    input: 'https://brightmorning.xyz/info',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S4_HIGH_ABUSE_TLD', 'S5_UNKNOWN_DOMAIN'],
  },
  {
    name: '83 Newly registered unknown domain (<90d)',
    input: 'https://freshagriblog.com/article',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S1_NEW_DOMAIN', 'S5_UNKNOWN_DOMAIN'],
    options: { domainAgeDays: 14 },
  },
  {
    name: '84 Unknown .org NGO site',
    input: 'https://farmertrust.org/resources',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S5_UNKNOWN_DOMAIN'],
  },
  {
    name: '85 Unknown shortener rb.gy',
    input: 'https://rb.gy/demo12',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S3_UNRESOLVED_SHORTENER'],
  },
  {
    name: '86 Unknown blog with ekyc only in path',
    input: 'https://ruralnewsdaily.com/how-to-check-ekyc-status',
    expectedVerdict: 'NOT_VERIFIED',
    expectedFlags: ['S5_UNKNOWN_DOMAIN'],
  },
];

test('Link Engine passes all 86 deterministic URL fixtures', () => {
  assert.ok(URL_FIXTURES.length >= 80, 'Must cover at least 80 URL fixtures');

  for (const fx of URL_FIXTURES) {
    const res = analyzeUrl(fx.input, fx.options);
    assert.equal(
      res.verdict,
      fx.expectedVerdict,
      `Fixture [${fx.name}] (${fx.input}) expected ${fx.expectedVerdict}, got ${res.verdict} with flags [${res.flags.map((f) => f.id).join(', ')}]`,
    );
    if (fx.expectedFlags) {
      const actualIds = new Set(res.flags.map((f) => f.id));
      for (const expectedFlag of fx.expectedFlags) {
        assert.ok(
          actualIds.has(expectedFlag),
          `Fixture [${fx.name}] expected flag ${expectedFlag}, got [${Array.from(actualIds).join(', ')}]`,
        );
      }
    }
  }
});

test('URL extraction handles punctuation, multiple URLs, spaces, Telugu digits, and no-URL text', () => {
  const punct = extractUrls('చూడండి: https://pmkisan.gov.in/home, మరియు (https://cybercrime.gov.in/).');
  assert.deepEqual(punct, ['https://pmkisan.gov.in/home', 'https://cybercrime.gov.in/']);

  const spaced = extractUrls('లింక్: pmkisan . gov . in / status');
  assert.deepEqual(spaced, ['pmkisan.gov.in/status']);

  const twoUrls = extractUrls('Official pmkisan.gov.in or fake https://pm-kisan-ekyc.in/app.apk!');
  assert.equal(twoUrls.length, 2);

  const teluguDigits = extractUrls('http://౨౦౩.౦.౧౧౩.౧౦/pmkisan');
  assert.deepEqual(teluguDigits, ['http://203.0.113.10/pmkisan']);

  const noUrl = extractUrls('గ్రామ సచివాలయంలో రేపు ఉదయం సమావేశం ఉంది.');
  assert.deepEqual(noUrl, []);
});

test('4-category Website Trust: Official Gov, Recognized Company, Unknown Amber, and Impersonation Red', () => {
  const google = analyzeUrl('https://www.google.com');
  assert.equal(google.verdict, 'RECOGNIZED_COMPANY');
  assert.equal(google.trustCategory, 'RECOGNIZED_COMPANY');
  assert.equal(google.registrableDomain, 'google.com');
  assert.equal(google.recognizedEntity?.name.en, 'Google');

  const ms = analyzeUrl('https://www.microsoft.com/en-in');
  assert.equal(ms.verdict, 'RECOGNIZED_COMPANY');
  assert.equal(ms.trustCategory, 'RECOGNIZED_COMPANY');
  assert.equal(ms.registrableDomain, 'microsoft.com');
  assert.equal(ms.recognizedEntity?.name.en, 'Microsoft');

  const uidai = analyzeUrl('https://www.uidai.gov.in');
  assert.equal(uidai.verdict, 'OFFICIAL');
  assert.equal(uidai.trustCategory, 'OFFICIAL_GOV');
  assert.equal(uidai.registrableDomain, 'uidai.gov.in');
  assert.ok(uidai.recognizedEntity?.name.en.includes('UIDAI'));

  const fakeGoogle = analyzeUrl('https://google.com.attacker.example/login');
  assert.equal(fakeGoogle.verdict, 'LIKELY_FAKE');
  assert.equal(fakeGoogle.trustCategory, 'POTENTIALLY_UNSAFE');
  assert.ok(fakeGoogle.flags.some((f) => f.id === 'H3_LOOKALIKE_DOMAIN'));

  const fakeUidai = analyzeUrl('https://uidai-gov-in.example.com/update');
  assert.equal(fakeUidai.verdict, 'LIKELY_FAKE');
  assert.equal(fakeUidai.trustCategory, 'POTENTIALLY_UNSAFE');
  assert.ok(fakeUidai.flags.some((f) => f.id === 'H3_LOOKALIKE_DOMAIN'));

  const fakeMs = analyzeUrl('https://microsoft-support.example.com/reset');
  assert.equal(fakeMs.verdict, 'LIKELY_FAKE');
  assert.equal(fakeMs.trustCategory, 'POTENTIALLY_UNSAFE');
  assert.ok(fakeMs.flags.some((f) => f.id === 'H3_LOOKALIKE_DOMAIN'));

  const unknownSite = analyzeUrl('https://random-village-journal-4421.example.net/post');
  assert.equal(unknownSite.verdict, 'NOT_VERIFIED');
  assert.equal(unknownSite.trustCategory, 'UNKNOWN_UNCONFIRMED');
});

