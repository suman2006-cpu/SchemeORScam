import { LANGUAGE_META, type Language } from '../engine/types';
import en from './en.json';
import hi from './hi.json';
import kn from './kn.json';
import ml from './ml.json';
import ta from './ta.json';
import te from './te.json';

export type TranslationKey = Exclude<keyof typeof en, '_reviewNote'>;

const DICTS: Record<Language, Record<string, string>> = {
  en,
  te,
  hi,
  ta,
  ml,
  kn,
};

export function t(
  lang: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[lang] ?? DICTS.en;
  let template = dict[key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return template;
}

const TELUGU_MONTHS = [
  'జనవరి',
  'ఫిబ్రవరి',
  'మార్చి',
  'ఏప్రిల్',
  'మే',
  'జూన్',
  'జూలై',
  'ఆగస్టు',
  'సెప్టెంబర్',
  'అక్టోబర్',
  'నవంబర్',
  'డిసెంబర్',
];

const TELUGU_WEEKDAYS = [
  'ఆదివారం',
  'సోమవారం',
  'మంగళవారం',
  'బుధవారం',
  'గురువారం',
  'శుక్రవారం',
  'శనివారం',
];

export function formatDateline(lang: Language, date: Date = new Date()): string {
  if (lang === 'te') {
    const weekday = TELUGU_WEEKDAYS[date.getDay()];
    const day = date.getDate();
    const month = TELUGU_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  }
  const locale = LANGUAGE_META[lang]?.locale ?? 'en-IN';
  try {
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

export const I18N_DICTS: Record<Language, Record<string, string>> = {
  en,
  te,
  hi,
  ta,
  ml,
  kn,
};
