import type { ContentBundle, ExamAttempt } from '../types';
import { assessmentIds, chapterStatus, lessonStatus, passesLearningQuiz, validScore, type LearningProgress, type LearningQuizResult, type LearningStatus } from './completion';
import { finishedExamEvidence, type EvidenceTally } from './learningStats';

export interface ProgressQuizScore { correct: number; total: number; at: number; passed: boolean; }
export function progressQuizScore(result: LearningQuizResult | undefined): ProgressQuizScore | null {
  return result && validScore(result.correct, result.total) ? { ...result, passed: passesLearningQuiz(result.correct, result.total) } : null;
}
export interface ProgressLessonRow {
  id: number;
  title: string;
  available: boolean;
  status: LearningStatus;
  studiedWithoutQuiz: boolean;
  latest: ProgressQuizScore | null;
}
export interface ProgressChapterRow {
  id: number;
  title: string;
  status: LearningStatus;
  completed: number;
  total: number;
  quizAvailable: boolean;
  quizPassed: boolean;
  latest: ProgressQuizScore | null;
  best: ProgressQuizScore | null;
  lessons: ProgressLessonRow[];
}
export function progressChapter(bundle: ContentBundle, progress: LearningProgress, chapterId: number): ProgressChapterRow | null {
  const chapter = bundle.chapters.find((c) => c.id === chapterId);
  if (!chapter) return null;
  const key = `chapter:${chapter.id}`;
  return {
    id: chapter.id, title: chapter.title, status: chapterStatus(progress, chapter),
    completed: chapter.lessonIds.filter((id) => lessonStatus(progress, id) === 'completed').length,
    total: chapter.lessonIds.length, quizAvailable: assessmentIds(bundle, key).length > 0,
    quizPassed: Boolean(progress.quizPassed[key]), latest: progressQuizScore(progress.quizResults[key]), best: progressQuizScore(progress.quizBest[key]),
    lessons: chapter.lessonIds.map((id) => {
      const lesson = bundle.lessons.find((l) => l.id === id); const status = lessonStatus(progress, id);
      return { id, title: lesson?.title ?? String(id), available: Boolean(lesson), status, studiedWithoutQuiz: Boolean(lesson && lesson.questionIds.length === 0 && progress.lessonsStudied[id] !== undefined && status === 'completed'), latest: progressQuizScore(progress.quizResults[`lesson:${id}`]) };
    }),
  };
}
export function progressHistory(bundle: ContentBundle, attempts: ExamAttempt[], now: number) {
  return finishedExamEvidence(bundle, attempts, now).slice(0, 8);
}
export function progressScoreColour(passed: boolean, dark: boolean): string {
  return passed ? dark ? '#8DCB91' : '#2E7D32' : dark ? '#FFB4AB' : '#C62828';
}
export function progressEvidence(tally: EvidenceTally): string | null {
  return tally.accuracy === null || !Number.isFinite(tally.accuracy) || tally.accuracy < 0 || tally.accuracy > 1 || !validScore(tally.correct, tally.total) ? null : `${tally.correct}/${tally.total} · ${Math.round(tally.accuracy * 100)}%`;
}
