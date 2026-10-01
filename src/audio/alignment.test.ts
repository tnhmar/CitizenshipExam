import { describe, expect, test } from '@jest/globals';
import type { Block } from '../types';
import { activeBlocks, alignSentences, layoutBlocks, sentencesFromTiming } from './alignment';

const blocks: Block[] = [
  { k: 'p', t: 'Hello **world**. Second sentence.' },
  { k: 'li', t: 'Item one' },
];

const timing = {
  result: true,
  data: {
    speech: [
      { type: 'sentence', value: 'Title.', start: 0, end: 6, time: 0 },
      { type: 'word', value: 'Title', start: 0, end: 5, time: 0 },
      { type: 'sentence', value: 'Hello world.', start: 8, end: 20, time: 100 },
      { type: 'sentence', value: 'Second sentence.', start: 21, end: 37, time: 2000 },
      { type: 'sentence', value: 'Item one', start: 38, end: 46, time: 4000 },
    ],
  },
};

describe('sentencesFromTiming', () => {
  test('keeps sentences only and tolerates bad input', () => {
    expect(sentencesFromTiming(timing).map((s) => s.startMs)).toEqual([0, 100, 2000, 4000]);
    expect(sentencesFromTiming(null)).toEqual([]);
    expect(sentencesFromTiming({ data: {} })).toEqual([]);
  });
});

describe('alignment', () => {
  const layout = layoutBlocks(blocks);
  const spans = alignSentences(layout.text, sentencesFromTiming(timing), 'Title');

  test('lays blocks out without markdown markers', () => {
    expect(layout.text).toBe('Hello world. Second sentence. Item one');
    expect(layout.ranges).toEqual([
      { start: 0, end: 29 },
      { start: 30, end: 38 },
    ]);
  });

  test('skips the spoken title and aligns the body sentences', () => {
    expect(spans).toHaveLength(3);
    expect(spans[0]).toMatchObject({ start: 0, end: 12, startMs: 100 });
  });

  test('finds the block being read at a given time', () => {
    expect(activeBlocks(layout.ranges, spans, 50)).toEqual([]);
    expect(activeBlocks(layout.ranges, spans, 150)).toEqual([0]);
    expect(activeBlocks(layout.ranges, spans, 2500)).toEqual([0]);
    expect(activeBlocks(layout.ranges, spans, 4500)).toEqual([1]);
  });

  test('a sentence that cannot be found is skipped, not fatal', () => {
    const out = alignSentences(layout.text, [{ text: 'Not in the lesson at all', startMs: 5 }], 'Title');
    expect(out).toEqual([]);
  });
});
