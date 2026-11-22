import React, { useState } from 'react';
import type { DistrictItem, Language, RadarCluster } from '../engine/types';
import { t } from '../i18n';
import styles from './Pages.module.css';

interface RadarViewProps {
  lang: Language;
  items: RadarCluster[];
  districts: DistrictItem[];
  onRefresh: () => void;
}

export function RadarView({ lang, items, districts, onRefresh }: RadarViewProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  // Opt-in manual anonymous report form
  const [domain, setDomain] = useState('');
  const [reportDistrict, setReportDistrict] = useState(
    districts[0]?.code ?? 'AP-GNT',
  );
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleItems =
    selectedDistrict === 'ALL'
      ? items
      : items.filter((i) => i.districtCode === selectedDistrict);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !domain.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const cleaned = domain
        .trim()
        .replace(/^https?:\/\//i, '')
        .split('/')[0];
      const res = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrableDomain: cleaned,
          verdict: 'LIKELY_FAKE',
          schemeId: 'unknown',
          actionType: 'other',
          districtCode: reportDistrict,
          consent: true,
        }),
      });
      if (res.ok) {
        setDomain('');
        setConsent(false);
        setFeedback(t(lang, 'radarOptInDone'));
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'radarTitle')}</h2>
        <p className={styles.pageSubtitle}>{t(lang, 'radarSubtitle')}</p>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterField}>
          <label htmlFor="alerts-district-filter" className={styles.label}>
            {t(lang, 'radarFilterLabel')}
          </label>
          <select
            id="alerts-district-filter"
            className={styles.select}
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="ALL">{t(lang, 'radarFilterAll')}</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {lang === 'te' ? `${d.nameTe} (${d.state})` : `${d.nameEn} (${d.state})`}
              </option>
            ))}
          </select>
        </div>

        {visibleItems.some((i) => i.isSample) && (
          <div className={styles.sampleNotice}>{t(lang, 'sampleDataBadge')}</div>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <p>{t(lang, 'radarEmpty')}</p>
      ) : (
        <ol className={styles.radarList}>
          {visibleItems.map((item, idx) => (
            <li
              key={item.id}
              className={`${styles.radarRow} rowStagger`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div>
                <div className={styles.radarMeta}>
                  <strong>
                    {lang === 'te' ? item.districtTe : item.districtEn}
                  </strong>
                  {' / '}
                  <span>{lang === 'te' ? item.schemeTe : item.schemeEn}</span>
                  {item.isSample && (
                    <>
                      {' / '}
                      <span>{t(lang, 'sampleDataBadge')}</span>
                    </>
                  )}
                </div>
                <div className={styles.radarDomain}>{item.registrableDomain}</div>
              </div>

              <div className={styles.dotStripWrap}>
                <div className={styles.radarMeta}>
                  <span className="mono">
                    {t(lang, 'radarCountLabel', { count: item.count })}
                  </span>
                  {' · '}
                  <span>{t(lang, 'radarDaysLabel')}</span>
                </div>
                <div className={styles.dotStrip} aria-label={t(lang, 'radarDaysLabel')}>
                  {item.dailyCounts14d.map((cnt, dIdx) => (
                    <span
                      key={dIdx}
                      className={cnt > 0 ? styles.dotFilled : styles.dotEmpty}
                    />
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Opt-in anonymous submission */}
      <h3 className={styles.sectionTitle}>{t(lang, 'radarOptInHeading')}</h3>
      <p className={styles.pageSubtitle} style={{ marginBottom: '16px' }}>
        {t(lang, 'radarOptInDesc')}
      </p>

      <form onSubmit={handleManualSubmit}>
        <div className={styles.fieldGroup}>
          <label htmlFor="radar-domain-input" className={styles.label}>
            {t(lang, 'radarDomainLabel')}
          </label>
          <input
            id="radar-domain-input"
            type="text"
            className={styles.input}
            placeholder="example-fake-kyc.xyz"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="radar-submit-district" className={styles.label}>
            {t(lang, 'radarOptInDistrictLabel')}
          </label>
          <select
            id="radar-submit-district"
            className={styles.select}
            value={reportDistrict}
            onChange={(e) => setReportDistrict(e.target.value)}
          >
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {lang === 'te' ? `${d.nameTe} (${d.state})` : `${d.nameEn} (${d.state})`}
              </option>
            ))}
          </select>
        </div>

        <label className={styles.choiceRow}>
          <input
            type="checkbox"
            className={styles.choiceCheckbox}
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>{t(lang, 'radarOptInCheckbox')}</span>
        </label>

        <div className={styles.ctaRow}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={!consent || !domain.trim() || submitting}
          >
            {t(lang, 'radarOptInSubmit')}
          </button>
        </div>
        {feedback && <div className={styles.okBox}>{feedback}</div>}
      </form>
    </section>
  );
}
