// Builds src/data/countries.json from Natural Earth 1:10m + world-countries metadata.
// Run with: npm run build:data
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { geoArea, geoAzimuthalEqualArea, geoCentroid, geoStream } from 'd3-geo'
import { merge } from 'topojson-client'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { CODE_REMAP, CUSTOM_GEOMETRY, EXTRA_COUNTRIES, KEEP_PARTS, MERGE_INTO, NAMED_GEOMETRIES } from './overrides.ts'
import { TIER_1, TIER_2, TIER_3 } from './tiers.ts'
import { EXTRA_ALIASES, NAME_OVERRIDES } from '../src/data/aliases.ts'
import type { Continent, Country, Tier } from '../src/data/types.ts'

const require = createRequire(import.meta.url)
const topo = JSON.parse(
  readFileSync(require.resolve('world-atlas/countries-10m.json'), 'utf8'),
) as Topology<{ countries: GeometryCollection<{ name: string }> }>
const meta = JSON.parse(readFileSync(require.resolve('world-countries/countries.json'), 'utf8')) as any[]

const SIZE = 1000
const PAD = 40
const SIMPLIFY_TOLERANCE = 0.8 // px in the 1000-unit viewBox; raised per country until under MAX_POINTS
const MAX_POINTS = 900
const MIN_RING_AREA = 10 // px²; specks below this are dropped for non-dispersed countries
const DISPERSED_FILL = 0.012 // fraction of the canvas covered below which we draw island markers
const EARTH_RADIUS_KM = 6371.0088

type Pt = [number, number]

// ---------- geometry helpers ----------

function ringArea(r: Pt[]): number {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1])
  return a / 2
}

function ringPerimeter(r: Pt[]): number {
  let p = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) p += Math.hypot(r[i][0] - r[j][0], r[i][1] - r[j][1])
  return p
}

function ringCentroid(r: Pt[]): Pt {
  let x = 0
  let y = 0
  for (const p of r) {
    x += p[0]
    y += p[1]
  }
  return [x / r.length, y / r.length]
}

/** Douglas–Peucker on a closed ring. */
function simplifyRing(ring: Pt[], tol: number): Pt[] {
  if (ring.length <= 4) return ring
  const keep = new Uint8Array(ring.length)
  keep[0] = 1
  // split the ring at the point farthest from the start so DP has two open polylines
  let far = 0
  let farD = -1
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1])
    if (d > farD) {
      farD = d
      far = i
    }
  }
  keep[far] = 1
  const stack: [number, number][] = [
    [0, far],
    [far, ring.length],
  ]
  const at = (i: number) => ring[i % ring.length]
  while (stack.length) {
    const [s, e] = stack.pop()!
    const a = at(s)
    const b = at(e)
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1e-9
    let maxD = 0
    let idx = -1
    for (let i = s + 1; i < e; i++) {
      const p = ring[i]
      const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len
      if (d > maxD) {
        maxD = d
        idx = i
      }
    }
    if (idx >= 0 && maxD > tol) {
      keep[idx] = 1
      stack.push([s, idx], [idx, e])
    }
  }
  return ring.filter((_, i) => keep[i])
}

/** Projects a feature and collects the output rings (after clipping/resampling). */
function projectRings(f: Feature, projection: ReturnType<typeof geoAzimuthalEqualArea>): Pt[][] {
  const rings: Pt[][] = []
  let cur: Pt[] | null = null
  const sink = {
    point(x: number, y: number) {
      cur?.push([x, y])
    },
    lineStart() {
      cur = []
    },
    lineEnd() {
      if (cur && cur.length > 2) rings.push(cur)
      cur = null
    },
    polygonStart() {},
    polygonEnd() {},
    sphere() {},
  }
  geoStream(f, projection.stream(sink as any))
  return rings
}

function ringsToPath(rings: Pt[][], decimals: number): string {
  const k = 10 ** decimals
  const fmt = (n: number) => (Math.round(n * k) / k).toString()
  return rings
    .map((r) => 'M' + r.map((p) => fmt(p[0]) + ' ' + fmt(p[1])).join('L') + 'Z')
    .join('')
}

/** Fixes polygons whose winding makes d3 treat them as "everything except this island". */
function rewind(f: Feature<Polygon | MultiPolygon>): Feature<MultiPolygon> {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const fixed = polys.map((rings) =>
    geoArea({ type: 'Polygon', coordinates: rings }) > 2 * Math.PI ? rings.map((r) => [...r].reverse()) : rings,
  )
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: fixed } }
}

