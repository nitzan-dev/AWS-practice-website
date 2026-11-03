import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAtlas } from '../data/atlas'
import type { Country, WorldMapData } from '../data/types'
import { loadWorldMap } from '../data/worldmap'
import { SPECS, type Difficulty, type HintKind } from '../game/config'
import { ShapeStage } from './ShapeStage'
import { WorldMap } from './WorldMap'

/** How much surrounding map to show around the highlighted country when naming it. */
const NAME_CONTEXT: Record<Difficulty, number> = { easy: 2.5, medium: 3, hard: 4.5, veryhard: 6 }

interface Props {
  /** find: the name is given, pick the country. name: the country is lit up, type its name. */
  variant: 'find' | 'name'
  questionKey: number
  country: Country
  difficulty: Difficulty
  hints: HintKind[]
  revealed: boolean
  pickedId: string | null
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Contents of the panel above the map (title, answer controls, hints). */
  prompt: ReactNode
  factCard: ReactNode
}

/** A round played on the world map. */
export function MapRound({
  variant,
  questionKey,
  country,
  difficulty,
  hints,
  revealed,
  pickedId,
  selectedId,
  onSelect,
  prompt,
  factCard,
}: Props) {
  const { countries } = useAtlas()
  const [data, setData] = useState<WorldMapData | null>(null)
  const spec = SPECS[difficulty]
  const find = variant === 'find'

  useEffect(() => {
    loadWorldMap().then(setData)
  }, [])

  // map-based hints only apply when finding: when naming, the map already shows where it is
  const focusIds = useMemo(
    () =>
      find && hints.includes('continent')
        ? countries.filter((c) => c.continent === country.continent && c.tier <= 3).map((c) => c.id)
        : undefined,
    [find, hints, countries, country],
  )
  const highlightIds = find && hints.includes('neighbors') ? country.borders : undefined

  return (
    <main className="mt-4 flex flex-1 flex-col gap-4">
      {/* raised above the map so the autocomplete list can overlap it */}
      <section className="clay-panel relative z-[var(--z-dropdown)] flex flex-col gap-4 p-4 sm:p-5">{prompt}</section>

      <div className="relative flex flex-1 flex-col gap-4">
        <section className="clay-panel relative h-[46vh] min-h-[300px] overflow-hidden p-0 sm:h-[58vh] lg:h-auto lg:min-h-[480px] lg:flex-1">
          {data ? (
            <WorldMap
              data={data}
              questionKey={questionKey}
              selectedId={selectedId}
              onSelect={find ? onSelect : undefined}
              markId={find ? undefined : country.id}
              context={NAME_CONTEXT[difficulty]}
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
            {find && hints.includes('shape') && !revealed && (
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
