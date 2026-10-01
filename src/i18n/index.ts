import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../types';
import { en } from './en';
import { fr } from './fr';

export function deviceLang(): Lang {
  return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    lng: deviceLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
