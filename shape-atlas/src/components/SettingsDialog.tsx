import { useState } from 'react'
import { useRecords } from '../store/records'
import { useSettings } from '../store/settings'
import { ClayButton } from './ClayButton'
import { Modal } from './Modal'

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-deep/40 px-4 py-3">
      <span>
        <span className="block font-bold">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-raised transition-colors duration-200 peer-checked:bg-primary peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
      />
    </label>
  )
}

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { sound, reduceMotion, set } = useSettings()
  const reset = useRecords((s) => s.reset)
  const [confirm, setConfirm] = useState(false)

  return (
    <Modal
      open={open}
      title="Settings"
      onClose={() => {
        setConfirm(false)
        onClose()
      }}
    >
      <div className="flex flex-col gap-3">
        <Toggle label="Sound effects" hint="Chimes, ticks and fanfares" checked={sound} onChange={(v) => set({ sound: v })} />
        <Toggle
          label="Reduce motion"
          hint="Calmer transitions, no spinning globe"
          checked={reduceMotion}
          onChange={(v) => set({ reduceMotion: v })}
        />
        <div className="mt-2 rounded-2xl border border-danger/25 p-4">
          <p className="font-bold">Reset records</p>
          <p className="text-sm text-muted">Clears best scores, daily history and streaks.</p>
          {confirm ? (
            <div className="mt-3 flex gap-2">
              <ClayButton
                variant="ghost"
                className="flex-1 !text-danger"
                onClick={() => {
                  reset()
                  setConfirm(false)
                }}
              >
                Yes, reset
              </ClayButton>
              <ClayButton variant="ghost" className="flex-1" onClick={() => setConfirm(false)}>
                Cancel
              </ClayButton>
            </div>
          ) : (
            <ClayButton variant="ghost" className="mt-3 w-full" onClick={() => setConfirm(true)}>
              Reset…
            </ClayButton>
          )}
        </div>
        <ClayButton variant="primary" className="mt-2" onClick={onClose}>
          Done
        </ClayButton>
      </div>
    </Modal>
  )
}
