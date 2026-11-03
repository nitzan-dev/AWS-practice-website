import { Download, Share, SquarePlus, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { isIos, promptInstall, useInstall } from '../pwa/install'
import { ClayButton } from './ClayButton'

const DISMISS_KEY = 'shape-atlas:install-dismissed'

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

/** Home-screen nudge to install the game as an app (button on Android/Chrome, instructions on iPhone). */
export function InstallCard() {
  const { deferred, installed } = useInstall()
  const [dismissed, setDismissed] = useState(readDismissed)
  const ios = isIos()

  if (installed || dismissed || (!deferred && !ios)) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* fine: it just shows again next time */
    }
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="clay-panel relative mt-6 flex flex-col gap-4 p-5 pr-14 sm:flex-row sm:items-center"
      aria-label="Install the app"
    >
      <img src="/app-icon.svg" alt="" width={56} height={56} className="size-14 shrink-0 rounded-2xl ring-1 ring-white/10" />
      <div className="flex-1">
        <p className="font-display text-xl font-semibold">Play it like an app</p>
        {deferred ? (
          <p className="text-sm text-muted">Add Atlas Challenge to your home screen. It opens full screen and works offline.</p>
        ) : (
          <p className="text-sm text-muted">
            In Safari, tap <Share size={15} className="inline align-[-2px] text-ink" aria-label="Share" /> Share, then{' '}
            <SquarePlus size={15} className="inline align-[-2px] text-ink" aria-hidden="true" />{' '}
            <span className="font-bold text-ink">Add to Home Screen</span>. It opens full screen and works offline.
          </p>
        )}
      </div>
      {deferred && (
        <ClayButton variant="accent" icon={<Download size={20} />} onClick={() => void promptInstall()}>
          Install
        </ClayButton>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="focus-ring absolute right-3 top-3 flex size-11 cursor-pointer items-center justify-center rounded-xl text-faint transition-colors duration-200 hover:text-ink"
      >
        <X size={18} />
      </button>
    </motion.aside>
  )
}
