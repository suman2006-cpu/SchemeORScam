import React from 'react';
import { VERBATIM_PROBLEM_STATEMENT } from '../data/learnPatterns';
import type { Language, SchemeEntry } from '../engine/types';
import { t } from '../i18n';
import styles from './Pages.module.css';

interface AboutViewProps {
  lang: Language;
  schemes: SchemeEntry[];
}

export function AboutView({ lang, schemes }: AboutViewProps) {
  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'aboutTitle')}</h2>
      </div>

      <div className={styles.problemBlock}>
        <h3 className={styles.sectionTitleFirst}>{t(lang, 'learnProblemTitle')}</h3>
        <p className={styles.problemQuote} lang="en">
          {VERBATIM_PROBLEM_STATEMENT}
        </p>
      </div>

      <h3 className={styles.sectionTitle}>{t(lang, 'aboutPrivacyTitle')}</h3>
      <p>{t(lang, 'aboutPrivacyBody')}</p>

      <h3 className={styles.sectionTitle}>{t(lang, 'aboutIndependentTitle')}</h3>
      <p>{t(lang, 'aboutIndependentBody')}</p>

      <h3 className={styles.sectionTitle}>{t(lang, 'learnSourcesTitle')}</h3>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>{t(lang, 'tableSchemeCol')}</th>
            <th>{t(lang, 'tableStatusCol')}</th>
            <th>{t(lang, 'lastVerifiedLabel')}</th>
          </tr>
        </thead>
        <tbody>
          {schemes.map((s) => (
            <tr key={s.id}>
              <td>{lang === 'te' ? s.nameTe : s.nameEn}</td>
              <td className="mono">{s.status}</td>
              <td className="mono">
                {s.officialChannels[0]?.verifiedOn ||
                  t(lang, 'unconfirmedRegistryNote')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
