import { useSyncExternalStore } from 'react'
import { readStore, writeStore } from '../lib/storage'

// Motion is off when the OS asks for reduced motion OR the visitor pressed
// "Pause motion" (persisted). Ongoing animation must be stoppable (WCAG 2.2.2).

const QUERY = '(prefers-reduced-motion: reduce)'
const PAUSED_KEY = 'bearo:motion-paused'

function subscribeReduced(cb) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const getReduced = () => window.matchMedia(QUERY).matches

const listeners = new Set()
function subscribePaused(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
const getPaused = () => readStore(PAUSED_KEY) === '1'

export function setMotionPaused(paused) {
  writeStore(PAUSED_KEY, paused ? '1' : null)
  for (const cb of listeners) cb()
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, getReduced, () => false)
}

export function useMotionPaused() {
  return useSyncExternalStore(subscribePaused, getPaused, () => false)
}

/** True when ongoing animation may run. */
export function useMotionAllowed() {
  const reduced = useReducedMotion()
  const paused = useMotionPaused()
  return !reduced && !paused
}
