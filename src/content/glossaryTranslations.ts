import type { GlossaryTerm } from '../types';
import { translateGlossaryTerm, type GlossaryLanguage } from '../logic/glossaryLanguages';
import { glossaryArabic } from './glossaryArabic';
import { getBundle } from './loader';

const french = new Map(getBundle('fr').glossary.map((term) => [term.id, term]));
const english = new Map(getBundle('en').glossary.map((term) => [term.id, term]));
export function getGlossaryTranslation(source: GlossaryTerm, language: GlossaryLanguage) {
  return translateGlossaryTerm(source, language, { fr: french.get(source.id), en: english.get(source.id) }, glossaryArabic[source.id]);
}
