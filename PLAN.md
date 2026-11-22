# PLAN.md — నిజమా? మోసమా? (Nijama? Mosama?)

## 1. Architecture Overview
A Telugu-first, mobile-first scheme-or-scam checker built as a full-stack TypeScript web application (React 19 + Vite frontend + Express Node 20+ API server in `server.ts`, styled exclusively with plain CSS Modules + CSS custom properties and hand-drawn inline SVGs + `roughjs`).

### File Tree
```
/
├── index.html                  # Fonts (Mandali, Hind Guntur, Source Serif 4, IBM Plex Mono), manifest, meta
├── server.ts                   # Express API + SSRF-safe routes + security headers + Vite dev/prod static host
├── public/
│   ├── manifest.webmanifest    # Installable PWA + Web Share Target (/check)
│   ├── sw.js                   # Versioned cache-first static / network-first API / offline fallback
│   ├── offline.html            # Standalone offline notice sheet
│   ├── icon-192.svg            # Hand-drawn ink PWA icon
│   └── icon-512.svg            # Hand-drawn ink PWA icon
├── scripts/
│   ├── seed-demo.ts            # npm run seed:demo (verifies/outputs labelled sample radar data)
│   └── build-audio.ts          # npm run audio:build (generates static Telugu phrases when TTS provider configured)
├── src/
│   ├── main.tsx                # App entry + production-only SW registration
│   ├── App.tsx                 # Client router (/ , /check, /rescue, /alerts, /learn, /report, /history, /about, /admin, 404)
│   ├── styles/
│   │   ├── tokens.css          # Paper/ink palette, type scale, radii, reduced-motion tokens
│   │   └── base.css            # Global paper rules, Telugu line-height >= 1.75, font-synthesis: none
│   ├── i18n/
│   │   ├── te.json             # Telugu copy (marked "needs native-speaker review")
│   │   ├── en.json             # English copy (1:1 key parity with te.json)
│   │   ├── index.ts            # Typed translator + Telugu date formatter
│   │   └── i18n.test.ts        # Key parity unit test
│   ├── data/
│   │   ├── registrySeed.ts     # Exact Section 6 seed only (unconfirmed verifiedOn left empty)
│   │   ├── districts.json      # Editable AP & Telangana district list
│   │   ├── highAbuseTlds.json  # Editable heuristic TLD list
│   │   ├── radarDemoSeed.ts    # Labelled sample radar items ("నమూనా డేటా / Sample data")
│   │   └── learnPatterns.ts    # 6 hand-drawn scam patterns + verbatim problem statement
│   ├── engine/
│   │   ├── types.ts            # Core domain interfaces
│   │   ├── normalize.ts        # NFC, Telugu digits, URL recovery, regex extractors, PII redactor
│   │   ├── linkEngine.ts       # Pure TS link engine (H1–H9, soft flags, official allowlist, lookalikes)
│   │   ├── messageEngine.ts    # Deterministic rule flags, OTP nuance, registry resolver, templated reasons
│   │   ├── linkEngine.test.ts  # 85+ deterministic URL fixtures
│   │   └── messageEngine.test.ts # Telugu/English/Hindi message, redaction, prompt-injection tests
│   ├── server/
│   │   ├── ssrf.ts             # DNS-checked, redirect-checked, size-capped shortener & APK probe
│   │   ├── ssrf.test.ts        # SSRF unit tests
│   │   ├── providers.ts        # Env-ordered LLM/OCR/ASR/TTS/SafeBrowsing/RDAP with timeout, retry, circuit breaker
│   │   ├── store.ts            # Supabase REST or in-memory seeded store + audit log
│   │   └── security.ts         # Daily-salted IP hash rate limiter, constant-time admin auth, security headers
│   ├── lib/
│   │   ├── audio.ts            # MediaRecorder, 16kHz mono WAV encoder, WebSpeech & TTS playback
│   │   ├── imagePrep.ts        # Canvas 1600px downscale + EXIF strip + 5MB guard
│   │   ├── shareCard.ts        # 1080x1350 Telugu/English warning card PNG generator (waits for fonts.load)
│   │   └── historyStore.ts     # Device-only check history & rescue timer localStorage helpers
│   └── components/
│       ├── HandDrawnSvgs.tsx   # Custom 2.5px ink-stroke hand-drawn SVGs (no icon packs, no emoji)
│       ├── RoughElements.tsx   # Client-side rough.js underline & rubber-stamp frame + SVG fallback
│       ├── Shell.tsx / .module.css
│       ├── CheckView.tsx / .module.css
│       ├── ResultView.tsx / .module.css
│       ├── ShareCardModal.tsx / .module.css
│       ├── RescueView.tsx / .module.css
│       ├── RadarView.tsx / .module.css
│       ├── LearnView.tsx / .module.css
│       ├── ReportView.tsx / .module.css
│       ├── HistoryView.tsx / .module.css
│       ├── AboutView.tsx / .module.css
│       ├── AdminView.tsx / .module.css
│       └── NotFoundView.tsx
```

