import { useSyncExternalStore } from 'react'

// One small store for the 3D scene's state, mirrored onto <html> so CSS and tests can read it.
//   html[data-scene]  none | loading | ready | failed | lost | off
//   html[data-model]  real | placeholder   (once the scene is ready)

let status = 'none'
let model = null
const listeners = new Set()

function emit() {
  const root = document.documentElement
  root.dataset.scene = status
  if (model) root.dataset.model = model
  else delete root.dataset.model
  for (const cb of listeners) cb()
}

export function setSceneStatus(next, nextModel = model) {
  if (next === status && nextModel === model) return
  status = next
  model = nextModel
  emit()
}

/** Current status and change subscription, for code outside React (the intro). */
export const getSceneStatus = () => status
export function subscribeSceneStatus(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useSceneStatus() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => status,
    () => 'none',
  )
}
