// Organization facts. Every claim keeps its source; open questions live in
// docs/CONTENT-CHECKLIST.md. Recipes for common edits: CONTENT.md.

export const SOURCES = {
  site: 'https://sites.google.com/view/uclabearospace/home',
  siteAbout: 'https://sites.google.com/view/uclabearospace/about',
  siteTeam: 'https://sites.google.com/view/uclabearospace/team',
  siteContact: 'https://sites.google.com/view/uclabearospace/contact',
  sitePrograms: 'https://sites.google.com/view/uclabearospace/technical-programs',
  sitePhotos: 'https://sites.google.com/view/uclabearospace/photos',
  oldSite: 'https://sites.google.com/view/bearospace-ucla',
  oldSiteContact: 'https://sites.google.com/view/bearospace-ucla/contact',
  aises: 'https://sites.google.com/g.ucla.edu/ucla-aises/about-us',
  fnlAwards: 'https://spacegrant.carthage.edu/first-nations-launch/awards/',
  fnl: 'https://spacegrant.carthage.edu/first-nations-launch/',
  nasaSL: 'https://www.nasa.gov/learning-resources/nasa-student-launch/',
  nasaSLTeams: 'https://www.nasa.gov/learning-resources/nasa-student-launch/current-teams/',
  mae2019: 'https://www.mae.ucla.edu/uclas-bearospace-rocket-team-wins-2019-first-nations-aises-launch-competition/',
  proposal2018: 'https://spacegrant.carthage.edu/live/files/5417-ucla-proposal-11-30-18-1pdf',
  samueli2014: 'https://samueli.ucla.edu/ucla-aises-team-wins-rocket-competition/',
  juan: 'Supplied by Juan Ventura-Romero, 2026-11-02',
  juanUpdate: 'Supplied by Juan Ventura-Romero, 2026-11-12',
  pmReview: 'Content review by Emmanuel Jaimes (Project Manager), 2026-11-10',
}

export const org = {
  name: 'Bearospace at UCLA',
  shortName: 'Bearospace',
  tagline: "UCLA student rocketry team",
  lede:
    'We design, build, and fly high-power rockets — and the payloads inside them — at UCLA.',
  mission:
    'Bearospace empowers students to become the next generation of engineers, scientists, and innovators through hands-on rocketry, technical training, and community engagement.',
  currentSeason: '2026-27',
  // Set when a domain is chosen (checklist C14); canonical URLs and the sitemap use it
  siteUrl: null,
  location: {
    building: 'Boelter Hall',
    room: '2817',
    campus: 'UCLA',
    // Whether visitors can drop in is unconfirmed (checklist C8)
    verifiedAt: null,
    source: SOURCES.siteContact,
  },
  parents: {
    ceed: { name: 'CEED', full: 'Center for Excellence in Engineering and Diversity', url: 'https://www.ceed.ucla.edu/' },
    samueli: { name: 'UCLA Samueli', full: 'UCLA Samueli School of Engineering', url: 'https://samueli.ucla.edu/' },
  },
  source: SOURCES.site,
}
