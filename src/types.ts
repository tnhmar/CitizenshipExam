export type Lang = 'fr' | 'en';
export type Block = { k: 'p' | 'h' | 'li'; t: string };
export type QType = 'mc' | 'tf';

export interface Question {
  id: number;
  conceptId: string;
  type: QType;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  origin: 'lesson' | 'exam';
  lessonId: number | null;
  chapterId: number | null;
  inferred: boolean;
}

export interface Lesson {
  id: number;
  chapterId: number;
  order: number;
  title: string;
  blocks: Block[];
  hasAudio: boolean;
  questionIds: number[];
}

export interface Chapter {
  id: number;
  order: number;
  title: string;
  lessonIds: number[];
}

export interface Exam {
  id: number;
  order: number;
  title: string;
  kind: 'mock' | 'practice';
  durationMin: number;
  questionIds: number[];
}

export interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
}

export interface ContentBundle {
  lang: Lang;
  sample: boolean;
  passMark: number;
  examSize: number;
  examMinutes: number;
  chapters: Chapter[];
  lessons: Lesson[];
  questions: Record<number, Question>;
  exams: Exam[];
  glossary: GlossaryTerm[];
}

export interface Presented {
  question: Question;
  options: string[];
  correctIndex: number;
}

export type Grade = 'know' | 'guess' | 'unknown';

export interface SrsCard {
  questionId: number;
  conceptId: string;
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
  due: number;
  lastReviewed: number;
}

export interface Answer {
  questionId: number;
  conceptId: string;
  chosen: number | null;
  correct: boolean;
  timeMs: number;
  flagged: boolean;
}

export interface ExamAttempt {
  id: string;
  examId: number;
  lang: Lang;
  seed: number;
  questionIds: number[];
  startedAt: number;
  finishedAt: number | null;
  limitMs: number;
  answers: Answer[];
}
