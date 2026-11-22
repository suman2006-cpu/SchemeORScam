import React from 'react';
import { LANGUAGE_META, type Language } from '../engine/types';
import { t } from '../i18n';
import type { LocalHistoryItem } from '../lib/historyStore';
import styles from './Pages.module.css';

interface HistoryViewProps {
  lang: Language;
  items: LocalHistoryItem[];
  onDeleteAll: () => void;
  onRecheck: (text: string) => void;
}

export function HistoryView({
  lang,
  items,
  onDeleteAll,
  onRecheck,
}: HistoryViewProps) {
  const verdictLabel = (v: LocalHistoryItem['verdict']) => {
    if (v === 'OFFICIAL') return t(lang, 'verdictOfficial');
    if (v === 'RECOGNIZED_COMPANY') return t(lang, 'verdictRecognizedCompany');
    if (v === 'LIKELY_FAKE') return t(lang, 'verdictLikelyFake');
    return t(lang, 'verdictNotVerified');
  };

  const verdictClass = (v: LocalHistoryItem['verdict']) => {
    if (v === 'OFFICIAL' || v === 'RECOGNIZED_COMPANY') return styles.verdictWordOk;
    if (v === 'LIKELY_FAKE') return styles.verdictWordBad;
    return styles.verdictWordWarn;
  };

  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'historyTitle')}</h2>
        <p className={styles.pageSubtitle}>{t(lang, 'historySubtitle')}</p>
      </div>

      {items.length === 0 ? (
        <p>{t(lang, 'historyEmpty')}</p>
      ) : (
        <>
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onDeleteAll}
            >
              {t(lang, 'historyDeleteAll')}
            </button>
          </div>

          <div style={{ borderTop: 'var(--border-sheet)' }}>
            {items.map((item) => (
              <div key={item.id} className={styles.historyRow}>
                <div style={{ flex: '1 1 260px' }}>
                  <div className={verdictClass(item.verdict)}>
                    {verdictLabel(item.verdict)}
                  </div>
                  {item.domain && (
                    <div className="mono urlBreak">{item.domain}</div>
                  )}
                  <div className={styles.radarMeta}>{item.snippet}</div>
                  <div className={styles.radarMeta} style={{ fontSize: '14px' }}>
                    {new Date(item.checkedAt).toLocaleString(
                      LANGUAGE_META[lang].locale,
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => onRecheck(item.inputText)}
                >
                  {t(lang, 'historyOpenAgain')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
