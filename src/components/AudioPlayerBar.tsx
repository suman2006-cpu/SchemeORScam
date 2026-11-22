import React, { useEffect, useRef, useState } from 'react';
import type { Language } from '../engine/types';
import { t } from '../i18n';
import {
  fetchServerTtsWav,
  pauseBrowserSpeech,
  resumeBrowserSpeech,
  speakTextWithBrowserVoice,
  stopSpeaking,
} from '../lib/audio';
import {
  PauseGlyph,
  PlayGlyph,
  ReplayGlyph,
  SpeakerGlyph,
  StopGlyph,
} from './HandDrawnSvgs';
import styles from './AudioPlayerBar.module.css';

interface AudioPlayerBarProps {
  text: string;
  lang: Language;
  label: string;
  testId?: string;
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable';
type PlaybackBackend = 'audio' | 'speech' | null;

export function AudioPlayerBar({
  text,
  lang,
  label,
  testId = 'audio-player-bar',
}: AudioPlayerBarProps) {
  const [state, setState] = useState<PlayerState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backendRef = useRef<PlaybackBackend>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const cacheKey = `${lang}::${text.trim()}`;

  const stopAll = (resetToIdle = true) => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    stopSpeaking();
    backendRef.current = null;
    if (resetToIdle) {
      setState('idle');
    }
  };

  // Stop playback when language or text changes
  useEffect(() => {
    stopAll(true);
  }, [lang, text]);

  // Revoke object URLs and stop audio on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopSpeaking();
      for (const url of cacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      cacheRef.current.clear();
    };
  }, []);

  const playFromUrl = async (objectUrl: string): Promise<boolean> => {
    try {
      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      backendRef.current = 'audio';
      audio.onended = () => {
        backendRef.current = null;
        setState('idle');
      };
      audio.onerror = () => {
        backendRef.current = null;
        setState('unavailable');
      };
      await audio.play();
      setState('playing');
      return true;
    } catch {
      audioRef.current = null;
      backendRef.current = null;
      return false;
    }
  };

  const startPlayback = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    stopAll(false);

    // 1. Instant replay from cached WAV blob URL if already synthesized
    const cachedUrl = cacheRef.current.get(cacheKey);
    if (cachedUrl) {
      const ok = await playFromUrl(cachedUrl);
      if (ok) return;
    }

    setState('loading');
    const controller = new AbortController();
    abortRef.current = controller;

    // 2. Request server-side multilingual Gemini TTS WAV
    const wavBlob = await fetchServerTtsWav(trimmed, lang, controller.signal);
    if (controller.signal.aborted) return;

    if (wavBlob) {
      const objectUrl = URL.createObjectURL(wavBlob);
      cacheRef.current.set(cacheKey, objectUrl);
      const ok = await playFromUrl(objectUrl);
      if (ok) return;
    }

    if (controller.signal.aborted) return;

    // 3. Fallback: browser speechSynthesis ONLY if a voice matching the exact language exists
    const spoke = speakTextWithBrowserVoice(
      trimmed,
      lang,
      () => {
        backendRef.current = null;
        setState('idle');
      },
      () => {
        backendRef.current = null;
        setState('unavailable');
      },
    );

    if (spoke) {
      backendRef.current = 'speech';
      setState('playing');
    } else {
      backendRef.current = null;
      setState('unavailable');
    }
  };

  const handlePause = () => {
    if (state !== 'playing') return;
    if (backendRef.current === 'audio' && audioRef.current) {
      audioRef.current.pause();
      setState('paused');
    } else if (backendRef.current === 'speech') {
      pauseBrowserSpeech();
      setState('paused');
    }
  };

  const handleResume = async () => {
    if (state !== 'paused') return;
    if (backendRef.current === 'audio' && audioRef.current) {
      try {
        await audioRef.current.play();
        setState('playing');
      } catch {
        setState('unavailable');
      }
    } else if (backendRef.current === 'speech') {
      resumeBrowserSpeech();
      setState('playing');
    }
  };

  const handleReplay = () => {
    void startPlayback();
  };

  const handleStop = () => {
    stopAll(true);
  };

  return (
    <div className={styles.wrap} data-testid={testId}>
      {state === 'idle' || state === 'unavailable' ? (
        <button
          type="button"
          className={styles.listenPrimaryBtn}
          onClick={() => void startPlayback()}
          data-testid={`${testId}-play`}
        >
          <SpeakerGlyph size={22} />
          <span>{label}</span>
        </button>
      ) : state === 'loading' ? (
        <div className={styles.controlsRow}>
          <button
            type="button"
            className={styles.listenPrimaryBtn}
            disabled
            aria-busy="true"
          >
            <SpeakerGlyph size={22} />
            <span>{t(lang, 'audioLoading')}</span>
          </button>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleStop}
            data-testid={`${testId}-stop`}
          >
            <StopGlyph size={18} />
            <span>{t(lang, 'btnStopListen')}</span>
          </button>
        </div>
      ) : (
        <div className={styles.controlsRow} role="group" aria-label={label}>
          {state === 'playing' ? (
            <button
              type="button"
              className={styles.controlBtnActive}
              onClick={handlePause}
              data-testid={`${testId}-pause`}
            >
              <PauseGlyph size={18} />
              <span>{t(lang, 'btnPauseListen')}</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.controlBtnActive}
              onClick={() => void handleResume()}
              data-testid={`${testId}-resume`}
            >
              <PlayGlyph size={18} />
              <span>{t(lang, 'btnResumeListen')}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleStop}
            data-testid={`${testId}-stop`}
          >
            <StopGlyph size={18} />
            <span>{t(lang, 'btnStopListen')}</span>
          </button>

          <button
            type="button"
            className={styles.controlBtn}
            onClick={handleReplay}
            data-testid={`${testId}-replay`}
          >
            <ReplayGlyph size={18} />
            <span>{t(lang, 'btnReplayListen')}</span>
          </button>
        </div>
      )}

      {state === 'unavailable' && (
        <p className={styles.unavailableNote} role="status" aria-live="polite">
          {t(lang, 'ttsUnavailableNote')}
        </p>
      )}
    </div>
  );
}
