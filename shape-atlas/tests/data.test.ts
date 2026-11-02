import { describe, expect, it } from 'vitest'
import { countries, byId } from './helpers'

describe('country data', () => {
  it('has exactly 197 countries with unique ids', () => {
    expect(countries).toHaveLength(197)
    expect(new Set(countries.map((c) => c.id)).size).toBe(197)
  })

  it('includes the four non-UN countries', () => {
    for (const id of ['VAT', 'PSE', 'XKX', 'TWN']) expect(byId.has(id)).toBe(true)
  })

  it('every country has a drawable path, a tier and metadata', () => {
    for (const c of countries) {
      expect(c.path.length, c.id).toBeGreaterThan(20)
      expect([1, 2, 3, 4]).toContain(c.tier)
      expect(c.continent, c.id).toBeTruthy()
      expect(c.iso2, c.id).toMatch(/^[a-z]{2}$/)
      expect(c.descriptors.aspect, c.id).toBeGreaterThan(0)
    }
  })

  it('borders only reference playable countries', () => {
    for (const c of countries) for (const b of c.borders) expect(byId.has(b), `${c.id}→${b}`).toBe(true)
  })

  it('tier sizes are balanced', () => {
    const count = (t: number) => countries.filter((c) => c.tier === t).length
    expect(count(1)).toBeGreaterThanOrEqual(40)
    expect(count(2)).toBeGreaterThanOrEqual(45)
    expect(count(3)).toBeGreaterThanOrEqual(45)
    expect(count(4)).toBeGreaterThanOrEqual(30)
  })
})
