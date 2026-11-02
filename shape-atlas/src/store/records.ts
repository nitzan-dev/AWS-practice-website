import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AnswerMode } from '../game/config'
import { previousKey } from '../game/daily'
import type { GameState } from '../game/reducer'
import { safeStorage } from './storage'

export interface DailyResult {
  score: number
  results: boolean[]
  countries: string[]
  bestStreak: number
  answerMode: AnswerMode
}

interface RecordsState {
  /** Best score per `${mode}:${difficulty}:${answerMode}`. */
  best: Record<string, number>
  daily: Record<string, DailyResult>
  dailyStreak: { last: string | null; count: number }
  gamesPlayed: number
  /** Saves a finished game; returns whether it set a new best. */
  recordGame: (game: GameState) => boolean
  reset: () => void
}

export const bestKey = (g: Pick<GameState, 'config'>) =>
  `${g.config.mode}:${g.config.difficulty}:${g.config.answerMode}`

export const useRecords = create<RecordsState>()(
  persist(
    (set, get) => ({
      best: {},
      daily: {},
      dailyStreak: { last: null, count: 0 },
      gamesPlayed: 0,
      recordGame: (game) => {
        const s = get()
        const { config, score, history } = game
        if (config.mode === 'daily' && config.dailyKey) {
          const key = config.dailyKey
          if (s.daily[key]) return false
          const streak = s.dailyStreak.last === previousKey(key) ? s.dailyStreak.count + 1 : 1
          // keep the last 60 days
          const kept = Object.fromEntries(Object.entries(s.daily).sort().slice(-59))
          set({
            daily: { ...kept, [key]: {
                score,
                results: history.map((h) => h.correct),
                countries: history.map((h) => h.countryId),
                bestStreak: game.bestStreak,
                answerMode: config.answerMode,
              },
            },
            dailyStreak: { last: key, count: streak },
            gamesPlayed: s.gamesPlayed + 1,
          })
          return false
        }
        const k = bestKey(game)
        const isBest = score > 0 && score > (s.best[k] ?? 0)
        set({ best: isBest ? { ...s.best, [k]: score } : s.best, gamesPlayed: s.gamesPlayed + 1 })
        return isBest
      },
      reset: () => set({ best: {}, daily: {}, dailyStreak: { last: null, count: 0 }, gamesPlayed: 0 }),
    }),
    { name: 'shape-atlas:records', storage: safeStorage },
  ),
)
