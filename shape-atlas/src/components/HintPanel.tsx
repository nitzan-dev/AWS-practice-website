import { Globe2, Landmark, Lightbulb, Map as MapIcon, Type } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { Country } from '../data/types'
import { HINT_LABEL, SPECS, hintKindsFor, type Difficulty, type HintKind } from '../game/config'

const ICONS: Record<HintKind, ReactNode> = {
  continent: <Globe2 size={16} />,
  letters: <Type size={16} />,
  neighbors: <MapIcon size={16} />,
  capital: <Landmark size={16} />,
}

const letterMask = (name: string) =>
  name
    .split('')
    .map((ch, i) => (i === 0 ? ch.toUpperCase() : /\p{L}/u.test(ch) ? '_' : ch === ' ' ? ' ' : ch))
    .join(' ')

function hintText(kind: HintKind, c: Country): ReactNode {
  switch (kind) {
    case 'continent':
      return c.continent
    case 'letters':
      return <span className="font-mono tracking-wider">{letterMask(c.name)}</span>
    case 'neighbors':
      return c.borders.length === 0
        ? 'No land borders. Surrounded by sea'
        : `Shares a border with ${c.borders.length} ${c.borders.length === 1 ? 'country' : 'countries'} (outlined)`
    case 'capital':
      return c.capital || 'No official capital'
  }
}

interface Props {
  country: Country
  difficulty: Difficulty
  used: HintKind[]
  disabled: boolean
  onUse: (kind: HintKind) => void
}

export function HintPanel({ country, difficulty, used, disabled, onUse }: Props) {
  const spec = SPECS[difficulty]
  const left = spec.hints - used.length
  const shown: HintKind[] = spec.showContinent ? ['continent', ...used] : used

  return (
    <div>
      <ul className="space-y-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {shown.map((k) => (
            <motion.li
              key={k}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 overflow-hidden rounded-2xl border border-primary-hi/20 bg-primary/10 px-4 py-2.5 text-sm"
            >
              <span className="text-primary-hi">{ICONS[k]}</span>
              <span className="font-bold text-muted">{HINT_LABEL[k]}</span>
              <span className="ml-auto text-right font-semibold text-ink">{hintText(k, country)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {!disabled && left > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-bold text-faint">
            <Lightbulb size={16} className="text-warn" />
            {left} {left === 1 ? 'hint' : 'hints'}
            {spec.hintCost > 0 && <span className="font-semibold">· −{spec.hintCost} pts each</span>}
          </span>
          {hintKindsFor(difficulty)
            .filter((k) => !used.includes(k))
            .map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onUse(k)}
                className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3.5 text-sm font-bold text-muted transition-colors duration-200 hover:border-primary-hi hover:text-ink"
              >
                {ICONS[k]}
                {HINT_LABEL[k]}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
