import { SUPPORTED_LANGUAGES, type Language, type Verdict } from '../engine/types';

const HISTORY_KEY = 'nm_local_history_v1';
const RESCUE_KEY = 'nm_rescue_state_v1';
const LANG_KEY = 'nm_lang_v1';
const MAX_HISTORY = 30;

export interface LocalHistoryItem {
  id: string;
  checkedAt: string;
  verdict: Verdict;
  domain: string;
  snippet: string;
  inputText: string;
}

export interface RescuePersistedState {
  actions: string[];
  startedAtMs: number | null;
  lastElapsedSec: number;
  linkOrPhone: string;
  amount: string;
  txnId: string;
}

export function loadLanguage(): Language {
  try {
    const val = localStorage.getItem(LANG_KEY);
    if (val && (SUPPORTED_LANGUAGES as readonly string[]).includes(val)) {
      return val as Language;
    }
    return 'te';
  } catch {
    return 'te';
  }
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore storage quota errors
  }
}

export function loadHistory(): LocalHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendHistory(item: Omit<LocalHistoryItem, 'id'>): LocalHistoryItem[] {
  const existing = loadHistory();
  const next: LocalHistoryItem[] = [
    {
      ...item,
      id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    },
    ...existing,
  ].slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

export function loadRescueState(): RescuePersistedState {
  const empty: RescuePersistedState = {
    actions: [],
    startedAtMs: null,
    lastElapsedSec: 0,
    linkOrPhone: '',
    amount: '',
    txnId: '',
  };
  try {
    const raw = localStorage.getItem(RESCUE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<RescuePersistedState>;
    return {
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      startedAtMs:
        typeof parsed.startedAtMs === 'number' ? parsed.startedAtMs : null,
      lastElapsedSec:
        typeof parsed.lastElapsedSec === 'number' && parsed.lastElapsedSec >= 0
          ? parsed.lastElapsedSec
          : 0,
      linkOrPhone: typeof parsed.linkOrPhone === 'string' ? parsed.linkOrPhone : '',
      amount: typeof parsed.amount === 'string' ? parsed.amount : '',
      txnId: typeof parsed.txnId === 'string' ? parsed.txnId : '',
    };
  } catch {
    return empty;
  }
}

export function saveRescueState(state: RescuePersistedState): void {
  try {
    localStorage.setItem(RESCUE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Computes elapsed minutes robustly even if the device wall clock shifts backward.
 */
export function computeRobustElapsedSec(
  startedAtMs: number | null,
  previousElapsedSec: number,
  nowMs: number = Date.now(),
): number {
  if (!startedAtMs) return 0;
  const diffSec = Math.floor((nowMs - startedAtMs) / 1000);
  if (diffSec < 0) {
    // Device clock shifted backwards; preserve monotonic elapsed seconds
    return previousElapsedSec;
  }
  // Cap sudden huge forward clock jumps (> 7 days) cleanly
  if (diffSec > 7 * 24 * 3600) {
    return previousElapsedSec;
  }
  return Math.max(diffSec, previousElapsedSec);
}
