import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { glossaryLanguage, type GlossaryLanguage } from '../logic/glossaryLanguages';

interface State { language: GlossaryLanguage; setLanguage: (language: GlossaryLanguage) => void; }
export const useGlossaryLanguage = create<State>()(persist((set) => ({
  language: 'ar',
  setLanguage: (language) => set({ language: glossaryLanguage(language) }),
}), {
  name: 'glossary-language-v1', version: 1, storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ language: state.language }),
  merge: (persisted, current) => ({ ...current, language: glossaryLanguage((persisted as { language?: unknown } | undefined)?.language) }),
}));
