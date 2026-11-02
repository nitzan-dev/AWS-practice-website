import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { sfx } from '../audio/sfx'

type Variant = 'accent' | 'primary' | 'ghost'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg'
  icon?: ReactNode
  silent?: boolean
}

const VARIANTS: Record<Variant, string> = {
  accent:
    'text-[#1f0a00] bg-gradient-to-b from-accent-hi to-accent shadow-[inset_0_2px_0_rgb(255_255_255/0.35),inset_0_-4px_0_rgb(0_0_0/0.18),0_12px_28px_-10px_rgb(249_115_22/0.8)]',
  primary:
    'text-white bg-gradient-to-b from-primary-hi to-primary shadow-[inset_0_2px_0_rgb(255_255_255/0.25),inset_0_-4px_0_rgb(0_0_0/0.2),0_12px_28px_-10px_rgb(99_102_241/0.8)]',
  ghost: 'clay text-ink hover:brightness-125',
}

export function ClayButton({ variant = 'primary', size = 'md', icon, silent, className = '', children, onClick, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      onClick={(e) => {
        if (!silent) sfx.click()
        onClick?.(e)
      }}
      className={`focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-[20px] font-display font-semibold tracking-wide transition-[transform,filter,box-shadow] duration-200 ease-out hover:brightness-110 active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${
        size === 'lg' ? 'min-h-14 px-8 text-xl' : 'min-h-12 px-5 text-base'
      } ${VARIANTS[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

export function IconButton({ label, children, className = '', onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      onClick={(e) => {
        sfx.click()
        onClick?.(e)
      }}
      className={`focus-ring clay inline-flex size-12 cursor-pointer items-center justify-center text-muted transition-[filter,transform] duration-200 hover:text-ink hover:brightness-125 active:translate-y-[2px] ${className}`}
    >
      {children}
    </button>
  )
}
