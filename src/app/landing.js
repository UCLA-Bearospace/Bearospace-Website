// Remembers whether the visitor is still on the page they landed on. Until they navigate,
// nothing moves focus or scroll; after the first navigation, every page change (including
// Back to the landing entry) focuses the new heading and restores or resets scroll.

let firstKey = null
let navigated = false

/** True only while the visitor has not navigated away from where they landed. */
export function isLandingLocation(key) {
  if (firstKey === null) firstKey = key
  if (key !== firstKey) navigated = true
  return !navigated
}
