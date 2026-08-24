import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { STORAGE_KEYS } from '../constants/storage';
import { DEFAULT_LANGUAGE, LANGUAGESUPPORT } from '../constants/languages';
import ViTranslation from './languages/vi';
import EnTranslation from './languages/en';

let initialLanguage: string = DEFAULT_LANGUAGE;
try {
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  if (stored === LANGUAGESUPPORT.en || stored === LANGUAGESUPPORT.vi) {
    initialLanguage = stored;
  }
} catch (e) {
  console.error('Error reading language from storage:', e);
}

const resources = {
  vi: {
    translation: ViTranslation,
  },
  en: {
    translation: EnTranslation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
      prefix: '{',
      suffix: '}',
    },
  });

export default i18n;
