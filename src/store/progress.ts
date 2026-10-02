import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getBundle } from '../content/loader';
import { toggleBookmark as toggleSaved, type Bookmarks } from '../logic/bookmarks';
import { initialLearning, migrateLearning, recordLearningQuiz, startLesson, studyLesson, type LearningProgress, type LearningQuizResult } from '../logic/completion';
import { touchStreak, type Streak } from '../logic/progress';
import { gradeFrom, newCard, schedule } from '../logic/srs';
import type { ExamAttempt, Grade, Lang, Question, SrsCard } from '../types';

export type QuizResult = LearningQuizResult;
interface ProgressData extends LearningProgress {
  attempts: ExamAttempt[]; active: ExamAttempt | null; cards: Record<string, SrsCard>; bookmarks: Bookmarks;
  streak: Streak; studyMs: number; lastRoute: string | null;
}
interface ProgressState extends ProgressData {
  startLesson: (lessonId: number) => void;
  markLessonStudied: (lessonId: number, lang: Lang) => void;
  // Kept for compatibility; a read marker can only start a lesson now.
  markLessonRead: (lessonId: number) => void;
  recordQuiz: (key: string, correct: number, total: number, lang?: Lang) => void;
  setActive: (attempt: ExamAttempt | null) => void;
  finishExam: (attempt: ExamAttempt) => void;
  review: (q: Question, grade: Grade) => void;
  feedMistake: (q: Question, correct: boolean) => void;
  toggleBookmark: (q: Question) => void;
  removeBookmark: (conceptId: string) => void;
  addStudyTime: (ms: number) => void;
  setLastRoute: (route: string) => void;
  resetAll: () => void;
}
const initial = (): ProgressData => ({ ...initialLearning(), attempts: [], active: null, cards: {}, bookmarks: {}, streak: { count: 0, best: 0, lastDay: null }, studyMs: 0, lastRoute: null });
export const useProgress = create<ProgressState>()(persist<ProgressState, [], [], ProgressData>((set, get) => ({
  ...initial(),
  startLesson: (id) => set((s) => getBundle('en').lessons.some((l) => l.id === id) ? startLesson(s, id, Date.now()) : s),
  markLessonRead: (id) => get().startLesson(id),
  markLessonStudied: (id, lang) => set((s) => {
    const now = Date.now(); const next = studyLesson(s, getBundle(lang), id, now);
    return next === s ? s : { ...next, streak: touchStreak(s.streak, now) };
  }),
  recordQuiz: (key, correct, total, lang = 'en') => set((s) => {
    const now = Date.now(); const next = recordLearningQuiz(s, getBundle(lang), key, correct, total, now);
    return next === s ? s : { ...next, streak: touchStreak(s.streak, now) };
  }),
  setActive: (active) => set({ active }),
  finishExam: (attempt) => set((s) => ({ attempts: [...s.attempts.filter((a) => a.id !== attempt.id), attempt], active: null, streak: touchStreak(s.streak, Date.now()) })),
  review: (q, grade) => set((s) => { const now = Date.now(); const card = s.cards[q.conceptId] ?? newCard(q.id, q.conceptId, now); return { cards: { ...s.cards, [q.conceptId]: schedule(card, grade, now) }, streak: touchStreak(s.streak, now) }; }),
  feedMistake: (q, correct) => { if (correct && !get().cards[q.conceptId]) return; get().review(q, gradeFrom(correct, 'know')); },
  toggleBookmark: (q) => set((s) => ({ bookmarks: toggleSaved(s.bookmarks, q, Date.now()) })),
  removeBookmark: (conceptId) => set((s) => { const bookmarks = { ...s.bookmarks }; delete bookmarks[conceptId]; return { bookmarks }; }),
  addStudyTime: (ms) => set((s) => ({ studyMs: s.studyMs + ms })),
  setLastRoute: (lastRoute) => set({ lastRoute }),
  resetAll: () => set(initial()),
}), {
  name: 'progress-v1', version: 2, storage: createJSONStorage(() => AsyncStorage),
  partialize: (s) => ({ lessonsRead: s.lessonsRead, lessonsStarted: s.lessonsStarted, lessonsStudied: s.lessonsStudied, quizResults: s.quizResults, quizBest: s.quizBest, quizPassed: s.quizPassed, attempts: s.attempts, active: s.active, cards: s.cards, bookmarks: s.bookmarks, streak: s.streak, studyMs: s.studyMs, lastRoute: s.lastRoute }),
  migrate: (persisted) => { const legacy = (persisted ?? {}) as Partial<ProgressData>; return { ...initial(), ...legacy, ...migrateLearning(legacy, [getBundle('en'), getBundle('fr')]) }; },
}));
