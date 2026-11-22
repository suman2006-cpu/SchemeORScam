import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseTld } from 'tldts';
import { z } from 'zod';
import { isShortenerHost } from './src/engine/linkEngine';
import {
  evaluateMessageAndLinks,
  type ExpandedUrlInfo,
} from './src/engine/messageEngine';
import { extractUrls } from './src/engine/normalize';
import {
  checkSafeBrowsing,
  extractStructuredWithLlm,
  extractTextFromScreenshot,
  getProviderHealth,
  lookupDomainAgeDays,
  synthesizeSpeechWithGemini,
  transcribeAudioBuffer,
  translateExplanationWithCache,
} from './src/server/providers';
import { matchRecognizedCompany } from './src/data/trustedEntities';
import {
  clearAdminCookie,
  createRateLimiter,
  isAdminRequest,
  requireAdmin,
  securityHeadersMiddleware,
  setAdminCookie,
  signAdminToken,
  verifyAdminPassword,
} from './src/server/security';
import { expandUrlSafely } from './src/server/ssrf';
import { store } from './src/server/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LangEnum = z.enum(['en', 'te', 'hi', 'ta', 'ml', 'kn']);

const CheckBodySchema = z
  .object({
    text: z.string().max(4000).optional().default(''),
    url: z.string().max(2048).optional().default(''),
    lang: LangEnum.optional().default('te'),
  })
  .refine((v) => v.text.trim().length > 0 || v.url.trim().length > 0, {
    message: 'Provide text or a URL to check.',
  });

