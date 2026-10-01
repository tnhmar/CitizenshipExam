import type { ContentBundle, Lang } from '../types';

const bundles: Record<Lang, ContentBundle> = {
  fr: require('./generated/content.fr.json') as ContentBundle,
  en: require('./generated/content.en.json') as ContentBundle,
};

export function getBundle(lang: Lang): ContentBundle {
  return bundles[lang];
}
