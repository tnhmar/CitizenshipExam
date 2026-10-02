import { useTranslation } from 'react-i18next';
const en = {
  title: 'Study-day streak', best: 'Best study-day streak', explain: 'What counts?', close: 'Close',
  states: { doneToday: 'Studied today · {{days}} consecutive study days.', continueToday: 'Study today to continue your {{days}}-day streak.', restart: 'Start a new study-day streak today.', notStarted: 'Complete a learning action to start your streak.' },
  definition: 'A day counts when you answer a valid quiz, objective review or exam question, finish a full quiz, explicitly mark a question-free lesson studied, or finish an exam with an answered question. Wrong answers count as study too.',
  excluded: 'Opening lessons, reading time, bookmarks, revealing flashcards and self-rating flashcards do not count. A streak is a habit indicator, not mastery or a daily-minute target.',
  calendar: 'Only one day is counted per local calendar date. Study on consecutive dates to extend it. If a full date is missed, start again. Best streak stays in Progress. Changing the device time zone can affect local dates.',
  migration: 'Your previous activity streak was saved separately. It is not reclassified as a study-day streak; this streak starts with your first qualifying action after the update.',
};
const fr: typeof en = {
  title: 'Série de jours d’étude', best: 'Meilleure série de jours d’étude', explain: 'Qu’est-ce qui compte ?', close: 'Fermer',
  states: { doneToday: 'Étudié aujourd’hui · {{days}} jours d’étude consécutifs.', continueToday: 'Étudiez aujourd’hui pour continuer votre série de {{days}} jours.', restart: 'Commencez une nouvelle série d’étude aujourd’hui.', notStarted: 'Effectuez une action d’apprentissage pour commencer votre série.' },
  definition: 'Un jour compte après une réponse valide à un quiz, à une révision objective ou à un examen, un quiz complet terminé, une leçon sans questions explicitement marquée étudiée, ou un examen terminé avec une question répondue. Les mauvaises réponses comptent aussi comme étude.',
  excluded: 'Ouvrir une leçon, le temps de lecture, les favoris, révéler une flashcard et les autoévaluations ne comptent pas. La série indique une habitude, pas la maîtrise ni un objectif de minutes.',
  calendar: 'Un seul jour est compté par date locale. Étudiez à des dates consécutives pour prolonger la série. Une date entière manquée impose de recommencer. La meilleure série reste dans Progrès. Changer le fuseau de l’appareil peut modifier les dates locales.',
  migration: 'Votre ancienne série d’activité est conservée séparément. Elle n’est pas reclassée en série d’étude ; cette nouvelle série commence avec votre première action admissible après la mise à jour.',
};
export function useStudyDayText(): typeof en {
  const { i18n } = useTranslation(); return i18n.language.startsWith('fr') ? fr : en;
}
