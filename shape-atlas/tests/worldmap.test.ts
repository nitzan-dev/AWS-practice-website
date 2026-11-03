import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { WorldMapData } from '../src/data/types'
import { hintKindsFor, timerFor } from '../src/game/config'
import { countries } from './helpers'

const map = JSON.parse(readFileSync(new URL('../src/data/worldmap.json', import.meta.url), 'utf8')) as WorldMapData

describe('world map data', () => {
  it('has a clickable shape for every one of the 197 countries', () => {
    const ids = new Set(map.countries.map((c) => c.id))
    expect(ids.size).toBe(197)
    for (const c of countries) expect(ids.has(c.id), c.id).toBe(true)
    for (const c of map.countries) expect(c.d.length, c.id).toBeGreaterThan(10)
  })

  it('marks microstates with dots but not big countries', () => {
    const dot = (id: string) => !!map.countries.find((c) => c.id === id)!.dot
    for (const id of ['VAT', 'MCO', 'SMR', 'LIE', 'TUV', 'NRU']) expect(dot(id), id).toBe(true)
    for (const id of ['FRA', 'BRA', 'RUS', 'EGY']) expect(dot(id), id).toBe(false)
  })

  it('zoom boxes stay local for countries crossing the antimeridian', () => {
    const width = map.viewBox[2]
    for (const id of ['RUS', 'FJI', 'USA']) {
      const b = map.countries.find((c) => c.id === id)!.b
      expect(b[2] - b[0], id).toBeLessThan(width * 0.6)
    }
  })
})

describe('map mode rules', () => {
  it('offers a shape hint instead of letters', () => {
    expect(hintKindsFor('hard', 'map')).toEqual(['continent', 'shape', 'neighbors', 'capital'])
    expect(hintKindsFor('easy', 'map')).toEqual(['shape', 'neighbors', 'capital'])
    expect(hintKindsFor('hard', 'typing')).toContain('letters')
  })

  it('gives extra time to find a country', () => {
    expect(timerFor('easy', 'map')).toBeNull()
    expect(timerFor('hard', 'map')).toBe(30)
    expect(timerFor('hard', 'choices')).toBe(20)
    expect(timerFor('hard', 'typing')).toBe(25)
  })
})
