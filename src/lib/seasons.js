// Season arithmetic. Seasons are written '2026-27' (content files use this everywhere).

/** '2018-19' → '2019-20' */
export const nextSeason = (s) => {
  const y = Number(s.slice(0, 4)) + 1
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
}

/** Runs of undocumented seasons between the first and last documented ones: [[from, to]] */
export function gaps(documented) {
  const have = new Set(documented)
  const sorted = [...documented].sort()
  const runs = []
  for (let s = sorted[0]; s && s < sorted.at(-1); s = nextSeason(s)) {
    if (have.has(s)) continue
    const last = runs.at(-1)
    if (last && nextSeason(last[1]) === s) last[1] = s
    else runs.push([s, s])
  }
  return runs
}
