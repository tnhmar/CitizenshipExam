import { describe, expect, test } from '@jest/globals';
import { glossaryArabic } from '../content/glossaryArabic';
import { getGlossaryTranslation } from '../content/glossaryTranslations';
import { getBundle } from '../content/loader';
import { GLOSSARY_LANGUAGES, glossaryLanguage, matchesGlossaryDisplay, translateGlossaryTerm } from './glossaryLanguages';

const fr = { id: 146, term: 'Parlement', definition: 'Définition française' };
const en = { id: 146, term: 'Parliament', definition: 'English definition' };
const ar = { w: 'البرلمان', d: 'تعريف تجريبي' };
describe('glossary translation preference', () => {
  test('offers only Arabic, French and English, defaulting to Arabic', () => {
    expect(GLOSSARY_LANGUAGES).toEqual(['ar', 'fr', 'en']);
    for (const value of [undefined, null, 'pa', 'es', 'invalid']) expect(glossaryLanguage(value)).toBe('ar');
    expect(glossaryLanguage('fr')).toBe('fr');
    expect(glossaryLanguage('en')).toBe('en');
  });
  test('keeps the lesson term while displaying the chosen translation', () => {
    const result = translateGlossaryTerm(fr, 'ar', { fr, en }, ar);
    expect(result.source).toBe(fr);
    expect(result.term).toBe(ar.w);
    expect(result.definition).toBe(ar.d);
    expect(result.rtl).toBe(true);
    expect(result.missing).toBe(false);
  });
  test('uses the native French and English definitions independently of the interface', () => {
    expect(translateGlossaryTerm(fr, 'en', { fr, en }, ar).definition).toBe(en.definition);
    expect(translateGlossaryTerm(en, 'fr', { fr, en }, ar).definition).toBe(fr.definition);
    expect(translateGlossaryTerm(fr, 'en', { fr, en }, ar).rtl).toBe(false);
  });
  test('searches source terms, translated terms and selected definitions', () => {
    const result = translateGlossaryTerm(fr, 'ar', { fr, en }, ar);
    for (const query of ['PARLIAMENT', 'parlement', 'الْبَرْلَمَان', 'البـرلمان', 'تجريبي']) expect(matchesGlossaryDisplay(result, query)).toBe(true);
    expect(matchesGlossaryDisplay(result, 'unrelated')).toBe(false);
  });
  test('marks missing translations and falls back to the source without pretending it is Arabic', () => {
    const result = translateGlossaryTerm(fr, 'ar', { fr, en });
    expect(result.definition).toBe(fr.definition);
    expect(result.missing).toBe(true);
    expect(result.rtl).toBe(false);
  });
  test('has 67 supplied Arabic entries and covers every imported native term', () => {
    expect(Object.keys(glossaryArabic)).toHaveLength(67);
    for (const language of ['fr', 'en'] as const) for (const term of getBundle(language).glossary) {
      const translated = getGlossaryTranslation(term, 'ar');
      expect(translated.missing).toBe(false);
      expect(translated.term).toBe(glossaryArabic[term.id].w);
      expect(translated.definition).toBe(glossaryArabic[term.id].d);
    }
  });
});
