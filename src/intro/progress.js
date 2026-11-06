import { useSyncExternalStore } from 'react'

// Real loading progress for the intro's progress bar (the portfolio's bar only tracked
// the animation). Weighted parts: the 3D code chunk 0.4, the rocket model's bytes 0.5,
// compiling shaders 0.1. Each part reports 0–1.

const WEIGHTS = { chunk: 0.4, model: 0.5, compile: 0.1 }
const parts = { chunk: 0, model: 0, compile: 0 }
const listeners = new Set()
let total = 0

export function reportProgress(part, value) {
  const v = Math.max(parts[part] ?? 0, Math.min(1, value))
  if (v === parts[part]) return
  parts[part] = v
  total = Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * parts[k], 0)
  listeners.forEach((cb) => cb())
}

export function useLoadProgress() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => total,
    () => 0,
  )
}
