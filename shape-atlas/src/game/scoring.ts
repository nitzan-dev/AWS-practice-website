import { SPECS, type Difficulty } from './config'

export interface ScoreInput {
  difficulty: Difficulty
  correct: boolean
  /** 0..1 of the timer left when answering; null when untimed. */
  timeLeft: number | null
  /** Consecutive correct answers before this one. */
  streak: number
  hintsUsed: number
}

export const speedBonus = (timeLeft: number | null) => (timeLeft === null ? 1 : 1 + 0.5 * Math.max(0, Math.min(1, timeLeft)))

export const streakMultiplier = (streak: number) => Math.min(2, 1 + 0.1 * streak)

export function questionPoints({ difficulty, correct, timeLeft, streak, hintsUsed }: ScoreInput): number {
  if (!correct) return 0
  const spec = SPECS[difficulty]
  const raw = spec.basePoints * speedBonus(timeLeft) * streakMultiplier(streak) - spec.hintCost * hintsUsed
  // a correct answer is always worth something, even after expensive hints
  return Math.max(10, Math.round(raw))
}
