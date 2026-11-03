import { lazy } from 'react'
import Home from '../pages/Home'

// Browser: each page loads as its own chunk. While a chunk loads during hydration, React
// keeps the prerendered HTML on screen, so there is no flash or mismatch.
const named = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })))
const projects = () => import('../pages/Projects')
const team = () => import('../pages/Team')

export const pages = {
  Home,
  About: lazy(() => import('../pages/About')),
  Engineering: lazy(() => import('../pages/Engineering')),
  Discipline: lazy(() => import('../pages/Discipline')),
  Projects: named(projects, 'Projects'),
  Project: named(projects, 'Project'),
  Competitions: lazy(() => import('../pages/Competitions')),
  History: lazy(() => import('../pages/History')),
  Team: named(team, 'Team'),
  TeamSeason: named(team, 'TeamSeason'),
  Member: named(team, 'Member'),
  Gallery: lazy(() => import('../pages/Gallery')),
  Sponsors: lazy(() => import('../pages/Sponsors')),
  Join: lazy(() => import('../pages/Join')),
  NotFound: lazy(() => import('../pages/NotFound')),
}
