import { useTranslation } from 'react-i18next';
import { homeLearningEn, homeLearningFr } from './homeLearning';
const extraEn = {
  lessonStatuses: { notStarted: 'Not started', inProgress: 'In progress', completed: 'Completed' },
  topicLabels: { notAssessed: 'Not assessed', limitedEvidence: 'Limited evidence', needsReview: 'Needs review', learning: 'Learning', strongEvidence: 'Strong recent evidence' },
  chapters: 'Chapter details', lessonCoverage: 'Completed lesson coverage', latestQuiz: 'Latest quiz', bestQuiz: 'Best quiz',
  quizPassed: 'Quiz passed', quizFailed: 'Quiz below 90%', validationEarned: 'Course validation earned',
  chapterQuizPending: 'Complete the remaining lessons and pass the chapter quiz at 90%.',
  chapterQuizRemaining: 'Lessons completed; chapter quiz validation is still required.',
  noChapterQuiz: 'No chapter quiz is available. Chapter validation is pending quiz coverage.',
  noQuizResult: 'No full quiz result saved', contentUnavailable: 'Lesson content unavailable', openChapter: 'Open chapter',
  topicEvidence: 'Recent topic evidence', topicHint: 'Last 30 days: latest eligible objective response per distinct concept. Completion and current performance are separate.',
  topicRule: 'Labels are product heuristics, not permanent mastery. Strong evidence needs at least five concepts, 90% accuracy, 60% topic coverage, two assessment dates and no reported guessing in the latest responses.',
  topicCoverage: 'Topic concepts assessed', assessmentDays: 'Assessment dates', lastAssessed: 'Latest objective response',
  focus: 'Topics needing review', focusEmpty: 'No topic meets the needs-review evidence rule yet. This does not mean every topic is strong.',
  coverageHint: 'Distinct concepts from native lesson questions; repeated variants do not increase coverage. Only retained objective first responses count.',
  recallEvidenceHint: 'No qualifying delayed review means not assessed, not a 0% recall score.',
  reviewWorkload: 'Review workload', due: 'Due now', overdue: 'Overdue from before today', noDue: 'No reviews are due now. This is a schedule status, not a mastery claim.',
  reviewAction: 'Open reviews', overdueHint: 'Overdue means scheduled before today’s local midnight. Due counts still belong to the current course.',
  history: 'Saved exam history', historyEmpty: 'No finished exam results saved yet.',
  historyHint: 'Latest eight finished attempts, including mock and practice exams. Each score and pass mark uses that attempt’s actual length.',
  chartLegend: 'Green passed; red did not pass. Tap a bar to open the result.',
  examRuleHint: 'Exam pass rules are separate from the 90% course-validation rule.',
  bestExam: 'Best saved exam (all modes)', finishedExams: 'Finished exams saved', passRequired: 'Correct answers required',
  historicMisses: 'Historical misses', historicHint: 'Past lapses, not a current mastery measurement.', noHistoricMisses: 'No historical misses recorded for this chapter.',
  activity: 'Activity, not mastery', readerTime: 'Estimated reader time', bestStreak: 'Best study-day streak',
  activityHint: 'Reader-focused duration can include idle time. It is not total active study time, exam time or listening time and is not used as a readiness score. The study-day streak counts qualifying learning actions on consecutive local dates, not reading time or flashcard self-ratings. Previous activity streaks are saved separately, not reclassified.',
};
const extraFr: typeof extraEn = {
  lessonStatuses: { notStarted: 'Pas commencé', inProgress: 'En cours', completed: 'Terminé' },
  topicLabels: { notAssessed: 'Pas encore évalué', limitedEvidence: 'Données limitées', needsReview: 'À réviser', learning: 'En apprentissage', strongEvidence: 'Indications récentes solides' },
  chapters: 'Détail des chapitres', lessonCoverage: 'Couverture des leçons terminées', latestQuiz: 'Dernier quiz', bestQuiz: 'Meilleur quiz',
  quizPassed: 'Quiz réussi', quizFailed: 'Quiz inférieur à 90 %', validationEarned: 'Validation du cours acquise',
  chapterQuizPending: 'Terminez les leçons restantes et réussissez le quiz du chapitre avec 90 %.',
  chapterQuizRemaining: 'Leçons terminées ; le quiz du chapitre reste à valider.',
  noChapterQuiz: 'Aucun quiz du chapitre disponible. La validation attend un quiz.',
  noQuizResult: 'Aucun résultat de quiz complet enregistré', contentUnavailable: 'Contenu de la leçon indisponible', openChapter: 'Ouvrir le chapitre',
  topicEvidence: 'Indicateurs récents par chapitre', topicHint: 'Sur 30 jours : dernière réponse objective admissible par concept distinct. La progression du cours et les résultats actuels sont séparés.',
  topicRule: 'Ces catégories sont des règles de produit, pas une maîtrise permanente. Des indications solides nécessitent cinq concepts, 90 % de réussite, 60 % de couverture, deux dates d’évaluation et aucune réponse déclarée devinée parmi les dernières.',
  topicCoverage: 'Concepts du chapitre évalués', assessmentDays: 'Dates d’évaluation', lastAssessed: 'Dernière réponse objective',
  focus: 'Chapitres à réviser', focusEmpty: 'Aucun chapitre ne remplit encore la règle de données pour la révision. Cela ne signifie pas que tous les chapitres sont maîtrisés.',
  coverageHint: 'Concepts distincts issus des questions des leçons ; les variantes répétées n’augmentent pas la couverture. Seules les premières réponses objectives conservées comptent.',
  recallEvidenceHint: 'Sans révision différée admissible, le rappel est non évalué, pas égal à 0 %.',
  reviewWorkload: 'Révisions à effectuer', due: 'À revoir maintenant', overdue: 'En retard depuis avant aujourd’hui', noDue: 'Aucune révision à effectuer maintenant. C’est un état du calendrier, pas une preuve de maîtrise.',
  reviewAction: 'Ouvrir les révisions', overdueHint: 'En retard signifie prévu avant minuit aujourd’hui, en heure locale. Les concepts comptés appartiennent encore au cours.',
  history: 'Historique des examens enregistrés', historyEmpty: 'Aucun résultat d’examen terminé enregistré.',
  historyHint: 'Huit dernières tentatives terminées, examens blancs et d’entraînement. Chaque résultat et seuil utilise la longueur réelle de la tentative.',
  chartLegend: 'Vert : réussi ; rouge : non réussi. Touchez une barre pour ouvrir le résultat.',
  examRuleHint: 'Les seuils des examens sont distincts du seuil de 90 % pour valider le cours.',
  bestExam: 'Meilleur examen enregistré (tous modes)', finishedExams: 'Examens terminés enregistrés', passRequired: 'Bonnes réponses nécessaires',
  historicMisses: 'Erreurs historiques', historicHint: 'Échecs passés, pas une mesure de la maîtrise actuelle.', noHistoricMisses: 'Aucune erreur historique enregistrée pour ce chapitre.',
  activity: 'Activité, pas maîtrise', readerTime: 'Durée de lecture estimée', bestStreak: 'Meilleure série de jours d’étude',
  activityHint: 'La durée affichée dans le lecteur peut inclure de l’inactivité. Ce n’est pas le temps total d’étude active, d’examen ou d’écoute et elle ne sert pas de score de préparation. La série d’étude compte les actions admissibles à des dates locales consécutives, pas la lecture ni les autoévaluations. Les anciennes séries d’activité restent conservées séparément, sans reclassement.',
};
export const progressLearningEn = { ...homeLearningEn, ...extraEn };
export const progressLearningFr: typeof progressLearningEn = { ...homeLearningFr, ...extraFr };
export function useProgressLearningText(): typeof progressLearningEn {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? progressLearningFr : progressLearningEn;
}