/** Filters a (Multi)Polygon's parts by centroid. */
function filterParts(f: Feature<Polygon | MultiPolygon>, keep?: (lon: number, lat: number) => boolean) {
  if (!keep) return f
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const kept = polys.filter((coords) => {
    const [lon, lat] = geoCentroid({ type: 'Polygon', coordinates: coords })
    return keep(lon, lat)
  })
  if (!kept.length) throw new Error('filter removed every part')
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: kept } } as Feature<MultiPolygon>
}

function clusterIslands(rings: Pt[][]): [number, number, number][] {
  const clusters: { x: number; y: number; n: number; minX: number; maxX: number; minY: number; maxY: number }[] = []
  for (const r of rings) {
    if (ringArea(r) < 0) continue
    const [x, y] = ringCentroid(r)
    const c = clusters.find((c) => Math.hypot(c.x - x, c.y - y) < 45)
    const xs = r.map((p) => p[0])
    const ys = r.map((p) => p[1])
    if (c) {
      c.x = (c.x * c.n + x) / (c.n + 1)
      c.y = (c.y * c.n + y) / (c.n + 1)
      c.n++
      c.minX = Math.min(c.minX, ...xs)
      c.maxX = Math.max(c.maxX, ...xs)
      c.minY = Math.min(c.minY, ...ys)
      c.maxY = Math.max(c.maxY, ...ys)
    } else {
      clusters.push({ x, y, n: 1, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) })
    }
  }
  return clusters.map((c) => {
    const r = Math.max(26, Math.hypot(c.maxX - c.minX, c.maxY - c.minY) / 2 + 14)
    return [Math.round(c.x), Math.round(c.y), Math.round(r)]
  })
}

// ---------- metadata ----------

function continentOf(m: any): Continent {
  if (m.region === 'Americas') return m.subregion === 'South America' ? 'South America' : 'North America'
  return m.region as Continent
}

