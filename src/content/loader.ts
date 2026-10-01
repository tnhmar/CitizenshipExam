import type { ContentBundle, Lang } from '../types';

const raw: Record<Lang, ContentBundle> = {
  fr: require('./generated/content.fr.json') as ContentBundle,
  en: require('./generated/content.en.json') as ContentBundle,
};

const kinds = new Map(raw.en.exams.map((e) => [e.id, e.kind]));

const bundles: Record<Lang, ContentBundle> = {
  en: raw.en,
  fr: { ...raw.fr, exams: raw.fr.exams.map((e) => ({ ...e, kind: kinds.get(e.id) ?? e.kind })) },
};

export function getBundle(lang: Lang): ContentBundle {
  return bundles[lang];
}
