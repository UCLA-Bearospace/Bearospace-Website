import { SOURCES } from './org.js'

// Dated milestones for the History timeline. Competition results are pulled in from
// competitions.js automatically; add other moments here.
//
//   date  'YYYY', 'YYYY-MM', or 'YYYY-MM-DD'

export const milestones = [
  {
    date: '2014-04',
    season: '2013-14',
    title: 'UCLA AISES rocket team wins the flight portion at First Nations Launch',
    body: 'Thirteen students, then called the UCLA AISES Bruin Rocketeers, placed first in flight among nine teams in Wisconsin.',
    source: SOURCES.samueli2014,
    publish: false, // lineage to Bearospace unconfirmed (checklist C4, D3)
  },
  {
    date: '2018-11-30',
    season: '2018-19',
    title: '"UCLA Bearospace" proposes its First Nations Launch rocket',
    body: 'The earliest public document using the Bearospace name: an 11-member team proposes a carbon-fiber rocket with a 3D-printed nose cone.',
    source: SOURCES.proposal2018,
    publish: true,
  },
  {
    date: '2019-04',
    season: '2018-19',
    title: 'First place, AISES Launch',
    body: "Bearospace wins First Nations Launch's AISES Launch category at Richard Bong State Recreation Area in Kansasville, Wisconsin.",
    source: SOURCES.mae2019,
    publish: true,
  },
  {
    date: '2025',
    season: '2025-26',
    title: 'Design reviews for NASA Student Launch',
    body: 'The team works through NASA Student Launch design reviews while building the year’s rocket.',
    source: SOURCES.oldSite,
    publish: false, // whether the team flew is unconfirmed (checklist C3)
  },
]
