// Explicit, reviewable rules that shape the playable country set.

/** Natural Earth geometries without an ISO numeric id that we map to a country. */
export const NAMED_GEOMETRIES: Record<string, string> = {
  Kosovo: 'XKX',
}

/** Extra geometries dissolved into a country (by Natural Earth name). */
export const MERGE_INTO: Record<string, string[]> = {
  SOM: ['Somaliland'],
  CYP: ['N. Cyprus', 'Cyprus U.N. Buffer Zone'],
}

/** world-countries uses "UNK" for Kosovo; we use the common XKX code. */
export const CODE_REMAP: Record<string, string> = { UNK: 'XKX' }

/** Non-UN entities that are part of the 197. */
export const EXTRA_COUNTRIES = ['PSE', 'XKX', 'TWN']

type Keep = (lon: number, lat: number) => boolean

/**
 * Per-country polygon filters, applied to each polygon's centroid.
 * Removes remote overseas parts that would shrink the recognizable mainland
 * to a speck (e.g. French Guiana, Galápagos, the Canaries).
 */
export const KEEP_PARTS: Record<string, Keep> = {
  FRA: (lon, lat) => lon > -6 && lon < 10 && lat > 41 && lat < 52,
  NLD: (_lon, lat) => lat > 50,
  NOR: (_lon, lat) => lat > 57 && lat < 72,
  ESP: (_lon, lat) => lat > 35.95,
  PRT: (lon) => lon > -10,
  ECU: (lon) => lon > -85,
  CHL: (lon) => lon > -77,
  COL: (lon) => lon > -79.5,
  CRI: (lon) => lon > -86,
  VEN: (_lon, lat) => lat < 13,
  BRA: (lon) => lon < -34,
  MEX: (lon, lat) => lon > -117.5 && !(lat < 20 && lon < -106),
  ZAF: (_lon, lat) => lat > -40,
  AUS: (lon, lat) => lat > -44 && lon < 154,
  NZL: (lon, lat) => lon > 165 && lon < 179 && lat > -48 && lat < -34,
  JPN: (lon, lat) => !(lat < 30 && lon > 135) && lon < 146,
  GNQ: (_lon, lat) => lat > 0, // drop Annobón
  FJI: (_lon, lat) => lat < -15, // drop Rotuma
  MUS: (lon, lat) => lon < 58 && lat < -19.5, // main island only
  SYC: (lon, lat) => lon > 55 && lat > -5, // Inner Islands
  PLW: (_lon, lat) => lat > 6.5, // drop the Southwest Islands
}

/**
 * Hand-drawn outlines for countries that the quantized 1:10m topology collapses
 * to a point. Vatican City: main walled area plus St. Peter's Square to the east.
 */
export const CUSTOM_GEOMETRY: Record<string, [number, number][][]> = {
  VAT: [
    [
      [12.4457, 41.9022], [12.4461, 41.9037], [12.4478, 41.9045], [12.4497, 41.9058],
      [12.4517, 41.9068], [12.4537, 41.9074], [12.4556, 41.9071], [12.4565, 41.9058],
      [12.4562, 41.904], [12.457, 41.9035], [12.4588, 41.9033], [12.4589, 41.9015],
      [12.457, 41.9013], [12.4558, 41.9005], [12.4538, 41.9001], [12.4513, 41.9003],
      [12.449, 41.9009], [12.4468, 41.9013], [12.4457, 41.9022],
    ],
  ],
}
