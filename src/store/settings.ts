import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Lang } from '../types';

interface SettingsState {
  lang: Lang | null;
  onboarded: boolean;
  examDate: string | null;
  dailyGoalMin: number;
  reduceMotion: boolean;
  setLang: (lang: Lang) => void;
  setExamDate: (day: string | null) => void;
  setDailyGoal: (minutes: number) => void;
  setReduceMotion: (value: boolean) => void;
  completeOnboarding: (p: { lang: Lang; examDate: string | null; dailyGoalMin: number }) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: null,
      onboarded: false,
      examDate: null,
      dailyGoalMin: 20,
      reduceMotion: false,
      setLang: (lang) => set({ lang }),
      setExamDate: (examDate) => set({ examDate }),
      setDailyGoal: (dailyGoalMin) => set({ dailyGoalMin }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      completeOnboarding: (p) => set({ ...p, onboarded: true }),
    }),
    { name: 'settings-v1', version: 1, storage: createJSONStorage(() => AsyncStorage) },
  ),
);
