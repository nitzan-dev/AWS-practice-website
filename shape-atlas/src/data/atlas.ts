import { createContext, useContext } from 'react'
import type { Country } from './types'

export interface Atlas {
  countries: Country[]
  byId: Map<string, Country>
}

let pending: Promise<Atlas> | null = null

/** Lazily loads the country shapes (kept out of the initial bundle). */
export function loadAtlas(): Promise<Atlas> {
  pending ??= import('./countries.json').then((m) => {
    const countries = m.default as unknown as Country[]
    return { countries, byId: new Map(countries.map((c) => [c.id, c])) }
  })
  return pending
}

export const AtlasContext = createContext<Atlas | null>(null)

export function useAtlas(): Atlas {
  const atlas = useContext(AtlasContext)
  if (!atlas) throw new Error('useAtlas outside AtlasContext')
  return atlas
}
