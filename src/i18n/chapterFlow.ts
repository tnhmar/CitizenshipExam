import { useTranslation } from 'react-i18next';
const en = { nextChapter: 'Next chapter', chapterCompleted: 'Chapter completed', courseCompleted: 'All chapters completed', viewChapters: 'View chapters' };
const fr: typeof en = { nextChapter: 'Chapitre suivant', chapterCompleted: 'Chapitre terminé', courseCompleted: 'Tous les chapitres sont terminés', viewChapters: 'Voir les chapitres' };
export function useChapterFlowText(): typeof en {
  const { i18n } = useTranslation();
  return i18n.language.startsWith('fr') ? fr : en;
}
