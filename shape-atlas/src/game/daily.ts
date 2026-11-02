import type { RoundRecord } from './reducer'

/** UTC calendar date, e.g. "2026-11-03" — the same daily puzzle worldwide. */
export const dailyKey = (d = new Date()) => d.toISOString().slice(0, 10)

export const dailySeed = (key: string) => `daily:${key}`

/** Milliseconds until the next UTC midnight. */
export function msUntilNextDaily(now = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return next - now.getTime()
}

export function previousKey(key: string): string {
  const d = new Date(`${key}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return dailyKey(d)
}

/** Shareable result text (emoji squares are fine here — this is clipboard text, not UI). */
export function shareText(key: string, history: Pick<RoundRecord, 'correct'>[], score: number): string {
  const grid = history.map((h) => (h.correct ? '🟩' : '🟥')).join('')
  const right = history.filter((h) => h.correct).length
  return `Shape Atlas Daily ${key}\n${grid}\n${right}/${history.length} · ${score.toLocaleString('en-US')} pts`
}
