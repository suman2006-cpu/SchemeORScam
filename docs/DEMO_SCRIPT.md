# 3-Minute Live Demo Script — నిజమా? మోసమా?

Use this script to walk examiners through the core promises in under 3 minutes using deterministic fixtures.

## 0:00 – 0:30 | First impression & language
1. Open `/` on mobile (`360x800`) or desktop (`1280x800`).
2. Point out the village notice-board paper layout: no top navbar (left numbered book index on desktop, 3-tab bottom strip on mobile), Telugu default with date at left and `తెలుగు | English` toggle at right, crossed-out link instruction, asymmetric input controls (64px voice bar first, Photo + Paste below), and the right-hand "ఈ వారం తిరుగుతున్న మోసాలు" board clearly labelled `నమూనా డేటా / Sample data`.

## 0:30 – 1:15 | The "Same Ask" & Lookalike Demo (LIKELY FAKE vs OFFICIAL)
1. Paste or tap the Fake e-KYC sample:
   `మీ పిఎం-కిసాన్ e-KYC వెంటనే పూర్తి చేయండి: https://pmkisan.gov.in.verify-now.xyz/ekyc.apk`
2. Click **చెక్ చేయండి**.
3. Show the angled rough.js rubber stamp (`ఇది మోసం కావచ్చు - క్లిక్ చేయకండి`), the real destination line highlighting **`verify-now.xyz`** in marker yellow while dimming `pmkisan.gov.in.`, the numbered reasons (`.apk` download + lookalike domain + unsafe ask), and the official PM-KISAN domain reference.
4. Tap **కుటుంబానికి హెచ్చరిక పంపండి** to show the browser-generated `1080x1350` Telugu PNG warning card. Close the modal.
5. Click **మరొక మెసేజ్ చెక్ చేయండి**, paste `https://pmkisan.gov.in/`, and show the green **అధికారికం** stamp with `pmkisan.gov.in` highlighted and domain-only guidance (`ఈ సైట్‌లో కనిపించే వాటినే చేయండి`).

## 1:15 – 1:45 | NOT VERIFIED discipline
1. Check `https://andhrachronicle.example.org/news/pm-kisan-update`.
2. Show that it returns **నిర్ధారణ కాలేదు** (never "safe") with the explicit advice to pause and ask the village secretariat or agriculture officer.

## 1:45 – 2:30 | First 60-Minute Rescue Flow
1. Tap **నేను ఇప్పటికే క్లిక్ చేశాను**.
2. Select "లింక్ ఓపెన్ చేశాను" and "డబ్బు చెల్లించాను (UPI / ఖాతా)".
3. Show the running persisted timer (`0 నిమిషాలు అయింది`), the prioritized checklist (bank/UPI helpline first, then `1930` / `cybercrime.gov.in`, keep evidence, do not delete chat, tell family), one-tap `tel:1930` button, and the auto-filled copyable complaint summary. Reload the page to show the timer and selections persist.

## 2:30 – 3:00 | Scam Radar, Learn, Privacy & Admin
1. Open **హెచ్చరికలు** (Scam Radar): filter by district, show 14-day dot strips and the opt-in anonymous submission notice.
2. Open **తెలుసుకోండి** (Learn) from the footer index: show the verbatim problem statement and 6 hand-drawn scam pattern panels.
3. Briefly note `/api/health` (rules-only resilience when providers are down), device-only **చరిత్ర** (History), and `/admin` (enforces `sourceUrl` + `verifiedOn` before publishing verified entries, plus CSV export).
