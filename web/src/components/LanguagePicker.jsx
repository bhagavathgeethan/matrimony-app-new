// Interface-language dropdown. Each language is listed in its own script, with its English name beneath.
import React from 'react';
import { Languages } from 'lucide-react';
import { t, UI_LANGUAGES, getLanguage, setLanguage } from '@shared/i18n';
import { Select } from './Select';

const OPTIONS = UI_LANGUAGES.map(([code, native, english]) => ({ value: code, label: native, hint: code === 'en' ? null : english, lang: code }));

export function LanguagePicker({ dark = false, className }) {
  return (
    <Select
      className={['lang-select', className].filter(Boolean).join(' ')}
      size="sm"
      tone={dark ? 'dark' : undefined}
      icon={Languages}
      menuWidth={210}
      aria-label={t('Choose your language')}
      value={getLanguage()}
      onChange={setLanguage}
      options={OPTIONS}
    />
  );
}
