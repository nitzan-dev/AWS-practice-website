export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania'

export type Tier = 1 | 2 | 3 | 4

export interface ShapeDescriptors {
  /** Bounding-box width / height of the projected shape. */
  aspect: number
  /** 4πA/P² of the largest ring (1 = circle). */
  compactness: number
  /** Number of outer rings (islands / exclaves). */
  parts: number
  /** log10 of real area in km². */
  logArea: number
}

export interface Country {
  id: string // ISO 3166-1 alpha-3
  iso2: string // lower-case alpha-2, for flags
  numeric: string // ISO numeric, for joining with world-atlas
  name: string
  aliases: string[]
  capital: string
  continent: Continent
  subregion: string
  area: number
  landlocked: boolean
  borders: string[]
  tier: Tier
  centroid: [number, number] // [lon, lat]
  /** SVG path in a 1000×1000 viewBox. */
  path: string
  /** Island markers for dispersed nations: [x, y, r] in viewBox units. */
  islands?: [number, number, number][]
  /** Projection used to draw the path, so neighbours can be drawn in the same frame. */
  projection: { rotate: [number, number]; scale: number; translate: [number, number] }
  /** Kilometres per viewBox unit (for the scale bar). */
  kmPerUnit: number
  descriptors: ShapeDescriptors
}

/** A country on the interactive world map (Natural Earth projection, pre-projected). */
export interface MapCountry {
  id: string
  /** SVG path of every part of the country, including overseas territories. */
  d: string
  /** Projected centroid. */
  c: [number, number]
  /** Bounding box of the mainland, for zooming: [x0, y0, x1, y1]. */
  b: [number, number, number, number]
  /** Too small to click reliably: drawn with a dot. */
  dot?: boolean
}

export interface WorldMapData {
  viewBox: [number, number, number, number]
  sphere: string
  graticule: string
  /** Land that isn't one of the 197 (Greenland, Western Sahara, territories). */
  other: string
  countries: MapCountry[]
}
