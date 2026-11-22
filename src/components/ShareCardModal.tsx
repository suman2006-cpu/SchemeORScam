import React, { useEffect, useState } from 'react';
import { getReasonText } from '../engine/messageEngine';
import type { CheckResult, Language } from '../engine/types';
import { t } from '../i18n';
import { generateWarningCardPng } from '../lib/shareCard';
import styles from './ShareCardModal.module.css';

interface ShareCardModalProps {
  lang: Language;
  result: CheckResult;
  onClose: () => void;
}

export function ShareCardModal({ lang, result, onClose }: ShareCardModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [canShareFile, setCanShareFile] = useState(false);

  useEffect(() => {
    let active = true;
    generateWarningCardPng(result, lang)
      .then((out) => {
        if (!active) return;
        setDataUrl(out.dataUrl);
        setBlob(out.blob);

        try {
          const file = new File([out.blob], 'nijama-mosama-warning.png', {
            type: 'image/png',
          });
          if (
            typeof navigator !== 'undefined' &&
            typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [file] })
          ) {
            setCanShareFile(true);
          }
        } catch {
          setCanShareFile(false);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [result, lang]);

  const handleNativeShare = async () => {
    if (!blob) return;
    try {
      const file = new File([blob], 'nijama-mosama-warning.png', {
        type: 'image/png',
      });
      await navigator.share({
        title: t(lang, 'appName'),
        text: buildWhatsappText(),
        files: [file],
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'nijama-mosama-warning.png';
    link.click();
  };

  const buildWhatsappText = () => {
    const verdictLabel =
      result.verdict === 'OFFICIAL'
        ? t(lang, 'verdictOfficial')
        : result.verdict === 'RECOGNIZED_COMPANY'
          ? t(lang, 'verdictRecognizedCompany')
          : result.verdict === 'LIKELY_FAKE'
            ? t(lang, 'verdictLikelyFake')
            : t(lang, 'verdictNotVerified');
    const dom = result.destination?.registrableDomain
      ? ` (${result.destination.registrableDomain})`
      : '';
    const firstReason = result.reasons[0]
      ? getReasonText(result.reasons[0], lang)
      : '';
    return `${t(lang, 'appName')}: ${verdictLabel}${dom}. ${firstReason} ${t(lang, 'rescueStep1930')}`;
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(buildWhatsappText())}`;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-card-title"
    >
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 id="share-card-title" className={styles.title}>
            {t(lang, 'shareCardTitle')}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
          >
            {t(lang, 'shareCardCloseBtn')}
          </button>
        </div>

        <p className={styles.desc}>{t(lang, 'shareCardDesc')}</p>

        <div className={styles.previewWrap} data-testid="share-card-preview">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={t(lang, 'shareCardTitle')}
              className={styles.previewImg}
            />
          ) : (
            <p>{t(lang, 'btnChecking')}</p>
          )}
        </div>

        <div className={styles.actions}>
          {canShareFile && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleNativeShare}
            >
              {t(lang, 'shareCardShareBtn')}
            </button>
          )}

          <button
            type="button"
            className={canShareFile ? styles.secondaryBtn : styles.primaryBtn}
            onClick={handleDownload}
            disabled={!dataUrl}
          >
            {t(lang, 'shareCardDownloadBtn')}
          </button>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondaryBtn}
          >
            {t(lang, 'shareCardWhatsappBtn')}
          </a>
        </div>
      </div>
    </div>
  );
}
