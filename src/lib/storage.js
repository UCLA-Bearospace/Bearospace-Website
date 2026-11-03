// Storage can throw (private windows, blocked storage); never let that break the page.
// Ported from the portfolio's src/lib/storage.js, with sessionStorage support.

export function readStore(key, fallback = null, store = 'local') {
  try {
    const v = (store === 'session' ? sessionStorage : localStorage).getItem(key)
    return v === null ? fallback : v
  } catch {
    return fallback
  }
}

export function writeStore(key, value, store = 'local') {
  try {
    const s = store === 'session' ? sessionStorage : localStorage
    if (value === null) s.removeItem(key)
    else s.setItem(key, value)
  } catch {
    /* ignore */
  }
}
