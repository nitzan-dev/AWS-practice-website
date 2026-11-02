import { ShapeStage } from '../components/ShapeStage'
import { useAtlas } from '../data/atlas'

/** Developer page (#debug): every shape in a grid for visual QA. */
export function Debug() {
  const all = useAtlas().countries
  const only = new URLSearchParams(location.search).get('only')?.split(',')
  const countries = only ? all.filter((c) => only.includes(c.id)) : all
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl font-semibold">All {countries.length} shapes</h1>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
        {countries.map((c) => (
          <figure key={c.id} className="rounded-2xl bg-surface p-2">
            <div className="aspect-square">
              <ShapeStage country={c} plain showScale />
            </div>
            <figcaption className="mt-1 truncate text-center text-xs text-muted">
              {c.name} <span className="text-faint">T{c.tier}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
