import { useSyncExternalStore } from 'react'
import { decideIntroMode, readIntroEnv } from './introMode'

// The opening sequence's state, mirrored onto <html> for CSS and tests:
//   html[data-intro]        full | short | off        (set before paint by the head script)
//   html[data-intro-phase]  dom | hold | scene        (absent when no intro is running)
// `run` counts plays, so Replay restarts the sequence.

const listeners = new Set()
const emit = () => listeners.forEach((cb) => cb())
let run = 0

function root() {
  return document.documentElement
}

/** The mode for this page view (the head script's answer, or decided now on the dev server). */
export function introMode() {
  const r = root()
  if (!r.dataset.intro) r.dataset.intro = decideIntroMode(readIntroEnv())
  return r.dataset.intro
}

export function setIntroPhase(phase) {
  const r = root()
  if (phase) r.dataset.introPhase = phase
  else delete r.dataset.introPhase
  emit()
}

/** The intro has finished (or was skipped): the page is the live menu now. */
export function endIntro() {
  root().dataset.intro = 'off'
  setIntroPhase(null)
}

/** Play the full sequence again (the Replay launch control). */
export function replayIntro() {
  root().dataset.intro = 'full'
  run++
  emit()
}

// Replay asked for from another page: it starts once the Flight Deck is showing
let pendingReplay = false
export const requestReplay = () => {
  pendingReplay = true
}
export function takePendingReplay() {
  const was = pendingReplay
  pendingReplay = false
  return was
}

const subscribe = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** { mode, phase, run }; while prerendering and hydrating: no intro. */
export function useIntro() {
  const mode = useSyncExternalStore(subscribe, introMode, () => 'off')
  const phase = useSyncExternalStore(
    subscribe,
    () => root().dataset.introPhase ?? null,
    () => null,
  )
  const current = useSyncExternalStore(
    subscribe,
    () => run,
    () => 0,
  )
  return { mode, phase, run: current }
}
