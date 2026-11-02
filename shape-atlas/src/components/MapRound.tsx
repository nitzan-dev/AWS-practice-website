import { Check, MousePointerClick } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAtlas } from '../data/atlas'
import type { Country, WorldMapData } from '../data/types'
import { loadWorldMap } from '../data/worldmap'
import { SPECS, showFlagFor, type Difficulty, type HintKind } from '../game/config'
import { ClayButton } from './ClayButton'
import { Flag } from './Flag'
import { HintPanel } from './HintPanel'
import { ShapeStage } from './ShapeStage'
import { WorldMap } from './WorldMap'

interface Props {
  questionKey: number
  country: Country
  difficulty: Difficulty
  modeLabel: string
  hints: HintKind[]
  onHint: (kind: HintKind) => void
  revealed: boolean
  pickedId: string | null
  selectedId: string | null
  onSelect: (id: string) => void
  onConfirm: () => void
  factCard: ReactNode
}

/** "Find on map" round: the name is given, the player picks the country on a world map. */
export function MapRound({
  questionKey,
  country,
  difficulty,
  modeLabel,
  hints,
  onHint,
  revealed,
  pickedId,
  selectedId,
  onSelect,
  onConfirm,
  factCard,
}: Props) {
  const { countries } = useAtlas()
  const [data, setData] = useState<WorldMapData | null>(null)
  const spec = SPECS[difficulty]

  useEffect(() => {
    loadWorldMap().then(setData)
  }, [])

  const focusIds = useMemo(
    () =>
      hints.includes('continent')
        ? countries.filter((c) => c.continent === country.continent && c.tier <= 3).map((c) => c.id)
        : undefined,
    [hints, countries, country],
  )
  const highlightIds = hints.includes('neighbors') ? country.borders : undefined

  return (
    <main className="mt-4 flex flex-1 flex-col gap-4">
      {/* prompt */}
      <section className="clay-panel flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {showFlagFor(difficulty) && (
              <Flag iso2={country.iso2} className="w-14 shrink-0 rounded-md ring-1 ring-white/15 sm:w-16" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-faint">{modeLabel} · Find this country</p>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{country.name}</h1>
            </div>
          </div>
          {!revealed && (
            <ClayButton
              variant="accent"
              size="lg"
              disabled={!selectedId}
              onClick={onConfirm}
              icon={selectedId ? <Check size={22} strokeWidth={3} /> : <MousePointerClick size={22} />}
              className="w-full sm:w-auto"
            >
              {selectedId ? 'Confirm' : 'Pick on the map'}
            </ClayButton>
          )}
        </div>
        {!revealed && (
          <HintPanel
            country={country}
            difficulty={difficulty}
            answerMode="map"
            used={hints}
            disabled={false}
            onUse={onHint}
          />
        )}
      </section>

      {/* map + result */}
      <div className="relative flex flex-1 flex-col gap-4">
        <section className="clay-panel relative h-[46vh] min-h-[300px] overflow-hidden p-0 sm:h-[58vh] lg:h-auto lg:min-h-[480px] lg:flex-1">
          {data ? (
            <WorldMap
              data={data}
              questionKey={questionKey}
              selectedId={selectedId}
              onSelect={onSelect}
              revealed={revealed}
              targetId={country.id}
              pickedId={pickedId}
              highlightIds={highlightIds}
              focusIds={focusIds}
              hideBorders={spec.outline}
            />
          ) : (
            <div className="flex h-full items-center justify-center" role="status">
              <div className="size-10 animate-spin rounded-full border-4 border-raised border-t-primary-hi" />
              <span className="sr-only">Loading map</span>
            </div>
          )}

          <AnimatePresence>
            {hints.includes('shape') && !revealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="clay-panel pointer-events-none absolute left-2 top-2 size-20 p-1.5 sm:left-3 sm:top-3 sm:size-36 sm:p-2"
                aria-label="Shape hint"
              >
                <ShapeStage country={country} plain />
              </motion.div>
            )}
          </AnimatePresence>

          {spec.outline && !revealed && (
            <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-deep/70 px-3 py-1 text-xs font-bold text-muted">
              Borders hidden
            </p>
          )}
        </section>

        {revealed && (
          <div className="clay-panel p-5 sm:p-6 lg:absolute lg:right-4 lg:top-4 lg:w-[400px]">{factCard}</div>
        )}
      </div>
    </main>
  )
}
