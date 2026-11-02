import { describe, expect, it } from 'vitest'
import { buildIndex, normalize, resolveAnswer, suggest } from '../src/game/matcher'
import { byId, countries } from './helpers'

const index = buildIndex(countries)
const resolve = (s: string, tol = 2) => resolveAnswer(s, index, tol)

describe('normalize', () => {
  it('strips diacritics, punctuation and "the"', () => {
    expect(normalize("  Côte d'Ivoire ")).toBe('cote d ivoire')
    expect(normalize('The Gambia')).toBe('gambia')
    expect(normalize('St. Lucia')).toBe('saint lucia')
  })
})

describe('resolveAnswer', () => {
  it('matches names and aliases exactly', () => {
    expect(resolve('france')).toEqual({ kind: 'match', id: 'FRA' })
    expect(resolve('USA')).toEqual({ kind: 'match', id: 'USA' })
    expect(resolve('america')).toEqual({ kind: 'match', id: 'USA' })
    expect(resolve('Ivory Coast')).toEqual({ kind: 'match', id: 'CIV' })
    expect(resolve('cote divoire')).toEqual({ kind: 'match', id: 'CIV' })
    expect(resolve('Czech Republic')).toEqual({ kind: 'match', id: 'CZE' })
    expect(resolve('Burma')).toEqual({ kind: 'match', id: 'MMR' })
    expect(resolve('Türkiye')).toEqual({ kind: 'match', id: 'TUR' })
    expect(resolve('Holy See')).toEqual({ kind: 'match', id: 'VAT' })
    expect(resolve('East Timor')).toEqual({ kind: 'match', id: 'TLS' })
    expect(resolve('swaziland')).toEqual({ kind: 'match', id: 'SWZ' })
  })

  it('tolerates typos on longer names', () => {
    expect(resolve('Argentnia')).toEqual({ kind: 'match', id: 'ARG' })
    expect(resolve('Phillipines')).toEqual({ kind: 'match', id: 'PHL' })
    expect(resolve('Mozambiqe', 1)).toEqual({ kind: 'match', id: 'MOZ' })
  })

  it('never confuses short look-alike names', () => {
    expect(resolve('Iran')).toEqual({ kind: 'match', id: 'IRN' })
    expect(resolve('Iraq')).toEqual({ kind: 'match', id: 'IRQ' })
    expect(resolve('Irak').kind).not.toBe('match')
    expect(resolve('Niger')).toEqual({ kind: 'match', id: 'NER' })
    expect(resolve('Nigeria')).toEqual({ kind: 'match', id: 'NGA' })
    expect(resolve('Austria')).toEqual({ kind: 'match', id: 'AUT' })
    expect(resolve('Australia')).toEqual({ kind: 'match', id: 'AUS' })
  })

  it('asks which Congo / Korea', () => {
    expect(resolve('Congo')).toEqual({ kind: 'ambiguous', ids: ['COD', 'COG'] })
    expect(resolve('korea')).toEqual({ kind: 'ambiguous', ids: ['KOR', 'PRK'] })
    expect(resolve('DRC')).toEqual({ kind: 'match', id: 'COD' })
  })

  it('returns none for gibberish', () => {
    expect(resolve('qwerty').kind).toBe('none')
    expect(resolve('   ').kind).toBe('none')
  })
})

describe('suggest', () => {
  it('ranks name prefixes first', () => {
    const names = suggest('ger', index, byId).map((c) => c.name)
    expect(names[0]).toBe('Germany')
  })
  it('matches inner words', () => {
    expect(suggest('korea', index, byId).map((c) => c.id).sort()).toEqual(['KOR', 'PRK'])
  })
})
