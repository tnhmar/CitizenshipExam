import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Lang } from '../types';

export type ThemeMode = 'system' | 'light' | 'dark';
interface SettingsState {
  lang: Lang | null; onboarded: boolean; examDate: string | null; dailyGoalMin: number; reduceMotion: boolean; haptics: boolean; themeMode: ThemeMode; textScale: number;
  setLang: (lang: Lang) => void; setExamDate: (day: string | null) => void; setDailyGoal: (minutes: number) => void; setReduceMotion: (value: boolean) => void; setHaptics: (value: boolean) => void; setThemeMode: (mode: ThemeMode) => void; setTextScale: (scale: number) => void;
  completeOnboarding: (p: { lang: Lang; examDate: string | null; dailyGoalMin: number }) => void;
}
export const useSettings = create<SettingsState>()(persist((set) => ({
  lang: null, onboarded: false, examDate: null, dailyGoalMin: 20, reduceMotion: false, haptics: true, themeMode: 'system', textScale: 1,
  setLang: (lang) => set({ lang }), setExamDate: (examDate) => set({ examDate }), setDailyGoal: (dailyGoalMin) => set({ dailyGoalMin }), setReduceMotion: (reduceMotion) => set({ reduceMotion }), setHaptics: (haptics) => set({ haptics }), setThemeMode: (themeMode) => set({ themeMode }), setTextScale: (textScale) => set({ textScale }), completeOnboarding: (p) => set({ ...p, onboarded: true }),
}), { name: 'settings-v1', version: 2, storage: createJSONStorage(() => AsyncStorage) }));
