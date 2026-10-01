import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '../types';
import { en } from './en'; import { examEn, examFr } from './exam'; import { focusEn, focusFr } from './focus'; import { fr } from './fr'; import { glossaryEn, glossaryFr } from './glossary'; import { homeEn, homeFr } from './home'; import { learnEn, learnFr } from './learn'; import { lessonEn, lessonFr } from './lesson'; import { moreEn, moreFr } from './more'; import { remindersEn, remindersFr } from './reminders'; import { screensEn, screensFr } from './screens'; import { settingsUxEn, settingsUxFr } from './settingsUx'; import { uiEn, uiFr } from './ui';
export function deviceLang(): Lang { return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en'; }
if (!i18n.isInitialized) { void i18n.use(initReactI18next).init({ resources: { en: { translation: { ...en, ...learnEn, ...screensEn, ...uiEn, ...examEn, ...homeEn, ...moreEn, ...lessonEn, ...glossaryEn, ...remindersEn, ...focusEn, ...settingsUxEn } }, fr: { translation: { ...fr, ...learnFr, ...screensFr, ...uiFr, ...examFr, ...homeFr, ...moreFr, ...lessonFr, ...glossaryFr, ...remindersFr, ...focusFr, ...settingsUxFr } } }, lng: deviceLang(), fallbackLng: 'en', interpolation: { escapeValue: false } }); }
export default i18n;
