import type { ContentBundle, SrsCard } from '../types';
import { shuffleSeeded } from './shuffle';
import { dueCards } from './srs';

export type DeckKind = 'due' | 'missed' | 'random';

export function countDue(cards: SrsCard[], now: number): number {
  return dueCards(cards, now).length;
}

export function countMissed(cards: SrsCard[]): number {
  return cards.filter((c) => c.lapses > 0).length;
}

export function nextDueAfter(cards: SrsCard[], now: number): number | null {
  const later = cards.map((c) => c.due).filter((d) => d > now);
  return later.length ? Math.min(...later) : null;
}

export function buildDeck(kind: DeckKind, bundle: ContentBundle, cards: SrsCard[], now: number, size: number, seed: number): number[] {
  let ids: number[];
  if (kind === 'due') {
    ids = dueCards(cards, now).map((c) => c.questionId);
  } else if (kind === 'missed') {
    ids = cards
      .filter((c) => c.lapses > 0)
      .sort((a, b) => b.lapses - a.lapses || a.due - b.due)
      .map((c) => c.questionId);
  } else {
    const seen = new Set<string>();
    const pool: number[] = [];
    for (const q of Object.values(bundle.questions)) {
      if (q.origin !== 'lesson' || seen.has(q.conceptId)) continue;
      seen.add(q.conceptId);
      pool.push(q.id);
    }
    ids = shuffleSeeded(pool, seed);
  }
  return ids.filter((id) => bundle.questions[id] !== undefined).slice(0, size);
}
