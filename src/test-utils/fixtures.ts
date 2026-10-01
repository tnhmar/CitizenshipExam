import type { ContentBundle, Question } from '../types';

const q = (id: number, conceptId: string, lessonId: number | null, chapterId: number | null, over: Partial<Question> = {}): Question => ({
  id,
  conceptId,
  type: 'mc',
  text: `Q${id}`,
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: '',
  origin: lessonId ? 'lesson' : 'exam',
  lessonId,
  chapterId,
  inferred: false,
  ...over,
});

export function makeBundle(): ContentBundle {
  const list = [
    q(1, 'c1', 10, 1),
    q(2, 'c2', 10, 1),
    q(3, 'c3', 10, 1),
    q(4, 'c3', 11, 1),
    q(5, 'c5', 11, 1),
    q(6, 'c6', 20, 2),
    q(7, 'c7', null, 2),
    q(8, 'c8', null, null),
  ];
  const questions: Record<number, Question> = {};
  for (const x of list) questions[x.id] = x;
  return {
    lang: 'en',
    sample: true,
    passMark: 15,
    examSize: 20,
    examMinutes: 45,
    chapters: [
      { id: 1, order: 1, title: 'Ch1', lessonIds: [10, 11] },
      { id: 2, order: 2, title: 'Ch2', lessonIds: [20] },
    ],
    lessons: [
      { id: 10, chapterId: 1, order: 1, title: 'L10', blocks: [], hasAudio: false, questionIds: [1, 2, 3] },
      { id: 11, chapterId: 1, order: 2, title: 'L11', blocks: [], hasAudio: false, questionIds: [4, 5] },
      { id: 20, chapterId: 2, order: 3, title: 'L20', blocks: [], hasAudio: false, questionIds: [6] },
    ],
    questions,
    exams: [{ id: 100, order: 1, title: 'Mock Test A', kind: 'mock', durationMin: 45, questionIds: [1, 2, 3, 4, 5, 6, 7, 8] }],
    glossary: [],
  };
}
