# నిజమా? మోసమా? (Nijama? Mosama?)

A Telugu-first scheme-or-scam checker built for rural families, farmers, and village agriculture officers. Given a forwarded link, text message, screenshot, or voice note, the tool returns one of three verdicts in seconds:

- **OFFICIAL (అధికారికం):** The link domain matches the verified allowlist (including exact `*.gov.in` and `*.nic.in` rules) with no hard red flags.
- **NOT VERIFIED (నిర్ధారణ కాలేదు):** Anything that cannot be confirmed. Never displayed as "safe"; advises doing nothing yet and checking with the village secretariat or agriculture officer.
- **LIKELY FAKE (ఇది మోసం కావచ్చు - క్లిక్ చేయకండి):** One or more hard red flags (APK download, lookalike domain, scheme keyword on a non-official host, OTP/fee/screen-share demand, forward chain, punycode/IP/userinfo trick, or deep-link).

This is an independent public-interest project and is not an official government service.

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set any optional keys (none are required to run in rules-only + memory mode).
3. Start the full-stack server on port 3000:
   ```bash
   npm run dev
   ```
4. Run the unit test suite (86 URL fixtures, message fixtures, PII redaction, prompt-injection, SSRF, and i18n parity):
   ```bash
   npm test
   ```
5. Verify the labelled sample data seed or build the audio phrase manifest:
   ```bash
   npm run seed:demo
   npm run audio:build
   ```

## How to add or confirm a scheme in the registry

1. Open `/admin` and sign in with `ADMIN_PASSWORD` (defaults to `demo-admin-2026` in local development; change before deployment).
2. Edit an entry or add official domains, helpline numbers, and official steps.
3. To publish an entry with status `verified`, you must provide both a non-empty `sourceUrl` and a `verifiedOn` date (`YYYY-MM-DD`). Entries without those fields remain `unverified` and cannot be used to assert official process steps.

## Architecture and trade-offs

- **Deterministic verdicts first:** The link engine (`src/engine/linkEngine.ts`) and message engine (`src/engine/messageEngine.ts`) always decide the verdict deterministically. When `GEMINI_API_KEY` is configured, redacted text (stripped of Aadhaar, phone, account, IFSC, UPI, email, OTP digits, and URL query strings) is sent for structured signal extraction only. If every AI provider is offline, `/api/check` continues to return full `rules-only` verdicts with vetted Telugu and English templates.
- **Privacy by design:** Raw messages, screenshots, and voice notes are never stored on the server. Check history lives only in the device's `localStorage` with a Delete All button. District Scam Radar submissions are opt-in and store only the registrable domain, verdict, scheme tag, action type, district, and hour bucket.
- **Hand-made paper interface:** Plain CSS Modules and CSS custom properties only, with `rough.js` underlines and rubber-stamp verdicts, inline hand-drawn SVGs, no top navbar, and light-only daylight contrast.

## Known limitations and items requiring human review

- **Telugu copy review:** All strings in `src/i18n/te.json` are marked `needs native-speaker review`.
- **Registry sourcing:** Seeded Section 6 entries carry `verifiedOn: ""` until confirmed against the live official pages by the team prior to demo.
- **Installed-app cleanup steps:** Device cleanup guidance after installing a malicious `.apk` is intentionally omitted from the Rescue checklist (`needs review by cyber police advice`) and directs users to call `1930` or visit a cyber police desk instead of inventing instructions.
- **Persistence without Supabase:** When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are unset, the server runs in seeded in-memory mode (`storageMode: "memory"` on `/api/health`) and resets on restart.
