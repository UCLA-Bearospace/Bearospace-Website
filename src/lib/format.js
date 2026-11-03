/** 1 → "1st", 2 → "2nd", 11 → "11th"; null → "—" */
export function ordinal(n) {
  if (!n) return '—'
  const teen = n % 100 >= 11 && n % 100 <= 13
  return `${n}${teen ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}
