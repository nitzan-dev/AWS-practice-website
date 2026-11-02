import { ArrowLeft, Check, Clock, Keyboard, LayoutGrid, Lightbulb, Play, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ClayButton, IconButton } from '../components/ClayButton'
import { ShapeStage } from '../components/ShapeStage'
import { useAtlas } from '../data/atlas'
import { CLASSIC_LENGTH, DAILY_LENGTH, DIFFICULTIES, SPECS, type AnswerMode, type Difficulty, type GameMode } from '../game/config'
import { dailyKey } from '../game/daily'
import { poolFor } from '../game/questions'
import { useRecords } from '../store/records'
import { useSettings } from '../store/settings'

const SAMPLE: Record<Difficulty, string> = { easy: 'ITA', medium: 'KEN', hard: 'LAO', veryhard: 'LIE' }
const ACCENT: Record<Difficulty, string> = {
  easy: 'text-success',
  medium: 'text-[#67e8f9]',
  hard: 'text-accent-hi',
  veryhard: 'text-danger',
}

const TITLES: Record<GameMode, string> = { classic: 'Classic', survival: 'Survival', daily: 'Daily Challenge' }
const BLURB: Record<GameMode, string> = {
  classic: `${CLASSIC_LENGTH} shapes. Answer fast and keep your streak for bonus points.`,
  survival: 'Keep going until you lose three lives. Every 10 correct answers it steps up a difficulty.',
  daily: `${DAILY_LENGTH} shapes for everyone today: 3 easy, 3 medium, 3 hard and 1 very hard. One attempt.`,
}

function Segment({ active, onClick, icon, title, sub }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; sub: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`focus-ring flex min-h-16 flex-1 cursor-pointer items-center gap-3 rounded-[18px] px-4 py-3 text-left transition-[background,box-shadow,color] duration-200 ${
        active ? 'bg-primary text-white shadow-[inset_0_2px_0_rgb(255_255_255/0.2),0_10px_24px_-10px_rgb(99_102_241/0.9)]' : 'text-muted hover:text-ink'
      }`}
    >
      {icon}
      <span>
        <span className="block font-display text-lg font-semibold leading-tight">{title}</span>
        <span className={`block text-sm ${active ? 'text-white/80' : 'text-faint'}`}>{sub}</span>
      </span>
    </button>
  )
}

interface Props {
  mode: GameMode
  onBack: () => void
  onStart: (difficulty: Difficulty, answerMode: AnswerMode) => void
  onShowDaily: () => void
}

export function Setup({ mode, onBack, onStart, onShowDaily }: Props) {
  const { countries, byId } = useAtlas()
  const { difficulty, answerMode, set } = useSettings()
  const { best, daily } = useRecords()
  const doneToday = mode === 'daily' && !!daily[dailyKey()]
  const record = best[`${mode}:${difficulty}:${answerMode}`]

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <header className="flex items-center gap-4">
        <IconButton label="Back to menu" onClick={onBack}>
          <ArrowLeft size={20} />
        </IconButton>
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{TITLES[mode]}</h1>
        </div>
      </header>
      <p className="mt-3 max-w-2xl text-muted">{BLURB[mode]}</p>

      {mode !== 'daily' && (
        <section className="mt-8" aria-labelledby="diff-h">
          <h2 id="diff-h" className="text-xs font-bold uppercase tracking-[0.18em] text-faint">
            Difficulty
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4" role="radiogroup" aria-labelledby="diff-h">
            {DIFFICULTIES.map((d, i) => {
              const spec = SPECS[d]
              const active = d === difficulty
              return (
                <motion.button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set({ difficulty: d })}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className={`focus-ring clay relative flex cursor-pointer flex-col p-4 text-left transition-[filter,box-shadow] duration-200 hover:brightness-125 sm:p-5 ${
                    active ? 'ring-3 ring-accent' : ''
                  }`}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-accent text-[#1f0a00]">
                      <Check size={16} strokeWidth={3} />
                    </span>
                  )}
                  <div className="mx-auto aspect-square w-3/5 sm:w-1/2">
                    <ShapeStage country={byId.get(SAMPLE[d])!} outline={spec.outline} rotation={spec.rotate ? -10 : 0} plain />
                  </div>
                  <span className={`mt-3 font-display text-xl font-semibold sm:text-2xl ${ACCENT[d]}`}>{spec.label}</span>
                  <span className="text-sm leading-snug text-muted">{spec.tagline}</span>
                  <ul className="mt-3 space-y-1 text-xs font-bold text-faint sm:text-sm">
                    <li>{poolFor(d, countries).length} countries</li>
                    <li className="flex items-center gap-1.5">
                      <Clock size={14} /> {spec.timer ? `${spec.timer}s per shape` : 'No timer'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Lightbulb size={14} /> {spec.hints} {spec.hints === 1 ? 'hint' : 'hints'}
                      {spec.hintCost ? ` · −${spec.hintCost}` : ' · free'}
                    </li>
                  </ul>
                </motion.button>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-8" aria-labelledby="mode-h">
        <h2 id="mode-h" className="text-xs font-bold uppercase tracking-[0.18em] text-faint">
          How you answer
        </h2>
        <div className="clay mt-3 flex flex-col gap-1 p-1.5 sm:flex-row" role="radiogroup" aria-labelledby="mode-h">
          <Segment
            active={answerMode === 'choices'}
            onClick={() => set({ answerMode: 'choices' })}
            icon={<LayoutGrid size={24} />}
            title="4 choices"
            sub="Pick the right name"
          />
          <Segment
            active={answerMode === 'typing'}
            onClick={() => set({ answerMode: 'typing' })}
            icon={<Keyboard size={24} />}
            title="Typing"
            sub="Type the name yourself"
          />
        </div>
      </section>

      <div className="mt-10 flex flex-col items-center gap-3">
        {doneToday ? (
          <>
            <p className="font-bold text-muted">You've played today's puzzle. Come back tomorrow!</p>
            <ClayButton variant="primary" size="lg" onClick={onShowDaily}>
              View today's result
            </ClayButton>
          </>
        ) : (
          <ClayButton
            variant="accent"
            size="lg"
            className="w-full max-w-sm"
            icon={<Play size={22} className="fill-current" />}
            onClick={() => onStart(difficulty, answerMode)}
          >
            {mode === 'daily' ? "Play today's puzzle" : 'Start'}
          </ClayButton>
        )}
        {mode !== 'daily' && record && (
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-faint">
            <Trophy size={15} className="text-warn" /> Best at this setting: {record.toLocaleString('en-US')}
          </p>
        )}
      </div>
    </div>
  )
}
