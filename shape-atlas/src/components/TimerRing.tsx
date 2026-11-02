interface Props {
  /** 0..1 remaining. */
  fraction: number
  seconds: number
}

export function TimerRing({ fraction, seconds }: Props) {
  const r = 20
  const c = 2 * Math.PI * r
  const color = fraction <= 0.15 ? 'var(--color-danger)' : fraction <= 0.3 ? 'var(--color-accent)' : 'var(--color-success)'
  return (
    <div className="relative size-14" role="timer" aria-label={`${seconds} seconds left`}>
      <svg viewBox="0 0 48 48" className="size-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill="var(--color-surface)" stroke="var(--color-raised)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          style={{ transition: 'stroke 300ms' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display text-lg font-semibold tabular-nums"
        style={{ color: fraction <= 0.3 ? color : undefined }}
      >
        {seconds}
      </span>
    </div>
  )
}
