import React from 'react';
import {
  LEARN_PATTERNS,
  VERBATIM_PROBLEM_STATEMENT,
} from '../data/learnPatterns';
import type { Language, SchemeEntry } from '../engine/types';
import { t } from '../i18n';
import { PatternIllustration } from './HandDrawnSvgs';
import styles from './Pages.module.css';

interface LearnViewProps {
  lang: Language;
  schemes: SchemeEntry[];
}

export function LearnView({ lang, schemes }: LearnViewProps) {
  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'learnTitle')}</h2>
        <p className={styles.pageSubtitle}>{t(lang, 'learnSubtitle')}</p>
      </div>

      {/* Verbatim problem statement from Section 1 */}
      <div className={styles.problemBlock}>
        <h3 className={styles.sectionTitleFirst}>{t(lang, 'learnProblemTitle')}</h3>
        <p className={styles.problemQuote} lang="en">
          {VERBATIM_PROBLEM_STATEMENT}
        </p>
      </div>

      {/* Six hand-drawn scam pattern panels in asymmetric layout */}
      <div className={styles.patternGrid}>
        {LEARN_PATTERNS.map((pattern) => (
          <article key={pattern.id} className={styles.patternPanel}>
            <div className={styles.patternTop}>
              <div>
                <div className={styles.patternKicker}>
                  {t(lang, 'learnPatternLabel')} {pattern.number}
                </div>
                <h3 className={styles.patternTitle}>{pattern.title[lang]}</h3>
              </div>
              <PatternIllustration kind={pattern.illustrationKey} />
            </div>

            <div>
              <div className={styles.patternFieldLabel}>
                {t(lang, 'learnHowItLooks')}
              </div>
              <p>{pattern.howItLooks[lang]}</p>
            </div>

            <div>
              <div className={styles.patternFieldLabel}>
                {t(lang, 'learnRedFlag')}
              </div>
              <p>{pattern.redFlag[lang]}</p>
            </div>

            <div>
              <div className={styles.patternFieldLabel}>
                {t(lang, 'learnSafeAction')}
              </div>
              <p>{pattern.safeAction[lang]}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Sources table with last-verified dates */}
      <h3 className={styles.sectionTitle}>{t(lang, 'learnSourcesTitle')}</h3>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>{t(lang, 'tableSchemeCol')}</th>
            <th>{t(lang, 'tableChannelCol')}</th>
            <th>{t(lang, 'lastVerifiedLabel')}</th>
          </tr>
        </thead>
        <tbody>
          {schemes.map((scheme) => (
            <tr key={scheme.id}>
              <td>{lang === 'te' ? scheme.nameTe : scheme.nameEn}</td>
              <td>
                {scheme.officialChannels.map((ch, idx) => (
                  <div key={idx} className="urlBreak">
                    {ch.type === 'web' ? (
                      <a href={ch.value} target="_blank" rel="noopener noreferrer">
                        {ch.value}
                      </a>
                    ) : (
                      <span className="mono">{ch.value}</span>
                    )}
                  </div>
                ))}
              </td>
              <td>
                <span className="mono">
                  {scheme.officialChannels[0]?.verifiedOn ||
                    t(lang, 'unconfirmedRegistryNote')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
