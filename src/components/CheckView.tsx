import React, { useEffect, useRef, useState } from 'react';
import type { CheckResult, Language, RadarCluster } from '../engine/types';
import { t } from '../i18n';
import {
  blobToBase64,
  createBrowserSpeechRecognition,
  encodeBlobToMonoWav16k,
  getPreferredAudioMimeType,
  type SpeechRecognitionLike,
} from '../lib/audio';
import { prepareScreenshotForOcr } from '../lib/imagePrep';
import {
  CameraGlyph,
  CrossedLinkDrawing,
  MicGlyph,
  PasteGlyph,
  UploadGlyph,
} from './HandDrawnSvgs';
import styles from './CheckView.module.css';

interface CheckViewProps {
  lang: Language;
  inputText: string;
  onInputChange: (val: string) => void;
  onCheckSubmit: (textToCheck: string) => Promise<void>;
  checking: boolean;
  radarItems: RadarCluster[];
  onOpenAlerts: () => void;
  resultNode?: React.ReactNode;
  activeResult: CheckResult | null;
}

const MAX_VOICE_SECONDS = 60;
const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024;

export function CheckView({
  lang,
  inputText,
  onInputChange,
  onCheckSubmit,
  checking,
  radarItems,
  onOpenAlerts,
  resultNode,
  activeResult,
}: CheckViewProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Screenshot OCR editable review state
  const [ocrDraft, setOcrDraft] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);

  // Voice recording & transcription review state
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState(MAX_VOICE_SECONDS);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioUploadRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      speechRecRef.current?.stop();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setRecording(false);
    setRemainingSec(MAX_VOICE_SECONDS);
  };

  const transcribeAudioBlob = async (rawBlob: Blob, durationSec: number) => {
    setVoiceBusy(true);
    setStatusMsg(t(lang, 'voiceReading'));
    setErrorMsg(null);
    try {
      const wavBlob = await encodeBlobToMonoWav16k(rawBlob);
      const base64 = await blobToBase64(wavBlob);
      const res = await fetch('/api/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: wavBlob.type || 'audio/wav',
          durationSec,
          lang,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { transcript?: string };
        if (data.transcript && data.transcript.trim()) {
          const clean = data.transcript.trim();
          onInputChange(clean);
          setVoiceDraft(clean);
          setStatusMsg(null);
          return true;
        }
      }
      setStatusMsg(null);
      setErrorMsg(t(lang, 'voiceError'));
      return false;
    } catch {
      setStatusMsg(null);
      setErrorMsg(t(lang, 'voiceError'));
      return false;
    } finally {
      setVoiceBusy(false);
    }
  };

  const handleVoiceToggle = async () => {
    setErrorMsg(null);
    setStatusMsg(null);

    if (recording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (speechRecRef.current) {
        speechRecRef.current.stop();
      }
      stopRecordingCleanup();
      return;
    }

    // Request microphone permission ONLY on explicit user click
    const preferredMime = getPreferredAudioMimeType();
    if (
      preferredMime !== null &&
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);

        chunksRef.current = [];
        startedAtRef.current = Date.now();
        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((tr) => tr.stop());
          streamRef.current = null;
          const durationSec = Math.min(
            MAX_VOICE_SECONDS,
            Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
          );
          const rawBlob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          await transcribeAudioBlob(rawBlob, durationSec);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setRecording(true);
        setRemainingSec(MAX_VOICE_SECONDS);

        countdownTimerRef.current = window.setInterval(() => {
          setRemainingSec((prev) => {
            if (prev <= 1) {
              if (recorder.state !== 'inactive') recorder.stop();
              stopRecordingCleanup();
              return MAX_VOICE_SECONDS;
            }
            return prev - 1;
          });
        }, 1000);
        return;
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setErrorMsg(t(lang, 'voicePermissionDenied'));
          return;
        }
        // Otherwise fall through to browser SpeechRecognition
      }
    }

    // Fallback: browser SpeechRecognition using selected Indian language locale
    const recognition = createBrowserSpeechRecognition(lang);
    if (!recognition) {
      setErrorMsg(t(lang, 'voiceNoSupport'));
      return;
    }

    speechRecRef.current = recognition;
    setRecording(true);
    setRemainingSec(MAX_VOICE_SECONDS);

    recognition.onresult = (event) => {
      const transcript = (event.results[0]?.[0]?.transcript ?? '').trim();
      if (transcript) {
        onInputChange(transcript);
        setVoiceDraft(transcript);
      }
      stopRecordingCleanup();
    };
    recognition.onerror = (ev) => {
      if (ev.error === 'not-allowed') {
        setErrorMsg(t(lang, 'voicePermissionDenied'));
      } else {
        setErrorMsg(t(lang, 'voiceError'));
      }
      stopRecordingCleanup();
    };
    recognition.onend = () => {
      stopRecordingCleanup();
    };

    try {
      recognition.start();
    } catch {
      stopRecordingCleanup();
      setErrorMsg(t(lang, 'voiceNoSupport'));
    }
  };

  const handleAudioFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);
    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      setErrorMsg(t(lang, 'voiceError'));
      return;
    }
    await transcribeAudioBlob(file, 30);
  };

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);
    setStatusMsg(t(lang, 'ocrReading'));
    setOcrBusy(true);

    try {
      const prepared = await prepareScreenshotForOcr(file);
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: prepared.base64,
          mimeType: prepared.mimeType,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { extractedText?: string };
        if (data.extractedText) {
          setOcrDraft(data.extractedText);
          setStatusMsg(null);
          setOcrBusy(false);
          return;
        }
      }
      setStatusMsg(t(lang, 'ocrFallbackNote'));
    } catch (err) {
      if (err instanceof Error && err.message === 'IMAGE_TOO_LARGE') {
        setErrorMsg(t(lang, 'imageTooLarge'));
      } else {
        setStatusMsg(t(lang, 'ocrFallbackNote'));
      }
    } finally {
      setOcrBusy(false);
    }
  };

  const handlePaste = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      if (!navigator.clipboard?.readText) {
        setErrorMsg(t(lang, 'pasteError'));
        return;
      }
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) {
        onInputChange(clip);
      } else {
        setErrorMsg(t(lang, 'pasteError'));
      }
    } catch {
      setErrorMsg(t(lang, 'pasteError'));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!inputText.trim()) {
      setErrorMsg(t(lang, 'emptyInputError'));
      return;
    }
    setVoiceDraft(null);
    setOcrDraft(null);
    await onCheckSubmit(inputText);
  };

  const handleConfirmOcr = async () => {
    if (!ocrDraft || !ocrDraft.trim()) return;
    const confirmed = ocrDraft.trim();
    onInputChange(confirmed);
    setOcrDraft(null);
    await onCheckSubmit(confirmed);
  };

  const handleConfirmVoice = async () => {
    if (!voiceDraft || !voiceDraft.trim()) return;
    const confirmed = voiceDraft.trim();
    onInputChange(confirmed);
    setVoiceDraft(null);
    await onCheckSubmit(confirmed);
  };

  const runSample = async (sampleText: string) => {
    setErrorMsg(null);
    setStatusMsg(null);
    setVoiceDraft(null);
    setOcrDraft(null);
    onInputChange(sampleText);
    await onCheckSubmit(sampleText);
  };

  return (
    <div className={styles.grid}>
      {/* Left 7-column primary tool / result area */}
      <div>
        {activeResult && resultNode ? (
          resultNode
        ) : (
          <>
            <div className={styles.instructionStrip}>
              <CrossedLinkDrawing />
              <p className={styles.instructionText}>
                {t(lang, 'checkInstruction')}
              </p>
            </div>

            <form className={styles.formSheet} onSubmit={handleFormSubmit} noValidate>
              <label htmlFor="check-message-input" className={styles.fieldLabel}>
                {t(lang, 'checkInputLabel')}
              </label>
              <textarea
                id="check-message-input"
                className={styles.textarea}
                value={inputText}
                onChange={(e) => {
                  onInputChange(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={t(lang, 'checkInputPlaceholder')}
                maxLength={4000}
                rows={4}
              />

              {/* Asymmetric input controls: 64px mic first, Photo + Paste + Upload Voice below */}
              <div className={styles.controlsStack}>
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`${styles.voiceBtn} ${recording ? styles.voiceBtnRecording : ''}`}
                  aria-pressed={recording}
                  disabled={voiceBusy}
                  data-testid="voice-record-btn"
                >
                  <MicGlyph size={26} />
                  <span>
                    {recording
                      ? `${t(lang, 'btnVoiceRecording')} (${t(lang, 'btnVoiceCountdown', { sec: remainingSec })})`
                      : t(lang, 'btnVoice')}
                  </span>
                </button>

                <div className={styles.secondaryRowThree}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={ocrBusy}
                  >
                    <CameraGlyph size={22} />
                    <span>{t(lang, 'btnPhoto')}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="srOnly"
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={handlePhotoFile}
                  />

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => audioUploadRef.current?.click()}
                    disabled={voiceBusy || recording}
                    data-testid="voice-upload-btn"
                  >
                    <UploadGlyph size={20} />
                    <span>{t(lang, 'btnVoiceUpload')}</span>
                  </button>
                  <input
                    ref={audioUploadRef}
                    type="file"
                    accept="audio/*"
                    className="srOnly"
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={handleAudioFileUpload}
                  />

                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={handlePaste}
                  >
                    <PasteGlyph size={22} />
                    <span>{t(lang, 'btnPaste')}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className={styles.primarySubmit}
                  disabled={checking || ocrBusy || voiceBusy}
                  data-testid="check-submit-btn"
                >
                  {checking ? t(lang, 'btnChecking') : t(lang, 'btnCheck')}
                </button>
              </div>

              {statusMsg && (
                <div className={styles.statusNote} role="status" aria-live="polite">
                  {statusMsg}
                </div>
              )}
              {errorMsg && (
                <div className={styles.errorNote} role="alert">
                  {errorMsg}
                </div>
              )}

              {/* Editable voice transcript confirmation panel */}
              {voiceDraft !== null && (
                <div className={styles.ocrReview} data-testid="voice-review-panel">
                  <label htmlFor="voice-review-input" className={styles.ocrReviewTitle}>
                    {t(lang, 'voiceConfirmQuestion')}
                  </label>
                  <textarea
                    id="voice-review-input"
                    className={styles.textarea}
                    value={voiceDraft}
                    onChange={(e) => {
                      setVoiceDraft(e.target.value);
                      onInputChange(e.target.value);
                    }}
                    rows={3}
                  />
                  <div className={styles.ocrReviewActions}>
                    <button
                      type="button"
                      className={styles.primarySubmit}
                      onClick={handleConfirmVoice}
                      disabled={checking}
                    >
                      {t(lang, 'voiceConfirmBtn')}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setVoiceDraft(null)}
                    >
                      {t(lang, 'ocrCancelBtn')}
                    </button>
                  </div>
                </div>
              )}

              {/* Editable screenshot OCR confirmation panel */}
              {ocrDraft !== null && (
                <div className={styles.ocrReview}>
                  <label htmlFor="ocr-review-input" className={styles.ocrReviewTitle}>
                    {t(lang, 'ocrConfirmQuestion')}
                  </label>
                  <textarea
                    id="ocr-review-input"
                    className={styles.textarea}
                    value={ocrDraft}
                    onChange={(e) => setOcrDraft(e.target.value)}
                    rows={4}
                  />
                  <div className={styles.ocrReviewActions}>
                    <button
                      type="button"
                      className={styles.primarySubmit}
                      onClick={handleConfirmOcr}
                      disabled={checking}
                    >
                      {t(lang, 'ocrConfirmBtn')}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setOcrDraft(null)}
                    >
                      {t(lang, 'ocrCancelBtn')}
                    </button>
                  </div>
                </div>
              )}

              {/* Visibly labelled sample fixtures covering all 4 website categories */}
              <div className={styles.sampleBar}>
                <div className={styles.sampleLabel}>{t(lang, 'sampleTryLabel')}</div>
                <div className={styles.sampleBtns}>
                  <button
                    type="button"
                    className={styles.sampleBtn}
                    onClick={() => runSample('https://www.uidai.gov.in/')}
                  >
                    {t(lang, 'sampleOfficialBtn')}
                  </button>
                  <button
                    type="button"
                    className={styles.sampleBtn}
                    onClick={() => runSample('https://www.google.com')}
                  >
                    {t(lang, 'sampleCompanyBtn')}
                  </button>
                  <button
                    type="button"
                    className={styles.sampleBtn}
                    onClick={() =>
                      runSample(
                        'Urgent PM-KISAN e-KYC pending: https://pmkisan.gov.in.verify-now.xyz/ekyc.apk',
                      )
                    }
                  >
                    {t(lang, 'sampleFakeApkBtn')}
                  </button>
                  <button
                    type="button"
                    className={styles.sampleBtn}
                    onClick={() =>
                      runSample(
                        'https://andhrachronicle.example.org/news/pm-kisan-update',
                      )
                    }
                  >
                    {t(lang, 'sampleNotVerifiedBtn')}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Right 5-column notice board: scams circulating this week */}
      <aside className={styles.boardSheet} aria-label={t(lang, 'radarSidebarTitle')}>
        <div className={styles.boardHeader}>
          <h2 className={styles.boardTitle}>{t(lang, 'radarSidebarTitle')}</h2>
          {radarItems.some((i) => i.isSample) && (
            <div className={styles.boardMeta}>{t(lang, 'sampleDataBadge')}</div>
          )}
        </div>

        <ul className={styles.boardList}>
          {radarItems.slice(0, 5).map((item) => (
            <li key={item.id} className={styles.boardRow}>
              <div className={styles.boardRowTop}>
                <span className={styles.boardDistrict}>
                  {lang === 'te' ? item.districtTe : item.districtEn}
                </span>
                <span className={styles.boardCount}>
                  {t(lang, 'radarCountLabel', { count: item.count })}
                </span>
              </div>
              <span className={styles.boardDomain}>{item.registrableDomain}</span>
              <div className={styles.boardScheme}>
                {lang === 'te' ? item.schemeTe : item.schemeEn}
              </div>
              <div
                className={styles.dotStrip}
                aria-label={t(lang, 'radarDaysLabel')}
                title={t(lang, 'radarDaysLabel')}
              >
                {item.dailyCounts14d.map((cnt, idx) => (
                  <span
                    key={idx}
                    className={cnt > 0 ? styles.dotFilled : styles.dotEmpty}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.boardFooterLink}>
          <button type="button" className={styles.linkBtn} onClick={onOpenAlerts}>
            {t(lang, 'radarSeeAll')}
          </button>
        </div>
      </aside>
    </div>
  );
}
