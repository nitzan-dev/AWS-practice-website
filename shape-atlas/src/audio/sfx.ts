import { useSettings } from '../store/settings'

// Synthesized sound effects — no audio files to load.
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (!useSettings.getState().sound) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

/** Vibration feedback on supported phones (Android; iOS Safari ignores it). */
export function buzz(pattern: number | number[]) {
  if (!useSettings.getState().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

export const sfx = {
  correct() {
    tone(660, 0, 0.18, 'triangle')
    tone(990, 0.09, 0.28, 'triangle')
  },
  wrong() {
    tone(196, 0, 0.32, 'sine', 0.25)
    tone(147, 0.06, 0.36, 'sine', 0.2)
  },
  tick() {
    tone(1200, 0, 0.05, 'square', 0.04)
  },
  click() {
    tone(520, 0, 0.06, 'triangle', 0.08)
  },
  hint() {
    tone(880, 0, 0.12, 'sine', 0.1)
    tone(1320, 0.06, 0.14, 'sine', 0.07)
  },
  streak() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.2, 'triangle', 0.12))
  },
  record() {
    ;[523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.26, 'triangle', 0.14))
  },
}
