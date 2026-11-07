// Which page module serves a URL. The browser loads it lazily (pages.lazy.js), and the
// prerender lists its chunks in each page's HTML so they download alongside the main bundle
// instead of after it (scripts/prerender.mjs). Values are file names in src/pages/.
export const PAGE_MODULES = {
  home: 'Home',
  about: 'About',
  engineering: 'Engineering',
  discipline: 'Engineering', // the overview's module exports Discipline too
  projects: 'Projects',
  competitions: 'Competitions',
  history: 'History',
  team: 'Team',
  gallery: 'Gallery',
  sponsors: 'Sponsors',
  join: 'Join',
  notFound: 'NotFound',
}

/** Key into PAGE_MODULES for a pathname; anything unknown is the 404 page. */
export function pageKeyFor(pathname) {
  const [section = 'home', sub] = pathname.split('/').filter(Boolean)
  if (section === 'engineering' && sub) return 'discipline'
  if (section === 'discipline' || section === 'notFound' || !(section in PAGE_MODULES)) return 'notFound'
  return section
}
