import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AboutView } from './components/AboutView';
import { AdminView } from './components/AdminView';
import { CheckView } from './components/CheckView';
import { HistoryView } from './components/HistoryView';
import { LearnView } from './components/LearnView';
import { NotFoundView } from './components/NotFoundView';
import { RadarView } from './components/RadarView';
import { ReportView } from './components/ReportView';
import { RescueView } from './components/RescueView';
import { ResultView } from './components/ResultView';
import { ShareCardModal } from './components/ShareCardModal';
import { Shell, type AppRoute } from './components/Shell';
import districtsData from './data/districts.json';
import { RADAR_DEMO_SEED } from './data/radarDemoSeed';
import { REGISTRY_SEED } from './data/registrySeed';
import { evaluateMessageAndLinks } from './engine/messageEngine';
import type {
  CheckResult,
  DistrictItem,
  Language,
  RadarCluster,
  SchemeEntry,
} from './engine/types';
import { t } from './i18n';
import {
  appendHistory,
  clearHistory,
  loadHistory,
  loadLanguage,
  saveLanguage,
  type LocalHistoryItem,
} from './lib/historyStore';

const KNOWN_ROUTES: AppRoute[] = [
  '/',
  '/rescue',
  '/alerts',
  '/learn',
  '/report',
  '/history',
  '/about',
  '/admin',
];

