import type { WorldMapData } from './types'

let pending: Promise<WorldMapData> | null = null

/** Pre-projected world map for "Find on map" (lazy: only fetched when that mode is played). */
export function loadWorldMap(): Promise<WorldMapData> {
  pending ??= import('./worldmap.json').then((m) => m.default as unknown as WorldMapData)
  return pending
}
