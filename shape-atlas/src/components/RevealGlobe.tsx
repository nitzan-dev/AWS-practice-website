import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import type { Country } from '../data/types'
import { worldKey, type WorldFeature } from '../data/world'
import type { StageStatus } from './ShapeStage'

interface Props {
  country: Country
  world: Map<string, WorldFeature> | null
  status: StageStatus
}

const SIZE = 500
const graticule = geoGraticule10()
// Remember where the globe was pointing so each reveal spins on from the last country.
let lastRotation: [number, number] = [0, -20]

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export function RevealGlobe({ country, world, status }: Props) {
  const reduce = useReducedMotion()
  const target = useMemo<[number, number]>(
    () => [-country.centroid[0], Math.max(-60, Math.min(60, -country.centroid[1]))],
    [country],
  )
  const [animated, setAnimated] = useState<[number, number]>(lastRotation)
  const rotation = reduce ? target : animated

  useEffect(() => {
    const from = lastRotation
    let dl = target[0] - from[0]
    dl = ((((dl + 180) % 360) + 360) % 360) - 180 // shortest way round
    const dp = target[1] - from[1]
    lastRotation = target
    if (reduce) return
    const start = performance.now()
    const duration = 1200
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = easeInOut(t)
      setAnimated([from[0] + dl * e, from[1] + dp * e])
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, reduce])

  const projection = geoOrthographic()
    .scale(SIZE / 2 - 12)
    .translate([SIZE / 2, SIZE / 2])
    .rotate(rotation)
    .clipAngle(90)
  const path = geoPath(projection)
  const key = worldKey(country)
  const highlight = world?.get(key)
  const marker = projection(country.centroid)
  const markerVisible = geoDistance(country.centroid, [-rotation[0], -rotation[1]]) < Math.PI / 2 - 0.05
  const hi = status === 'correct' ? '#34d399' : status === 'wrong' ? '#f87171' : '#818cf8'

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-full w-full" role="img" aria-label={`Globe showing ${country.name}`}>
      <defs>
        <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#24307a" />
          <stop offset="0.65" stopColor="#141c4a" />
          <stop offset="1" stopColor="#0a0f2e" />
        </radialGradient>
        <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
          <stop offset="0.9" stopColor="#818cf8" stopOpacity="0" />
          <stop offset="0.96" stopColor="#818cf8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="shade" cx="35%" cy="30%" r="80%">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#atmo)" />
      <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#ocean)" />
      <path d={path(graticule) ?? ''} fill="none" stroke="#818cf8" strokeOpacity={0.12} strokeWidth={0.8} />
      <g fill="#2a3577" stroke="#4453a3" strokeWidth={0.6} strokeOpacity={0.7}>
        {world &&
          [...world.entries()].map(([k, f]) =>
            k === key ? null : <path key={k} d={path(f) ?? ''} />,
          )}
      </g>
      {highlight && (
        <path
          d={path(highlight) ?? ''}
          fill={hi}
          stroke="#fff"
          strokeWidth={1}
          style={{ filter: `drop-shadow(0 0 8px ${hi})` }}
        />
      )}
      {marker && markerVisible && (
        <g transform={`translate(${marker[0]} ${marker[1]})`}>
          <circle r={18} fill="none" stroke={hi} strokeWidth={2.5} opacity={0.9}>
            {!reduce && (
              <>
                <animate attributeName="r" values="8;28;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite" />
              </>
            )}
          </circle>
          <circle r={5} fill={hi} stroke="#fff" strokeWidth={2} />
        </g>
      )}
      <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#shade)" pointerEvents="none" />
    </svg>
  )
}
