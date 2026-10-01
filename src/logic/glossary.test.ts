import { describe, expect, test } from '@jest/globals';
import type { GlossaryTerm } from '../types';
import { makeGlossaryMatcher, normalizeSearch, richSegments, searchGlossary } from './glossary';

const terms: GlossaryTerm[] = [
  { id: 1, term: 'Parlement', definition: 'Définition A' },
  { id: 2, term: 'République', definition: 'Définition B' },
  { id: 3, term: 'common law', definition: 'Définition C' },
  { id: 4, term: 'law', definition: 'Définition D' },
  { id: 5, term: 'Étude', definition: 'Définition E' },
];
const match = makeGlossaryMatcher(terms);

describe('glossary search', () => {
  test('ignores case, accents and repeated whitespace', () => {
    expect(normalizeSearch('  RÉPUBLIQUE  ')).toBe('republique');
    expect(searchGlossary(terms, 'REPUBLIQUE', 'fr').map((t) => t.id)).toEqual([2]);
    expect(searchGlossary(terms, 'definition c', 'en').map((t) => t.id)).toEqual([3]);
  });
  test('sorts a blank search without mutating its input', () => {
    const before = terms.map((t) => t.id);
    expect(searchGlossary(terms, '', 'en')[0].id).toBe(3);
    expect(terms.map((t) => t.id)).toEqual(before);
    expect(searchGlossary(terms, 'not a glossary entry', 'fr')).toEqual([]);
  });
});

describe('lesson term matching', () => {
  test('matches whole words, not parts of longer words', () => {
    expect(match('Parlementaire lawmaker')).toEqual([]);
    expect(match('Le PARLEMENT.').map((m) => m.term.id)).toEqual([1]);
  });
  test('prefers the longest multiword term', () => {
    expect(match('Common law; law.').map((m) => m.term.id)).toEqual([3, 4]);
    expect(match('common \n law')[0].term.id).toBe(3);
  });
  test('preserves original offsets for accents, combining marks and emoji', () => {
    for (const text of ['🍁 étude', '🍁 e\u0301tude']) {
      const m = match(text)[0];
      expect(text.slice(m.start, m.end)).toBe(text.slice(text.indexOf(' ') + 1));
      expect(m.term.id).toBe(5);
    }
  });
  test('keeps text and bold formatting when a link crosses bold boundaries', () => {
    const parts = richSegments('The **common** law and **Parlement**.', match);
    expect(parts.map((p) => p.text).join('')).toBe('The common law and Parlement.');
    expect(parts.filter((p) => p.term?.id === 3).map((p) => p.text).join('')).toBe('common law');
    expect(parts.find((p) => p.text === 'common')?.bold).toBe(true);
    expect(parts.find((p) => p.text === ' law')?.bold).toBe(false);
  });
  test('supports plain rich text and an empty glossary', () => {
    expect(richSegments('One **two**').map((p) => [p.text, p.bold])).toEqual([['One ', false], ['two', true]]);
    expect(makeGlossaryMatcher([])('Parlement')).toEqual([]);
  });
});
