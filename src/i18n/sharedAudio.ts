import { useTranslation } from 'react-i18next';
const en = { loading: 'Loading audio…', failed: 'Audio could not be played. Press Play to retry.', stop: 'Stop audio', replay: 'Replay', other: 'Another lesson is playing. Press Play to replace it.' };
const fr: typeof en = { loading: 'Chargement audio…', failed: 'Lecture audio impossible. Appuyez sur Lecture pour réessayer.', stop: 'Arrêter l’audio', replay: 'Réécouter', other: 'Une autre leçon est en lecture. Appuyez sur Lecture pour la remplacer.' };
export function useSharedAudioText(): typeof en { const { i18n } = useTranslation(); return i18n.language.startsWith('fr') ? fr : en; }
