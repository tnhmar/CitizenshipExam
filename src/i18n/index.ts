import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../types';
import { en } from './en';
import { examEn, examFr } from './exam';
import { fr } from './fr';
import { homeEn, homeFr } from './home';
import { learnEn, learnFr } from './learn';
import { screensEn, screensFr } from './screens';
import { uiEn, uiFr } from './ui';

export function deviceLang(): Lang {
  return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
}

if (!i18n.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: { ...en, ...learnEn, ...screensEn, ...uiEn, ...examEn, ...homeEn } },
      fr: { translation: { ...fr, ...learnFr, ...screensFr, ...uiFr, ...examFr, ...homeFr } },
    },
    lng: deviceLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
