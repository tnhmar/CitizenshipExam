export const LEARNING_LEVELS = ['discovery', 'consolidation', 'mastery'] as const;
export type LearningLevel = typeof LEARNING_LEVELS[number];
export const DEFAULT_LEARNING_LEVEL: LearningLevel = 'discovery';
export const LEARNING_THRESHOLDS: Record<LearningLevel, number> = {
  discovery: 75,
  consolidation: 90,
  mastery: 100,
};
export function normalizeLearningLevel(value: unknown): LearningLevel {
  return value === 'discovery' || value === 'consolidation' || value === 'mastery'
    ? value : DEFAULT_LEARNING_LEVEL;
}
export function learningPassPercent(value: unknown): number {
  return LEARNING_THRESHOLDS[normalizeLearningLevel(value)];
}