function cleanAliases(m: any, name: string): string[] {
  const set = new Set<string>([m.name.common, m.name.official, ...(m.altSpellings ?? [])])
  const out: string[] = []
  for (const s of set) {
    if (!s || s === name) continue
    if (/^[A-Z]{2,3}$/.test(s)) continue // ISO-like codes; curated short forms come from EXTRA_ALIASES
    if (!/^[\p{Script=Latin}\s'’\-.,()&]+$/u.test(s)) continue // keep Latin-script spellings only
    out.push(s)
  }
  return out
}

// ---------- build ----------

const geoms = topo.objects.countries.geometries
const geomsById = new Map<string, typeof geoms>()
for (const g of geoms) {
  const id = (g.id as string | undefined) ?? NAMED_GEOMETRIES[g.properties!.name]
  if (!id) continue
  if (!geomsById.has(id)) geomsById.set(id, [])
  geomsById.get(id)!.push(g)
}

const remap = (c: string) => CODE_REMAP[c] ?? c
const metaById = new Map(meta.map((m) => [remap(m.cca3), m]))
const playable = meta
  .filter((m) => m.unMember || EXTRA_COUNTRIES.includes(remap(m.cca3)))
  .map((m) => remap(m.cca3))
const playableSet = new Set(playable)

const tierOf = (id: string): Tier =>
  TIER_1.includes(id) ? 1 : TIER_2.includes(id) ? 2 : TIER_3.includes(id) ? 3 : 4

const countries: Country[] = []
let totalPoints = 0

for (const id of playable) {
  const m = metaById.get(id)!
  const key = NAMED_GEOMETRIES.Kosovo === id ? 'XKX' : m.ccn3
  let parts = (geomsById.get(key) ?? []).filter(
    // world-atlas groups Ashmore & Cartier under Australia's id
    (g) => !(id === 'AUS' && g.properties!.name !== 'Australia'),
  )
  for (const extra of MERGE_INTO[id] ?? []) parts = parts.concat(geoms.filter((g) => g.properties!.name === extra))
  if (!parts.length) throw new Error(`no geometry for ${id}`)

  let geometry: Polygon | MultiPolygon = merge(topo as any, parts as any)
  if (CUSTOM_GEOMETRY[id]) {
    geometry = { type: 'Polygon', coordinates: CUSTOM_GEOMETRY[id] }
  }
  let f: Feature<Polygon | MultiPolygon> = rewind({ type: 'Feature', properties: {}, geometry })
  f = filterParts(f, KEEP_PARTS[id])

  const [clon, clat] = geoCentroid(f)
  const projection = geoAzimuthalEqualArea()
    .rotate([-clon, -clat])
    .fitExtent(
      [
        [PAD, PAD],
        [SIZE - PAD, SIZE - PAD],
      ],
      f,
    )

  const raw = projectRings(f, projection)
  const rawArea = raw.reduce((s, r) => s + ringArea(r), 0)
  const dispersed = Math.abs(rawArea) / (SIZE * SIZE) < DISPERSED_FILL

  let rings: Pt[][] = []
  for (let tol = SIMPLIFY_TOLERANCE; ; tol *= 1.25) {
    rings = raw.map((r) => simplifyRing(r, tol))
    if (!dispersed) {
      const largest = Math.max(...rings.map((r) => Math.abs(ringArea(r))))
      rings = rings.filter((r) => Math.abs(ringArea(r)) >= Math.min(MIN_RING_AREA, largest))
    }
    rings = rings.filter((r) => r.length >= 3)
    if (rings.reduce((s, r) => s + r.length, 0) <= MAX_POINTS || tol > 4) break
  }
  if (!rings.length) throw new Error(`no rings for ${id} (raw ${raw.length}, area ${rawArea.toFixed(1)})`)
  totalPoints += rings.reduce((s, r) => s + r.length, 0)

  // descriptors
  const xs = rings.flatMap((r) => r.map((p) => p[0]))
  const ys = rings.flatMap((r) => r.map((p) => p[1]))
  const w = Math.max(...xs) - Math.min(...xs)
  const h = Math.max(...ys) - Math.min(...ys)
  // winding direction differs between outer rings and holes; the sign of the largest ring marks "outer"
  const largestRing = rings.reduce((a, b) => (Math.abs(ringArea(b)) > Math.abs(ringArea(a)) ? b : a))
  const outerSign = Math.sign(ringArea(largestRing))
  const outerRings = rings.filter((r) => Math.sign(ringArea(r)) === outerSign)
  const compactness = (4 * Math.PI * Math.abs(ringArea(largestRing))) / ringPerimeter(largestRing) ** 2

  const name = NAME_OVERRIDES[id] ?? m.name.common
  const aliases = [...new Set([...cleanAliases(m, name), ...(EXTRA_ALIASES[id] ?? [])])]

  countries.push({
    id,
    iso2: id === 'XKX' ? 'xk' : m.cca2.toLowerCase(),
    numeric: m.ccn3 || '',
    name,
    aliases,
    capital: (m.capital ?? [])[0] ?? '',
    continent: continentOf(m),
    subregion: m.subregion || continentOf(m),
    area: m.area,
    landlocked: !!m.landlocked,
    borders: (m.borders ?? []).map(remap).filter((b: string) => playableSet.has(b)),
    tier: tierOf(id),
    centroid: [Math.round(clon * 100) / 100, Math.round(clat * 100) / 100],
    path: ringsToPath(rings, dispersed ? 1 : 0),
    ...(dispersed ? { islands: clusterIslands(rings.filter((r) => Math.sign(ringArea(r)) === outerSign)) } : {}),
    projection: {
      rotate: projection.rotate().slice(0, 2) as [number, number],
      scale: Math.round(projection.scale() * 100) / 100,
      translate: projection.translate().map((v) => Math.round(v * 100) / 100) as [number, number],
    },
    kmPerUnit: EARTH_RADIUS_KM / projection.scale(),
    descriptors: {
      aspect: Math.round((w / h) * 1000) / 1000,
      compactness: Math.round(compactness * 1000) / 1000,
      parts: outerRings.length,
      logArea: Math.round(Math.log10(m.area) * 1000) / 1000,
    },
  })
}

countries.sort((a, b) => a.name.localeCompare(b.name))
const json = JSON.stringify(countries)
writeFileSync(new URL('../src/data/countries.json', import.meta.url), json)

const tiers = [1, 2, 3, 4].map((t) => countries.filter((c) => c.tier === t).length)
console.log(`countries: ${countries.length}  tiers: ${tiers.join('/')}  points: ${totalPoints}  size: ${(json.length / 1024).toFixed(0)} KB`)
console.log('dispersed:', countries.filter((c) => c.islands).map((c) => c.id).join(' '))
