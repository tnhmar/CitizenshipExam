import type { ContentBundle } from '../types';
import { assessmentIds } from './completion';
import type { DashboardAction } from './dashboardStats';
import { homeFocusTarget } from './homeFocus';
import type { NextStepAlternative } from './nextSteps';

export type RecommendationLabel = DashboardAction['kind'] | 'startChapter' | 'startLesson' | 'openChapter' | 'openCourse' | 'continueCourse' | 'reviewChapter';
export type RecommendationReason = DashboardAction['kind'] | 'startChapter' | 'quizUnavailable' | 'contentUnavailable';
export interface RecommendationTarget { route: string; subject: string | null; context: string | null; label: RecommendationLabel; reason: RecommendationReason; }
function recommendationTarget(action: DashboardAction, bundle: ContentBundle): RecommendationTarget {
  const base = homeFocusTarget(action, bundle);
  const lesson = bundle.lessons.find((entry) => entry.id === action.lessonId);
  const chapter = bundle.chapters.find((entry) => entry.id === action.chapterId);
  const parent = bundle.chapters.find((entry) => entry.id === lesson?.chapterId);
  let label: RecommendationLabel = action.kind;
  let reason: RecommendationReason = action.kind;
  let route = base.route;
  if (action.kind === 'finishChapter') {
    if (!chapter) { label = 'openCourse'; reason = 'contentUnavailable'; }
    else if (assessmentIds(bundle, `chapter:${chapter.id}`).length > 0) route = `/learn/quiz?kind=chapter&id=${chapter.id}`;
    else { label = 'openChapter'; reason = 'quizUnavailable'; }
  } else if (action.kind === 'startLearning' || action.kind === 'continueLesson') {
    if (!lesson) { label = 'openCourse'; reason = 'contentUnavailable'; }
    else if (action.kind === 'startLearning') { label = base.startsChapter ? 'startChapter' : 'startLesson'; if (base.startsChapter) reason = 'startChapter'; }
  } else if (action.kind === 'studyTopic' && !chapter) { label = 'openCourse'; reason = 'contentUnavailable'; }
  else if (action.kind === 'resumeExam' && !bundle.exams.some((exam) => exam.id === action.examId)) { label = 'takeMock'; reason = 'contentUnavailable'; }
  return { route, label, reason, subject: lesson?.title ?? base.subject, context: lesson && parent ? parent.title : null };
}
export function homeRecommendationModel(action: DashboardAction, alternative: NextStepAlternative | null, bundle: ContentBundle) {
  const primary = recommendationTarget(action, bundle);
  const candidate = alternative ? recommendationTarget(alternative.action, bundle) : null;
  const secondary = candidate && candidate.route !== primary.route ? {
    ...candidate,
    label: alternative?.label === 'reviewChapter' ? 'reviewChapter' as const : alternative?.action.kind === 'finishChapter' ? candidate.label : candidate.label === 'openCourse' ? 'openCourse' as const : candidate.label === 'takeMock' ? 'takeMock' as const : 'continueCourse' as const,
    subject: candidate.context && candidate.subject ? `${candidate.context} · ${candidate.subject}` : candidate.subject,
  } : null;
  return { primary, secondary, showExamWarning: primary.label === 'resumeExam' && secondary !== null };
}
