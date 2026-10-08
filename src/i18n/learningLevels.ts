import { useTranslation } from 'react-i18next';
const en = {
  title: 'Quiz success target', discovery: 'Discovery', consolidation: 'Consolidation', mastery: 'Mastery',
  hint: 'Choose the minimum score for full lesson and chapter quizzes. Mock exams are unchanged.',
  history: 'Changes apply to future quiz submissions. Previously earned completions remain valid; saved failures are not automatically reclassified.',
};
const fr: typeof en = {
  title: 'Objectif de réussite des quiz', discovery: 'Découverte', consolidation: 'Consolidation', mastery: 'Maîtrise',
  hint: 'Choisissez le score minimum pour les quiz complets des leçons et des chapitres. Les examens blancs restent inchangés.',
  history: 'Les changements s’appliquent aux prochaines soumissions. Les validations déjà acquises restent valides ; les anciens échecs ne sont pas automatiquement reclassés.',
};
export function useLearningLevelText(): typeof en {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? fr : en;
}