const OcrBodySchema = z.object({
  imageBase64: z.string().min(10).max(7_000_000),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

const AsrBodySchema = z.object({
  audioBase64: z.string().min(10).max(7_000_000),
  mimeType: z.string().min(3).max(80),
  durationSec: z.number().min(0).max(120).optional().default(10),
  lang: LangEnum.optional().default('te'),
});

const TtsBodySchema = z.object({
  text: z.string().min(1).max(1500),
  lang: LangEnum.default('te'),
});

const TranslateBodySchema = z.object({
  text: z.string().min(1).max(1500),
  targetLang: LangEnum,
});

const RadarSubmitSchema = z.object({
  registrableDomain: z.string().min(3).max(255),
  verdict: z.enum(['OFFICIAL', 'RECOGNIZED_COMPANY', 'NOT_VERIFIED', 'LIKELY_FAKE']),
  schemeId: z.string().max(100).optional().default('unknown'),
  actionType: z.string().max(60).optional().default('other'),
  districtCode: z.string().min(2).max(20),
  consent: z.literal(true),
});

const AdminLoginSchema = z.object({
  password: z.string().min(1).max(200),
});

const SchemeUpsertSchema = z.object({
  id: z.string().min(2).max(80),
  nameEn: z.string().min(2).max(160),
  nameTe: z.string().min(2).max(160),
  aliases: z.array(z.string().max(80)).default([]),
  level: z.enum(['central', 'state']),
  officialDomains: z.array(z.string().max(160)).default([]),
  officialApps: z.array(z.string().max(160)).default([]),
  officialChannels: z
    .array(
      z.object({
        type: z.enum(['web', 'helpline', 'office']),
        value: z.string().min(1).max(240),
        sourceUrl: z.string().max(500).default(''),
        verifiedOn: z.string().max(40).default(''),
        noteTe: z.string().max(240).optional(),
        noteEn: z.string().max(240).optional(),
      }),
    )
    .default([]),
  processes: z
    .array(
      z.object({
        action: z.enum([
          'ekyc',
          'register',
          'claim',
          'pay_fee',
          'share_otp_with_person',
          'enter_otp_on_page',
          'enter_bank_details',
          'install_app',
          'forward',
          'call_number',
          'other',
        ]),
        stepsTe: z.array(z.string().max(400)),
        stepsEn: z.array(z.string().max(400)),
        sourceUrl: z.string().max(500).default(''),
        verifiedOn: z.string().max(40).default(''),
      }),
    )
    .default([]),
  status: z.enum(['verified', 'unverified']),
  teamVerificationNote: z.string().max(240).default(''),
});

async function createServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware);
  app.use(express.json({ limit: '8mb' }));

  // Health endpoint (reports storage mode & active providers; never leaks secrets)
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      storageMode: store.mode,
      providers: getProviderHealth(),
      radarMinCount: store.getRadarMinCount(),
    });
  });

  // Main Link + Message Check endpoint (never stores or logs raw user messages)
  app.post(
    '/api/check',
    createRateLimiter('check', 60, 60_000),
    async (req, res) => {
      const parsed = CheckBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input.' });
        return;
      }

      const targetLang = parsed.data.lang;
      const combinedInput = [parsed.data.url.trim(), parsed.data.text.trim()]
        .filter(Boolean)
        .join('\n');

      try {
        const urls = extractUrls(combinedInput).slice(0, 5);
        const expandedMap = new Map<string, ExpandedUrlInfo>();

        // Determine whether prose exists beyond extracted URLs
        const proseWithoutUrls = urls
          .reduce((acc, u) => acc.replace(u, ' '), combinedInput)
          .trim();
        const shouldRunLlm = proseWithoutUrls.length >= 12;

        // 1 & 2. Run URL probes and optional LLM extraction in parallel
        const probeTargets: string[] = [];
        const probeTask = Promise.all(
          urls.map(async (rawUrl) => {
            if (/^(?:intent|market):\/\//i.test(rawUrl)) return;
            const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl)
              ? rawUrl
              : `https://${rawUrl}`;
            let host = '';
            try {
              host = new URL(candidate).hostname.toLowerCase();
            } catch {
              return;
            }
            const shortener = isShortenerHost(host);
            if (shortener) {
              const exp = await expandUrlSafely(candidate, { timeoutMs: 3500 });
              expandedMap.set(rawUrl, {
                originalUrl: rawUrl,
                finalUrl: exp.finalUrl,
                wasShortener: true,
                unresolved: exp.unresolved,
                serverContentType: exp.contentType,
                serverAttachmentFilename: exp.attachmentFilename,
              });
              if (!exp.unresolved) probeTargets.push(exp.finalUrl);
            } else {
              probeTargets.push(candidate);
              const tld = parseTld(host, { allowPrivateDomains: true });
              const regDom = (tld.domain ?? host).toLowerCase();
              const isGov =
                host === 'gov.in' ||
                host.endsWith('.gov.in') ||
                host.endsWith('.nic.in');
              const isKnownCompany = Boolean(matchRecognizedCompany(host));
              if (
                !isGov &&
                !isKnownCompany &&
                regDom &&
                !regDom.endsWith('.example.org') &&
                !regDom.endsWith('.example.com') &&
                !regDom.endsWith('.example')
              ) {
                const ageDays = await lookupDomainAgeDays(regDom);
                if (ageDays !== null) {
                  expandedMap.set(rawUrl, {
                    originalUrl: rawUrl,
                    finalUrl: candidate,
                    wasShortener: false,
                    domainAgeDays: ageDays,
                  });
                }
              }
            }
          }),
        );

        const llmTask = shouldRunLlm
          ? extractStructuredWithLlm(combinedInput, targetLang)
          : Promise.resolve({ extraction: null, provider: 'none' });

        const [, llmRes] = await Promise.all([probeTask, llmTask]);

        // 3. Optional Google Safe Browsing check (H10)
        if (probeTargets.length > 0) {
          const gsbMatches = await checkSafeBrowsing(probeTargets);
          for (const rawUrl of urls) {
            const existing = expandedMap.get(rawUrl);
            const target = existing?.finalUrl ?? rawUrl;
            if (gsbMatches.has(target) || gsbMatches.has(rawUrl)) {
              expandedMap.set(rawUrl, {
                originalUrl: rawUrl,
                finalUrl: target,
                wasShortener: existing?.wasShortener ?? false,
                unresolved: existing?.unresolved,
                serverContentType: existing?.serverContentType,
                serverAttachmentFilename: existing?.serverAttachmentFilename,
                domainAgeDays: existing?.domainAgeDays ?? null,
                safeBrowsingMatch: true,
              });
            }
          }
        }

        // 4. Deterministic dual trust + authenticity assembly
        const result = evaluateMessageAndLinks({
          rawText: combinedInput,
          targetLang,
          registry: store.getRegistry(),
          llmExtraction: llmRes.extraction,
          expandedUrls: expandedMap,
          engineMode: llmRes.extraction ? 'rules+llm' : 'rules-only',
        });

        res.json(result);
      } catch {
        const fallback = evaluateMessageAndLinks({
          rawText: combinedInput,
          targetLang,
          registry: store.getRegistry(),
          engineMode: 'rules-only',
        });
        res.json(fallback);
      }
    },
  );

  // Screenshot OCR endpoint (never stores image)
  app.post(
    '/api/ocr',
    createRateLimiter('ocr', 20, 60_000),
    async (req, res) => {
      const parsed = OcrBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid image payload.' });
        return;
      }
      const byteLength = Buffer.byteLength(parsed.data.imageBase64, 'base64');
      if (byteLength > 5 * 1024 * 1024) {
        res.status(413).json({ error: 'Image exceeds 5 MB limit.' });
        return;
      }

      const result = await extractTextFromScreenshot(
        parsed.data.imageBase64,
        parsed.data.mimeType,
      );
      if (!result) {
        res.status(503).json({
          error: 'OCR provider unavailable.',
          fallbackRequired: true,
        });
        return;
      }
      res.json(result);
    },
  );

  // Multilingual Voice ASR endpoint (never stores audio)
  app.post(
    '/api/asr',
    createRateLimiter('asr', 25, 60_000),
    async (req, res) => {
      const parsed = AsrBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid audio payload.' });
        return;
      }
      const byteLength = Buffer.byteLength(parsed.data.audioBase64, 'base64');
      if (byteLength > 5 * 1024 * 1024) {
        res.status(413).json({ error: 'Audio exceeds 5 MB limit.' });
        return;
      }

      const result = await transcribeAudioBuffer(
        parsed.data.audioBase64,
        parsed.data.mimeType,
        parsed.data.lang,
      );
      if (!result) {
        res.status(503).json({
          error: 'ASR provider unavailable.',
          fallbackRequired: true,
        });
        return;
      }
      res.json(result);
    },
  );

  // Multilingual Text-to-Speech endpoint (cached WAV via gemini-3.8-flash-lite-tts)
  app.post(
    '/api/tts',
    createRateLimiter('tts', 40, 60_000),
    async (req, res) => {
      const parsed = TtsBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid TTS payload.' });
        return;
      }
      const audio = await synthesizeSpeechWithGemini(
        parsed.data.text,
        parsed.data.lang,
      );
      if (!audio) {
        res.status(503).json({
          error: 'TTS provider unavailable for this language.',
          fallbackRequired: true,
        });
        return;
      }
      res.json(audio);
    },
  );

  // Cached translation endpoint for dynamic AI explanations when switching language
  app.post(
    '/api/translate',
    createRateLimiter('translate', 40, 60_000),
    async (req, res) => {
      const parsed = TranslateBodySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid translate payload.' });
        return;
      }
      const translated = await translateExplanationWithCache(
        parsed.data.text,
        parsed.data.targetLang,
      );
      if (!translated) {
        res.status(503).json({ error: 'Translation provider unavailable.' });
        return;
      }
      res.json(translated);
    },
  );

  // Public Registry read
  app.get('/api/registry', (_req, res) => {
    res.json({ schemes: store.getRegistry() });
  });

  // Public Scam Radar read & opt-in anonymised submission
  app.get('/api/radar', (req, res) => {
    const district =
      typeof req.query.district === 'string' ? req.query.district : undefined;
    res.json({
      items: store.getRadarClusters(district),
      districts: store.getDistricts(),
      minCount: store.getRadarMinCount(),
    });
  });

  app.post(
    '/api/radar',
    createRateLimiter('radar', 20, 60_000),
    (req, res) => {
      const parsed = RadarSubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid radar submission.' });
        return;
      }
      try {
        const result = store.submitRadarReport({
          registrableDomain: parsed.data.registrableDomain,
          verdict: parsed.data.verdict,
          schemeId: parsed.data.schemeId,
          actionType: parsed.data.actionType,
          districtCode: parsed.data.districtCode,
        });
        res.status(201).json({ ok: true, ...result });
      } catch {
        res.status(400).json({ error: 'Could not record radar entry.' });
      }
    },
  );

  // Admin endpoints (constant-time password check, httpOnly cookie, rate limited)
  app.get('/api/admin/session', (req, res) => {
    res.json({ authenticated: isAdminRequest(req) });
  });

  app.post(
    '/api/admin/login',
    createRateLimiter('admin-login', 10, 15 * 60_000),
    (req, res) => {
      const parsed = AdminLoginSchema.safeParse(req.body);
      if (!parsed.success || !verifyAdminPassword(parsed.data.password)) {
        res.status(401).json({ error: 'Invalid credentials.' });
        return;
      }
      setAdminCookie(res, signAdminToken());
      res.json({ ok: true });
    },
  );

  app.post('/api/admin/logout', (_req, res) => {
    clearAdminCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/admin/data', requireAdmin, (_req, res) => {
    res.json({
      schemes: store.getRegistry(),
      radar: store.getAllRadarClustersForAdmin(),
      auditLog: store.getAuditLog(),
    });
  });

  app.post('/api/admin/registry', requireAdmin, (req, res) => {
    const parsed = SchemeUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid registry entry.' });
      return;
    }
    try {
      const saved = store.upsertScheme(parsed.data, 'admin');
      res.json({ ok: true, scheme: saved, auditLog: store.getAuditLog() });
    } catch (err) {
      if (err instanceof Error && err.message === 'VERIFICATION_REQUIRED') {
        res.status(400).json({
          error:
            'Publishing a verified entry requires at least one channel or process with both sourceUrl and verifiedOn.',
        });
        return;
      }
      res.status(500).json({ error: 'Could not save entry.' });
    }
  });

  app.get('/api/admin/radar.csv', requireAdmin, (_req, res) => {
    const csv = store.exportRadarCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="nijama-mosama-radar.csv"',
    );
    res.send(csv);
  });

  // Frontend Vite dev middleware OR production static hosting
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`Nijama? Mosama? server listening on http://0.0.0.0:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
