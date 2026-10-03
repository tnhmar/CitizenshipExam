import { useTranslation } from 'react-i18next';
const en = {
  title: 'Overview', course: 'Course completion', lessons: 'Lessons completed', chapters: 'Chapters completed', noCourse: 'No lessons available',
  mocks: 'Recent timed mocks', average: 'Average', latest: 'Latest', mockWindow: 'Up to 5 · 30 days', noMocks: 'No recent timed mock yet.', oneMock: 'One attempt recorded; no trend yet.', chooseExam: 'Choose a mock', passLine: 'Dashed: pass mark',
  practice: 'Recent practice', practiceWindow: 'Last 30 days · distinct concepts', notAssessed: 'Not assessed yet', concepts: 'concepts assessed',
  viewProgress: 'View progress', separate: 'Course completion and performance are separate indicators, not a prediction of passing.',
};
const fr: typeof en = {
  title: 'Vue d’ensemble', course: 'Progression du cours', lessons: 'Leçons terminées', chapters: 'Chapitres terminés', noCourse: 'Aucune leçon disponible',
  mocks: 'Examens blancs récents', average: 'Moyenne', latest: 'Dernier', mockWindow: '5 max · 30 jours', noMocks: 'Aucun examen blanc chronométré récent.', oneMock: 'Une tentative enregistrée ; pas encore de tendance.', chooseExam: 'Choisir un examen blanc', passLine: 'Pointillés : seuil',
  practice: 'Entraînement récent', practiceWindow: '30 derniers jours · concepts distincts', notAssessed: 'Pas encore évalué', concepts: 'concepts évalués',
  viewProgress: 'Voir les progrès', separate: 'Progression du cours et résultats sont distincts, sans prédiction de réussite.',
};
export function useHomeOverviewText(): typeof en { const { i18n } = useTranslation(); return i18n.language.startsWith('fr') ? fr : en; }
