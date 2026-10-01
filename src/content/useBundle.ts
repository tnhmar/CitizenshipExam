import { deviceLang } from '../i18n';
import { useSettings } from '../store/settings';
import type { ContentBundle } from '../types';
import { getBundle } from './loader';

export function useBundle(): ContentBundle {
  const lang = useSettings((s) => s.lang);
  return getBundle(lang ?? deviceLang());
}
