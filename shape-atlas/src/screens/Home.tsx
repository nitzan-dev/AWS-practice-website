import { CalendarDays, ChevronRight, Flame, HeartPulse, Settings, Target, Trophy, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { IconButton } from '../components/ClayButton'
import { InstallCard } from '../components/InstallCard'
import { SettingsDialog } from '../components/SettingsDialog'
import { SpinningGlobe } from '../components/SpinningGlobe'
import { useAtlas } from '../data/atlas'
import { DAILY_LENGTH, type GameMode } from '../game/config'
import { dailyKey, msUntilNextDaily } from '../game/daily'
import { useRecords } from '../store/records'
import { useSettings } from '../store/settings'

function useCountdown() {
  const [ms, setMs] = useState(msUntilNextDaily())
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilNextDaily()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const s = Math.floor(ms / 1000)
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

interface CardProps {
  icon: ReactNode
  title: string
  body: string
  meta: ReactNode
  accent: string
  onClick: () => void
  delay: number
}

function ModeCard({ icon, title, body, meta, accent, onClick, delay }: CardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 22 }}
      className="focus-ring clay group flex cursor-pointer flex-col items-start gap-3 p-5 text-left transition-[filter,transform] duration-200 hover:brightness-125 active:translate-y-[2px] sm:p-6"
    >
      <span className={`flex size-12 items-center justify-center rounded-2xl ${accent}`}>{icon}</span>
      <span className="flex w-full items-center justify-between">
        <span className="font-display text-2xl font-semibold">{title}</span>
        <ChevronRight className="text-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink" />
      </span>
      <span className="text-[15px] leading-snug text-muted">{body}</span>
      <span className="mt-auto w-full border-t border-line/60 pt-3 text-sm font-bold text-faint">{meta}</span>
    </motion.button>
  )
}

export function Home({ onPick }: { onPick: (mode: GameMode) => void }) {
  const { countries } = useAtlas()
  const { sound, set, difficulty, answerMode } = useSettings()
  const { best, daily, dailyStreak } = useRecords()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const countdown = useCountdown()
  const today = daily[dailyKey()]
  const classicBest = best[`classic:${difficulty}:${answerMode}`]
  const survivalBest = best[`survival:${difficulty}:${answerMode}`]
  const streakAlive = dailyStreak.count > 0 && (dailyStreak.last === dailyKey() || !today)

  return (
    <div className="mx-auto flex min-h-safe max-w-5xl flex-col px-4 pb-8 pt-4 sm:px-6">
      <header className="flex justify-end gap-2">
        <IconButton label={sound ? 'Mute sound' : 'Turn sound on'} onClick={() => set({ sound: !sound })}>
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </IconButton>
        <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings size={20} />
        </IconButton>
      </header>

      <section className="mt-2 text-center sm:mt-0">
        <div className="relative mx-auto size-60 sm:size-72">
          <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgb(99_102_241/0.28),transparent_65%)]" />
          <SpinningGlobe className="relative w-full" />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-gradient-to-r from-[#67e8f9] via-[#a5b4fc] to-[#d8b4fe] bg-clip-text font-display text-[2.6rem] leading-tight font-bold tracking-tight text-transparent sm:text-7xl"
        >
          Atlas Challenge
        </motion.h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-muted">
          Name the country from its silhouette, or find it on the map. All {countries.length} of them, from easy to very hard.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Game modes">
        <ModeCard
          icon={<Target size={26} className="text-[#1f0a00]" />}
          accent="bg-gradient-to-b from-accent-hi to-accent"
          title="Classic"
          body="15 shapes at your chosen difficulty. Speed and streaks boost your score."
          meta={
            classicBest ? (
              <span className="inline-flex items-center gap-1.5">
                <Trophy size={15} className="text-warn" /> Best {classicBest.toLocaleString('en-US')}
              </span>
            ) : (
              'No record yet. Set one!'
            )
          }
          onClick={() => onPick('classic')}
          delay={0.05}
        />
        <ModeCard
          icon={<HeartPulse size={26} className="text-white" />}
          accent="bg-gradient-to-b from-[#fb7185] to-[#e11d48]"
          title="Survival"
          body="Endless shapes, three lives. It gets harder every 10 correct answers."
          meta={
            survivalBest ? (
              <span className="inline-flex items-center gap-1.5">
                <Trophy size={15} className="text-warn" /> Best {survivalBest.toLocaleString('en-US')}
              </span>
            ) : (
              'How far can you go?'
            )
          }
          onClick={() => onPick('survival')}
          delay={0.12}
        />
        <ModeCard
          icon={<CalendarDays size={26} className="text-white" />}
          accent="bg-gradient-to-b from-[#22d3ee] to-[#0891b2]"
          title="Daily"
          body={`${DAILY_LENGTH} shapes, easy to very hard. The same puzzle for everyone today.`}
          meta={
            <span className="flex items-center justify-between gap-2">
              {today ? (
                <span>
                  Done · {today.results.filter(Boolean).length}/{today.results.length} · next in{' '}
                  <span className="tabular-nums">{countdown}</span>
                </span>
              ) : (
                <span className="text-success">New puzzle ready</span>
              )}
              {streakAlive && (
                <span className="inline-flex items-center gap-1 text-accent-hi">
                  <Flame size={15} /> {dailyStreak.count}
                </span>
              )}
            </span>
          }
          onClick={() => onPick('daily')}
          delay={0.19}
        />
      </section>

      <InstallCard />

      <footer className="mt-auto pt-10 text-center text-xs font-semibold text-faint">
        197 countries · 4 difficulties · Map data © Natural Earth
      </footer>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
