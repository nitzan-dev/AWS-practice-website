import { CornerDownLeft, SkipForward } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Country } from '../data/types'
import type { DifficultySpec } from '../game/config'
import { resolveAnswer, suggest, type MatchIndex } from '../game/matcher'

interface Props {
  index: MatchIndex
  byId: Map<string, Country>
  spec: DifficultySpec
  disabled: boolean
  onSubmit: (id: string | null) => void
}

export function TypeAnswer({ index, byId, spec, disabled, onSubmit }: Props) {
  const [value, setValue] = useState('')
  const [active, setActive] = useState(-1)
  const [error, setError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Country[] | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!disabled) input.current?.focus()
  }, [disabled])

  const suggestions = useMemo(() => {
    if (spec.autocompleteAfter === null || value.trim().length < spec.autocompleteAfter) return []
    return suggest(value, index, byId, 5)
  }, [value, index, byId, spec.autocompleteAfter])

  const submit = (text: string) => {
    const r = resolveAnswer(text, index, spec.typoTolerance)
    if (r.kind === 'match') return onSubmit(r.id)
    if (r.kind === 'ambiguous') {
      setChoices(r.ids.map((id) => byId.get(id)!))
      setError('Which one do you mean?')
      return
    }
    setError(text.trim() ? "That's not a country we know. Check the spelling." : 'Type a country name first.')
  }

  const showList = !disabled && suggestions.length > 0 && !choices

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (disabled) return
          if (active >= 0 && suggestions[active]) onSubmit(suggestions[active].id)
          else submit(value)
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <label htmlFor={`${listId}-input`} className="sr-only">
            Country name
          </label>
          <input
            ref={input}
            id={`${listId}-input`}
            value={value}
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={!!error && !choices}
            aria-describedby={error ? `${listId}-err` : undefined}
            placeholder="Type the country…"
            onChange={(e) => {
              setValue(e.target.value)
              setActive(-1)
              setError(null)
              setChoices(null)
            }}
            onKeyDown={(e) => {
              if (!showList) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => (a + 1) % suggestions.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1))
              }
            }}
            className="focus-ring clay h-14 w-full px-5 font-display text-xl text-ink placeholder:text-faint focus:outline-none disabled:opacity-60"
          />
          {showList && (
            <ul
              id={listId}
              role="listbox"
              className="clay-panel absolute inset-x-0 top-full z-[var(--z-dropdown)] mt-2 overflow-hidden p-1.5"
            >
              {suggestions.map((c, i) => (
                <li
                  key={c.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSubmit(c.id)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`cursor-pointer rounded-xl px-4 py-2.5 text-base font-semibold transition-colors duration-150 ${
                    i === active ? 'bg-primary/30 text-ink' : 'text-muted'
                  }`}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          aria-label="Submit answer"
          className="focus-ring inline-flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-[20px] bg-gradient-to-b from-accent-hi to-accent text-[#1f0a00] shadow-[inset_0_2px_0_rgb(255_255_255/0.35),inset_0_-4px_0_rgb(0_0_0/0.18)] transition-transform duration-200 hover:brightness-110 active:translate-y-[2px] disabled:opacity-50"
        >
          <CornerDownLeft size={22} strokeWidth={2.5} />
        </button>
      </form>

      <div className="mt-3 flex min-h-8 flex-wrap items-center gap-2">
        {error && (
          <p id={`${listId}-err`} role="alert" className={`text-sm font-semibold ${choices ? 'text-warn' : 'text-danger'}`}>
            {error}
          </p>
        )}
        {choices?.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSubmit(c.id)}
            className="focus-ring clay min-h-11 cursor-pointer px-4 text-sm font-bold hover:brightness-125"
          >
            {c.name}
          </button>
        ))}
        {!disabled && (
          <button
            type="button"
            onClick={() => onSubmit(null)}
            className="focus-ring ml-auto inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-faint transition-colors duration-200 hover:text-ink"
          >
            <SkipForward size={16} /> Skip
          </button>
        )}
      </div>
    </div>
  )
}
