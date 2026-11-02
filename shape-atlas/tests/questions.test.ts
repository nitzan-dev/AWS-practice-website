import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, SPECS } from '../src/game/config'
import { makeQuestion, makeQuestionSet, poolFor } from '../src/game/questions'
import { byId, countries } from './helpers'

describe('questions', () => {
  it('pools grow with difficulty and very hard covers all 197', () => {
    const sizes = DIFFICULTIES.map((d) => poolFor(d, countries).length)
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    expect(sizes[3]).toBe(197)
  })

  for (const d of DIFFICULTIES) {
    it(`${d}: 4 unique options including the answer, target in pool`, () => {
      for (let i = 0; i < 300; i++) {
        const q = makeQuestion(`t:${d}:${i}`, d, countries, new Set())
        expect(new Set(q.options).size).toBe(4)
        expect(q.options).toContain(q.countryId)
        expect(SPECS[d].tiers).toContain(byId.get(q.countryId)!.tier)
        expect(Math.abs(q.rotation)).toBeLessThanOrEqual(SPECS[d].rotate)
      }
    })
  }

  it('easy decoys come from other continents', () => {
    for (let i = 0; i < 200; i++) {
      const q = makeQuestion(`e:${i}`, 'easy', countries, new Set())
      const target = byId.get(q.countryId)!
      for (const id of q.options.filter((o) => o !== q.countryId)) expect(byId.get(id)!.continent).not.toBe(target.continent)
    }
  })

  it('medium and hard decoys share the continent', () => {
    for (const d of ['medium', 'hard'] as const) {
      for (let i = 0; i < 200; i++) {
        const q = makeQuestion(`m:${d}:${i}`, d, countries, new Set())
        const target = byId.get(q.countryId)!
        for (const id of q.options) expect(byId.get(id)!.continent).toBe(target.continent)
      }
    }
  })

  it('a question set has no repeats and is deterministic', () => {
    const a = makeQuestionSet('seed-1', Array(15).fill('hard'), countries)
    const b = makeQuestionSet('seed-1', Array(15).fill('hard'), countries)
    expect(a).toEqual(b)
    expect(new Set(a.map((q) => q.countryId)).size).toBe(15)
  })
})
