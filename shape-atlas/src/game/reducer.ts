import type { Country } from '../data/types'
import {
  CLASSIC_LENGTH,
  DAILY_LENGTH,
  DAILY_MIX,
  DIFFICULTIES,
  SPECS,
  SURVIVAL_LIVES,
  SURVIVAL_RAMP,
  type AnswerMode,
  type Difficulty,
  type GameMode,
  type HintKind,
} from './config'
import { makeQuestion, makeQuestionSet, type Question } from './questions'
import { questionPoints } from './scoring'

export interface GameConfig {
  mode: GameMode
  difficulty: Difficulty
  answerMode: AnswerMode
  seed: string
  /** UTC date key for daily games. */
  dailyKey?: string
}

export interface RoundRecord {
  countryId: string
  difficulty: Difficulty
  correct: boolean
  /** What the player picked or typed (country id), null on timeout. */
  answerId: string | null
  points: number
  hints: HintKind[]
}

export interface GameState {
  config: GameConfig
  questions: Question[]
  index: number
  phase: 'question' | 'reveal' | 'over'
  score: number
  streak: number
  bestStreak: number
  /** null = no lives system. */
  lives: number | null
  hints: HintKind[]
  history: RoundRecord[]
}

export type GameAction =
  | { type: 'answer'; answerId: string | null; timeLeft: number | null }
  | { type: 'hint'; kind: HintKind }
  | { type: 'next' }

export const currentQuestion = (s: GameState) => s.questions[s.index]

/** Survival steps up from the chosen difficulty every SURVIVAL_RAMP correct answers. */
export function survivalDifficulty(start: Difficulty, correct: number): Difficulty {
  const i = Math.min(DIFFICULTIES.length - 1, DIFFICULTIES.indexOf(start) + Math.floor(correct / SURVIVAL_RAMP))
  return DIFFICULTIES[i]
}

export function initGame(config: GameConfig, countries: Country[]): GameState {
  const base = {
    config,
    index: 0,
    phase: 'question' as const,
    score: 0,
    streak: 0,
    bestStreak: 0,
    hints: [],
    history: [],
  }
  switch (config.mode) {
    case 'classic':
      return {
        ...base,
        lives: null,
        questions: makeQuestionSet(config.seed, Array(CLASSIC_LENGTH).fill(config.difficulty), countries),
      }
    case 'daily':
      return { ...base, lives: null, questions: makeQuestionSet(config.seed, DAILY_MIX.slice(0, DAILY_LENGTH), countries) }
    case 'survival':
      return {
        ...base,
        lives: SURVIVAL_LIVES,
        questions: [makeQuestion(`${config.seed}:0`, config.difficulty, countries, new Set())],
      }
  }
}

export function createGameReducer(countries: Country[]) {
  return function reducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'hint': {
        const q = currentQuestion(state)
        if (state.phase !== 'question' || state.hints.includes(action.kind)) return state
        if (state.hints.length >= SPECS[q.difficulty].hints) return state
        return { ...state, hints: [...state.hints, action.kind] }
      }

      case 'answer': {
        if (state.phase !== 'question') return state
        const q = currentQuestion(state)
        const correct = action.answerId === q.countryId
        const points = questionPoints({
          difficulty: q.difficulty,
          correct,
          timeLeft: action.timeLeft,
          streak: state.streak,
        })
        const streak = correct ? state.streak + 1 : 0
        return {
          ...state,
          phase: 'reveal',
          score: state.score + points,
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          lives: state.lives !== null && !correct ? state.lives - 1 : state.lives,
          history: [
            ...state.history,
            { countryId: q.countryId, difficulty: q.difficulty, correct, answerId: action.answerId, points, hints: state.hints },
          ],
        }
      }

      case 'next': {
        if (state.phase !== 'reveal') return state
        const { config } = state
        if (config.mode === 'survival') {
          if (state.lives === 0) return { ...state, phase: 'over' }
          const correctSoFar = state.history.filter((h) => h.correct).length
          const used = new Set(state.history.map((h) => h.countryId))
          const nextIndex = state.index + 1
          const q = makeQuestion(
            `${config.seed}:${nextIndex}`,
            survivalDifficulty(config.difficulty, correctSoFar),
            countries,
            used,
          )
          return { ...state, phase: 'question', index: nextIndex, hints: [], questions: [...state.questions, q] }
        }
        if (state.index + 1 >= state.questions.length) return { ...state, phase: 'over' }
        return { ...state, phase: 'question', index: state.index + 1, hints: [] }
      }
    }
  }
}
