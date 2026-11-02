import { AMBIGUOUS } from '../data/aliases'
import type { Country } from '../data/types'

export type MatchResult =
  | { kind: 'match'; id: string }
  | { kind: 'ambiguous'; ids: string[] }
  | { kind: 'none' }

interface Entry {
  norm: string
  id: string
}

export type MatchIndex = Entry[]

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[.,'’()-]/g, ' ')
    .replace(/\bst\b/g, 'saint')
    .replace(/^\s*the\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildIndex(countries: Country[]): MatchIndex {
  const entries: Entry[] = []
  for (const c of countries) {
    const seen = new Set<string>()
    for (const name of [c.name, ...c.aliases]) {
      const norm = normalize(name)
      if (norm && !seen.has(norm)) {
        seen.add(norm)
        entries.push({ norm, id: c.id })
      }
    }
  }
  return entries
}

/** Damerau–Levenshtein (optimal string alignment) distance. */
export function editDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 1; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[m][n]
}

/** Typos allowed for a given name: none for short names, so "Iran" never matches "Iraq". */
const allowedTypos = (name: string, tolerance: number) =>
  name.length <= 4 ? 0 : name.length <= 7 ? Math.min(1, tolerance) : tolerance

/** Resolves typed text to a country, independent of which country is the answer. */
export function resolveAnswer(input: string, index: MatchIndex, tolerance: number): MatchResult {
  const n = normalize(input)
  if (!n) return { kind: 'none' }
  if (AMBIGUOUS[n]) return { kind: 'ambiguous', ids: AMBIGUOUS[n] }

  const exact = new Set(index.filter((e) => e.norm === n).map((e) => e.id))
  if (exact.size === 1) return { kind: 'match', id: [...exact][0] }
  if (exact.size > 1) return { kind: 'ambiguous', ids: [...exact] }

  let best = Infinity
  let ids = new Set<string>()
  for (const e of index) {
    if (Math.abs(e.norm.length - n.length) > tolerance) continue
    const d = editDistance(n, e.norm)
    if (d > allowedTypos(e.norm, tolerance)) continue
    if (d < best) {
      best = d
      ids = new Set([e.id])
    } else if (d === best) ids.add(e.id)
  }
  if (ids.size === 1) return { kind: 'match', id: [...ids][0] }
  if (ids.size > 1) return { kind: 'ambiguous', ids: [...ids] }
  return { kind: 'none' }
}

/** Autocomplete: countries whose name or alias starts with (or has a word starting with) the input. */
export function suggest(input: string, index: MatchIndex, byId: Map<string, Country>, limit = 6): Country[] {
  const n = normalize(input)
  if (!n) return []
  const scored = new Map<string, number>()
  for (const e of index) {
    const score = e.norm.startsWith(n) ? (e.norm === normalize(byId.get(e.id)!.name) ? 0 : 1) : e.norm.includes(` ${n}`) ? 2 : -1
    if (score < 0) continue
    const prev = scored.get(e.id)
    if (prev === undefined || score < prev) scored.set(e.id, score)
  }
  return [...scored.entries()]
    .sort((a, b) => a[1] - b[1] || byId.get(a[0])!.name.localeCompare(byId.get(b[0])!.name))
    .slice(0, limit)
    .map(([id]) => byId.get(id)!)
}
