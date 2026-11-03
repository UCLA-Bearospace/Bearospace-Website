import { useSyncExternalStore } from 'react'

// A single polite live region for status messages ("Motion paused", "3D view
// unavailable"). Route changes are announced by moving focus to the page heading.

let message = ''
const listeners = new Set()

export function announce(text) {
  // Clear first so repeating the same message is still read out
  message = ''
  for (const cb of listeners) cb()
  setTimeout(() => {
    message = text
    for (const cb of listeners) cb()
  }, 50)
}

export function useAnnouncement() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => message,
    () => '',
  )
}
