import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toggleBookmark as toggleSaved, type Bookmarks } from '../logic/bookmarks';
import { touchStreak, type Streak } from '../logic/progress';
import { gradeFrom, newCard, schedule } from '../logic/srs';
import type { ExamAttempt, Grade, Question, SrsCard } from '../types';

export interface QuizResult { correct: number; total: number; at: number; }
interface ProgressData {
  lessonsRead: Record<number, number>; quizResults: Record<string, QuizResult>; attempts: ExamAttempt[];
  active: ExamAttempt | null; cards: Record<string, SrsCard>; bookmarks: Bookmarks;
  streak: Streak; studyMs: number; lastRoute: string | null;
}
interface ProgressState extends ProgressData {
  markLessonRead: (lessonId: number) => void;
  recordQuiz: (key: string, correct: number, total: number) => void;
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
const initial = (): ProgressData => ({ lessonsRead: {}, quizResults: {}, attempts: [], active: null, cards: {}, bookmarks: {}, streak: { count: 0, best: 0, lastDay: null }, studyMs: 0, lastRoute: null });

export const useProgress = create<ProgressState>()(persist((set, get) => ({
  ...initial(),
  markLessonRead: (lessonId) => set((s) => {
    const now = Date.now();
    return { lessonsRead: { ...s.lessonsRead, [lessonId]: s.lessonsRead[lessonId] ?? now }, streak: touchStreak(s.streak, now) };
  }),
  recordQuiz: (key, correct, total) => set((s) => {
    const now = Date.now();
    return { quizResults: { ...s.quizResults, [key]: { correct, total, at: now } }, streak: touchStreak(s.streak, now) };
  }),
  setActive: (active) => set({ active }),
  finishExam: (attempt) => set((s) => ({ attempts: [...s.attempts.filter((a) => a.id !== attempt.id), attempt], active: null, streak: touchStreak(s.streak, Date.now()) })),
  review: (q, grade) => set((s) => {
    const now = Date.now();
    const card = s.cards[q.conceptId] ?? newCard(q.id, q.conceptId, now);
    return { cards: { ...s.cards, [q.conceptId]: schedule(card, grade, now) }, streak: touchStreak(s.streak, now) };
  }),
  feedMistake: (q, correct) => { if (correct && !get().cards[q.conceptId]) return; get().review(q, gradeFrom(correct, 'know')); },
  toggleBookmark: (q) => set((s) => ({ bookmarks: toggleSaved(s.bookmarks, q, Date.now()) })),
  removeBookmark: (conceptId) => set((s) => { const bookmarks = { ...s.bookmarks }; delete bookmarks[conceptId]; return { bookmarks }; }),
  addStudyTime: (ms) => set((s) => ({ studyMs: s.studyMs + ms })),
  setLastRoute: (lastRoute) => set({ lastRoute }),
  resetAll: () => set(initial()),
}), { name: 'progress-v1', version: 1, storage: createJSONStorage(() => AsyncStorage) }));
