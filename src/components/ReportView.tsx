import React, { useState } from 'react';
import { LANGUAGE_META, type Language } from '../engine/types';
import { t } from '../i18n';
import { PhoneGlyph } from './HandDrawnSvgs';
import styles from './Pages.module.css';

interface ReportViewProps {
  lang: Language;
}

export function ReportView({ lang }: ReportViewProps) {
  const [linkText, setLinkText] = useState('');
  const [phoneText, setPhoneText] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const summary = [
    `Date/Time: ${new Date().toLocaleString(LANGUAGE_META[lang].locale)}`,
    `Suspicious link: ${linkText.trim() || '(none)'}`,
    `Caller / sender number: ${phoneText.trim() || '(none)'}`,
    `Details: ${notes.trim() || '(none)'}`,
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'reportTitle')}</h2>
        <p className={styles.pageSubtitle}>{t(lang, 'reportSubtitle')}</p>
      </div>

      <div className={styles.ctaRow} style={{ marginTop: 0 }}>
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
        <a
          href="https://sancharsaathi.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.secondaryBtn}
        >
          {t(lang, 'reportChakshuBtn')}
        </a>
      </div>

      <ol className={styles.orderedList} style={{ marginTop: '24px' }}>
        <li className={styles.orderedRow}>
          <span className={styles.rowNumber}>1.</span>
          <div>
            <strong>1930 / cybercrime.gov.in</strong>
            <div>{t(lang, 'reportCybercrimeDesc')}</div>
          </div>
        </li>
        <li className={styles.orderedRow}>
          <span className={styles.rowNumber}>2.</span>
          <div>
            <strong>sancharsaathi.gov.in (Chakshu)</strong>
            <div>{t(lang, 'reportChakshuDesc')}</div>
          </div>
        </li>
      </ol>

      <h3 className={styles.sectionTitle}>{t(lang, 'rescueSummaryTitle')}</h3>
      <div className={styles.fieldGroup}>
        <label htmlFor="report-link" className={styles.label}>
          {t(lang, 'rescueSummaryLinkLabel')}
        </label>
        <input
          id="report-link"
          type="text"
          className={styles.input}
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="report-phone" className={styles.label}>
          {t(lang, 'reportSenderPhoneLabel')}
        </label>
        <input
          id="report-phone"
          type="text"
          className={styles.input}
          value={phoneText}
          onChange={(e) => setPhoneText(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="report-notes" className={styles.label}>
          {t(lang, 'reportExtraDetailsLabel')}
        </label>
        <textarea
          id="report-notes"
          className={styles.textarea}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <pre className={styles.summaryPreview}>{summary}</pre>
      <div className={styles.ctaRow}>
        <button type="button" className={styles.primaryBtn} onClick={handleCopy}>
          {copied ? t(lang, 'rescueCopied') : t(lang, 'rescueCopySummary')}
        </button>
      </div>
    </section>
  );
}
