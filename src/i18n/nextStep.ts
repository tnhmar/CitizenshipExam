import { useTranslation } from 'react-i18next';
const en = {
  openChapter: 'Open chapter', quizUnavailable: 'The chapter quiz is unavailable. Open the chapter to see the remaining validation requirement.',
  startChapter: 'Start chapter', startLesson: 'Start lesson', finishChapter: 'Validate chapter',
  continueCourse: 'Continue course instead', reviewChapter: 'Review this chapter',
  examWarning: 'The exam timer keeps running if you choose another activity.',
  reasons: {
    resumeExam: 'Your exam is still in progress and time remains. Resume it first.',
    reviewDue: 'Reviews are due now. Revisit them before continuing the course.',
    finishChapter: 'All lessons are complete. Pass the chapter quiz to finish this chapter before moving on.',
    studyTopic: 'Open this chapter and review its lessons and explanations.',
    continueLesson: 'Continue your unfinished lesson in the current chapter.',
    startLearning: 'Start the next required lesson in course order.',
    takeMock: 'Your chapters are complete. Choose a mock exam for timed practice.',
  },
};
const fr: typeof en = {
  openChapter: 'Ouvrir le chapitre', quizUnavailable: 'Le quiz du chapitre est indisponible. Ouvrez le chapitre pour voir la validation encore requise.',
  startChapter: 'Commencer le chapitre', startLesson: 'Commencer la leçon', finishChapter: 'Valider le chapitre',
  continueCourse: 'Continuer le cours à la place', reviewChapter: 'Réviser ce chapitre',
  examWarning: 'Le minuteur de l’examen continue si vous choisissez une autre activité.',
  reasons: {
    resumeExam: 'Votre examen est en cours et il reste du temps. Reprenez-le en priorité.',
    reviewDue: 'Des révisions sont à effectuer maintenant, avant de poursuivre le cours.',
    finishChapter: 'Toutes les leçons sont terminées. Réussissez le quiz du chapitre avant de passer au suivant.',
    studyTopic: 'Ouvrez ce chapitre et révisez ses leçons et explications.',
    continueLesson: 'Reprenez votre leçon inachevée dans le chapitre actuel.',
    startLearning: 'Commencez la prochaine leçon requise dans l’ordre du cours.',
    takeMock: 'Vos chapitres sont terminés. Choisissez un examen blanc chronométré.',
  },
};
export function useNextStepText(): typeof en {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? fr : en;
}
