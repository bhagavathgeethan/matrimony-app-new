// Interface-language dropdown. Each language is listed in its own script, with its English name beneath.
import React from 'react';
import { Languages } from 'lucide-react';
import { SelectField } from './Picker';
import { t, UI_LANGUAGES, getLanguage, setLanguage } from '@shared/i18n';

const OPTIONS = UI_LANGUAGES.map(([code, native, english]) => ({ value: code, label: native, hint: code === 'en' ? null : english, lang: code }));

export const LanguagePicker = ({ dark = false, style }) => (
  <SelectField
    small
    dark={dark}
    icon={Languages}
    style={style}
    title={t('Choose your language')}
    label={t('Language')}
    value={getLanguage()}
    onChange={setLanguage}
    options={OPTIONS}
  />
);
