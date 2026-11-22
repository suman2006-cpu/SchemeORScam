import React from 'react';
import type { Language } from '../engine/types';
import { t } from '../i18n';
import styles from './Pages.module.css';

interface NotFoundViewProps {
  lang: Language;
  onGoHome: () => void;
}

export function NotFoundView({ lang, onGoHome }: NotFoundViewProps) {
  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'notFoundTitle')}</h2>
        <p className={styles.pageSubtitle}>{t(lang, 'notFoundDesc')}</p>
      </div>
      <button type="button" className={styles.primaryBtn} onClick={onGoHome}>
        {t(lang, 'notFoundHomeBtn')}
      </button>
    </section>
  );
}
