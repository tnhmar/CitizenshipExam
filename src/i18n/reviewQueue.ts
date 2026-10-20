import { useTranslation } from 'react-i18next';
const en = {
  unresolved: 'Needs more practice', unresolvedHint: 'Latest difficulty or uncertainty not yet resolved by a later objective recall.',
  history: 'Previously missed', historyHint: 'Distinct concepts ever missed. Successful practice does not erase this history.',
  pool: '{count} concepts available · up to {size} per session',
  correction: 'Immediate corrections', correctionHint: 'Practice after feedback does not promote the long-term review schedule.',
  pending: 'Still due now: {count}', known: 'Known without guessing', guessed: 'Correct but guessed', missed: 'Incorrect / unknown',
  lapses: 'Historical misses: {count}', outcome: 'Latest grade: {value}', next: 'Scheduled review: {date}',
  unknownHistory: 'No recorded latest grade', selfReport: 'Self-rating', objective: 'Answer accuracy',
};
const fr: typeof en = {
  unresolved: 'À retravailler', unresolvedHint: 'Difficulté ou incertitude non résolue par un rappel objectif ultérieur.',
  history: 'Déjà ratées', historyHint: 'Concepts distincts déjà ratés. Une réussite n’efface pas cet historique.',
  pool: '{count} concepts disponibles · jusqu’à {size} par session',
  correction: 'Corrections immédiates', correctionHint: 'La pratique après correction ne fait pas progresser le calendrier de révision à long terme.',
  pending: 'Encore à revoir maintenant : {count}', known: 'Sues sans deviner', guessed: 'Correctes mais devinées', missed: 'Incorrectes / non sues',
  lapses: 'Erreurs historiques : {count}', outcome: 'Dernière évaluation : {value}', next: 'Révision prévue : {date}',
  unknownHistory: 'Aucune dernière évaluation enregistrée', selfReport: 'Autoévaluation', objective: 'Réussite aux réponses',
};
export function useReviewQueueText(): typeof en {
  const { i18n } = useTranslation(); return i18n.language.startsWith('fr') ? fr : en;
}
