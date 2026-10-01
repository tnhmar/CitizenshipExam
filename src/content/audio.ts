import type { Lang } from '../types';
import { audioIndex, type AudioEntry } from './generated/audioIndex';

export function getAudio(lang: Lang, lessonId: number): AudioEntry | undefined {
  return audioIndex[lang][lessonId];
}
