// The destination the visitor last chose, so returning to the Flight Deck puts focus
// back on it. Survives page changes (module state), not reloads.

let last = null

export const getLastDestination = () => last
export const setLastDestination = (id) => {
  last = id
}
