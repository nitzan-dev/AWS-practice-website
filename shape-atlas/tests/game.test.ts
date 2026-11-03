import { describe, expect, it } from 'vitest'
import { dailyKey, previousKey, shareText } from '../src/game/daily'
import { createGameReducer, initGame, survivalDifficulty, type GameState } from '../src/game/reducer'
import { questionPoints, streakMultiplier } from '../src/game/scoring'
import { countries } from './helpers'

const reducer = createGameReducer(countries)

function answerAll(state: GameState, correct: (i: number) => boolean) {
  let s = state
  let guard = 0
  while (s.phase !== 'over' && guard++ < 200) {
    const q = s.questions[s.index]
    const wrong = q.options.find((o) => o !== q.countryId)!
    s = reducer(s, { type: 'answer', answerId: correct(s.index) ? q.countryId : wrong, timeLeft: null })
    s = reducer(s, { type: 'next' })
  }
  return s
}

describe('scoring', () => {
  it('rewards speed, streaks and difficulty', () => {
    expect(questionPoints({ difficulty: 'easy', correct: true, timeLeft: null, streak: 0 })).toBe(100)
    expect(questionPoints({ difficulty: 'hard', correct: true, timeLeft: 1, streak: 0 })).toBe(338)
    expect(questionPoints({ difficulty: 'medium', correct: true, timeLeft: 0, streak: 5 })).toBe(225)
    expect(questionPoints({ difficulty: 'hard', correct: false, timeLeft: 1, streak: 9 })).toBe(0)
    expect(streakMultiplier(50)).toBe(2)
  })
})

describe('game reducer', () => {
  it('classic runs 15 rounds and tracks streaks', () => {
    const s = answerAll(initGame({ mode: 'classic', difficulty: 'easy', answerMode: 'choices', seed: 'x' }, countries), (i) => i !== 4)
    expect(s.history).toHaveLength(15)
    expect(s.bestStreak).toBe(10)
    expect(s.score).toBeGreaterThan(0)
  })

  it('daily is the same for everyone on a date and has the difficulty mix', () => {
    const a = initGame({ mode: 'daily', difficulty: 'easy', answerMode: 'choices', seed: 'daily:2026-11-03' }, countries)
    const b = initGame({ mode: 'daily', difficulty: 'hard', answerMode: 'typing', seed: 'daily:2026-11-03' }, countries)
    expect(a.questions).toEqual(b.questions)
    expect(a.questions.map((q) => q.difficulty).at(-1)).toBe('veryhard')
    expect(answerAll(a, () => true).history).toHaveLength(10)
  })

  it('survival ends after three misses', () => {
    const s = answerAll(initGame({ mode: 'survival', difficulty: 'medium', answerMode: 'choices', seed: 's' }, countries), (i) => i % 4 !== 3)
    expect(s.lives).toBe(0)
    expect(s.history.filter((h) => !h.correct)).toHaveLength(3)
    expect(s.history).toHaveLength(12)
  })

  it('survival ramps difficulty', () => {
    expect(survivalDifficulty('easy', 9)).toBe('easy')
    expect(survivalDifficulty('easy', 10)).toBe('medium')
    expect(survivalDifficulty('hard', 50)).toBe('veryhard')
  })

  it('gives 3 hints on Easy, ignoring duplicates', () => {
    let s = initGame({ mode: 'classic', difficulty: 'easy', answerMode: 'typing', seed: 'h' }, countries)
    for (const kind of ['letters', 'letters', 'neighbors', 'capital', 'continent'] as const) s = reducer(s, { type: 'hint', kind })
    expect(s.hints).toEqual(['letters', 'neighbors', 'capital'])
  })

  it('gives no hints above Easy', () => {
    for (const difficulty of ['medium', 'hard', 'veryhard'] as const) {
      let s = initGame({ mode: 'classic', difficulty, answerMode: 'choices', seed: 'h' }, countries)
      s = reducer(s, { type: 'hint', kind: 'capital' })
      expect(s.hints).toEqual([])
    }
  })

  it('ignores answers outside the question phase', () => {
    let s = initGame({ mode: 'classic', difficulty: 'easy', answerMode: 'choices', seed: 'p' }, countries)
    s = reducer(s, { type: 'answer', answerId: null, timeLeft: 0 })
    const again = reducer(s, { type: 'answer', answerId: s.questions[0].countryId, timeLeft: 1 })
    expect(again).toBe(s)
  })
})

describe('daily helpers', () => {
  it('formats keys and share text', () => {
    expect(dailyKey(new Date('2026-11-03T23:59:00Z'))).toBe('2026-11-03')
    expect(previousKey('2026-03-01')).toBe('2026-02-28')
    expect(shareText('2026-11-03', [{ correct: true }, { correct: false }], 1234)).toBe(
      'Atlas Challenge Daily 2026-11-03\n🟩🟥\n1/2 · 1,234 pts',
    )
  })
})
