import type { Chapter, ContentBundle, Lesson, Presented, Question } from '../types';
import { shuffleSeeded } from './shuffle';

export function present(q: Question, seed: number): Presented {
  const order = shuffleSeeded(
    q.options.map((_, i) => i),
    (seed ^ q.id) >>> 0,
  );
  return {
    question: q,
    options: order.map((i) => q.options[i]),
    correctIndex: order.indexOf(q.correctIndex),
  };
}

export function isCorrect(p: Presented, chosen: number | null): boolean {
  return chosen !== null && chosen === p.correctIndex;
}

export function lessonQuizIds(lesson: Lesson, minQuestions: number): number[] {
  return lesson.questionIds.length >= minQuestions ? [...lesson.questionIds] : [];
}

export function chapterQuizIds(bundle: ContentBundle, chapter: Chapter): number[] {
  const seen = new Set<string>();
  const out: number[] = [];
  for (const lessonId of chapter.lessonIds) {
    const lesson = bundle.lessons.find((l) => l.id === lessonId);
    if (!lesson) continue;
    for (const id of lesson.questionIds) {
      const q = bundle.questions[id];
      if (!q || seen.has(q.conceptId)) continue;
      seen.add(q.conceptId);
      out.push(id);
    }
  }
  return out;
}
