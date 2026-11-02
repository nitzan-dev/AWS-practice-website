import type { Country } from '../data/types'
import { SPECS, type Difficulty } from './config'
import { pickWeighted, rngFor, shuffle, type Rng } from './rng'

export interface Question {
  countryId: string
  difficulty: Difficulty
  /** Four country ids (including the answer), already shuffled. */
  options: string[]
  rotation: number
}

/** How different two silhouettes look (lower = more alike). */
export function shapeDistance(a: Country, b: Country): number {
  const da = a.descriptors
  const db = b.descriptors
  return (
    Math.abs(Math.log(da.aspect / db.aspect)) +
    Math.abs(da.compactness - db.compactness) * 2 +
    Math.abs(Math.log(da.parts / db.parts)) * 0.3 +
    Math.abs(da.logArea - db.logArea) * 0.35
  )
}

export function poolFor(difficulty: Difficulty, countries: Country[]): Country[] {
  const tiers = SPECS[difficulty].tiers
  return countries.filter((c) => tiers.includes(c.tier))
}

export function pickCountry(rng: Rng, difficulty: Difficulty, countries: Country[], used: Set<string>): Country {
  const pool = poolFor(difficulty, countries)
  const fresh = pool.filter((c) => !used.has(c.id))
  const weights = SPECS[difficulty].tierWeight
  return pickWeighted(fresh.length ? fresh : pool, (c) => weights[c.tier], rng)
}

/** Three wrong options whose closeness to the answer grows with difficulty. */
export function decoysFor(target: Country, difficulty: Difficulty, countries: Country[], rng: Rng): Country[] {
  const others = countries.filter((c) => c.id !== target.id)
  const fill = (picked: Country[], fallback: Country[]) => {
    for (const c of shuffle(fallback, rng)) {
      if (picked.length >= 3) break
      if (!picked.includes(c)) picked.push(c)
    }
    return picked
  }

  switch (difficulty) {
    case 'easy': {
      // familiar countries from other continents, each from a different continent where possible
      const pool = shuffle(
        others.filter((c) => c.tier <= 2 && c.continent !== target.continent),
        rng,
      )
      const picked: Country[] = []
      const seen = new Set<string>()
      for (const c of pool) {
        if (picked.length >= 3) break
        if (!seen.has(c.continent)) {
          picked.push(c)
          seen.add(c.continent)
        }
      }
      return fill(picked, pool)
    }
    case 'medium': {
      const sameContinent = others.filter((c) => c.continent === target.continent)
      const familiar = sameContinent.filter((c) => c.tier <= 3)
      // small continents (Oceania) run out of familiar names, so top up from the same continent
      return fill(shuffle(familiar, rng).slice(0, 3), sameContinent)
    }
    case 'hard': {
      const ranked = others
        .filter((c) => c.continent === target.continent)
        .map((c) => ({ c, d: shapeDistance(target, c) - (c.subregion === target.subregion ? 0.4 : 0) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 7)
        .map((x) => x.c)
      return fill(shuffle(ranked, rng).slice(0, 3), others.filter((c) => c.continent === target.continent))
    }
    case 'veryhard': {
      const ranked = others
        .map((c) => ({ c, d: shapeDistance(target, c) - (c.continent === target.continent ? 0.2 : 0) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 5)
        .map((x) => x.c)
      return shuffle(ranked, rng).slice(0, 3)
    }
  }
}

export function makeQuestion(
  key: string,
  difficulty: Difficulty,
  countries: Country[],
  used: Set<string>,
): Question {
  const rng = rngFor(key)
  const target = pickCountry(rng, difficulty, countries, used)
  const decoys = decoysFor(target, difficulty, countries, rng)
  const spec = SPECS[difficulty]
  const rotation = spec.rotate ? Math.round((rng() * 2 - 1) * spec.rotate) : 0
  return {
    countryId: target.id,
    difficulty,
    options: shuffle([target, ...decoys], rng).map((c) => c.id),
    rotation,
  }
}

/** A fixed list of questions with no repeats (classic and daily). */
export function makeQuestionSet(seed: string, difficulties: Difficulty[], countries: Country[]): Question[] {
  const used = new Set<string>()
  return difficulties.map((d, i) => {
    const q = makeQuestion(`${seed}:${i}`, d, countries, used)
    used.add(q.countryId)
    return q
  })
}
