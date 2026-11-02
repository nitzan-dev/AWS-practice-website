import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnswerMode, Difficulty } from '../game/config'
import { safeStorage } from './storage'

interface SettingsState {
  sound: boolean
  reduceMotion: boolean
  difficulty: Difficulty
  answerMode: AnswerMode
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      sound: true,
      reduceMotion: false,
      difficulty: 'easy',
      answerMode: 'choices',
      set: (patch) => set(patch),
    }),
    { name: 'shape-atlas:settings', storage: safeStorage },
  ),
)
