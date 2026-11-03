import { create } from 'zustand'

// Chrome/Edge/Android fire `beforeinstallprompt`; we hold on to it so the home screen can offer an
// Install button. Listeners are registered at import time because the event can fire before React mounts.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

/** iPhone/iPad (iPadOS reports itself as a Mac with touch). */
export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

interface InstallState {
  deferred: BeforeInstallPromptEvent | null
  installed: boolean
}

export const useInstall = create<InstallState>(() => ({ deferred: null, installed: isStandalone() }))

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  useInstall.setState({ deferred: e as BeforeInstallPromptEvent })
})
window.addEventListener('appinstalled', () => useInstall.setState({ deferred: null, installed: true }))

export async function promptInstall() {
  const deferred = useInstall.getState().deferred
  if (!deferred) return
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  useInstall.setState({ deferred: null, installed: outcome === 'accepted' })
}
