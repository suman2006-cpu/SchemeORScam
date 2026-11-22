import React from 'react';
import {
  LANGUAGE_META,
  SUPPORTED_LANGUAGES,
  type Language,
} from '../engine/types';
import { formatDateline, t } from '../i18n';
import {
  AlertsNavGlyph,
  CheckNavGlyph,
  GlobeGlyph,
  RescueNavGlyph,
} from './HandDrawnSvgs';
import { RoughUnderline } from './RoughElements';
import styles from './Shell.module.css';

export type AppRoute =
  | '/'
  | '/rescue'
  | '/alerts'
  | '/learn'
  | '/report'
  | '/history'
  | '/about'
  | '/admin'
  | '/404';

interface ShellProps {
  route: AppRoute;
  lang: Language;
  onNavigate: (route: AppRoute) => void;
  onLangChange: (lang: Language) => void;
  children: React.ReactNode;
}

export function Shell({
  route,
  lang,
  onNavigate,
  onLangChange,
  children,
}: ShellProps) {
  const dateline = formatDateline(lang);

  const primaryItems: Array<{
    route: AppRoute;
    num: string;
    label: string;
    glyph: React.ReactNode;
  }> = [
    {
      route: '/',
      num: '1',
      label: t(lang, 'navCheck'),
      glyph: <CheckNavGlyph size={22} />,
    },
    {
      route: '/rescue',
      num: '2',
      label: t(lang, 'navRescue'),
      glyph: <RescueNavGlyph size={22} />,
    },
    {
      route: '/alerts',
      num: '3',
      label: t(lang, 'navAlerts'),
      glyph: <AlertsNavGlyph size={22} />,
    },
  ];

  const footerItems: Array<{ route: AppRoute; label: string }> = [
    { route: '/learn', label: t(lang, 'navLearn') },
    { route: '/report', label: t(lang, 'navReport') },
    { route: '/history', label: t(lang, 'navHistory') },
    { route: '/about', label: t(lang, 'navAbout') },
    { route: '/admin', label: t(lang, 'navAdmin') },
  ];

  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skipLink">
        {t(lang, 'skipToContent')}
      </a>

      {/* Desktop left rail styled as a numbered book index — NO top navbar */}
      <aside
        className={styles.desktopRail}
        aria-label={t(lang, 'railHeading')}
      >
        <div className={styles.railHeading}>{t(lang, 'railHeading')}</div>
        <nav aria-label={t(lang, 'railHeading')}>
          <ul className={styles.railList}>
            {primaryItems.map((item) => {
              const active = route === item.route;
              return (
                <li key={item.route} className={styles.railItem}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.route)}
                    aria-current={active ? 'page' : undefined}
                    className={`${styles.railBtn} ${active ? styles.railBtnActive : ''}`}
                  >
                    <span className={styles.railNum}>{item.num}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main paper sheet area */}
      <div className={styles.mainColumn}>
        {/* Dateline strip: localized date left, 6-language dropdown right */}
        <div className={styles.dateline}>
          <span className={styles.dateText}>{dateline}</span>
          <div className={styles.langControl}>
            <GlobeGlyph size={20} className={styles.langIcon} />
            <label htmlFor="app-language-select" className={styles.langLabel}>
              {t(lang, 'langSelectLabel')}
            </label>
            <select
              id="app-language-select"
              data-testid="language-select"
              className={styles.langSelect}
              value={lang}
              aria-label={t(lang, 'langSelectLabel')}
              onChange={(e) => onLangChange(e.target.value as Language)}
            >
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code} lang={code}>
                  {LANGUAGE_META[code].nativeName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Masthead wordmark block, left-aligned */}
        <header className={styles.masthead}>
          <a
            href="/"
            className={styles.wordmarkLink}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
          >
            <h1 className={styles.wordmarkTitle}>{t(lang, 'appName')}</h1>
            <RoughUnderline width={320} />
          </a>
          <p className={styles.tagline}>{t(lang, 'tagline')}</p>
        </header>

        <main id="main-content" className={styles.contentArea}>
          {children}
        </main>

        {/* Footer index + independent non-government disclaimer */}
        <footer className={styles.footer}>
          <div className={styles.footerHeading}>{t(lang, 'footerIndexTitle')}</div>
          <ul className={styles.footerLinks}>
            {footerItems.map((item) => (
              <li key={item.route}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  aria-current={route === item.route ? 'page' : undefined}
                  className={`${styles.footerLinkBtn} ${route === item.route ? styles.footerLinkActive : ''}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.disclaimer}>{t(lang, 'footerDisclaimer')}</p>
        </footer>
      </div>

      {/* Mobile bottom 3-tab strip */}
      <nav className={styles.mobileNav} aria-label={t(lang, 'railHeading')}>
        {primaryItems.map((item) => {
          const active = route === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              aria-current={active ? 'page' : undefined}
              className={`${styles.mobileNavBtn} ${active ? styles.mobileNavBtnActive : ''}`}
            >
              {item.glyph}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
