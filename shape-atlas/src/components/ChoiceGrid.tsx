import { Check, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import type { Country } from '../data/types'

interface Props {
  options: Country[]
  /** Set once answered. */
  revealed: boolean
  correctId: string
  pickedId: string | null
  onPick: (id: string) => void
}

export function ChoiceGrid({ options, revealed, correctId, pickedId, onPick }: Props) {
  useEffect(() => {
    if (revealed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) {
        e.preventDefault()
        onPick(options[n - 1].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, revealed, onPick])

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3" role="group" aria-label="Answer options">
      {options.map((c, i) => {
        const isCorrect = revealed && c.id === correctId
        const isWrongPick = revealed && c.id === pickedId && c.id !== correctId
        const dim = revealed && !isCorrect && !isWrongPick
        return (
          <motion.button
            key={c.id}
            type="button"
            disabled={revealed}
            onClick={() => onPick(c.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: dim ? 0.45 : 1, y: 0 }}
            transition={{ delay: revealed ? 0 : 0.05 * i, duration: 0.25 }}
            className={`focus-ring group relative flex min-h-16 cursor-pointer items-center gap-2.5 rounded-[20px] px-3 py-3 text-left font-display text-base font-medium sm:gap-3 sm:px-4 sm:text-lg transition-[filter,transform,background] duration-200 enabled:hover:brightness-125 enabled:active:translate-y-[2px] disabled:cursor-default ${
              isCorrect
                ? 'bg-success/20 text-ink ring-2 ring-success'
                : isWrongPick
                  ? 'bg-danger/20 text-ink ring-2 ring-danger'
                  : 'clay text-ink'
            }`}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                isCorrect ? 'bg-success text-deep' : isWrongPick ? 'bg-danger text-deep' : 'bg-deep/60 text-muted'
              }`}
              aria-hidden="true"
            >
              {isCorrect ? <Check size={18} strokeWidth={3} /> : isWrongPick ? <X size={18} strokeWidth={3} /> : i + 1}
            </span>
            <span className="leading-tight">{c.name}</span>
            {(isCorrect || isWrongPick) && <span className="sr-only">{isCorrect ? '(correct answer)' : '(your answer)'}</span>}
          </motion.button>
        )
      })}
    </div>
  )
}
