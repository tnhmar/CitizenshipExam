import type { Block } from '../types';

export interface Sentence {
  text: string;
  startMs: number;
}

export interface Span {
  start: number;
  end: number;
  startMs: number;
}

export interface Range {
  start: number;
  end: number;
}

export function normalize(s: string): string {
  return s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

export function sentencesFromTiming(timing: unknown): Sentence[] {
  const speech = (timing as { data?: { speech?: unknown } } | null | undefined)?.data?.speech;
  if (!Array.isArray(speech)) return [];
  const out: Sentence[] = [];
  for (const item of speech as unknown[]) {
    const s = item as { type?: unknown; value?: unknown; time?: unknown } | null;
    if (s && s.type === 'sentence' && typeof s.value === 'string' && typeof s.time === 'number') {
      out.push({ text: s.value, startMs: s.time });
    }
  }
  return out;
}

export function layoutBlocks(blocks: Block[]): { text: string; ranges: Range[] } {
  let text = '';
  const ranges: Range[] = [];
  blocks.forEach((b, i) => {
    const n = normalize(b.t);
    if (i > 0) text += ' ';
    ranges.push({ start: text.length, end: text.length + n.length });
    text += n;
  });
  return { text, ranges };
}

export function alignSentences(text: string, sentences: Sentence[], title: string): Span[] {
  const spans: Span[] = [];
  const strip = (s: string) => s.replace(/[.!?]$/, '');
  const t = strip(normalize(title));
  let cursor = 0;
  for (const s of sentences) {
    const v = normalize(s.text);
    if (!v || strip(v) === t) continue;
    let len = v.length;
    let idx = text.indexOf(v, cursor);
    if (idx < 0) {
      len = Math.min(24, v.length);
      idx = text.indexOf(v.slice(0, len), cursor);
    }
    if (idx < 0) continue;
    spans.push({ start: idx, end: idx + len, startMs: s.startMs });
    cursor = idx + len;
  }
  return spans;
}

export function activeBlocks(ranges: Range[], spans: Span[], ms: number): number[] {
  let found: Span | undefined;
  for (const s of spans) {
    if (s.startMs <= ms) found = s;
    else break;
  }
  if (!found) return [];
  const a = found;
  const out: number[] = [];
  ranges.forEach((r, i) => {
    if (r.start < a.end && r.end > a.start) out.push(i);
  });
  return out;
}
