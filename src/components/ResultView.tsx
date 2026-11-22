import React, { useEffect, useState } from 'react';
import { getReasonText } from '../engine/messageEngine';
import type {
  CheckResult,
  DistrictItem,
  Language,
  MessageAuthenticityStatus,
  StatusTone,
  WebsiteTrustCategory,
} from '../engine/types';
import { t } from '../i18n';
import { AudioPlayerBar } from './AudioPlayerBar';
import {
  CrossMark,
  QuestionMark,
  ShareGlyph,
  TickMark,
} from './HandDrawnSvgs';
import { RoughStampBox } from './RoughElements';
import styles from './ResultView.module.css';

interface ResultViewProps {
  lang: Language;
  result: CheckResult;
  districts: DistrictItem[];
  onCheckAnother: () => void;
  onAlreadyClicked: (suspiciousLink: string) => void;
  onOpenShareCard: () => void;
  onRadarSubmitted: () => void;
}

function getTrustBadgeLabel(lang: Language, category: WebsiteTrustCategory): string {
  switch (category) {
    case 'OFFICIAL_GOV':
      return t(lang, 'trustOfficialGov');
    case 'RECOGNIZED_COMPANY':
      return t(lang, 'trustRecognizedCompany');
    case 'UNKNOWN_UNCONFIRMED':
      return t(lang, 'trustUnknownUnconfirmed');
    case 'POTENTIALLY_UNSAFE':
      return t(lang, 'trustPotentiallyUnsafe');
    case 'NO_URL':
      return t(lang, 'trustNoUrl');
  }
}

function getMsgAuthBadgeLabel(
  lang: Language,
  status: MessageAuthenticityStatus,
): string {
  switch (status) {
    case 'SUPPORTED_OFFICIAL':
      return t(lang, 'msgSupportedOfficial');
    case 'UNVERIFIED_CLAIM':
      return t(lang, 'msgUnverifiedClaim');
    case 'SUSPICIOUS_OR_FAKE':
      return t(lang, 'msgSuspiciousFake');
    case 'NO_MESSAGE_CLAIM':
      return t(lang, 'msgNoClaim');
  }
}

function toneBadgeClass(tone: StatusTone): string {
  if (tone === 'green') return styles.badgeGreen;
  if (tone === 'red') return styles.badgeRed;
  if (tone === 'amber') return styles.badgeAmber;
  return styles.badgeNeutral;
}

function toneIcon(tone: StatusTone) {
  if (tone === 'green') return <TickMark size={20} />;
  if (tone === 'red') return <CrossMark size={20} />;
  return <QuestionMark size={20} />;
}