function resolvePathToRoute(pathname: string): AppRoute {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/check') return '/';
  if (KNOWN_ROUTES.includes(normalized as AppRoute)) {
    return normalized as AppRoute;
  }
  return '/404';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    resolvePathToRoute(window.location.pathname),
  );
  const [lang, setLang] = useState<Language>(() => loadLanguage());
  const [inputText, setInputText] = useState('');
  const [checking, setChecking] = useState(false);
  const [activeResult, setActiveResult] = useState<CheckResult | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [rescuePrefillLink, setRescuePrefillLink] = useState<string>('');

  const [radarItems, setRadarItems] = useState<RadarCluster[]>(RADAR_DEMO_SEED);
  const [districts, setDistricts] = useState<DistrictItem[]>(
    districtsData as DistrictItem[],
  );
  const [schemes, setSchemes] = useState<SchemeEntry[]>(REGISTRY_SEED);
  const [historyItems, setHistoryItems] = useState<LocalHistoryItem[]>(() =>
    loadHistory(),
  );

  // Guard so Web Share Target (/check?text=&url=&title=) runs ONCE and never loops
  const shareTargetHandledRef = useRef(false);

  // Sync <html lang> attribute and document title with selected language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${t(lang, 'appName')} — ${t(lang, 'tagline')}`;
    saveLanguage(lang);
  }, [lang]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const onPop = () => {
      setRoute(resolvePathToRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    if (window.location.pathname !== nextRoute) {
      window.history.pushState({}, '', nextRoute);
    }
    window.scrollTo({ top: 0 });
  }, []);

  const fetchRadar = useCallback(async () => {
    try {
      const res = await fetch('/api/radar');
      if (res.ok) {
        const data = (await res.json()) as {
          items?: RadarCluster[];
          districts?: DistrictItem[];
        };
        if (Array.isArray(data.items)) setRadarItems(data.items);
        if (Array.isArray(data.districts) && data.districts.length > 0) {
          setDistricts(data.districts);
        }
      }
    } catch {
      // Keep local fallback seed when offline
    }
  }, []);

  const fetchRegistry = useCallback(async () => {
    try {
      const res = await fetch('/api/registry');
      if (res.ok) {
        const data = (await res.json()) as { schemes?: SchemeEntry[] };
        if (Array.isArray(data.schemes) && data.schemes.length > 0) {
          setSchemes(data.schemes);
        }
      }
    } catch {
      // Keep local seed when offline
    }
  }, []);

  useEffect(() => {
    fetchRadar();
    fetchRegistry();
  }, [fetchRadar, fetchRegistry]);

  const runCheck = useCallback(
    async (textToCheck: string) => {
      const trimmed = textToCheck.trim();
      if (!trimmed) return;
      setChecking(true);
      try {
        const res = await fetch('/api/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed, lang }),
        });

        let result: CheckResult;
        if (res.ok) {
          result = (await res.json()) as CheckResult;
        } else {
          // F15 Resilience: client-side deterministic fallback if server is unreachable/offline
          result = evaluateMessageAndLinks({
            rawText: trimmed,
            registry: schemes,
            engineMode: 'rules-only',
            targetLang: lang,
          });
        }

        setActiveResult(result);
        const updatedHistory = appendHistory({
          checkedAt: result.checkedAt,
          verdict: result.verdict,
          domain: result.destination?.registrableDomain ?? '',
          snippet: trimmed.slice(0, 120),
          inputText: trimmed,
        });
        setHistoryItems(updatedHistory);
      } catch {
        // Offline deterministic fallback
        const fallback = evaluateMessageAndLinks({
          rawText: trimmed,
          registry: schemes,
          engineMode: 'rules-only',
          targetLang: lang,
        });
        setActiveResult(fallback);
        const updatedHistory = appendHistory({
          checkedAt: fallback.checkedAt,
          verdict: fallback.verdict,
          domain: fallback.destination?.registrableDomain ?? '',
          snippet: trimmed.slice(0, 120),
          inputText: trimmed,
        });
        setHistoryItems(updatedHistory);
      } finally {
        setChecking(false);
      }
    },
    [lang, schemes],
  );

  // Handle Android Web Share Target (/check?text=...&url=...&title=...) ONCE without looping
  useEffect(() => {
    if (shareTargetHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sharedParts = [
      params.get('title')?.trim(),
      params.get('text')?.trim(),
      params.get('url')?.trim(),
    ].filter(Boolean);

    if (sharedParts.length > 0) {
      shareTargetHandledRef.current = true;
      const combined = sharedParts.join(' ');
      setInputText(combined);
      setRoute('/');
      window.history.replaceState({}, '', '/');
      void runCheck(combined);
    }
  }, [runCheck]);

  const handleAlreadyClicked = (suspiciousLink: string) => {
    setRescuePrefillLink(suspiciousLink);
    navigate('/rescue');
  };

  const handleHistoryRecheck = (text: string) => {
    setInputText(text);
    setActiveResult(null);
    navigate('/');
    void runCheck(text);
  };

  const handleDeleteAllHistory = () => {
    clearHistory();
    setHistoryItems([]);
  };

  return (
    <Shell
      route={route}
      lang={lang}
      onNavigate={(r) => {
        if (r === '/' && route === '/') {
          setActiveResult(null);
        }
        navigate(r);
      }}
      onLangChange={setLang}
    >
      {route === '/' && (
        <CheckView
          lang={lang}
          inputText={inputText}
          onInputChange={setInputText}
          onCheckSubmit={runCheck}
          checking={checking}
          radarItems={radarItems}
          onOpenAlerts={() => navigate('/alerts')}
          activeResult={activeResult}
          resultNode={
            activeResult ? (
              <ResultView
                lang={lang}
                result={activeResult}
                districts={districts}
                onCheckAnother={() => {
                  setActiveResult(null);
                  setInputText('');
                }}
                onAlreadyClicked={handleAlreadyClicked}
                onOpenShareCard={() => setShareModalOpen(true)}
                onRadarSubmitted={fetchRadar}
              />
            ) : null
          }
        />
      )}

      {route === '/rescue' && (
        <RescueView lang={lang} prefillLink={rescuePrefillLink} />
      )}

      {route === '/alerts' && (
        <RadarView
          lang={lang}
          items={radarItems}
          districts={districts}
          onRefresh={fetchRadar}
        />
      )}

      {route === '/learn' && <LearnView lang={lang} schemes={schemes} />}

      {route === '/report' && <ReportView lang={lang} />}

      {route === '/history' && (
        <HistoryView
          lang={lang}
          items={historyItems}
          onDeleteAll={handleDeleteAllHistory}
          onRecheck={handleHistoryRecheck}
        />
      )}

      {route === '/about' && <AboutView lang={lang} schemes={schemes} />}

      {route === '/admin' && (
        <AdminView lang={lang} onRegistryUpdated={fetchRegistry} />
      )}

      {route === '/404' && (
        <NotFoundView lang={lang} onGoHome={() => navigate('/')} />
      )}

      {shareModalOpen && activeResult && (
        <ShareCardModal
          lang={lang}
          result={activeResult}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </Shell>
  );
}
