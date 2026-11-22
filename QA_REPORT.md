# QA Report — నిజమా? మోసమా? (Nijama? Mosama?)

**Date**: 2026-11-22  
**Build**: Vite 8 + React 19 + Express 4 (`server.ts`)  
**Scope**: Automated unit tests, API smoke tests, design-system audit, and headless Chromium E2E checks across mobile (`360x800`) and desktop (`1280x800`).

---

## 1. Automated Unit & Logic Tests (`npm test`)

Command: `tsx --test src/engine/linkEngine.test.ts src/engine/messageEngine.test.ts src/server/ssrf.test.ts src/i18n/i18n.test.ts`

| Suite | Result | Details |
|---|---|---|
| Link Engine (`linkEngine.test.ts`) | **PASS** | 86/86 deterministic URL fixtures passed (exact `.gov.in`/`.nic.in` allowlist, subdomain spoofing, Levenshtein<=2 lookalikes, punycode/mixed-script homoglyphs, IP literals, userinfo `@`, APK/ZIP downloads, high-abuse TLDs, spaced/obfuscated URLs, Telugu digits). |
| Message Engine (`messageEngine.test.ts`) | **PASS** | Telugu, English, and Hindi scam/genuine fixtures passed; OTP nuance verified; PII redaction strips Aadhaar, mobile, account, IFSC, UPI, email, OTP, and URL query values before any LLM call; prompt-injection attempts cannot force `OFFICIAL`. |
| SSRF Guard (`ssrf.test.ts`) | **PASS** | Blocks loopback, RFC1918 private ranges, link-local (`169.254.x.x`), IPv6 ULA/loopback, redirects to localhost, and DNS rebinding to private IPs. |
| i18n Parity (`i18n.test.ts`) | **PASS** | `src/i18n/te.json` and `src/i18n/en.json` share identical key sets with non-empty values. |

Total: **8/8 test blocks passed, 0 failed**.

---

## 2. Build, Lint, Seeds & Design-System Audit

| Check | Result | Notes |
|---|---|---|
| `npm run build` (`compile_applet`) | **PASS** | Production client bundle compiles cleanly with pure CSS Modules + CSS custom properties (no Tailwind runtime). |
| `npm run lint` (`lint_applet`) | **PASS** | TypeScript strict check passes with 0 errors. |
| `npm run seed:demo` | **PASS** | Seeds demo Radar rows clearly tagged `isDemo: true`. |
| `npm run audio:build` | **PASS** | Generates `public/audio/manifest.json` cleanly; falls back gracefully when no TTS API key is configured. |
| Design-System Grep (`src/` + `dist/assets/*.css`) | **PASS** | Zero gradients, zero box-shadows, zero purple/violet/indigo hexes, zero Inter/Roboto fonts, zero emojis, zero icon libraries, zero Tailwind classes. |

---

## 3. Browser E2E Verification (Headless Chromium, 2 Rounds)

Verified via `playwright-cli` on `http://localhost:3000` with **0 console errors and 0 warnings**.

| Journey | Viewport | Result | Screenshots |
|---|---|---|---|
| Home Check form & mobile fold | `360x800` | **PASS** | `docs/screens/mobile-home.png` |
| Fake APK Telugu message -> `LIKELY_FAKE` stamp + `verify-now.xyz` highlight | `1280x800` | **PASS** | `docs/screens/result-likely-fake.png` |
| Warning Share Card modal (`1080x1350` PNG rendered client-side) | `1280x800` | **PASS** | `docs/screens/share-card-modal.png` |
| Official URL (`https://pmkisan.gov.in/`) -> `OFFICIAL` stamp | `1280x800` | **PASS** | Verified in DOM |
| Unknown news URL -> `NOT_VERIFIED` (never claims "safe") | `1280x800` | **PASS** | Verified in DOM |
| Rescue flow (`/rescue`) multi-select + running timer persistence across reload + `1930` / `cybercrime.gov.in` | `1280x800` | **PASS** | `docs/screens/rescue-checklist.png` |
| Alerts / Scam Radar (`/alerts`) district filter + visible `"నమూనా డేటా / Sample data"` label | `1280x800` | **PASS** | Verified in DOM |
| Learn (`/learn`) 6 hand-drawn scam panels + verbatim problem statement | `1280x800` | **PASS** | Verified in DOM |
| History (`/history`) local entries + Delete All | `1280x800` | **PASS** | Verified in DOM |
| Language toggle (`తెలుగు` <-> `English`) preserving route | `1280x800` | **PASS** | Verified in DOM |
| Web Share Target (`/check?url=...`) one-shot check & URL rewrite without loop | `1280x800` | **PASS** | Verified in DOM |
| Admin (`/admin`) password login + registry editor + `/api/admin/radar.csv` (200 CSV) | `1280x800` | **PASS** | Verified in DOM & fetch |

### Defects Found & Fixed During Verification
1. **Spaced URL normalization**: Fixed regex in `src/engine/normalize.ts` requiring at least one space around dots so `pmkisan . gov . in` collapses cleanly across multiple dots.
2. **LLM timeout resilience**: Added hard `Promise.race` timeout (`5500ms`) in `src/server/providers.ts` and skipped unnecessary LLM calls on bare URLs so checks always complete quickly with seamless `rules-only` fallback.
3. **Duplicate accessible Photo button**: Marked hidden `<input type="file">` with `aria-hidden="true" tabIndex={-1}` in `src/components/CheckView.tsx`.
4. **Mobile `360x800` CTA visibility**: Tightened mobile vertical spacing in `src/components/Shell.module.css` and `src/components/CheckView.module.css` so `"చెక్ చేయండి"` sits cleanly above the bottom tab strip.
5. **Angled `RoughStampBox` sizing**: Switched from rotated `getBoundingClientRect()` to unrotated `offsetWidth` / `offsetHeight` with `preserveAspectRatio="none"` and `document.fonts.ready` redraw in `src/components/RoughElements.tsx` so stamp borders wrap Telugu text accurately.

---

## 4. Known Limitations & Items Requiring Human Review

- **Telugu copy review**: All Telugu strings in `src/i18n/te.json` and engine reason templates carry `_reviewNote: "needs native-speaker review"` and have not yet been audited by a native Telugu speaker in Andhra Pradesh / Telangana.
- **Scheme Registry sourcing**: Section 6 seeded schemes (`pm-kisan`, `pmfby`, `rythu-bharosa`, `rythu-bandhu`, `aarogyasri`, `ration-pds`) intentionally leave `verifiedOn` blank until an operator verifies each official domain and records its `sourceUrl` + `verifiedOn` via `/admin`.
- **Installed-app device cleanup**: Per factual-integrity rules, step-by-step Android phone cleanup instructions for installed `.apk` files are excluded from the Rescue UI and flagged as needing cyber-police guidance (`1930` / `cybercrime.gov.in`).
- **Storage mode without Postgres/Supabase**: When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are unset, the server runs in in-memory mode (data resets on server restart).
- **Browser hardware capabilities**: Live microphone recording, real screenshot OCR against arbitrary WhatsApp photos, OS-level PWA Web Share Target invocation, and device-specific Telugu `speechSynthesis` voices could only be exercised via API/fallback paths in headless Chromium and should be smoke-tested on a physical Android phone.
