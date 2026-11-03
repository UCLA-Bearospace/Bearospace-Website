import { SOURCES } from './org.js'

// Photos. `src` is a path under assets-src/images/; `npm run images` makes web sizes.
// Captions describe only what is visible or confirmed. Leave `date` null unless known.
//
//   category  launch | build | team-life | lab

const photo = (src, alt, category, extra = {}) => ({
  src: `gallery/${src}`,
  alt,
  caption: null,
  season: '2025-26', // the Google Site labels this set 2025–2026
  date: null,
  category,
  people: [],
  credit: null,
  source: SOURCES.sitePhotos,
  ...extra,
})

export const gallery = [
  photo('team-at-launch-tower.png', 'Ten team members stand in a line beside a launch tower holding a white rocket in the desert.', 'launch'),
  photo('team-carrying-carbon-rocket.jpg', 'Members carry a black carbon-fiber rocket on their shoulders across the desert.', 'launch'),
  photo('igniter-installation.png', 'A member crouches to install the igniter in a rocket on the launch rail while the team watches.', 'launch'),
  photo('wiring-electronics-sled.jpg', 'Three members wire an electronics sled on a folding table at the launch site.', 'build'),
  photo('preflight-briefing.jpg', 'The team gathers around a rocket standing on a table for a pre-flight briefing.', 'launch', { date: '2026-01-24' }),
  photo('composite-layup-lab.jpg', 'Members in lab coats and masks lay up composite cloth on a work table.', 'lab', { season: null }),
  photo('carbon-rocket-carried-on-tarmac.jpg', 'Members carry a black rocket with a blue nose cone along a desert tarmac.', 'launch'),
  photo('rocket-on-tower-wide.jpg', 'A white rocket stands on its launch tower in a wide desert landscape.', 'launch'),
  photo('member-posing-with-airframe.jpg', 'A member poses with a rocket airframe held over one shoulder.', 'team-life', { date: '2026-01-24' }),
  photo('team-walking-to-pad.jpg', 'The team walks out across the desert toward the launch pad.', 'team-life'),
  photo('dog-beside-launch-rail.jpg', 'A dog stands beside the launch rail with a rocket loaded on it.', 'team-life'),
  photo('three-member-selfie.jpg', 'Three members take a selfie at the launch site.', 'team-life'),
  photo('sunset-campsite.jpg', 'Tents at a desert campsite at sunset.', 'team-life'),
]
