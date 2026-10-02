import type { ContentBundle, ExamAttempt, SrsCard } from '../types';
import { chapterStatus, lessonStatus, type LearningProgress } from './completion';
import { assessmentCoverage, bestExamEvidence, delayedRecallEvidence, examImprovement, recentMockEvidence, recentPracticeEvidence, reviewWorkload, topicEvidence, type ExamEvidence, type TopicEvidence, type AssessmentHistory } from './learningStats';

export interface DashboardProgress extends LearningProgress, AssessmentHistory {
  attempts: ExamAttempt[];
  cards: Record<string, SrsCard>;
  active?: ExamAttempt | null;
}
export interface DashboardSnapshot {
  completion: { lessonsCompleted: number; lessonsTotal: number; chaptersCompleted: number; chaptersTotal: number; lessonsInProgress: number; lessonsValidated: number; lessonsStudiedWithoutQuiz: number };
  evidence: { coverage: ReturnType<typeof assessmentCoverage>; practice: ReturnType<typeof recentPracticeEvidence>; delayedRecall: ReturnType<typeof delayedRecallEvidence>; topics: TopicEvidence[]; historyStartedAt: number | null; truncatedBefore: number | null };
  exams: { best: ExamEvidence | null; recentMocks: ExamEvidence[]; recentMockAverage: number | null; improvement: number | null };
  review: { due: number; overdue: number };
  nextAction: DashboardAction;
}
export interface DashboardAction {
  kind: 'startLearning' | 'continueLesson' | 'reviewDue' | 'studyTopic' | 'finishChapter' | 'takeMock' | 'resumeExam';
  chapterId?: number;
  lessonId?: number;
  examId?: number;
}
export function snapshot(bundle: ContentBundle, progress: DashboardProgress, now: number): DashboardSnapshot {
  const lessonStates = bundle.lessons.map((l) => lessonStatus(progress, l.id));
  const chapterStates = bundle.chapters.map((c) => chapterStatus(progress, c));
  const topics = topicEvidence(bundle, progress.assessmentEvents, now);
  const weak = topics.filter((t) => t.status === 'needsReview').sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1) || a.chapterId - b.chapterId)[0];
  const nextLesson = bundle.lessons.find((l) => lessonStatus(progress, l.id) !== 'completed');
  const pendingChapter = bundle.chapters.find((c) => c.lessonIds.length > 0 && c.lessonIds.every((id) => lessonStatus(progress, id) === 'completed') && chapterStatus(progress, c) !== 'completed');
  const review = reviewWorkload(bundle, Object.values(progress.cards), now);
  const active = progress.active;
  let nextAction: DashboardAction;
  if (active && active.finishedAt === null && bundle.exams.some((e) => e.id === active.examId)) nextAction = { kind: 'resumeExam', examId: active.examId };
  else if (review.due > 0) nextAction = { kind: 'reviewDue' };
  else if (weak) nextAction = { kind: 'studyTopic', chapterId: weak.chapterId };
  else if (nextLesson) nextAction = { kind: lessonStatus(progress, nextLesson.id) === 'inProgress' ? 'continueLesson' : 'startLearning', lessonId: nextLesson.id };
  else if (pendingChapter) nextAction = { kind: 'finishChapter', chapterId: pendingChapter.id };
  else nextAction = { kind: 'takeMock' };
  const lessonsCompleted = lessonStates.filter((s) => s === 'completed').length;
  const studied = bundle.lessons.filter((l) => l.questionIds.length === 0 && progress.lessonsStudied[l.id] !== undefined && lessonStatus(progress, l.id) === 'completed').length;
  const recentMocks = recentMockEvidence(bundle, progress.attempts, now);
  return {
    completion: { lessonsCompleted, lessonsTotal: bundle.lessons.length, chaptersCompleted: chapterStates.filter((s) => s === 'completed').length, chaptersTotal: bundle.chapters.length, lessonsInProgress: lessonStates.filter((s) => s === 'inProgress').length, lessonsValidated: lessonsCompleted - studied, lessonsStudiedWithoutQuiz: studied },
    evidence: { coverage: assessmentCoverage(bundle, progress.assessmentEvents, now), practice: recentPracticeEvidence(bundle, progress.assessmentEvents, now), delayedRecall: delayedRecallEvidence(bundle, progress.assessmentEvents, now), topics, historyStartedAt: progress.assessmentHistoryStartedAt, truncatedBefore: progress.assessmentHistoryTruncatedBefore },
    exams: { best: bestExamEvidence(bundle, progress.attempts, now), recentMocks, recentMockAverage: recentMocks.length ? recentMocks.reduce((sum, e) => sum + e.ratio, 0) / recentMocks.length : null, improvement: examImprovement(bundle, progress.attempts, now) },
    review,
    nextAction,
  };
}