## 2. Core Data Models
- **SchemeEntry**: `{ id, nameEn, nameTe, aliases[], level: "central" | "state", officialDomains[], officialApps[], officialChannels[], processes[], status: "verified" | "unverified", teamVerificationNote }`
- **CheckResponse**: `{ verdict: "OFFICIAL" | "NOT_VERIFIED" | "LIKELY_FAKE", reasons: ReasonItem[], allReasons: ReasonItem[], destination: DestinationInfo | null, officialPath: OfficialPathInfo | null, schemeMatched: { id, nameTe, nameEn } | null, actionDetected: string | null, engineMode: "rules+llm" | "rules-only", checkedAt: string }`
- **RadarCluster**: `{ id, districtCode, districtTe, districtEn, registrableDomain, schemeId, schemeTe, schemeEn, actionType, verdict, count, dailyCounts14d: number[], isSample: boolean, lastSeenBucket: string }`
- **AuditLogEntry**: `{ id, at, actor, action, targetId, summary }`

## 3. API Contracts
- `GET /api/health` -> `{ ok, storageMode: "memory" | "supabase", providers: { llm, ocr, asr, tts, safeBrowsing }, radarMinCount }`
- `POST /api/check` -> Zod `{ text?: string (<=4000), url?: string (<=2048), lang?: "te"|"en" }` -> `CheckResponse` (never logs or stores raw text)
- `POST /api/ocr` -> Zod `{ imageBase64: string, mimeType: string }` (<=5MB decoded) -> `{ extractedText: string, provider: string }`
- `POST /api/asr` -> Zod `{ audioBase64: string, mimeType: string, durationSec: number (<=60) }` (<=2MB) -> `{ transcript: string, provider: string }`
- `GET /api/radar?district=<code>` -> `{ items: RadarCluster[], districts, minCount }`
- `POST /api/radar` -> Zod `{ registrableDomain, verdict, schemeId, actionType, districtCode, consent: true }` -> `{ ok: true, id }` (anonymous metadata only)
- `GET /api/registry` -> `{ schemes: SchemeEntry[] }`
- `POST /api/admin/login` / `POST /api/admin/logout` / `GET /api/admin/session`
- `PUT /api/admin/registry/:id` / `POST /api/admin/registry` (requires admin session; publishing `status: "verified"` requires non-empty `sourceUrl` and `verifiedOn`)
- `GET /api/admin/radar.csv` (requires admin session; CSV export of anonymised radar clusters)

## 4. Environment Variables
Defined in `.env.example`: `GEMINI_API_KEY`, `LLM_PROVIDER_ORDER`, `LLM_MODEL`, `EXPLAIN_WITH_LLM`, `ASR_PROVIDER_ORDER`, `TTS_PROVIDER_ORDER`, `SARVAM_API_KEY`, `BHASHINI_USER_ID`, `BHASHINI_API_KEY`, `BHASHINI_PIPELINE_ID`, `GOOGLE_SAFE_BROWSING_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `RADAR_MIN_COUNT`, `APP_URL`.