export function ResultView({
  lang,
  result,
  districts,
  onCheckAnother,
  onAlreadyClicked,
  onOpenShareCard,
  onRadarSubmitted,
}: ResultViewProps) {
  const [showAllReasons, setShowAllReasons] = useState(false);

  // Cached dynamic AI explanation translations per language (preserves result on switch)
  const [aiExpCache, setAiExpCache] = useState<Partial<Record<Language, string>>>(
    () => ({ ...(result.messageAuthenticity.aiExplanationByLang ?? {}) }),
  );
  const [translatingAi, setTranslatingAi] = useState(false);

  // Opt-in Radar submission state
  const [selectedDistrict, setSelectedDistrict] = useState(
    districts[0]?.code ?? 'AP-GNT',
  );
  const [consentChecked, setConsentChecked] = useState(false);
  const [radarSubmitting, setRadarSubmitting] = useState(false);
  const [radarDone, setRadarDone] = useState(false);

  // Reset AI cache only when a new CheckResult arrives
  useEffect(() => {
    setAiExpCache({ ...(result.messageAuthenticity.aiExplanationByLang ?? {}) });
    setShowAllReasons(false);
    setRadarDone(false);
  }, [result]);

  // Translate dynamic AI explanation into newly selected language if we have one in another language
  useEffect(() => {
    if (aiExpCache[lang]) return;
    const entries = Object.entries(aiExpCache) as Array<[Language, string]>;
    const sourceEntry = entries.find(([, v]) => Boolean(v && v.trim()));
    if (!sourceEntry) return;

    const controller = new AbortController();
    setTranslatingAi(true);
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: sourceEntry[1],
        sourceLang: sourceEntry[0],
        targetLang: lang,
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { translatedText?: string } | null) => {
        if (data?.translatedText && !controller.signal.aborted) {
          setAiExpCache((prev) => ({ ...prev, [lang]: data.translatedText }));
        }
      })
      .catch(() => {
        // Keep structured 6-language deterministic explanation visible
      })
      .finally(() => {
        if (!controller.signal.aborted) setTranslatingAi(false);
      });

    return () => controller.abort();
  }, [lang, aiExpCache]);

  const stampConfig =
    result.verdict === 'OFFICIAL'
      ? {
          color: '#1F6B3B',
          bg: '#E1EEE3',
          label: t(lang, 'verdictOfficial'),
          icon: <TickMark size={30} />,
        }
      : result.verdict === 'RECOGNIZED_COMPANY'
        ? {
            color: '#1F6B3B',
            bg: '#E1EEE3',
            label: t(lang, 'verdictRecognizedCompany'),
            icon: <TickMark size={30} />,
          }
        : result.verdict === 'LIKELY_FAKE'
          ? {
              color: '#B3261E',
              bg: '#F8DEDA',
              label: t(lang, 'verdictLikelyFake'),
              icon: <CrossMark size={30} />,
            }
          : {
              color: '#8A5300',
              bg: '#FBEBC8',
              label: t(lang, 'verdictNotVerified'),
              icon: <QuestionMark size={30} />,
            };

  const visibleReasons = showAllReasons ? result.allReasons : result.reasons;
  const aiExplanationForLang = aiExpCache[lang] || null;

  // Assemble "What to do now" rows cleanly across all 4 categories + dual authenticity
  const steps: string[] = [];
  if (
    result.verdict === 'LIKELY_FAKE' ||
    result.messageAuthenticity.status === 'SUSPICIOUS_OR_FAKE'
  ) {
    if (result.websiteTrust.category === 'RECOGNIZED_COMPANY') {
      steps.push(t(lang, 'stepPrivateCompanyNote'));
    } else {
      steps.push(t(lang, 'stepDoNotClick'));
    }
    steps.push(t(lang, 'stepDoNotShareOtp'));
    if (result.officialPath && result.officialPath.stepsTe.length > 0) {
      steps.push(
        ...(lang === 'te'
          ? result.officialPath.stepsTe
          : result.officialPath.stepsEn),
      );
    } else if (result.officialPath?.channels.length) {
      const ch = result.officialPath.channels[0];
      steps.push(
        `${t(lang, 'officialPathHeading')}: ${
          lang === 'te'
            ? result.officialPath.schemeNameTe
            : result.officialPath.schemeNameEn
        } — ${ch.value}`,
      );
    }
    steps.push(t(lang, 'stepWarnFamily'));
  } else if (result.verdict === 'OFFICIAL') {
    if (result.officialPath && result.officialPath.stepsTe.length > 0) {
      steps.push(
        ...(lang === 'te'
          ? result.officialPath.stepsTe
          : result.officialPath.stepsEn),
      );
    } else {
      steps.push(t(lang, 'stepUseOfficialDomain'));
    }
    steps.push(t(lang, 'stepDoNotShareOtp'));
  } else if (result.verdict === 'RECOGNIZED_COMPANY') {
    steps.push(t(lang, 'stepPrivateCompanyNote'));
    steps.push(t(lang, 'stepDoNotShareOtp'));
  } else {
    steps.push(t(lang, 'stepAskOfficer'));
    steps.push(t(lang, 'stepDoNotShareOtp'));
  }

  // Spoken explanation in the exact selected language for AudioPlayerBar
  const spokenExplanation = [
    stampConfig.label,
    `${t(lang, 'websiteTrustHeading')}: ${getTrustBadgeLabel(lang, result.websiteTrust.category)}.`,
    result.websiteTrust.organizationName
      ? `${result.websiteTrust.organizationName[lang]}.`
      : '',
    result.websiteTrust.description[lang],
    `${t(lang, 'messageAuthHeading')}: ${getMsgAuthBadgeLabel(lang, result.messageAuthenticity.status)}.`,
    result.messageAuthenticity.summary[lang],
    aiExplanationForLang || '',
    ...visibleReasons.map((r) => getReasonText(r, lang)),
    `${t(lang, 'whatToDoHeading')}:`,
    ...steps,
  ]
    .filter(Boolean)
    .join(' ');

  const handleRadarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked || !result.destination?.registrableDomain) return;
    setRadarSubmitting(true);
    try {
      const res = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrableDomain: result.destination.registrableDomain,
          verdict: result.verdict,
          schemeId: result.schemeMatched?.id ?? 'unknown',
          actionType: result.actionDetected ?? 'other',
          districtCode: selectedDistrict,
          consent: true,
        }),
      });
      if (res.ok) {
        setRadarDone(true);
        onRadarSubmitted();
      }
    } finally {
      setRadarSubmitting(false);
    }
  };

  const canSubmitRadar =
    result.websiteTrust.category === 'POTENTIALLY_UNSAFE' &&
    Boolean(result.destination?.registrableDomain);

  return (
    <section
      className={styles.sheet}
      aria-live="polite"
      aria-label={stampConfig.label}
      data-testid="verdict-result"
    >
      <div className={styles.topActions}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onCheckAnother}
        >
          {t(lang, 'btnCheckAnother')}
        </button>
        {result.engineMode === 'rules-only' && (
          <span className={styles.rulesNotice}>{t(lang, 'rulesOnlyNotice')}</span>
        )}
      </div>

      {/* Rubber-stamp overall verdict */}
      <div className={styles.stampSection}>
        <RoughStampBox color={stampConfig.color} bgColor={stampConfig.bg}>
          <div className={styles.stampContent}>
            {stampConfig.icon}
            <span className={styles.stampText}>{stampConfig.label}</span>
          </div>
        </RoughStampBox>

        {result.verdict === 'NOT_VERIFIED' && (
          <p className={styles.notVerifiedLead}>
            {t(lang, 'verdictNotVerifiedAdvice')}
          </p>
        )}
      </div>

      {/* TWO INDEPENDENT VERIFICATION SECTIONS: A. Website Trust & B. Message Authenticity */}
      <div className={styles.dualGrid}>
        {/* A. Website Trust */}
        <article
          className={styles.trustCard}
          data-testid="website-trust-card"
          data-trust-category={result.websiteTrust.category}
          data-trust-tone={result.websiteTrust.tone}
        >
          <h2 className={styles.trustCardTitle}>
            {t(lang, 'websiteTrustHeading')}
          </h2>

          <div className={`${styles.statusBadge} ${toneBadgeClass(result.websiteTrust.tone)}`}>
            {toneIcon(result.websiteTrust.tone)}
            <span>{getTrustBadgeLabel(lang, result.websiteTrust.category)}</span>
          </div>

          {result.websiteTrust.organizationName && (
            <div className={styles.metaLine}>
              <span className={styles.metaKey}>{t(lang, 'orgLabel')}:</span>{' '}
              <strong className={styles.metaVal}>
                {result.websiteTrust.organizationName[lang]}
              </strong>
            </div>
          )}

          {result.websiteTrust.domain && (
            <div className={styles.metaLine} data-testid="destination-hostname">
              <span className={styles.metaKey}>{t(lang, 'domainLabel')}:</span>{' '}
              <span className={styles.hostnameInline}>
                {result.websiteTrust.subdomain && (
                  <span className={styles.subdomainText}>
                    {result.websiteTrust.subdomain}.
                  </span>
                )}
                <mark className={styles.registrableHighlight}>
                  {result.websiteTrust.domain}
                </mark>
              </span>
            </div>
          )}

          {result.destination?.expandedFrom && (
            <div className={styles.expandedNote}>
              {t(lang, 'destinationShortenerNote')}: {result.destination.expandedFrom}
            </div>
          )}

          {result.websiteTrust.categoryLabel && (
            <div className={styles.metaLine}>
              <span className={styles.metaKey}>{t(lang, 'categoryLabel')}:</span>{' '}
              <span className={styles.metaVal}>
                {result.websiteTrust.categoryLabel[lang]}
              </span>
            </div>
          )}

          <p className={styles.trustDesc}>{result.websiteTrust.description[lang]}</p>

          {result.websiteTrust.matchesMentionedScheme !== null && (
            <div
              className={
                result.websiteTrust.matchesMentionedScheme
                  ? styles.schemeMatchYes
                  : styles.schemeMatchNo
              }
            >
              <strong>{t(lang, 'schemeMatchLabel')}:</strong>{' '}
              {result.websiteTrust.matchesMentionedScheme
                ? t(lang, 'schemeMatchYes')
                : t(lang, 'schemeMatchNo')}
            </div>
          )}
        </article>

        {/* B. Message Authenticity */}
        <article
          className={styles.trustCard}
          data-testid="message-authenticity-card"
          data-msg-status={result.messageAuthenticity.status}
          data-msg-tone={result.messageAuthenticity.tone}
        >
          <h2 className={styles.trustCardTitle}>
            {t(lang, 'messageAuthHeading')}
          </h2>

          <div
            className={`${styles.statusBadge} ${toneBadgeClass(result.messageAuthenticity.tone)}`}
          >
            {toneIcon(result.messageAuthenticity.tone)}
            <span>
              {getMsgAuthBadgeLabel(lang, result.messageAuthenticity.status)}
            </span>
          </div>

          <p className={styles.trustDesc}>
            {result.messageAuthenticity.summary[lang]}
          </p>

          {(aiExplanationForLang || translatingAi) && (
            <div className={styles.aiExplainBox}>
              <div className={styles.aiExplainTitle}>
                {t(lang, 'aiExplanationHeading')}
              </div>
              {translatingAi ? (
                <p className={styles.translatingNote}>
                  {t(lang, 'translatingNote')}
                </p>
              ) : (
                <p className={styles.aiExplainText}>{aiExplanationForLang}</p>
              )}
            </div>
          )}
        </article>
      </div>

      {/* Prominent audio explanation player (Play / Pause / Resume / Stop / Replay) */}
      <div className={styles.audioSection}>
        <AudioPlayerBar
          text={spokenExplanation}
          lang={lang}
          label={t(lang, 'btnListen')}
          testId="result-audio-player"
        />
      </div>

      {/* Up to 3 numbered reasons */}
      <div className={styles.sectionBlock}>
        <h2 className={styles.sectionHeading}>{t(lang, 'reasonsHeading')}</h2>
        <ol className={styles.reasonList}>
          {visibleReasons.map((reason, idx) => (
            <li
              key={reason.id}
              className={`${styles.reasonRow} rowStagger`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <span className={styles.reasonNum}>{idx + 1}.</span>
              <span
                className={
                  reason.severity === 'hard'
                    ? styles.reasonIconHard
                    : reason.severity === 'soft'
                      ? styles.reasonIconSoft
                      : styles.reasonIconOk
                }
              >
                {reason.severity === 'hard' ? (
                  <CrossMark size={20} />
                ) : reason.severity === 'soft' ? (
                  <QuestionMark size={20} />
                ) : (
                  <TickMark size={20} />
                )}
              </span>
              <div className={styles.reasonBody}>
                <span>{getReasonText(reason, lang)}</span>
                {reason.evidence && (
                  <span className={styles.reasonEvidence}>{reason.evidence}</span>
                )}
              </div>
            </li>
          ))}
        </ol>

        {result.allReasons.length > 3 && (
          <button
            type="button"
            className={styles.toggleMoreBtn}
            onClick={() => setShowAllReasons((v) => !v)}
            aria-expanded={showAllReasons}
          >
            {showAllReasons ? t(lang, 'lessDetails') : t(lang, 'moreDetails')} (
            {result.allReasons.length})
          </button>
        )}
      </div>

      {/* What to do now — numbered big rows (>= 56px) */}
      <div className={styles.sectionBlock}>
        <h2 className={styles.sectionHeading}>{t(lang, 'whatToDoHeading')}</h2>
        <ol className={styles.stepList}>
          {steps.map((step, idx) => (
            <li
              key={idx}
              className={`${styles.stepRow} rowStagger`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <span className={styles.stepNum}>{idx + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {result.officialPath && (
          <div className={styles.officialSourceBox}>
            <strong>
              {t(lang, 'officialPathHeading')}:{' '}
              {lang === 'te'
                ? result.officialPath.schemeNameTe
                : result.officialPath.schemeNameEn}
            </strong>
            {result.officialPath.domainOnlyNotice && (
              <div>{t(lang, 'verdictDomainOnlyLine')}</div>
            )}
            {result.officialPath.channels.map((ch, idx) => (
              <div key={idx} className={styles.sourceMetaRow}>
                {ch.type === 'web' ? (
                  <a
                    href={ch.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="urlBreak"
                  >
                    {ch.value}
                  </a>
                ) : (
                  <span className="mono">{ch.value}</span>
                )}
                {' — '}
                {lang === 'te' ? ch.noteTe : ch.noteEn}
              </div>
            ))}
            <div className={styles.sourceMetaRow}>
              {t(lang, 'lastVerifiedLabel')}:{' '}
              <span className="mono">
                {result.officialPath.verifiedOn ||
                  t(lang, 'unconfirmedRegistryNote')}
              </span>
            </div>
            {result.officialPath.sourceUrl && (
              <div className={styles.sourceMetaRow}>
                {t(lang, 'sourceLinkLabel')}:{' '}
                <a
                  href={result.officialPath.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="urlBreak"
                >
                  {result.officialPath.sourceUrl}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Opt-in Scam Radar submission (no personal data) */}
      {canSubmitRadar && (
        <div className={styles.optInBox}>
          <h3 className={styles.optInTitle}>{t(lang, 'radarOptInHeading')}</h3>
          <p className={styles.optInDesc}>{t(lang, 'radarOptInDesc')}</p>
          {radarDone ? (
            <p role="status">
              <strong>{t(lang, 'radarOptInDone')}</strong>
            </p>
          ) : (
            <form onSubmit={handleRadarSubmit}>
              <label htmlFor="radar-district-select" className="srOnly">
                {t(lang, 'radarOptInDistrictLabel')}
              </label>
              <select
                id="radar-district-select"
                className={styles.selectField}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {lang === 'te' ? `${d.nameTe} (${d.state})` : `${d.nameEn} (${d.state})`}
                  </option>
                ))}
              </select>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span>{t(lang, 'radarOptInCheckbox')}</span>
              </label>

              <button
                type="submit"
                className={styles.optInSubmitBtn}
                disabled={!consentChecked || radarSubmitting}
              >
                {t(lang, 'radarOptInSubmit')}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Action bar: Share Warning Card */}
      <div className={`${styles.actionBar} ${styles.stickyMobileActions}`}>
        <button
          type="button"
          className={styles.shareBtn}
          onClick={onOpenShareCard}
        >
          <ShareGlyph size={22} />
          <span>{t(lang, 'btnSendWarning')}</span>
        </button>
      </div>

      {/* Persistent Rescue flow link */}
      <div className={styles.rescueLinkRow}>
        <button
          type="button"
          className={styles.rescueLinkBtn}
          onClick={() => {
            onAlreadyClicked(
              result.destination?.originalInputUrl ||
                result.extractedPhones[0] ||
                '',
            );
          }}
        >
          {t(lang, 'btnAlreadyClicked')}
        </button>
      </div>
    </section>
  );
}
