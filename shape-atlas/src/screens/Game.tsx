import { Flame, Heart, Pause, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { sfx } from '../audio/sfx'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { ChoiceGrid } from '../components/ChoiceGrid'
import { ClayButton, IconButton } from '../components/ClayButton'
import { FactCard } from '../components/FactCard'
import { HintPanel } from '../components/HintPanel'
import { Modal } from '../components/Modal'
import { RevealGlobe } from '../components/RevealGlobe'
import { ShapeStage } from '../components/ShapeStage'
import { TimerRing } from '../components/TimerRing'
import { TypeAnswer } from '../components/TypeAnswer'
import { useAtlas } from '../data/atlas'
import { loadWorld, worldKey, type WorldFeature } from '../data/world'
import { SPECS, SURVIVAL_LIVES, hintKindsFor } from '../game/config'
import { buildIndex } from '../game/matcher'
import { createGameReducer, currentQuestion, initGame, type GameConfig, type GameState } from '../game/reducer'
import { useSettings } from '../store/settings'

interface Props {
  config: GameConfig
  onExit: () => void
  onFinish: (state: GameState) => void
}

export function Game({ config, onExit, onFinish }: Props) {
  const { countries, byId } = useAtlas()
  const reducer = useMemo(() => createGameReducer(countries), [countries])
  const [state, dispatch] = useReducer(reducer, config, (c) => initGame(c, countries))
  const index = useMemo(() => buildIndex(countries), [countries])
  const [world, setWorld] = useState<Map<string, WorldFeature> | null>(null)
  const [paused, setPaused] = useState(false)
  const sound = useSettings((s) => s.sound)
  const setSettings = useSettings((s) => s.set)

  useEffect(() => {
    loadWorld().then(setWorld)
  }, [])

  const q = currentQuestion(state)
  const country = byId.get(q.countryId)!
  const spec = SPECS[q.difficulty]
  const timerMs = spec.timer ? spec.timer * 1000 : 0
  const revealed = state.phase !== 'question'
  const last = state.history.at(-1)
  const record = revealed ? last : undefined

  // ---- timer ----
  const [remaining, setRemaining] = useState(timerMs)
  const lastSecond = useRef(Infinity)
  useEffect(() => {
    setRemaining(timerMs)
    lastSecond.current = Infinity
  }, [state.index, timerMs])

  useEffect(() => {
    if (state.phase !== 'question' || !timerMs || paused) return
    let prev = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const dt = now - prev
      prev = now
      setRemaining((r) => Math.max(0, r - dt))
    }, 100)
    return () => window.clearInterval(id)
  }, [state.phase, state.index, timerMs, paused])

  const answer = useCallback(
    (id: string | null) => {
      dispatch({ type: 'answer', answerId: id, timeLeft: timerMs ? remaining / timerMs : null })
    },
    [remaining, timerMs],
  )

  useEffect(() => {
    if (!timerMs || state.phase !== 'question') return
    const secs = Math.ceil(remaining / 1000)
    if (secs <= 5 && secs > 0 && secs < lastSecond.current) sfx.tick()
    lastSecond.current = secs
    if (remaining <= 0) answer(null)
  }, [remaining, timerMs, state.phase, answer])

  // ---- sounds on each result ----
  useEffect(() => {
    if (!last) return
    if (!last.correct) sfx.wrong()
    else if (state.streak > 0 && state.streak % 5 === 0) sfx.streak()
    else sfx.correct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.history.length])

  useEffect(() => {
    if (state.phase === 'over') onFinish(state)
  }, [state, onFinish])

  const next = useCallback(() => dispatch({ type: 'next' }), [])

  // ---- keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused) return
      const tag = (e.target as HTMLElement).tagName
      if (e.key === 'Escape') {
        setPaused(true)
        return
      }
      if (tag === 'INPUT' || tag === 'BUTTON') return
      if (e.key === 'Enter' && state.phase === 'reveal') {
        e.preventDefault()
        next()
      } else if ((e.key === 'h' || e.key === 'H') && state.phase === 'question') {
        const kind = hintKindsFor(q.difficulty).find((k) => !state.hints.includes(k))
        if (kind && state.hints.length < spec.hints) {
          sfx.hint()
          dispatch({ type: 'hint', kind })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paused, state.phase, state.hints, q.difficulty, spec.hints, next])

  const neighbors = useMemo(() => {
    if (!world || !state.hints.includes('neighbors')) return undefined
    return country.borders.map((id) => world.get(worldKey(byId.get(id)!))).filter((f): f is WorldFeature => !!f)
  }, [world, state.hints, country, byId])

  const status = record ? (record.correct ? 'correct' : 'wrong') : 'idle'
  const total = config.mode === 'survival' ? null : state.questions.length
  const isLast =
    config.mode === 'survival' ? state.lives === 0 : state.index + 1 >= state.questions.length

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6">
      {/* HUD */}
      <header className="relative z-[var(--z-hud)] flex items-center gap-3">
        <IconButton label="Pause" onClick={() => setPaused(true)}>
          <Pause size={20} />
        </IconButton>

        <div className="min-w-0 flex-1">
          {total ? (
            <div>
              <div className="flex items-baseline justify-between text-sm font-bold text-muted">
                <span>
                  Shape <span className="text-ink">{state.index + 1}</span> / {total}
                </span>
                <span className="hidden rounded-full bg-raised px-2.5 py-0.5 text-xs uppercase tracking-wider sm:inline">
                  {spec.label}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-raised">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#22d3ee] via-primary-hi to-[#c084fc]"
                  animate={{ width: `${((state.index + (revealed ? 1 : 0)) / total) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" aria-label={`${state.lives} lives left`}>
              {Array.from({ length: SURVIVAL_LIVES }, (_, i) => (
                <motion.span key={i} animate={{ scale: i < (state.lives ?? 0) ? 1 : 0.8 }}>
                  <Heart
                    size={26}
                    className={i < (state.lives ?? 0) ? 'fill-danger text-danger' : 'text-line'}
                    strokeWidth={2.2}
                  />
                </motion.span>
              ))}
              <span className="ml-2 rounded-full bg-raised px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-muted">
                {spec.label}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-faint">Score</div>
            <AnimatedNumber value={state.score} className="font-display text-2xl font-bold leading-none" />
          </div>
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-display text-lg font-semibold transition-colors duration-300 ${
              state.streak >= 3 ? 'bg-accent/20 text-accent-hi' : 'text-faint'
            }`}
            aria-label={`Streak ${state.streak}`}
          >
            <Flame size={20} className={state.streak >= 3 ? 'fill-accent/60' : ''} />
            {state.streak}
          </div>
          {timerMs > 0 && (
            <TimerRing fraction={remaining / timerMs} seconds={Math.ceil(remaining / 1000)} />
          )}
          <IconButton
            label={sound ? 'Mute sound' : 'Turn sound on'}
            onClick={() => setSettings({ sound: !sound })}
            className="hidden sm:inline-flex"
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </IconButton>
        </div>
      </header>

      <main className="mt-3 grid flex-1 items-center gap-4 sm:mt-5 sm:gap-6 lg:mt-2 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* Stage */}
        <section className="relative mx-auto aspect-square w-full max-w-[min(560px,42vh)] sm:max-w-[min(560px,52vh)] lg:max-w-[min(600px,72vh)]">
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgb(99_102_241/0.22),transparent_70%)]" />
          <AnimatePresence>
            {revealed && (
              <motion.div
                key="globe"
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <RevealGlobe country={country} world={world} status={status} />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 140, damping: 20, delay: revealed ? 0.25 : 0 }}
            className={
              revealed
                ? 'clay-panel absolute left-0 top-0 z-10 size-[30%] p-3'
                : 'absolute inset-0'
            }
          >
            <ShapeStage
              key={state.index}
              country={country}
              outline={spec.outline && !revealed}
              rotation={revealed ? 0 : q.rotation}
              status={status}
              neighbors={revealed ? undefined : neighbors}
              showScale={spec.showScale && !revealed}
              plain={revealed}
            />
          </motion.div>
        </section>

        {/* Panel */}
        <section className="clay-panel relative w-full p-5 sm:p-7">
          {state.phase === 'question' ? (
            <div key={`q${state.index}`} className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-faint">
                  {config.mode === 'daily' ? `Daily · ${spec.label}` : config.mode === 'survival' ? 'Survival' : 'Classic'}
                </p>
                <h1 className="mt-1 font-display text-2xl font-semibold sm:text-4xl">Which country is this?</h1>
              </div>
              {config.answerMode === 'choices' ? (
                <ChoiceGrid
                  options={q.options.map((id) => byId.get(id)!)}
                  revealed={false}
                  correctId={q.countryId}
                  pickedId={null}
                  onPick={answer}
                />
              ) : (
                <TypeAnswer key={state.index} index={index} byId={byId} spec={spec} disabled={false} onSubmit={answer} />
              )}
              <HintPanel
                country={country}
                difficulty={q.difficulty}
                used={state.hints}
                disabled={false}
                onUse={(kind) => {
                  sfx.hint()
                  dispatch({ type: 'hint', kind })
                }}
              />
            </div>
          ) : (
            record && (
              <FactCard
                key={state.index}
                country={country}
                correct={record.correct}
                answer={record.answerId ? byId.get(record.answerId)! : null}
                timedOut={!record.answerId && !!timerMs && remaining <= 0}
                points={record.points}
                streak={state.streak}
                isLast={isLast}
                onNext={next}
              />
            )
          )}
        </section>
      </main>

      <div className="sr-only" aria-live="assertive">
        {record ? `${record.correct ? 'Correct' : 'Wrong'}. It's ${country.name}. ${record.points} points.` : ''}
      </div>

      <Modal open={paused} title="Paused" onClose={() => setPaused(false)}>
        <p className="text-muted">The clock is stopped. Take a breath.</p>
        <div className="mt-6 flex flex-col gap-3">
          <ClayButton variant="accent" onClick={() => setPaused(false)}>
            Resume
          </ClayButton>
          <ClayButton variant="ghost" onClick={onExit}>
            Quit to menu
          </ClayButton>
        </div>
      </Modal>
    </div>
  )
}
