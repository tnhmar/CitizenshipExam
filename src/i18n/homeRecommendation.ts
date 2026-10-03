import { useTranslation } from 'react-i18next';
const en = {
  title: 'Next step', examWarning: 'The exam timer keeps running during another activity.',
  labels: { startLearning: 'Start learning', startChapter: 'Start chapter', startLesson: 'Start lesson', continueLesson: 'Continue lesson', reviewDue: 'Review due questions', studyTopic: 'Review chapter', finishChapter: 'Validate chapter', openChapter: 'Open chapter', openCourse: 'Open course', takeMock: 'Choose a mock', resumeExam: 'Resume exam', continueCourse: 'Continue course', reviewChapter: 'Review this chapter' },
  reasons: { startLearning: 'Next required lesson.', startChapter: 'Begin this chapter.', continueLesson: 'Lesson in progress.', reviewDue: 'Reviews are due now.', studyTopic: 'A focused chapter review.', finishChapter: 'Lessons complete · Chapter quiz pending.', takeMock: 'Practise under timed conditions.', resumeExam: 'Exam in progress · Timer running.', quizUnavailable: 'Quiz unavailable · Open chapter details.', contentUnavailable: 'This content is unavailable · Open the course or exam list.' },
};
const fr: typeof en = {
  title: 'Prochaine étape', examWarning: 'Le minuteur de l’examen continue pendant une autre activité.',
  labels: { startLearning: 'Commencer l’apprentissage', startChapter: 'Commencer le chapitre', startLesson: 'Commencer la leçon', continueLesson: 'Continuer la leçon', reviewDue: 'Effectuer les révisions', studyTopic: 'Réviser le chapitre', finishChapter: 'Valider le chapitre', openChapter: 'Ouvrir le chapitre', openCourse: 'Ouvrir le cours', takeMock: 'Choisir un examen blanc', resumeExam: 'Reprendre l’examen', continueCourse: 'Continuer le cours', reviewChapter: 'Réviser ce chapitre' },
  reasons: { startLearning: 'Prochaine leçon requise.', startChapter: 'Commencez ce chapitre.', continueLesson: 'Leçon en cours.', reviewDue: 'Des révisions sont à effectuer.', studyTopic: 'Révision ciblée du chapitre.', finishChapter: 'Leçons terminées · Quiz du chapitre à valider.', takeMock: 'Entraînement chronométré.', resumeExam: 'Examen en cours · Minuteur actif.', quizUnavailable: 'Quiz indisponible · Ouvrez le chapitre.', contentUnavailable: 'Contenu indisponible · Ouvrez le cours ou la liste des examens.' },
};
export function useHomeRecommendationText(): typeof en { const { i18n } = useTranslation(); return i18n.language.startsWith('fr') ? fr : en; }
