import { useTranslation } from 'react-i18next';
const en = { today: 'Today', shortcuts: 'Explore', viewProgress: 'View progress', progressHint: 'Lessons and chapters completed. Detailed results live in Progress.' };
const fr: typeof en = { today: 'Aujourd’hui', shortcuts: 'Explorer', viewProgress: 'Voir les progrès', progressHint: 'Leçons et chapitres terminés. Retrouvez les résultats détaillés dans Progrès.' };
export function useHomeFocusText(): typeof en {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? fr : en;
}
