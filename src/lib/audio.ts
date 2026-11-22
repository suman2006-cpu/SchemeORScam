import { LANGUAGE_META, type Language } from '../engine/types';

/**
 * Picks a supported MediaRecorder MIME type (webm/opus on Android/Chrome, mp4 on iOS Safari).
 */
export function getPreferredAudioMimeType(): string | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

/**
 * Encodes an AudioBlob into 16 kHz 16-bit mono PCM WAV in the browser using
 * decodeAudioData + OfflineAudioContext.
 */
export async function encodeBlobToMonoWav16k(blob: Blob): Promise<Blob> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx || typeof OfflineAudioContext === 'undefined') {
    return blob;
  }

  const arrayBuffer = await blob.arrayBuffer();
  const tempCtx = new AudioCtx();
  try {
    const decoded = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
    const targetRate = 16000;
    const frameCount = Math.max(1, Math.ceil(decoded.duration * targetRate));
    const offline = new OfflineAudioContext(1, frameCount, targetRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);

    const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(wavBuffer);

    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch {
    return blob;
  } finally {
    await tempCtx.close().catch(() => {});
  }
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? '');
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('BLOB_READ_FAILED'));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

/**
 * Creates a browser SpeechRecognition instance configured for the exact
 * selected Indian language locale (en-IN, te-IN, hi-IN, ta-IN, ml-IN, kn-IN).
 */
export function createBrowserSpeechRecognition(
  lang: Language,
): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = LANGUAGE_META[lang].locale;
  rec.continuous = false;
  rec.interimResults = false;
  return rec;
}

/**
 * Checks whether browser speechSynthesis TTS exists.
 */
export function isTtsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Strictly locates a browser voice matching the selected language.
 * NEVER silently falls back to an English voice when a non-English language is requested.
 */
export function findMatchingBrowserVoice(lang: Language): SpeechSynthesisVoice | null {
  if (!isTtsSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const localeLower = LANGUAGE_META[lang].locale.toLowerCase();
  const langPrefix = `${lang.toLowerCase()}-`;
  const exactLocale = voices.find((v) => v.lang.toLowerCase() === localeLower);
  if (exactLocale) return exactLocale;

  const sameLang = voices.find((v) => {
    const l = v.lang.toLowerCase();
    return l === lang.toLowerCase() || l.startsWith(langPrefix) || l.startsWith(`${lang.toLowerCase()}_`);
  });
  return sameLang ?? null;
}

export function stopSpeaking(): void {
  if (isTtsSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function pauseBrowserSpeech(): void {
  if (isTtsSupported()) {
    try {
      window.speechSynthesis.pause();
    } catch {
      // ignore unsupported pause on some mobile engines
    }
  }
}

export function resumeBrowserSpeech(): void {
  if (isTtsSupported()) {
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }
}

/**
 * Speaks text via browser SpeechSynthesis ONLY when a matching language voice exists
 * (so we never silently read Telugu/Hindi/Tamil/Malayalam/Kannada with an English voice).
 */
export function speakTextWithBrowserVoice(
  text: string,
  lang: Language,
  onEnd?: () => void,
  onError?: () => void,
): boolean {
  if (!isTtsSupported()) return false;
  const match = findMatchingBrowserVoice(lang);
  if (!match) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_META[lang].locale;
    utterance.voice = match;
    utterance.rate = 0.94;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onError?.();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/**
 * Requests server-side multilingual speech synthesis (POST /api/tts -> audio/wav).
 * Returns a Blob on success, or null if server TTS is unavailable.
 */
export async function fetchServerTtsWav(
  text: string,
  lang: Language,
  signal?: AbortSignal,
): Promise<Blob | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      audioBase64?: string;
      mimeType?: string;
    };
    if (!data.audioBase64) return null;
    return base64ToBlob(data.audioBase64, data.mimeType || 'audio/wav');
  } catch {
    return null;
  }
}
