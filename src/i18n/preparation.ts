import { useTranslation } from 'react-i18next';
const en = {
  title: 'Estimated preparation', courseOnlyTitle: 'Preparation in progress',
  hints: { empty: 'Indicators are being established.', courseOnly: 'Course progress only · Not an overall estimate.', insufficient: 'Insufficient recent evidence for an overall estimate.', available: 'Based on course, recent practice and timed mocks.' },
  explain: 'Understand your preparation', close: 'Close', progress: 'View progress',
  method: 'This is a transparent product indicator, not a probability of passing or a guarantee of readiness. Repeated familiar-bank questions are not independent predictive evidence.',
  weights: '25% course progression + 40% recent objective practice + 35% recent timed mock performance.',
  courseRule: 'Course progression is the average of the completed-lesson percentage and completed-chapter percentage. Studied exceptions contribute course progress, not assessment-validated mastery.',
  gate: 'A combined number requires all three components, at least {{concepts}} assessed practice concepts and {{mocks}} recent timed mocks. These minimums are product heuristics, not validated confidence thresholds.',
  missing: 'Missing evidence is not scored as failure. We do not reweight the available components to manufacture an overall percentage.',
  window: 'Practice and mocks use the existing last-30-days selectors. Up to five timed mocks contribute their individual score ratios. Flashcard self-ratings are excluded from practice accuracy.',
  excluded: 'Reading time, audio, bookmarks, streaks and the exam countdown do not increase this indicator.',
  course: 'Course', lessons: 'Lessons completed', chapters: 'Chapters completed', practice: 'Objective practice', mocks: 'Timed mocks', notAssessed: 'Not assessed', concepts: 'concepts assessed', attempts: 'attempts', latest: 'Latest mock',
};
const fr: typeof en = {
  title: 'Préparation estimée', courseOnlyTitle: 'Préparation en cours',
  hints: { empty: 'Indicateurs en cours de création.', courseOnly: 'Progression du cours uniquement · Pas d’estimation globale.', insufficient: 'Données récentes insuffisantes pour une estimation globale.', available: 'Basé sur le cours, l’entraînement récent et les examens blancs.' },
  explain: 'Comprendre votre préparation', close: 'Fermer', progress: 'Voir les progrès',
  method: 'Cet indicateur de produit n’est pas une probabilité de réussite ni une garantie de préparation. Les questions répétées d’une banque connue ne constituent pas des preuves prédictives indépendantes.',
  weights: '25 % de progression du cours + 40 % d’entraînement objectif récent + 35 % de résultats récents aux examens blancs chronométrés.',
  courseRule: 'La progression du cours est la moyenne des pourcentages de leçons et de chapitres terminés. Les leçons marquées étudiées contribuent au parcours, pas à une maîtrise validée par évaluation.',
  gate: 'Le nombre global nécessite les trois composantes, au moins {{concepts}} concepts évalués en entraînement et {{mocks}} examens blancs chronométrés récents. Ces minimums sont des règles de produit, pas des seuils de confiance validés.',
  missing: 'Une donnée absente n’est pas un échec. Les composantes disponibles ne sont pas repondérées pour fabriquer un pourcentage global.',
  window: 'L’entraînement et les examens utilisent les sélecteurs existants sur 30 jours. Jusqu’à cinq examens blancs contribuent avec leurs résultats proportionnels. Les autoévaluations de flashcards sont exclues de la réussite objective.',
  excluded: 'Le temps de lecture, l’audio, les favoris, les séries et le compte à rebours de l’examen n’augmentent pas cet indicateur.',
  course: 'Cours', lessons: 'Leçons terminées', chapters: 'Chapitres terminés', practice: 'Entraînement objectif', mocks: 'Examens blancs chronométrés', notAssessed: 'Pas encore évalué', concepts: 'concepts évalués', attempts: 'tentatives', latest: 'Dernier examen blanc',
};
export function usePreparationText(): typeof en { const { i18n } = useTranslation(); return i18n.language.startsWith('fr') ? fr : en; }
