import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { Starfield } from './components/Starfield'
import { AtlasContext, loadAtlas, type Atlas } from './data/atlas'
import { SPECS, answerModeLabel, type AnswerMode, type Difficulty, type GameMode } from './game/config'
import { dailyKey, dailySeed } from './game/daily'
import type { GameConfig, GameState } from './game/reducer'
import { randomSeed } from './game/rng'
import { Debug } from './screens/Debug'
import { Game } from './screens/Game'
import { Home } from './screens/Home'
import { Results, type ResultSummary } from './screens/Results'
import { Setup } from './screens/Setup'
import { useRecords } from './store/records'
import { useSettings } from './store/settings'

type Screen =
  | { name: 'home' }
  | { name: 'setup'; mode: GameMode }
  | { name: 'game'; config: GameConfig; id: string }
  | { name: 'results'; summary: ResultSummary; config?: GameConfig }

const isDebug = () => location.hash === '#debug' || new URLSearchParams(location.search).has('only')

function Loading() {
  return (
    <div className="flex min-h-safe flex-col items-center justify-center gap-4" role="status">
      <div className="size-14 animate-spin rounded-full border-4 border-raised border-t-primary-hi" />
      <p className="font-display text-xl text-muted">Charting the world…</p>
    </div>
  )
}

export default function App() {
  const [atlas, setAtlas] = useState<Atlas | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const reduceMotion = useSettings((s) => s.reduceMotion)
  const recordGame = useRecords((s) => s.recordGame)

  useEffect(() => {
    loadAtlas().then(setAtlas)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [screen.name])

  const start = useCallback((mode: GameMode, difficulty: Difficulty, answerMode: AnswerMode) => {
    const key = dailyKey()
    const config: GameConfig =
      mode === 'daily'
        ? { mode, difficulty, answerMode, seed: dailySeed(key), dailyKey: key }
        : { mode, difficulty, answerMode, seed: randomSeed() }
    setScreen({ name: 'game', config, id: randomSeed() })
  }, [])

  const finish = useCallback(
    (game: GameState) => {
      const isNewBest = recordGame(game)
      const { config } = game
      setScreen({
        name: 'results',
        config,
        summary: {
          mode: config.mode,
          difficultyLabel: SPECS[config.difficulty].label,
          answerModeLabel: answerModeLabel(config.answerMode),
          score: game.score,
          rounds: game.history,
          bestStreak: game.bestStreak,
          isNewBest,
          dailyKey: config.dailyKey,
        },
      })
    },
    [recordGame],
  )

  const showTodaysDaily = useCallback(() => {
    const key = dailyKey()
    const d = useRecords.getState().daily[key]
    if (!d) return
    setScreen({
      name: 'results',
      summary: {
        mode: 'daily',
        difficultyLabel: '',
        answerModeLabel: answerModeLabel(d.answerMode),
        score: d.score,
        rounds: d.countries.map((countryId, i) => ({ countryId, correct: d.results[i] })),
        bestStreak: d.bestStreak,
        isNewBest: false,
        dailyKey: key,
      },
    })
  }, [])

  const home = useCallback(() => setScreen({ name: 'home' }), [])

  let content: React.ReactNode
  if (!atlas) content = <Loading />
  else if (isDebug()) content = <Debug />
  else
    switch (screen.name) {
      case 'home':
        content = (
          <Home
            onPick={(mode) => {
              if (mode === 'daily' && useRecords.getState().daily[dailyKey()]) showTodaysDaily()
              else setScreen({ name: 'setup', mode })
            }}
          />
        )
        break
      case 'setup':
        content = (
          <Setup
            mode={screen.mode}
            onBack={home}
            onStart={(d, a) => start(screen.mode, d, a)}
            onShowDaily={showTodaysDaily}
          />
        )
        break
      case 'game':
        content = <Game key={screen.id} config={screen.config} onExit={home} onFinish={finish} />
        break
      case 'results': {
        const cfg = screen.config
        content = (
          <Results
            summary={screen.summary}
            onHome={home}
            onPlayAgain={cfg && cfg.mode !== 'daily' ? () => start(cfg.mode, cfg.difficulty, cfg.answerMode) : undefined}
            onSetup={cfg && cfg.mode !== 'daily' ? () => setScreen({ name: 'setup', mode: cfg.mode }) : undefined}
          />
        )
        break
      }
    }

  const screenKey = !atlas ? 'loading' : screen.name === 'game' ? screen.id : screen.name

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <Starfield />
      <AtlasContext.Provider value={atlas}>
        <AnimatePresence mode="wait">
          <motion.div
            key={screenKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </AtlasContext.Provider>
    </MotionConfig>
  )
}
