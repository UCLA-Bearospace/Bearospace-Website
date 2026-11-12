// The eight Flight Deck destinations (docs/PLAN.md §7). Slice 3 turns each into a
// celestial body; until then (and always on phones / without WebGL) they render as a list.

export const destinations = [
  { id: 'about', path: '/about', label: 'About', body: 'Ursa', descriptor: 'Our mission and how we work' },
  { id: 'engineering', path: '/engineering', label: 'Engineering', body: 'Ringed planet', descriptor: 'Our seven subteams' },
  { id: 'projects', path: '/projects', label: 'Projects', body: 'Payload satellite', descriptor: 'Our current designs and R&D' },
  { id: 'competitions', path: '/competitions', label: 'Competitions', body: 'Red planet', descriptor: 'NASA Student Launch and First Nations Launch' },
  { id: 'history', path: '/history', label: 'History', body: 'Comet', descriptor: 'Seasons, rockets, and results' },
  { id: 'team', path: '/team', label: 'Team', body: 'Orbital station', descriptor: 'The students behind the rocket' },
  { id: 'gallery', path: '/gallery', label: 'Gallery', body: 'Nebula', descriptor: 'Launch days, lab nights, and team life' },
  { id: 'sponsors', path: '/sponsors', label: 'Sponsors', body: 'Handshake', descriptor: 'The supporters who fly with us' },
]
