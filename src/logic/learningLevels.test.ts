import { describe, expect, jest, test } from '@jest/globals';
import { makeBundle } from '../test-utils/fixtures';
import { initialLearning, passesLearningQuiz, recordLearningQuiz } from './completion';
import { learningPassPercent } from './learningLevels';
import { useSettings } from '../store/settings';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: (key: string) => Promise.resolve(values.get(key) ?? null),
      setItem: (key: string, value: string) => { values.set(key, value); return Promise.resolve(); },
      removeItem: (key: string) => { values.delete(key); return Promise.resolve(); },
    },
  };
});

describe('configurable learning quiz target', () => {
  test('defaults to discovery and rejects unknown persisted levels', () => {
    expect(learningPassPercent(undefined)).toBe(75);
    expect(learningPassPercent('invalid')).toBe(75);
    expect(learningPassPercent('consolidation')).toBe(90);
    expect(learningPassPercent('mastery')).toBe(100);
  });
  test('compares exact scores without rounding', () => {
    expect(passesLearningQuiz(3, 4, 75)).toBe(true);
    expect(passesLearningQuiz(2, 3, 75)).toBe(false);
    expect(passesLearningQuiz(9, 10, 90)).toBe(true);
    expect(passesLearningQuiz(17, 19, 90)).toBe(false);
    expect(passesLearningQuiz(9, 10, 100)).toBe(false);
    expect(passesLearningQuiz(10, 10, 100)).toBe(true);
    expect(passesLearningQuiz(0, 0, 75)).toBe(false);
  });
  test('recording reads the saved setting and preserves earned completion', () => {
    const previous = useSettings.getState().quizLevel;
    try {
      const bundle = makeBundle();
      useSettings.getState().setQuizLevel('discovery');
      const earned = recordLearningQuiz(initialLearning(), bundle, 'chapter:1', 3, 4, 1);
      expect(earned.quizPassed['chapter:1'].passPercent).toBe(75);
      useSettings.getState().setQuizLevel('mastery');
      const retry = recordLearningQuiz(earned, bundle, 'chapter:1', 3, 4, 2);
      expect(retry.quizPassed['chapter:1'].at).toBe(1);
      expect(retry.quizResults['chapter:1'].passPercent).toBe(100);
    } finally { useSettings.getState().setQuizLevel(previous); }
  });
});
