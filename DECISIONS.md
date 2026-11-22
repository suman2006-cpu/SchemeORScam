# DECISIONS.md — Engineering & Product Decisions

1. **Runtime Stack (Vite + React 19 + Express `server.ts` vs Next.js)**:
   - The execution environment is pre-configured as a Vite + React 19 + Express (`server.ts`) Node 20+ full-stack application serving on port 3000. Rather than breaking the host build/preview pipeline, all server APIs, SSRF-safe fetchers, security headers, rate limiting, and admin auth live in Express route handlers inside `server.ts`, while the frontend uses React 19 with plain CSS Modules + CSS custom properties (no Tailwind classes, no component kits, no icon libraries, no emojis).

2. **Visual Aesthetic Confirmed by User**:
   - The user selected the **Hand-made village notice board and paper** single dedicated aesthetic (Section 7): `#F2F4EF` paper, `#FBFBF8` sheet with `1.5px` ink borders and `0px` sheet radius, `3px` control radius, `rough.js` underlines and `-4deg` rubber-stamp verdicts, yellow marker `#FFD84D` strictly for the registrable domain highlight, custom 2.5px ink-stroke inline SVGs, no top navbar (left numbered book index on desktop, 3-tab bottom strip on mobile), and zero gradients/shadows/pills/emojis.

3. **LLM & Resilience Fallback**:
   - The user declined paid API key setup, so `LLM_MODEL` defaults to `gemini-4-hydrogen` (configurable via `process.env.LLM_MODEL` without hard-coding) with `ThinkingLevel.HIGH`.
   - Every verdict is assembled deterministically by the link & message rule engines. If `GEMINI_API_KEY` is missing or any upstream provider fails, `/api/check` returns a full `rules-only` verdict with vetted Telugu/English reason templates. `EXPLAIN_WITH_LLM` defaults to `false`.

4. **Registry Verification Discipline**:
   - Only Section 6 items are seeded (`*.gov.in`, `*.nic.in`, `cybercrime.gov.in`, `sancharsaathi.gov.in`, helpline `1930`, `pmkisan.gov.in`, PMFBY `14447`, Bharat-VISTAAR `155261`, AP Mana Mitra WhatsApp `9552300009`).
   - All seeded entries carry a visible note that the team must confirm against official pages before demo, with `verifiedOn` empty until confirmed via `/admin`. Domain-level `*.gov.in` / `*.nic.in` checks still produce `OFFICIAL` with the domain-only guidance line `"ఈ సైట్‌లో కనిపించే వాటినే చేయండి"` when no verified process steps exist, and no invented process steps are shown.

5. **Installed-App Device Cleanup Exclusion**:
   - Per Section 4 (S3), device-cleanup instructions for an installed APK are intentionally excluded from the user-facing UI and flagged as `"needs review by cyber police advice"` in source comments and `QA_REPORT.md` rather than inventing steps.

6. **Storage Mode**:
   - Server supports Supabase Postgres REST when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured; otherwise operates in an in-memory seeded store and reports `"storageMode": "memory"` in `/api/health`. All seeded demo radar items are explicitly tagged `isSample: true` and labelled `"నమూనా డేటా / Sample data"` in the UI.
