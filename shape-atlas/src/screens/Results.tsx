import { Check, Copy, Flame, Home as HomeIcon, RotateCcw, SlidersHorizontal, Target, Trophy, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { sfx } from '../audio/sfx'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { ClayButton } from '../components/ClayButton'
import { Modal } from '../components/Modal'
import { RevealGlobe } from '../components/RevealGlobe'
import { ShapeStage } from '../components/ShapeStage'
import { useAtlas } from '../data/atlas'
import type { Country } from '../data/types'
import { loadWorld, type WorldFeature } from '../data/world'
import type { GameMode } from '../game/config'
import { shareText } from '../game/daily'

export interface ResultSummary {
  mode: GameMode
  difficultyLabel: string
  answerModeLabel: string
  score: number
  rounds: { countryId: string; correct: boolean }[]
  bestStreak: number
  isNewBest: boolean
  dailyKey?: string
}

function rank(accuracy: number) {
  if (accuracy >= 0.9) return 'Legendary cartographer'
  if (accuracy >= 0.7) return 'Seasoned explorer'
  if (accuracy >= 0.4) return 'Finding your bearings'
  return 'Lost at sea, for now'
}

interface Props {
  summary: ResultSummary
  onPlayAgain?: () => void
  onSetup?: () => void
  onHome: () => void
}

export function Results({ summary, onPlayAgain, onSetup, onHome }: Props) {
  const { byId } = useAtlas()
  const [world, setWorld] = useState<Map<string, WorldFeature> | null>(null)
  const [focus, setFocus] = useState<Country | null>(null)
  const [copied, setCopied] = useState(false)
  const right = summary.rounds.filter((r) => r.correct).length
  const accuracy = summary.rounds.length ? right / summary.rounds.length : 0

  useEffect(() => {
    loadWorld().then(setWorld)
    if (summary.isNewBest) sfx.record()
  }, [summary.isNewBest])

  const share = async () => {
    const text = shareText(summary.dailyKey!, summary.rounds, summary.score)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.prompt('Copy your result:', text)
    }
  }

  const stats = [
    { icon: <Target size={18} />, label: 'Correct', value: `${right}/${summary.rounds.length}` },
    { icon: <Check size={18} />, label: 'Accuracy', value: `${Math.round(accuracy * 100)}%` },
    { icon: <Flame size={18} />, label: 'Best streak', value: String(summary.bestStreak) },
  ]

  return (
    <div className="mx-auto flex min-h-safe max-w-4xl flex-col px-4 pb-10 pt-8 sm:px-6">
      <section className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-faint">
          {summary.mode === 'daily' ? `Daily · ${summary.dailyKey}` : `${summary.mode === 'survival' ? 'Survival' : 'Classic'} · ${summary.difficultyLabel}`}{' '}
          · {summary.answerModeLabel}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-muted sm:text-4xl">{rank(accuracy)}</h1>
        <div className="relative mt-4 inline-block">
          <AnimatedNumber
            value={summary.score}
            duration={1.4}
            className="bg-gradient-to-r from-[#67e8f9] via-[#a5b4fc] to-[#d8b4fe] bg-clip-text font-display text-7xl font-bold text-transparent sm:text-8xl"
          />
          <span className="ml-2 font-display text-2xl text-faint">pts</span>
        </div>
        {summary.isNewBest && (
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 1.2 }}
            className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-warn/15 px-4 py-1.5 font-display text-lg font-semibold text-warn"
          >
            <Trophy size={20} /> New personal best!
          </motion.p>
        )}
      </section>

      <section className="mt-8 grid grid-cols-3 gap-3" aria-label="Stats">
        {stats.map((s) => (
          <div key={s.label} className="clay p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-faint">
              {s.icon}
              {s.label}
            </div>
            <div className="mt-1 font-display text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </section>

      <section className="mt-8" aria-labelledby="rounds-h">
        <h2 id="rounds-h" className="text-xs font-bold uppercase tracking-[0.18em] text-faint">
          Your shapes <span className="normal-case tracking-normal">(tap one to see it on the globe)</span>
        </h2>
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {summary.rounds.map((r, i) => {
            const c = byId.get(r.countryId)!
            return (
              <motion.li key={`${r.countryId}${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
                <button
                  type="button"
                  onClick={() => setFocus(c)}
                  className={`focus-ring relative flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 bg-surface/80 p-2 transition-[filter] duration-200 hover:brightness-125 ${
                    r.correct ? 'border-success/50' : 'border-danger/50'
                  }`}
                >
                  <span
                    className={`absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full ${r.correct ? 'bg-success' : 'bg-danger'} text-deep`}
                    aria-label={r.correct ? 'correct' : 'missed'}
                  >
                    {r.correct ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                  </span>
                  <span className="aspect-square w-full p-1">
                    <ShapeStage country={c} plain status={r.correct ? 'correct' : 'wrong'} />
                  </span>
                  <span className="w-full truncate text-center text-xs font-bold text-muted">{c.name}</span>
                </button>
              </motion.li>
            )
          })}
        </ul>
      </section>

      <section className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        {summary.mode === 'daily' && summary.dailyKey && (
          <ClayButton variant="accent" size="lg" icon={copied ? <Check size={20} /> : <Copy size={20} />} onClick={share}>
            {copied ? 'Copied to clipboard' : 'Share result'}
          </ClayButton>
        )}
        {onPlayAgain && (
          <ClayButton variant="accent" size="lg" icon={<RotateCcw size={20} />} onClick={onPlayAgain}>
            Play again
          </ClayButton>
        )}
        {onSetup && (
          <ClayButton variant="ghost" size="lg" icon={<SlidersHorizontal size={20} />} onClick={onSetup}>
            Change settings
          </ClayButton>
        )}
        <ClayButton variant="ghost" size="lg" icon={<HomeIcon size={20} />} onClick={onHome}>
          Menu
        </ClayButton>
      </section>

      <Modal open={!!focus} title={focus?.name ?? ''} onClose={() => setFocus(null)}>
        {focus && (
          <div>
            <div className="mx-auto aspect-square w-full max-w-xs">
              <RevealGlobe country={focus} world={world} status="idle" />
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-muted">
              {focus.continent} · Capital {focus.capital || '—'}
            </p>
            <ClayButton variant="primary" className="mt-4 w-full" onClick={() => setFocus(null)}>
              Close
            </ClayButton>
          </div>
        )}
      </Modal>
    </div>
  )
}
