import type { Tier } from '../data/types'

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'veryhard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]
export type AnswerMode = 'choices' | 'typing' | 'map'
export type GameMode = 'classic' | 'survival' | 'daily'
export type HintKind = 'continent' | 'letters' | 'neighbors' | 'capital' | 'shape'

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
    tagline: 'Famous countries, no clock',
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
    tagline: 'Well-known countries',
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
    tagline: 'Look-alikes and lesser-known',
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
    tagline: 'All 197. Outlines only, borders hidden on the map',
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

export const ANSWER_MODE_LABEL: Record<AnswerMode, string> = { choices: '4 choices', typing: 'Typing', map: 'Find on map' }
export const answerModeLabel = (m: AnswerMode) => ANSWER_MODE_LABEL[m]

/** Finding a country on the map takes longer than recognising a shape, so it gets extra time. */
export const MAP_EXTRA_SECONDS = 10

export const timerFor = (d: Difficulty, mode: AnswerMode): number | null => {
  const t = SPECS[d].timer
  return t === null ? null : mode === 'map' ? t + MAP_EXTRA_SECONDS : t
}

/** In map mode the flag is shown next to the name on the easier levels. */
export const showFlagFor = (d: Difficulty) => d === 'easy' || d === 'medium'

export const HINT_ORDER: HintKind[] = ['continent', 'letters', 'neighbors', 'capital']
/** In map mode the name is already shown, so the letters hint becomes a peek at the shape. */
export const MAP_HINT_ORDER: HintKind[] = ['continent', 'shape', 'neighbors', 'capital']

/** Hint kinds offered (continent is free and always shown on Easy). */
export const hintKindsFor = (d: Difficulty, mode: AnswerMode = 'choices'): HintKind[] => {
  const order = mode === 'map' ? MAP_HINT_ORDER : HINT_ORDER
  return SPECS[d].showContinent ? order.filter((k) => k !== 'continent') : order
}

export const HINT_LABEL: Record<HintKind, string> = {
  continent: 'Continent',
  letters: 'Letters',
  neighbors: 'Neighbours',
  capital: 'Capital',
  shape: 'Shape',
}

export const CLASSIC_LENGTH = 15
export const DAILY_LENGTH = 10
export const SURVIVAL_LIVES = 3
/** Survival steps up one difficulty every N correct answers. */
export const SURVIVAL_RAMP = 10
export const DAILY_MIX: Difficulty[] = [
  'easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'veryhard',
]
