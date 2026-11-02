import { memo } from 'react'
import { rngFor } from '../game/rng'

const rng = rngFor('stars')
const STARS = Array.from({ length: 110 }, () => ({
  x: rng() * 100,
  y: rng() * 100,
  r: rng() < 0.85 ? 0.6 + rng() * 0.6 : 1.3 + rng() * 0.8,
  twinkle: rng() < 0.18,
  delay: rng() * 4,
}))

/** Night-sky backdrop: glow, faint graticule and stars. Purely decorative. */
export const Starfield = memo(function Starfield() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#1b2466_0%,#0d1336_45%,#070b1f_80%)]" />
      <div className="absolute -left-40 top-1/3 size-[36rem] rounded-full bg-[#22d3ee]/8 blur-3xl" />
      <div className="absolute -right-32 -top-20 size-[30rem] rounded-full bg-[#c084fc]/10 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="grat-fade" cx="50%" cy="45%" r="55%">
            <stop offset="0" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="grat-mask">
            <rect width="100" height="100" fill="url(#grat-fade)" />
          </mask>
        </defs>
        <g mask="url(#grat-mask)" fill="none" stroke="#818cf8" strokeOpacity="0.09" strokeWidth="0.12">
          {[10, 20, 30, 40].map((rx) => (
            <ellipse key={rx} cx="50" cy="48" rx={rx} ry="44" />
          ))}
          {[-30, -15, 0, 15, 30].map((dy) => (
            <line key={dy} x1="2" x2="98" y1={48 + dy} y2={48 + dy} />
          ))}
          <line x1="50" x2="50" y1="4" y2="92" />
        </g>
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.12}
            fill="#e0e7ff"
            opacity={s.twinkle ? undefined : 0.45}
            className={s.twinkle ? 'animate-twinkle' : undefined}
            style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
          />
        ))}
      </svg>
    </div>
  )
})
