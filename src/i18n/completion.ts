import { useTranslation } from 'react-i18next';
const en = {
  notStarted: 'Not started', inProgress: 'In progress', completed: 'Completed', completedLessons: 'Completed lessons',
  passRule: 'Pass the full quiz with at least 90% to complete this lesson.', markStudied: 'Mark studied',
  noQuiz: 'No quiz is available. After studying the lesson, mark it studied explicitly.',
  unavailable: 'Quiz content is unavailable. This lesson cannot be validated yet.',
  chapterPending: 'Complete every lesson and pass the full chapter quiz with at least 90%.',
  chapterQuizRemaining: 'All lessons completed. Pass the chapter quiz to finish this chapter.',
  chapterPassedPending: 'Chapter quiz passed. Complete the remaining lessons to finish this chapter.',
  noChapterQuiz: 'No chapter quiz is available. Chapter validation is pending quiz coverage.',
  quizPassed: 'Quiz passed (90% required).', quizFailed: 'Below 90%. Study the explanations and retry the full quiz.',
  practiceOnly: 'Missed-question practice does not validate completion. Restart the full quiz to qualify.',
  earned: 'Completion already earned; practice does not remove it.', latest: 'Latest', best: 'Best',
};
const fr: typeof en = {
  notStarted: 'Pas commencé', inProgress: 'En cours', completed: 'Terminé', completedLessons: 'Leçons terminées',
  passRule: 'Réussissez le quiz complet avec au moins 90 % pour terminer cette leçon.', markStudied: 'Marquer comme étudiée',
  noQuiz: 'Aucun quiz disponible. Après avoir étudié la leçon, marquez-la explicitement comme étudiée.',
  unavailable: 'Le contenu du quiz est indisponible. Cette leçon ne peut pas encore être validée.',
  chapterPending: 'Terminez toutes les leçons et réussissez le quiz complet du chapitre avec au moins 90 %.',
  chapterQuizRemaining: 'Toutes les leçons sont terminées. Réussissez le quiz du chapitre pour le terminer.',
  chapterPassedPending: 'Quiz du chapitre réussi. Terminez les leçons restantes pour terminer le chapitre.',
  noChapterQuiz: 'Aucun quiz du chapitre disponible. La validation attend un quiz.',
  quizPassed: 'Quiz réussi (90 % requis).', quizFailed: 'Moins de 90 %. Étudiez les explications et refaites le quiz complet.',
  practiceOnly: 'Refaire uniquement les questions ratées ne valide pas la progression. Recommencez le quiz complet.',
  earned: 'Validation déjà acquise ; un entraînement ne la supprime pas.', latest: 'Dernier résultat', best: 'Meilleur résultat',
};
export function useCompletionText(): typeof en {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? fr : en;
}
