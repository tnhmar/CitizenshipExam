import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../types';
import { en } from './en';
import { fr } from './fr';
import { learnEn, learnFr } from './learn';
import { screensEn, screensFr } from './screens';

export function deviceLang(): Lang {
  return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: { ...en, ...learnEn, ...screensEn } },
      fr: { translation: { ...fr, ...learnFr, ...screensFr } },
    },
    lng: deviceLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
