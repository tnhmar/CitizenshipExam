import type { ContentBundle, ExamAttempt, SrsCard } from '../types';
import { requiredToPass } from './exam';
import { dayKey, startOfDay } from './progress';

export type AssessmentMode = 'lesson' | 'chapter' | 'review' | 'bookmark' | 'mock' | 'practiceExam';
export interface AssessmentEvent {
  id: string;
  sessionId: string;
  questionId: number;
  conceptId: string;
  at: number;
  mode: AssessmentMode;
  response: 'objective' | 'selfReport';
  correct: boolean;
  firstResponse: boolean;
  retry: 'none' | 'full' | 'missed';
  confidence: 'know' | 'guess' | 'unknown' | null;
}
export interface AssessmentHistory {
  assessmentEvents: AssessmentEvent[];
  assessmentHistoryStartedAt: number | null;
  assessmentHistoryTruncatedBefore: number | null;
}
export interface EvidenceTally {
  correct: number;
  total: number;
  accuracy: number | null;
  distinctConcepts: number;
}
export interface ExamEvidence {
  attempt: ExamAttempt;
  correct: number;
  total: number;
  answered: number;
  required: number;
  passed: boolean;
  ratio: number;
}
export type TopicEvidenceStatus = 'notAssessed' | 'limitedEvidence' | 'needsReview' | 'learning' | 'strongEvidence';
export interface TopicEvidence extends EvidenceTally {
  chapterId: number;
  assessableConcepts: number;
  coverage: number | null;
  days: number;
  lastAssessedAt: number | null;
  status: TopicEvidenceStatus;
}
export const HISTORY_LIMIT = 5000;
export const EVIDENCE_WINDOW_MS = 30 * 86400000;
export const RECALL_DELAY_MS = 86400000;
const MODES: AssessmentMode[] = ['lesson', 'chapter', 'review', 'bookmark', 'mock', 'practiceExam'];
export const initialAssessmentHistory = (): AssessmentHistory => ({ assessmentEvents: [], assessmentHistoryStartedAt: null, assessmentHistoryTruncatedBefore: null });
export function validAssessmentEvent(e: AssessmentEvent): boolean {
  return Boolean(e && typeof e.id === 'string' && e.id.length && typeof e.sessionId === 'string' && e.sessionId.length && typeof e.conceptId === 'string' && e.conceptId.length && Number.isSafeInteger(e.questionId) && e.questionId > 0 && Number.isFinite(e.at) && e.at >= 0 && MODES.includes(e.mode) && (e.response === 'objective' || e.response === 'selfReport') && typeof e.correct === 'boolean' && typeof e.firstResponse === 'boolean' && ['none', 'full', 'missed'].includes(e.retry) && (e.confidence === null || ['know', 'guess', 'unknown'].includes(e.confidence)));
}
export function appendAssessmentEvent(h: AssessmentHistory, e: AssessmentEvent): AssessmentHistory {
  if (!validAssessmentEvent(e) || h.assessmentEvents.some((x) => x.id === e.id)) return h;
  const all = [...h.assessmentEvents, { ...e }].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  const removed = all.slice(0, Math.max(0, all.length - HISTORY_LIMIT));
  return { assessmentEvents: all.slice(-HISTORY_LIMIT), assessmentHistoryStartedAt: h.assessmentHistoryStartedAt === null ? e.at : Math.min(h.assessmentHistoryStartedAt, e.at), assessmentHistoryTruncatedBefore: removed.length ? Math.max(h.assessmentHistoryTruncatedBefore ?? 0, removed[removed.length - 1].at) : h.assessmentHistoryTruncatedBefore };
}
export function migrateAssessmentHistory(): AssessmentHistory {
  // The old schema has no reliable first-response or session timestamps to backfill.
  return initialAssessmentHistory();
}
export function conceptPool(bundle: ContentBundle, chapterId?: number): Set<string> {
  const concepts = new Set<string>();
  for (const l of bundle.lessons) {
    if (chapterId !== undefined && l.chapterId !== chapterId) continue;
    for (const id of l.questionIds) { const q = bundle.questions[id]; if (q) concepts.add(q.conceptId); }
  }
  return concepts;
}
export function objectiveFirstResponses(events: AssessmentEvent[], now: number): AssessmentEvent[] {
  const seen = new Set<string>();
  return [...events].filter(validAssessmentEvent).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id)).filter((e) => {
    if (e.at > now || e.response !== 'objective' || !e.firstResponse || e.retry === 'missed') return false;
    const key = JSON.stringify([e.sessionId, e.conceptId]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function tally(events: AssessmentEvent[]): EvidenceTally {
  const correct = events.filter((e) => e.correct).length;
  return { correct, total: events.length, accuracy: events.length ? correct / events.length : null, distinctConcepts: new Set(events.map((e) => e.conceptId)).size };
}
export function assessmentCoverage(bundle: ContentBundle, events: AssessmentEvent[], now: number): EvidenceTally & { assessableConcepts: number; coverage: number | null } {
  const pool = conceptPool(bundle);
  const eligible = objectiveFirstResponses(events, now).filter((e) => pool.has(e.conceptId));
  const result = tally(eligible);
  return { ...result, assessableConcepts: pool.size, coverage: pool.size ? result.distinctConcepts / pool.size : null };
}
export function recentPracticeEvidence(bundle: ContentBundle, events: AssessmentEvent[], now: number): EvidenceTally {
  const pool = conceptPool(bundle); const latest = new Map<string, AssessmentEvent>();
  for (const e of objectiveFirstResponses(events, now)) {
    if (!pool.has(e.conceptId) || e.at < now - EVIDENCE_WINDOW_MS || e.mode === 'mock' || e.mode === 'practiceExam') continue;
    latest.set(e.conceptId, e);
  }
  return tally([...latest.values()]);
}
export function delayedRecallEvidence(bundle: ContentBundle, events: AssessmentEvent[], now: number): EvidenceTally {
  const pool = conceptPool(bundle); const eligible = new Set(objectiveFirstResponses(events, now).map((e) => e.id));
  const previous = new Map<string, number>(); const latest = new Map<string, AssessmentEvent>();
  for (const e of [...events].filter(validAssessmentEvent).filter((e) => e.at <= now).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))) {
    if (!pool.has(e.conceptId)) continue;
    const prior = previous.get(e.conceptId);
    if (e.mode === 'review' && eligible.has(e.id) && prior !== undefined && e.at - prior >= RECALL_DELAY_MS && e.at >= now - EVIDENCE_WINDOW_MS) latest.set(e.conceptId, e);
    previous.set(e.conceptId, e.at);
  }
  return tally([...latest.values()]);
}
export function topicEvidence(bundle: ContentBundle, events: AssessmentEvent[], now: number): TopicEvidence[] {
  const first = objectiveFirstResponses(events, now).filter((e) => e.at >= now - EVIDENCE_WINDOW_MS);
  return bundle.chapters.map((c) => {
    const pool = conceptPool(bundle, c.id); const rows = first.filter((e) => pool.has(e.conceptId));
    const latest = new Map<string, AssessmentEvent>();
    for (const e of rows) latest.set(e.conceptId, e);
    const result = tally([...latest.values()]); const coverage = pool.size ? result.distinctConcepts / pool.size : null;
    const days = new Set(rows.map((e) => dayKey(e.at))).size;
    const guessed = [...latest.values()].some((e) => e.confidence === 'guess');
    const status: TopicEvidenceStatus = !result.total ? 'notAssessed' : result.distinctConcepts < 5 ? 'limitedEvidence' : (result.accuracy ?? 0) < 0.75 ? 'needsReview' : (result.accuracy ?? 0) >= 0.90 && (coverage ?? 0) >= 0.60 && days >= 2 && !guessed ? 'strongEvidence' : 'learning';
    return { ...result, chapterId: c.id, assessableConcepts: pool.size, coverage, days, lastAssessedAt: rows.length ? rows[rows.length - 1].at : null, status };
  });
}
export function examEvidence(a: ExamAttempt, passMark: number, examSize: number): ExamEvidence | null {
  if (!Number.isFinite(a.startedAt) || a.startedAt < 0 || a.finishedAt === null || !Number.isFinite(a.finishedAt) || a.finishedAt < a.startedAt || !Number.isFinite(a.limitMs) || a.limitMs <= 0 || !Number.isSafeInteger(examSize) || examSize <= 0 || !Number.isSafeInteger(passMark) || passMark <= 0 || passMark > examSize) return null;
  const ids = new Set(a.questionIds); if (!ids.size) return null;
  const answers = new Map(a.answers.filter((x) => ids.has(x.questionId)).map((x) => [x.questionId, x]));
  const answered = [...answers.values()].filter((x) => x.chosen !== null).length;
  const correct = [...answers.values()].filter((x) => x.chosen !== null && x.correct).length;
  const required = requiredToPass(ids.size, passMark, examSize);
  return { attempt: a, correct, total: ids.size, answered, required, passed: correct >= required, ratio: correct / ids.size };
}
export function finishedExamEvidence(bundle: ContentBundle, attempts: ExamAttempt[], now: number): ExamEvidence[] {
  return attempts.map((a) => examEvidence(a, bundle.passMark, bundle.examSize)).filter((e): e is ExamEvidence => e !== null && (e.attempt.finishedAt ?? 0) <= now).sort((a, b) => (b.attempt.finishedAt ?? 0) - (a.attempt.finishedAt ?? 0) || b.attempt.id.localeCompare(a.attempt.id));
}
export function bestExamEvidence(bundle: ContentBundle, attempts: ExamAttempt[], now: number): ExamEvidence | null {
  return [...finishedExamEvidence(bundle, attempts, now)].sort((a, b) => b.ratio - a.ratio || b.total - a.total || (b.attempt.finishedAt ?? 0) - (a.attempt.finishedAt ?? 0))[0] ?? null;
}
export function recentMockEvidence(bundle: ContentBundle, attempts: ExamAttempt[], now: number): ExamEvidence[] {
  const mockIds = new Set(bundle.exams.filter((e) => e.kind === 'mock').map((e) => e.id));
  return finishedExamEvidence(bundle, attempts, now).filter((e) => mockIds.has(e.attempt.examId) && e.attempt.limitMs > 0 && (e.attempt.finishedAt ?? 0) >= now - EVIDENCE_WINDOW_MS).slice(0, 5);
}
export function examImprovement(bundle: ContentBundle, attempts: ExamAttempt[], now: number): number | null {
  const mockIds = new Set(bundle.exams.filter((e) => e.kind === 'mock').map((e) => e.id));
  const all = finishedExamEvidence(bundle, attempts, now).filter((e) => mockIds.has(e.attempt.examId) && (e.attempt.finishedAt ?? 0) >= now - EVIDENCE_WINDOW_MS);
  if (!all.length) return null;
  const comparable = all.filter((e) => e.total === all[0].total).slice(0, 6);
  if (comparable.length < 6) return null;
  const mean = (rows: ExamEvidence[]) => rows.reduce((s, e) => s + e.ratio, 0) / rows.length;
  return (mean(comparable.slice(0, 3)) - mean(comparable.slice(3, 6))) * 100;
}
export function reviewWorkload(bundle: ContentBundle, cards: SrsCard[], now: number): { due: number; overdue: number } {
  const pool = conceptPool(bundle); const unique = new Map(cards.filter((c) => pool.has(c.conceptId)).map((c) => [c.conceptId, c]));
  const rows = [...unique.values()].filter((c) => Number.isFinite(c.due));
  return { due: rows.filter((c) => c.due <= now).length, overdue: rows.filter((c) => c.due < startOfDay(now)).length };
}
