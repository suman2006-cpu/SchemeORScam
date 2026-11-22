import React, { useEffect, useState } from 'react';
import { LANGUAGE_META, type Language } from '../engine/types';
import { t } from '../i18n';
import {
  computeRobustElapsedSec,
  loadRescueState,
  saveRescueState,
  type RescuePersistedState,
} from '../lib/historyStore';
import { AudioPlayerBar } from './AudioPlayerBar';
import { PhoneGlyph } from './HandDrawnSvgs';
import styles from './Pages.module.css';

interface RescueViewProps {
  lang: Language;
  prefillLink?: string;
}

const RESCUE_OPTIONS = [
  { id: 'opened', key: 'rescueOptOpened' as const },
  { id: 'installed', key: 'rescueOptInstalled' as const },
  { id: 'otp', key: 'rescueOptOtp' as const },
  { id: 'bank', key: 'rescueOptBank' as const },
  { id: 'paid', key: 'rescueOptPaid' as const },
];

export function RescueView({ lang, prefillLink }: RescueViewProps) {
  const [state, setState] = useState<RescuePersistedState>(() => {
    const loaded = loadRescueState();
    if (prefillLink && !loaded.linkOrPhone) {
      return { ...loaded, linkOrPhone: prefillLink };
    }
    return loaded;
  });

  const [elapsedSec, setElapsedSec] = useState<number>(() =>
    computeRobustElapsedSec(state.startedAtMs, state.lastElapsedSec),
  );
  const [copied, setCopied] = useState(false);

  // Sync prefillLink if passed after mount
  useEffect(() => {
    if (prefillLink) {
      setState((prev) =>
        prev.linkOrPhone ? prev : { ...prev, linkOrPhone: prefillLink },
      );
    }
  }, [prefillLink]);

  // Persist to localStorage
  useEffect(() => {
    saveRescueState({ ...state, lastElapsedSec: elapsedSec });
  }, [state, elapsedSec]);

  // Live timer synced on interval and visibilitychange (robust to clock shifts)
  useEffect(() => {
    if (!state.startedAtMs) {
      setElapsedSec(0);
      return;
    }

    const sync = () => {
      setElapsedSec((prev) =>
        computeRobustElapsedSec(state.startedAtMs, prev, Date.now()),
      );
    };

    sync();
    const id = window.setInterval(sync, 10000);
    const onVis = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [state.startedAtMs]);

  const toggleAction = (actionId: string) => {
    setState((prev) => {
      const exists = prev.actions.includes(actionId);
      const nextActions = exists
        ? prev.actions.filter((a) => a !== actionId)
        : [...prev.actions, actionId];
      const nextStarted =
        prev.startedAtMs ?? (nextActions.length > 0 ? Date.now() : null);
      return {
        ...prev,
        actions: nextActions,
        startedAtMs: nextStarted,
      };
    });
  };

  const resetTimer = () => {
    setElapsedSec(0);
    setState({
      actions: [],
      startedAtMs: null,
      lastElapsedSec: 0,
      linkOrPhone: prefillLink ?? '',
      amount: '',
      txnId: '',
    });
  };

  const elapsedMinutes = Math.floor(elapsedSec / 60);

  const checklist: string[] = [];
  const hasFinancialRisk =
    state.actions.includes('paid') ||
    state.actions.includes('bank') ||
    state.actions.includes('otp');

  if (hasFinancialRisk) {
    checklist.push(t(lang, 'rescueStepBank'));
    checklist.push(t(lang, 'rescueStep1930'));
  } else {
    checklist.push(t(lang, 'rescueStep1930'));
    checklist.push(t(lang, 'rescueStepBank'));
  }

  if (state.actions.includes('installed')) {
    checklist.push(t(lang, 'rescueStepInstalledNote'));
  }

  checklist.push(t(lang, 'rescueStepEvidence'));
  checklist.push(t(lang, 'rescueStepNoDelete'));
  checklist.push(t(lang, 'rescueStepFamily'));

  const selectedLabels = RESCUE_OPTIONS.filter((o) =>
    state.actions.includes(o.id),
  ).map((o) => t(lang, o.key));

  const complaintSummary = [
    `Date/Time: ${new Date(state.startedAtMs ?? Date.now()).toLocaleString(LANGUAGE_META[lang].locale)}`,
    `What happened: ${selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Suspicious link / message interaction'}`,
    `Suspicious link / number: ${state.linkOrPhone.trim() || '(not entered)'}`,
    `Amount lost (INR): ${state.amount.trim() || '(none / not entered)'}`,
    `Transaction ID / UTR: ${state.txnId.trim() || '(none / not entered)'}`,
  ].join('\n');

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(complaintSummary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

  const spokenChecklist = [
    t(lang, 'rescueTitle'),
    t(lang, 'rescueSubtitle'),
    t(lang, 'rescueChecklistTitle'),
    ...checklist,
  ].join('. ');

  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'rescueTitle')}</h2>
        <p className={styles.pageSubtitle}>{t(lang, 'rescueSubtitle')}</p>
      </div>

      {/* Running persisted timer */}
      {state.startedAtMs && (
        <div className={styles.timerBar} role="status" aria-live="polite">
          <div>
            <div className={styles.timerValue} data-testid="rescue-timer">
              {t(lang, 'rescueTimerLabel', { mins: elapsedMinutes })}
            </div>
            <div>{t(lang, 'rescueTimerStart')}</div>
          </div>
          <button
            type="button"
            className={styles.timerResetBtn}
            onClick={resetTimer}
          >
            {t(lang, 'rescueTimerReset')}
          </button>
        </div>
      )}

      {/* Multi-select question */}
      <h3 className={styles.sectionTitleFirst}>{t(lang, 'rescueQuestion')}</h3>
      <div className={styles.choiceList} role="group" aria-label={t(lang, 'rescueQuestion')}>
        {RESCUE_OPTIONS.map((opt) => {
          const checked = state.actions.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`${styles.choiceRow} ${checked ? styles.choiceRowSelected : ''}`}
            >
              <input
                type="checkbox"
                className={styles.choiceCheckbox}
                checked={checked}
                onChange={() => toggleAction(opt.id)}
              />
              <span>{t(lang, opt.key)}</span>
            </label>
          );
        })}
      </div>

      {/* Immediate emergency buttons */}
      <div className={styles.ctaRow}>
        <a href="tel:1930" className={styles.urgentCta}>
          <PhoneGlyph size={22} />
          <span>{t(lang, 'rescueCall1930')}</span>
        </a>
        <a
          href="https://cybercrime.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.primaryBtn}
        >
          {t(lang, 'rescueOpenCybercrime')}
        </a>
      </div>

      {/* Full Play/Pause/Resume/Stop/Replay audio readout for safety instructions */}
      <div style={{ marginTop: '16px' }}>
        <AudioPlayerBar
          text={spokenChecklist}
          lang={lang}
          label={t(lang, 'btnListenSafety')}
          testId="rescue-audio-player"
        />
      </div>

      {/* Ordered checklist */}
      <h3 className={styles.sectionTitle}>{t(lang, 'rescueChecklistTitle')}</h3>
      <ol className={styles.orderedList}>
        {checklist.map((step, idx) => (
          <li
            key={idx}
            className={`${styles.orderedRow} rowStagger`}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <span className={styles.rowNumber}>{idx + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {/* Pre-filled complaint summary builder */}
      <h3 className={styles.sectionTitle}>{t(lang, 'rescueSummaryTitle')}</h3>
      <div className={styles.fieldGroup}>
        <label htmlFor="rescue-link" className={styles.label}>
          {t(lang, 'rescueSummaryLinkLabel')}
        </label>
        <input
          id="rescue-link"
          type="text"
          className={styles.input}
          value={state.linkOrPhone}
          onChange={(e) =>
            setState((p) => ({ ...p, linkOrPhone: e.target.value }))
          }
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="rescue-amount" className={styles.label}>
          {t(lang, 'rescueSummaryAmountLabel')}
        </label>
        <input
          id="rescue-amount"
          type="text"
          inputMode="numeric"
          className={styles.input}
          value={state.amount}
          onChange={(e) => setState((p) => ({ ...p, amount: e.target.value }))}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="rescue-txn" className={styles.label}>
          {t(lang, 'rescueSummaryTxnLabel')}
        </label>
        <input
          id="rescue-txn"
          type="text"
          className={styles.input}
          value={state.txnId}
          onChange={(e) => setState((p) => ({ ...p, txnId: e.target.value }))}
        />
      </div>

      <pre className={styles.summaryPreview} data-testid="complaint-summary">
        {complaintSummary}
      </pre>

      <div className={styles.ctaRow}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleCopySummary}
        >
          {copied ? t(lang, 'rescueCopied') : t(lang, 'rescueCopySummary')}
        </button>
      </div>
    </section>
  );
}
