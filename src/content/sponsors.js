import { SOURCES } from './org.js'

// Sponsors and supporters. The same records drive the opening sequence, the
// "Supported by" strip, and the Sponsors page, so a new sponsor only needs a row here.
//
//   relationship  sponsor | institutional | home-organization | partner
//   label         public wording, shown exactly
//   logo          paths under assets-src/images/ (onDark for dark backgrounds)
//   showInIntro   appears in the opening sequence, ordered by introOrder, with introKicker

export const sponsors = [
  {
    id: 'anduril',
    name: 'Anduril Industries',
    relationship: 'sponsor',
    label: 'Supported by Anduril',
    url: 'https://www.anduril.com/',
    logo: { onDark: 'logos/anduril-logo.svg', onLight: 'logos/anduril-logo.svg', invertOnDark: true },
    showInIntro: true,
    introOrder: 1,
    introKicker: 'Supported by',
    order: 1,
    activeSeasons: ['2026-27'],
    // A full sponsor; logo use approved (Juan Ventura-Romero, 2026-11-07; checklist C1).
    // Public wording decided 2026-11-02.
    verifiedAt: '2026-11-07',
    source: SOURCES.juan,
  },
  {
    id: 'ucla-samueli',
    name: 'UCLA Samueli School of Engineering',
    relationship: 'institutional',
    label: 'Home institution',
    url: 'https://samueli.ucla.edu/',
    // Reversed (white text) lockup on dark backgrounds, the standard block on light ones
    logo: { onDark: 'logos/ucla-samueli-block-rev.png', onLight: 'logos/ucla-samueli-block.png' },
    showInIntro: true,
    introOrder: 2,
    introKicker: 'Built at',
    order: 2,
    activeSeasons: ['2025-26', '2026-27'],
    verifiedAt: null, // label pending (checklist C2)
    source: SOURCES.aises,
  },
  {
    id: 'aises-ucla',
    name: 'AISES at UCLA',
    relationship: 'home-organization',
    label: 'Home organization',
    url: SOURCES.aises,
    logo: null,
    showInIntro: false,
    order: 3,
    activeSeasons: ['2025-26', '2026-27'],
    verifiedAt: '2026-11-02',
    source: SOURCES.aises,
  },
]
