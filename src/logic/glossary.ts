import type { GlossaryTerm } from '../types';

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’‘]/g, "'");
export const normalizeSearch = (s: string): string => fold(s).replace(/\s+/g, ' ').trim();

export function searchGlossary(terms: GlossaryTerm[], query: string, lang: string): GlossaryTerm[] {
  const q = normalizeSearch(query);
  return terms.filter((t) => !q || normalizeSearch(t.term).includes(q) || normalizeSearch(t.definition).includes(q))
    .sort((a, b) => a.term.localeCompare(b.term, lang, { sensitivity: 'base' }));
}

export interface TermMatch { start: number; end: number; term: GlossaryTerm; }
export type GlossaryMatcher = (text: string) => TermMatch[];

export function makeGlossaryMatcher(terms: GlossaryTerm[]): GlossaryMatcher {
  const byName = new Map<string, GlossaryTerm>();
  for (const term of terms) {
    const name = normalizeSearch(term.term);
    if (name && !byName.has(name)) byName.set(name, term);
  }
  const special = new Set(['\\', '^', '$', '.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|']);
  const escape = (s: string) => Array.from(s).map((c) => special.has(c) ? '\\' + c : c).join('').replace(/ /g, '\\s+');
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  if (!names.length) return () => [];
  const pattern = '(^|[^\\p{L}\\p{N}_])(' + names.map(escape).join('|') + ')(?![\\p{L}\\p{N}_])';
  return (text) => {
    let normalized = '';
    let offset = 0;
    const starts: number[] = [];
    const ends: number[] = [];
    for (const char of text) {
      const part = fold(char);
      for (let i = 0; i < part.length; i += 1) { starts.push(offset); ends.push(offset + char.length); }
      if (!part.length && ends.length) ends[ends.length - 1] = offset + char.length;
      normalized += part;
      offset += char.length;
    }
    const regex = new RegExp(pattern, 'gu');
    const out: TermMatch[] = [];
    for (const match of normalized.matchAll(regex)) {
      const start = (match.index ?? 0) + match[1].length;
      const end = start + match[2].length;
      const term = byName.get(normalizeSearch(match[2]));
      if (term) out.push({ start: starts[start], end: ends[end - 1], term });
    }
    return out;
  };
}

export interface RichSegment { text: string; bold: boolean; term?: GlossaryTerm; }

export function richSegments(text: string, matcher?: GlossaryMatcher): RichSegment[] {
  let plain = '';
  const bold: { start: number; end: number }[] = [];
  text.split('**').forEach((part, i) => {
    const start = plain.length;
    plain += part;
    if (i % 2 === 1) bold.push({ start, end: plain.length });
  });
  const matches = matcher?.(plain) ?? [];
  const cuts = [...new Set([0, plain.length, ...bold.flatMap((b) => [b.start, b.end]), ...matches.flatMap((m) => [m.start, m.end])])].sort((a, b) => a - b);
  const out: RichSegment[] = [];
  for (let i = 0; i + 1 < cuts.length; i += 1) {
    const start = cuts[i];
    const end = cuts[i + 1];
    if (start === end) continue;
    out.push({ text: plain.slice(start, end), bold: bold.some((b) => b.start <= start && b.end >= end), term: matches.find((m) => m.start <= start && m.end >= end)?.term });
  }
  return out;
}
