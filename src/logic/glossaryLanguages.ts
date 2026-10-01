import type { GlossaryTerm } from '../types';
import { normalizeSearch } from './glossary';

export const GLOSSARY_LANGUAGES = ['ar', 'fr', 'en'] as const;
export type GlossaryLanguage = typeof GLOSSARY_LANGUAGES[number];
export function glossaryLanguage(value: unknown): GlossaryLanguage { return value === 'fr' || value === 'en' || value === 'ar' ? value : 'ar'; }
export interface GlossaryDisplay { source: GlossaryTerm; term: string; definition: string; rtl: boolean; missing: boolean; searchText: string; }
export function normalizeGlossaryQuery(value: string): string { return normalizeSearch(value).replace(/\u0640/g, ''); }

export function translateGlossaryTerm(source: GlossaryTerm, language: GlossaryLanguage, native: { fr?: GlossaryTerm; en?: GlossaryTerm }, arabic?: { w: string; d: string }): GlossaryDisplay {
  const selected = language === 'ar' ? arabic?.w && arabic.d ? { term: arabic.w, definition: arabic.d } : undefined : native[language];
  const result = selected ?? source;
  return { source, term: result.term, definition: result.definition, rtl: language === 'ar' && Boolean(selected), missing: !selected, searchText: normalizeGlossaryQuery([source.term, source.definition, native.fr?.term, native.en?.term, result.term, result.definition].filter(Boolean).join(' ')) };
}
export function matchesGlossaryDisplay(display: GlossaryDisplay, query: string): boolean { return display.searchText.includes(normalizeGlossaryQuery(query)); }
