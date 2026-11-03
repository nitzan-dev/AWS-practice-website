import { SPECS, type Difficulty } from './config'

export interface ScoreInput {
  difficulty: Difficulty
  correct: boolean
  /** 0..1 of the timer left when answering; null when untimed. */
  timeLeft: number | null
  /** Consecutive correct answers before this one. */
  streak: number
}

export const speedBonus = (timeLeft: number | null) => (timeLeft === null ? 1 : 1 + 0.5 * Math.max(0, Math.min(1, timeLeft)))

export const streakMultiplier = (streak: number) => Math.min(2, 1 + 0.1 * streak)

export function questionPoints({ difficulty, correct, timeLeft, streak }: ScoreInput): number {
  if (!correct) return 0
  return Math.round(SPECS[difficulty].basePoints * speedBonus(timeLeft) * streakMultiplier(streak))
}
