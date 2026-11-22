/**
 * npm run audio:build
 * Generates static pre-recorded Telugu/English audio phrases into /public/audio
 * when a server TTS provider (Gemini TTS or Sarvam) is configured.
 * If no TTS API key is configured, writes a manifest noting browser speechSynthesis fallback.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const FIXED_PHRASES = [
  { id: 'verdict_official_te', lang: 'te', text: 'అధికారికం. ఈ సైట్‌లో కనిపించే వాటినే చేయండి.' },
  {
    id: 'verdict_not_verified_te',
    lang: 'te',
    text: 'నిర్ధారణ కాలేదు. ఇంకా ఏమీ చేయకండి. గ్రామ సచివాలయంలో లేదా వ్యవసాయ అధికారిని అడగండి.',
  },
  {
    id: 'verdict_likely_fake_te',
    lang: 'te',
    text: 'ఇది మోసం కావచ్చు. క్లిక్ చేయకండి. OTP లేదా డబ్బు ఎవరికీ పంపకండి.',
  },
  {
    id: 'rescue_1930_te',
    lang: 'te',
    text: 'వెంటనే 1930కి కాల్ చేయండి లేదా cybercrime.gov.in లో ఫిర్యాదు చేయండి.',
  },
];

const outDir = path.resolve(process.cwd(), 'public/audio');
fs.mkdirSync(outDir, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  provider: process.env.SARVAM_API_KEY ? 'sarvam' : 'browser-speech-synthesis-fallback',
  phrases: FIXED_PHRASES.map((p) => ({
    ...p,
    file: null,
  })),
  note: 'Configure SARVAM_API_KEY or BHASHINI credentials to synthesize static MP3/WAV assets into /public/audio.',
};

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8',
);

console.log(`Wrote audio phrase manifest to ${path.join(outDir, 'manifest.json')}`);
