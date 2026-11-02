import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

export type WorldFeature = Feature<Geometry, { name: string }>

let pending: Promise<Map<string, WorldFeature>> | null = null

/** Low-res world (1:110m) for the reveal globe and neighbour hints, keyed by ISO numeric id. */
export function loadWorld(): Promise<Map<string, WorldFeature>> {
  pending ??= import('world-atlas/countries-110m.json').then((m) => {
    const topo = m.default as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>
    const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>
    const map = new Map<string, WorldFeature>()
    for (const f of fc.features) {
      const key = (f.id as string | undefined) ?? (f.properties.name === 'Kosovo' ? 'XKX' : `name:${f.properties.name}`)
      map.set(key, f)
    }
    return map
  })
  return pending
}

/** Key a country by in the world map: numeric id, or XKX for Kosovo. */
export const worldKey = (c: { id: string; numeric: string }) => (c.id === 'XKX' ? 'XKX' : c.numeric)
