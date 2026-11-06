import { lazy } from 'react'

// Browser: each page loads as its own chunk. While a chunk loads during hydration, React
// keeps the prerendered HTML on screen, so there is no flash or mismatch. Route changes
// start loading the next page's chunk as soon as the transition begins (`preload`).
const load = {
  home: () => import('../pages/Home'),
  about: () => import('../pages/About'),
  engineering: () => import('../pages/Engineering'),
  discipline: () => import('../pages/Discipline'),
  projects: () => import('../pages/Projects'),
  competitions: () => import('../pages/Competitions'),
  history: () => import('../pages/History'),
  team: () => import('../pages/Team'),
  gallery: () => import('../pages/Gallery'),
  sponsors: () => import('../pages/Sponsors'),
  join: () => import('../pages/Join'),
  notFound: () => import('../pages/NotFound'),
}
const page = (key, name = 'default') => lazy(() => load[key]().then((m) => ({ default: m[name] })))

export const pages = {
  Home: page('home'),
  About: page('about'),
  Engineering: page('engineering'),
  Discipline: page('discipline'),
  Projects: page('projects', 'Projects'),
  Project: page('projects', 'Project'),
  Competitions: page('competitions'),
  History: page('history'),
  Team: page('team', 'Team'),
  TeamSeason: page('team', 'TeamSeason'),
  Member: page('team', 'Member'),
  Gallery: page('gallery'),
  Sponsors: page('sponsors'),
  Join: page('join'),
  NotFound: page('notFound'),
  /** Start fetching the chunk for a URL (best effort; unknown paths load nothing). */
  preload(pathname) {
    const [section = 'home', sub] = pathname.split('/').filter(Boolean)
    const key = section === 'engineering' && sub ? 'discipline' : section
    load[key]?.().catch(() => {})
  },
}
