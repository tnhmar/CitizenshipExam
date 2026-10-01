import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ReminderPrefs } from '../logic/reminders';

export type ReminderStatus = 'off' | 'ready' | 'blocked' | 'error' | 'unsupported';
interface Report { status: ReminderStatus; count: number; nextAt: number | null; until: number | null; error: string | null; }
interface State { prefs: ReminderPrefs; report: Report; setPrefs: (patch: Partial<ReminderPrefs>) => void; setReport: (report: Report) => void; }

export const useReminderSettings = create<State>()(persist((set) => ({
  prefs: { enabled: false, study: true, review: true, exam: true, time: '20:00' },
  report: { status: 'off', count: 0, nextAt: null, until: null, error: null },
  setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
  setReport: (report) => set({ report }),
}), { name: 'reminders-v1', version: 1, storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ prefs: s.prefs }) }));
