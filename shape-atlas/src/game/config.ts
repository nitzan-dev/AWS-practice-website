import type { Tier } from '../data/types'

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'veryhard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]
export type AnswerMode = 'choices' | 'typing'
export type GameMode = 'classic' | 'survival' | 'daily'
export type HintKind = 'continent' | 'letters' | 'neighbors' | 'capital'

export interface DifficultySpec {
  label: string
  tagline: string
  tiers: Tier[]
  tierWeight: Record<Tier, number>
  /** Seconds per shape; null = untimed. */
  timer: number | null
  outline: boolean
  /** Max random rotation in degrees (±). */
  rotate: number
  showContinent: boolean
  showScale: boolean
  /** Characters typed before suggestions appear; null = no autocomplete. */
  autocompleteAfter: number | null
  typoTolerance: number
  /** Hints usable per shape. */
  hints: number
  hintCost: number
  basePoints: number
}

export const SPECS: Record<Difficulty, DifficultySpec> = {
  easy: {
    label: 'Easy',
    tagline: 'Famous shapes, no clock',
    tiers: [1],
    tierWeight: { 1: 1, 2: 0, 3: 0, 4: 0 },
    timer: null,
    outline: false,
    rotate: 0,
    showContinent: true,
    showScale: true,
    autocompleteAfter: 1,
    typoTolerance: 2,
    hints: 3,
    hintCost: 0,
    basePoints: 100,
  },
  medium: {
    label: 'Medium',
    tagline: 'Well-known countries, 30s',
    tiers: [1, 2],
    tierWeight: { 1: 1, 2: 1.4, 3: 0, 4: 0 },
    timer: 30,
    outline: false,
    rotate: 0,
    showContinent: false,
    showScale: true,
    autocompleteAfter: 2,
    typoTolerance: 2,
    hints: 3,
    hintCost: 30,
    basePoints: 150,
  },
  hard: {
    label: 'Hard',
    tagline: 'Look-alikes, 20s',
    tiers: [1, 2, 3],
    tierWeight: { 1: 0.6, 2: 1, 3: 1.6, 4: 0 },
    timer: 20,
    outline: false,
    rotate: 0,
    showContinent: false,
    showScale: true,
    autocompleteAfter: 3,
    typoTolerance: 1,
    hints: 2,
    hintCost: 50,
    basePoints: 225,
  },
  veryhard: {
    label: 'Very Hard',
    tagline: 'All 197, outline only, 12s',
    tiers: [1, 2, 3, 4],
    tierWeight: { 1: 0.4, 2: 0.8, 3: 2, 4: 3 },
    timer: 12,
    outline: true,
    rotate: 15,
    showContinent: false,
    showScale: false,
    autocompleteAfter: null,
    typoTolerance: 1,
    hints: 1,
    hintCost: 120,
    basePoints: 350,
  },
}

export const answerModeLabel = (m: AnswerMode) => (m === 'choices' ? '4 choices' : 'Typing')

export const HINT_ORDER: HintKind[] = ['continent', 'letters', 'neighbors', 'capital']

/** Hint kinds offered at a difficulty (continent is free and always shown on Easy). */
export const hintKindsFor = (d: Difficulty): HintKind[] =>
  SPECS[d].showContinent ? HINT_ORDER.filter((k) => k !== 'continent') : HINT_ORDER

export const HINT_LABEL: Record<HintKind, string> = {
  continent: 'Continent',
  letters: 'Letters',
  neighbors: 'Neighbours',
  capital: 'Capital',
}

export const CLASSIC_LENGTH = 15
export const DAILY_LENGTH = 10
export const SURVIVAL_LIVES = 3
/** Survival steps up one difficulty every N correct answers. */
export const SURVIVAL_RAMP = 10
export const DAILY_MIX: Difficulty[] = [
  'easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'veryhard',
]
