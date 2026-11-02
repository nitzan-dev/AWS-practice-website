import { readFileSync } from 'node:fs'
import type { Country } from '../src/data/types'

export const countries = JSON.parse(
  readFileSync(new URL('../src/data/countries.json', import.meta.url), 'utf8'),
) as Country[]
export const byId = new Map(countries.map((c) => [c.id, c]))
