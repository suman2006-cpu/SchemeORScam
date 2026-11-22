import assert from 'node:assert/strict';
import test from 'node:test';
import { LANGUAGE_META, SUPPORTED_LANGUAGES } from '../engine/types';
import { I18N_DICTS } from './index';

test('All 6 supported language dictionaries (en, te, hi, ta, ml, kn) have identical key sets and non-empty values', () => {
  assert.deepEqual(
    [...SUPPORTED_LANGUAGES],
    ['en', 'te', 'hi', 'ta', 'ml', 'kn'],
    'Exactly 6 languages must be supported',
  );

  const enKeys = Object.keys(I18N_DICTS.en).sort();

  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(
      LANGUAGE_META[lang].locale.endsWith('-IN'),
      `Locale for ${lang} must target India (*-IN)`,
    );
    const dict = I18N_DICTS[lang] as Record<string, string>;
    const keys = Object.keys(dict).sort();
    const missing = enKeys.filter((k) => !(k in dict));
    const extra = keys.filter((k) => !(k in I18N_DICTS.en));

    assert.deepEqual(
      missing,
      [],
      `Keys missing in ${lang}.json: ${missing.join(', ')}`,
    );
    assert.deepEqual(
      extra,
      [],
      `Extra keys in ${lang}.json not in en.json: ${extra.join(', ')}`,
    );

    for (const key of enKeys) {
      assert.ok(
        typeof dict[key] === 'string' && dict[key].trim().length > 0,
        `Empty value in ${lang}.json for key ${key}`,
      );
    }
  }
});
