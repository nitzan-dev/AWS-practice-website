import { geoAzimuthalEqualArea, geoPath } from 'd3-geo'
import { motion, useReducedMotion } from 'motion/react'
import { useId, useMemo } from 'react'
import type { Country } from '../data/types'
import type { WorldFeature } from '../data/world'

export type StageStatus = 'idle' | 'correct' | 'wrong'

interface Props {
  country: Country
  outline?: boolean
  rotation?: number
  status?: StageStatus
  /** Bordering countries to draw faintly around the shape (neighbours hint). */
  neighbors?: WorldFeature[]
  showScale?: boolean
  className?: string
  /** Disable the glow + entry animation (used in dense grids). */
  plain?: boolean
}

const NICE = [1, 2, 5]

function scaleBar(kmPerUnit: number) {
  const target = kmPerUnit * 170
  const pow = 10 ** Math.floor(Math.log10(target))
  let km = pow
  for (const n of NICE) if (n * pow <= target) km = n * pow
  return { km, width: km / kmPerUnit }
}

const fmtKm = (km: number) => (km >= 1 ? `${km.toLocaleString()} km` : `${Math.round(km * 1000)} m`)

export function ShapeStage({
  country,
  outline = false,
  rotation = 0,
  status = 'idle',
  neighbors,
  showScale = false,
  className = '',
  plain = false,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const reduce = useReducedMotion()

  const neighborPaths = useMemo(() => {
    if (!neighbors?.length) return []
    const p = country.projection
    const projection = geoAzimuthalEqualArea()
      .rotate(p.rotate)
      .scale(p.scale)
      .translate(p.translate)
      .clipExtent([
        [-260, -260],
        [1260, 1260],
      ])
    const path = geoPath(projection)
    return neighbors.map((f) => ({ key: f.properties.name, d: path(f) ?? '' }))
  }, [country, neighbors])

  const zoomed = neighborPaths.length > 0
  const viewBox = zoomed ? '-250 -250 1500 1500' : '0 0 1000 1000'
  const bar = showScale ? scaleBar(country.kmPerUnit) : null

  const [c1, c2, c3] =
    status === 'correct'
      ? ['#6ee7b7', '#34d399', '#10b981']
      : status === 'wrong'
        ? ['#fca5a5', '#f87171', '#ef4444']
        : ['var(--shape-a)', 'var(--shape-b)', 'var(--shape-c)']

  const glow =
    status === 'correct' ? 'rgb(52 211 153 / 0.55)' : status === 'wrong' ? 'rgb(248 113 113 / 0.5)' : 'rgb(129 140 248 / 0.5)'

  return (
    <motion.svg
      viewBox={viewBox}
      animate={{ viewBox }}
      transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`block h-full w-full overflow-visible ${status === 'wrong' && !plain ? 'animate-shake' : ''} ${className}`}
      role="img"
      aria-label="Country silhouette"
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="0.55" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </linearGradient>
        <radialGradient id={`f${uid}`} gradientUnits="userSpaceOnUse" cx="500" cy="500" r="760">
          <stop offset="0.55" stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`m${uid}`} maskUnits="userSpaceOnUse" x="-250" y="-250" width="1500" height="1500">
          <rect x="-250" y="-250" width="1500" height="1500" fill={`url(#f${uid})`} />
        </mask>
      </defs>

      <g mask={`url(#m${uid})`}>
        {neighborPaths.map((n) => (
          <motion.path
            key={n.key}
            d={n.d}
            fill="rgb(129 140 248 / 0.07)"
            stroke="rgb(165 180 252 / 0.45)"
            strokeWidth={3}
            strokeDasharray="10 8"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        ))}
      </g>

      <motion.g
        key={country.id + rotation}
        initial={plain || reduce ? false : { opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        style={{
          transformOrigin: '500px 500px',
          filter: plain ? undefined : `drop-shadow(0 0 18px ${glow}) drop-shadow(0 12px 30px rgb(0 0 0 / 0.5))`,
        }}
      >
        <g transform={rotation ? `rotate(${rotation} 500 500)` : undefined}>
          {country.islands?.map(([x, y, r], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={outline ? 'none' : `url(#g${uid})`}
              fillOpacity={0.12}
              stroke={`url(#g${uid})`}
              strokeOpacity={0.75}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path
            d={country.path}
            fillRule="evenodd"
            fill={outline ? 'none' : `url(#g${uid})`}
            stroke={outline ? `url(#g${uid})` : 'rgb(255 255 255 / 0.35)'}
            strokeWidth={outline ? 4 : 1.5}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </motion.g>

      {bar && (
        <g transform="translate(40 968)" aria-hidden="true" opacity={zoomed ? 0 : 1}>
          <line x1={0} x2={bar.width} y1={0} y2={0} stroke="var(--color-muted)" strokeWidth={4} strokeLinecap="round" />
          <line x1={0} x2={0} y1={-10} y2={10} stroke="var(--color-muted)" strokeWidth={4} strokeLinecap="round" />
          <line x1={bar.width} x2={bar.width} y1={-10} y2={10} stroke="var(--color-muted)" strokeWidth={4} strokeLinecap="round" />
          <text x={bar.width + 16} y={9} fill="var(--color-muted)" fontSize={28} fontFamily="var(--font-sans)" fontWeight={700}>
            {fmtKm(bar.km)}
          </text>
        </g>
      )}
    </motion.svg>
  )
}
