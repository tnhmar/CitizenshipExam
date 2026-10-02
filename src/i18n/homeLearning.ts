import { useTranslation } from 'react-i18next';
export const homeLearningEn = {
  completion: 'Course completion', lessonsCompleted: 'Lessons completed', chaptersCompleted: 'Chapters completed',
  validated: 'Quiz-validated lessons', studied: 'Studied without a quiz', inProgress: 'Lessons in progress',
  completionHint: 'Completion records your course progress, not a prediction of passing.',
  recentResults: 'View recent mock results', mocks: 'Recent timed mock exams', average: 'Average score', attempts: 'Attempts in the last 30 days',
  passed: 'Passed', failed: 'Not passed', noMocks: 'No recent timed mock exam evidence yet.',
  mockHint: 'Up to five recent mock attempts. Familiar-bank scores are not a prediction of passing.',
  improvement: 'Change across comparable mocks', noTrend: 'Six same-length recent mocks are needed for a trend.',
  trendHint: 'Latest three versus previous three; percentage points, not percentage growth.',
  points: 'percentage points', examsAction: 'Choose a mock exam', evidence: 'Learning evidence',
  coverage: 'Distinct concepts assessed', practice: 'Recent practice accuracy', recall: 'Delayed review recall',
  noEvidence: 'Not assessed', evidenceHint: 'Recent practice and delayed recall use distinct concepts from recorded objective responses, not flashcard self-ratings.',
  historyEmpty: 'Detailed evidence starts with new recorded responses. Older scores remain saved; response history is not invented.',
  since: 'Detailed recording started', pruned: 'Some older response history was pruned; coverage reflects retained records.',
  recallHint: 'Qualifying reviews at least 24 hours after the previous recorded encounter, within 30 days.',
  details: 'See progress details', next: 'Recommended next step',
  actions: { startLearning: 'Start learning', continueLesson: 'Continue lesson', reviewDue: 'Review due questions', studyTopic: 'Study a topic needing review', finishChapter: 'Open a chapter awaiting validation', takeMock: 'Practise a mock exam', resumeExam: 'Resume your exam' },
};
export const homeLearningFr: typeof homeLearningEn = {
  completion: 'Progression du cours', lessonsCompleted: 'Leçons terminées', chaptersCompleted: 'Chapitres terminés',
  validated: 'Leçons validées par quiz', studied: 'Étudiées sans quiz', inProgress: 'Leçons en cours',
  completionHint: 'La progression indique votre avancée dans le cours, pas une prédiction de réussite.',
  recentResults: 'Voir les résultats récents', mocks: 'Examens blancs chronométrés récents', average: 'Résultat moyen', attempts: 'Tentatives au cours des 30 derniers jours',
  passed: 'Réussi', failed: 'Non réussi', noMocks: 'Aucun résultat récent d’examen blanc chronométré.',
  mockHint: 'Jusqu’à cinq tentatives récentes. Les résultats sur une banque connue ne prédisent pas la réussite.',
  improvement: 'Évolution sur des examens comparables', noTrend: 'Six examens blancs récents de même longueur sont nécessaires.',
  trendHint: 'Trois dernières tentatives contre les trois précédentes ; points de pourcentage, pas croissance en pourcentage.',
  points: 'points de pourcentage', examsAction: 'Choisir un examen blanc', evidence: 'Indicateurs d’apprentissage',
  coverage: 'Concepts distincts évalués', practice: 'Réussite récente en entraînement', recall: 'Rappel lors des révisions différées',
  noEvidence: 'Pas encore évalué', evidenceHint: 'L’entraînement récent et le rappel différé utilisent des concepts distincts et des réponses objectives enregistrées, pas les autoévaluations des flashcards.',
  historyEmpty: 'Les indicateurs détaillés commencent avec les nouvelles réponses enregistrées. Les anciens résultats restent conservés ; aucun historique de réponses n’est inventé.',
  since: 'Début de l’enregistrement détaillé', pruned: 'Une partie des anciennes réponses a été supprimée ; la couverture utilise les données conservées.',
  recallHint: 'Révisions effectuées au moins 24 heures après la précédente rencontre enregistrée, dans les 30 derniers jours.',
  details: 'Voir le détail des progrès', next: 'Prochaine étape recommandée',
  actions: { startLearning: 'Commencer l’apprentissage', continueLesson: 'Continuer la leçon', reviewDue: 'Réviser les questions à revoir', studyTopic: 'Étudier un chapitre à réviser', finishChapter: 'Ouvrir un chapitre à valider', takeMock: 'S’entraîner avec un examen blanc', resumeExam: 'Reprendre votre examen' },
};
export function useHomeLearningText(): typeof homeLearningEn {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? homeLearningFr : homeLearningEn;
}
