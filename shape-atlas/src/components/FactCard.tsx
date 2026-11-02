import { ArrowRight, CheckCircle2, Clock, Flame, XCircle } from 'lucide-react'
import { motion } from 'motion/react'
import type { Country } from '../data/types'
import { ClayButton } from './ClayButton'
import { Flag } from './Flag'

interface Props {
  country: Country
  correct: boolean
  answer: Country | null
  timedOut: boolean
  /** How far the wrong pick was from the answer (map mode). */
  distanceKm?: number
  points: number
  streak: number
  isLast: boolean
  onNext: () => void
}

export function FactCard({ country, correct, answer, timedOut, distanceKm, points, streak, isLast, onNext }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        {correct ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 font-display text-lg font-semibold text-success">
            <CheckCircle2 size={20} /> Correct!
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-danger/15 px-3 py-1.5 font-display text-lg font-semibold text-danger">
            {timedOut ? <Clock size={20} /> : <XCircle size={20} />} {timedOut ? "Time's up" : answer ? 'Not quite' : 'Skipped'}
          </span>
        )}
        {points > 0 && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.15 }}
            className="ml-auto font-display text-2xl font-bold text-accent-hi"
          >
            +{points}
          </motion.span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Flag
          iso2={country.iso2}
          className="w-[4.5rem] shrink-0 rounded-lg shadow-[0_6px_20px_-6px_rgb(0_0_0/0.7)] ring-1 ring-white/15"
        />
        <div className="min-w-0">
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{country.name}</h2>
          {!correct && answer && (
            <p className="mt-1 text-sm font-semibold text-muted">
              You answered <span className="text-danger">{answer.name}</span>
              {distanceKm !== undefined && <>, {Math.round(distanceKm).toLocaleString('en-US')} km away</>}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-sm">
        {[
          ['Capital', country.capital || '—'],
          ['Continent', country.continent],
          ['Area', `${Math.round(country.area).toLocaleString('en-US')} km²`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-deep/50 px-3 py-2.5">
            <dt className="text-xs font-bold uppercase tracking-wider text-faint">{k}</dt>
            <dd className="mt-0.5 font-bold leading-snug text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      {correct && streak >= 3 && (
        <p className="inline-flex items-center gap-2 text-sm font-bold text-accent-hi">
          <Flame size={18} /> {streak} in a row: ×{Math.min(2, 1 + 0.1 * streak).toFixed(1)} multiplier
        </p>
      )}

      <ClayButton variant="accent" size="lg" onClick={onNext} autoFocus className="w-full" silent>
        {isLast ? 'See results' : 'Next shape'} <ArrowRight size={22} />
      </ClayButton>
      <p className="-mt-2 text-center text-xs font-semibold text-faint">
        Press <kbd className="rounded bg-raised px-1.5 py-0.5">Enter</kbd> to continue
      </p>
    </motion.div>
  )
}
