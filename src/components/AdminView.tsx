import React, { useEffect, useState } from 'react';
import type { AuditLogEntry, Language, SchemeEntry } from '../engine/types';
import { t } from '../i18n';
import styles from './Pages.module.css';

interface AdminViewProps {
  lang: Language;
  onRegistryUpdated: () => void;
}

export function AdminView({ lang, onRegistryUpdated }: AdminViewProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [schemes, setSchemes] = useState<SchemeEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  // Editor state
  const [editingId, setEditingId] = useState<string>('');
  const [nameEn, setNameEn] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [domainsStr, setDomainsStr] = useState('');
  const [channelValue, setChannelValue] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [verifiedOn, setVerifiedOn] = useState('');
  const [status, setStatus] = useState<'verified' | 'unverified'>('unverified');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const loadAdminData = async () => {
    const res = await fetch('/api/admin/data');
    if (res.ok) {
      const data = (await res.json()) as {
        schemes: SchemeEntry[];
        auditLog: AuditLogEntry[];
      };
      setSchemes(data.schemes);
      setAuditLog(data.auditLog);
    }
  };

  useEffect(() => {
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then(async (data: { authenticated?: boolean }) => {
        if (data.authenticated) {
          setAuthenticated(true);
          await loadAdminData();
        }
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setPassword('');
      await loadAdminData();
    } else {
      setAuthError('Invalid admin password.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setSchemes([]);
    setAuditLog([]);
  };

  const startEdit = (s: SchemeEntry) => {
    setSaveMsg(null);
    setSaveErr(null);
    setEditingId(s.id);
    setNameEn(s.nameEn);
    setNameTe(s.nameTe);
    setDomainsStr(s.officialDomains.join(', '));
    setChannelValue(s.officialChannels[0]?.value ?? '');
    setSourceUrl(s.officialChannels[0]?.sourceUrl ?? '');
    setVerifiedOn(s.officialChannels[0]?.verifiedOn ?? '');
    setStatus(s.status);
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);
    setSaveErr(null);

    const existing = schemes.find((s) => s.id === editingId);
    const payload: SchemeEntry = {
      id: editingId.trim() || `scheme-${Date.now()}`,
      nameEn: nameEn.trim(),
      nameTe: nameTe.trim(),
      aliases: existing?.aliases ?? [nameEn.trim().toLowerCase()],
      level: existing?.level ?? 'central',
      officialDomains: domainsStr
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean),
      officialApps: existing?.officialApps ?? [],
      officialChannels: channelValue.trim()
        ? [
            {
              type: channelValue.startsWith('http') ? 'web' : 'helpline',
              value: channelValue.trim(),
              sourceUrl: sourceUrl.trim(),
              verifiedOn: verifiedOn.trim(),
              noteTe: existing?.officialChannels[0]?.noteTe ?? nameTe.trim(),
              noteEn: existing?.officialChannels[0]?.noteEn ?? nameEn.trim(),
            },
          ]
        : [],
      processes: existing?.processes ?? [],
      status,
      teamVerificationNote:
        status === 'verified'
          ? `Confirmed on ${verifiedOn.trim()}`
          : 'team must confirm against the official page before the demo',
    };

    const res = await fetch('/api/admin/registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSaveMsg('Saved registry entry.');
      await loadAdminData();
      onRegistryUpdated();
    } else {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      setSaveErr(errData.error || 'Could not save entry.');
    }
  };

  if (checkingSession) {
    return (
      <section className={styles.pageSheet}>
        <p>{t(lang, 'btnChecking')}</p>
      </section>
    );
  }

  return (
    <section className={styles.pageSheet}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>{t(lang, 'adminTitle')}</h2>
        <p className={styles.pageSubtitle}>{t(lang, 'adminPublishRule')}</p>
      </div>

      {!authenticated ? (
        <form onSubmit={handleLogin} style={{ maxWidth: '420px' }}>
          <div className={styles.fieldGroup}>
            <label htmlFor="admin-password" className={styles.label}>
              {t(lang, 'adminPasswordLabel')}
            </label>
            <input
              id="admin-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.primaryBtn}>
            {t(lang, 'adminLoginBtn')}
          </button>
          {authError && <div className={styles.errorBox}>{authError}</div>}
        </form>
      ) : (
        <>
          <div className={styles.ctaRow} style={{ marginTop: 0, marginBottom: '24px' }}>
            <a href="/api/admin/radar.csv" className={styles.primaryBtn}>
              {t(lang, 'adminExportCsv')}
            </a>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleLogout}
            >
              {t(lang, 'adminLogoutBtn')}
            </button>
          </div>

          <h3 className={styles.sectionTitleFirst}>
            {t(lang, 'adminRegistryTitle')}
          </h3>

          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.id}</td>
                  <td>{s.nameEn}</td>
                  <td className="mono">{s.status}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => startEdit(s)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {editingId && (
            <form onSubmit={handleSaveScheme} style={{ marginTop: '24px' }}>
              <h4 className={styles.sectionTitleFirst}>
                Editing: <span className="mono">{editingId}</span>
              </h4>
              <div className={styles.fieldGroup}>
                <label htmlFor="adm-name-en" className={styles.label}>
                  Name (English)
                </label>
                <input
                  id="adm-name-en"
                  className={styles.input}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="adm-name-te" className={styles.label}>
                  Name (Telugu)
                </label>
                <input
                  id="adm-name-te"
                  className={styles.input}
                  value={nameTe}
                  onChange={(e) => setNameTe(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="adm-domains" className={styles.label}>
                  Official domains (comma-separated)
                </label>
                <input
                  id="adm-domains"
                  className={styles.input}
                  value={domainsStr}
                  onChange={(e) => setDomainsStr(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="adm-channel" className={styles.label}>
                  Primary official channel (URL or helpline)
                </label>
                <input
                  id="adm-channel"
                  className={styles.input}
                  value={channelValue}
                  onChange={(e) => setChannelValue(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="adm-source" className={styles.label}>
                  sourceUrl (required to publish as verified)
                </label>
                <input
                  id="adm-source"
                  className={styles.input}
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="adm-verified-on" className={styles.label}>
                  verifiedOn YYYY-MM-DD (required to publish as verified)
                </label>
                <input
                  id="adm-verified-on"
                  className={styles.input}
                  value={verifiedOn}
                  onChange={(e) => setVerifiedOn(e.target.value)}
                  placeholder="2026-11-22"
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="adm-status" className={styles.label}>
                  Status
                </label>
                <select
                  id="adm-status"
                  className={styles.select}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'verified' | 'unverified')
                  }
                >
                  <option value="unverified">unverified</option>
                  <option value="verified">verified</option>
                </select>
              </div>
              <button type="submit" className={styles.primaryBtn}>
                Save Registry Entry
              </button>
              {saveMsg && <div className={styles.okBox}>{saveMsg}</div>}
              {saveErr && <div className={styles.errorBox}>{saveErr}</div>}
            </form>
          )}

          <h3 className={styles.sectionTitle}>{t(lang, 'adminAuditTitle')}</h3>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id}>
                  <td className="mono">{entry.at.slice(0, 19)}</td>
                  <td className="mono">{entry.action}</td>
                  <td className="mono">{entry.targetId}</td>
                  <td>{entry.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
