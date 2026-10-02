import { useTranslation } from 'react-i18next';
const en = {
  lessons: 'Lessons', chapters: 'Chapters', assessed: 'Assessed', unassessed: 'Not yet assessed', correctRecall: 'Correct recall', missedRecall: 'Needs practice',
  dueToday: 'Due today, not overdue', examTarget: 'Pass requirement for each attempt', attemptOrder: 'Attempts run oldest to newest, left to right. Tap a score for details.',
  topics: 'Topic performance', topicsHint: 'Latest objective answers, last 30 days. Counts show assessed concepts out of available concepts.', showAll: 'Show all topics', showLess: 'Show fewer topics',
  details: 'Details and definitions', chapterDetails: 'Lessons and chapter validation', activity: 'Study activity',
  recordingEmpty: 'Detailed recording starts with new responses. Older exam and quiz scores remain saved.',
};
const fr: typeof en = {
  lessons: 'Leçons', chapters: 'Chapitres', assessed: 'Évalués', unassessed: 'Pas encore évalués', correctRecall: 'Rappel correct', missedRecall: 'À retravailler',
  dueToday: 'À revoir aujourd’hui, sans retard', examTarget: 'Seuil de réussite de chaque tentative', attemptOrder: 'Tentatives de la plus ancienne à la plus récente, de gauche à droite. Touchez un résultat pour le détail.',
  topics: 'Résultats par chapitre', topicsHint: 'Dernières réponses objectives, sur 30 jours. Les nombres indiquent les concepts évalués sur les concepts disponibles.', showAll: 'Voir tous les chapitres', showLess: 'Voir moins de chapitres',
  details: 'Détails et définitions', chapterDetails: 'Leçons et validation des chapitres', activity: 'Activité d’étude',
  recordingEmpty: 'L’enregistrement détaillé commence avec les nouvelles réponses. Les anciens résultats d’examens et de quiz restent conservés.',
};
export function useProgressChartText(): typeof en {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? fr : en;
}
