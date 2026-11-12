// This season's stages for each competition, shown as a progress tracker on /competitions.
// Kept out of index.js on purpose: only the Competitions page imports it, so it stays out of
// the main script every page loads (docs/PLAN.md §9.5 budget).
//
// To move a competition on: change `current` to the next stage's id and `asOf` to today.
// Dates are the organizers' published schedules (subject to change; see `source`).

export const timelines = {
  'nasa-student-launch': {
    season: '2026-27',
    current: 'pdr', // by the published schedule; the team confirms (docs/CONTENT-CHECKLIST.md C25)
    asOf: '2026-11-11',
    source: {
      label: '2027 Student Launch Handbook (NASA)',
      url: 'https://www.nasa.gov/wp-content/uploads/2026/08/g-739882-2027-sli-handbook-508-aug5.pdf',
    },
    stages: [
      {
        id: 'proposal',
        short: 'Proposal',
        name: 'Proposal',
        date: 'Sep 14, 2026',
        about: 'Teams answer NASA’s request for proposals with their plan for the rocket, the payload, safety, outreach, and funding.',
      },
      {
        id: 'selected',
        short: 'Selected',
        name: 'Selected',
        date: 'Oct 1, 2026',
        about: 'NASA announces the teams whose proposals it accepted; the season kicks off on October 6.',
      },
      {
        id: 'pdr',
        short: 'PDR',
        name: 'Preliminary Design Review',
        date: 'Oct 29 – Nov 24, 2026',
        about:
          'The PDR report, slides, and flysheet, with the final motor choice, are due October 29. Then the team presents its design to a NASA review panel by video teleconference (November 9–24).',
      },
      {
        id: 'cdr',
        short: 'CDR',
        name: 'Critical Design Review',
        date: 'Jan 7 – Feb 3, 2027',
        about:
          'A subscale rocket must fly by January 7, when the CDR report is due. The team then presents the detailed design to the panel (January 18 – February 3).',
      },
      {
        id: 'frr',
        short: 'FRR',
        name: 'Flight Readiness Review',
        date: 'Mar 8 – 29, 2027',
        about:
          'The full-scale Vehicle Demonstration Flight and the FRR report are due March 8, with presentations March 15–26. The Payload Demonstration Flight follows by March 29.',
      },
      {
        id: 'launch',
        short: 'Launch',
        name: 'Launch Week in Huntsville',
        date: 'Apr 7 – 11, 2027',
        about: 'Teams pass a Launch Readiness Review and fly on Launch Day, April 10, in Huntsville, Alabama.',
      },
      {
        id: 'plar',
        short: 'PLAR',
        name: 'Post-Launch Assessment Review',
        date: 'Apr 26, 2027',
        about: 'The team reports on how the flight and the payload performed.',
      },
    ],
  },
  'first-nations-launch': {
    season: '2026-27',
    current: 'planning', // Juan, 2026-11-11
    asOf: '2026-11-11',
    source: { label: 'First Nations Launch 2026–27 calendar (WSGC)', url: 'https://spacegrant.carthage.edu/first-nations-launch/calendar/' },
    stages: [
      {
        id: 'planning',
        short: 'Planning',
        name: 'Planning',
        date: 'Fall 2026',
        about: 'The team is planning its entry for the 2026–27 season, which offers Moon, Mars, and Gateway challenges.',
      },
      {
        id: 'proposal',
        short: 'Proposal',
        name: 'Notice of intent and proposal',
        date: 'Oct 19 – Dec 7, 2026',
        about: 'Moon and Mars teams send a notice of intent and a proposal by October 19; Gateway teams send their notice of intent by December 7.',
      },
      {
        id: 'pdr',
        short: 'PDR',
        name: 'Preliminary Design Review',
        date: 'Nov 30 – Dec 11, 2026',
        about: 'The PDR report, flysheet, and simulation file are due November 30, followed by virtual presentations (Moon and Mars).',
      },
      {
        id: 'cdr',
        short: 'CDR',
        name: 'Critical Design Review',
        date: 'Jan 25 – Feb 5, 2027',
        about: 'The CDR report is due January 25, followed by virtual presentations (Moon and Mars).',
      },
      {
        id: 'frr',
        short: 'FRR',
        name: 'Flight Readiness Review',
        date: 'Mar 8 – 26, 2027',
        about: 'The FRR report is due March 8, followed by virtual presentations for every challenge.',
      },
      {
        id: 'launch',
        short: 'Launch',
        name: 'Competition week in Wisconsin',
        date: 'Apr 22 – 25, 2027',
        about: 'Teams meet in Kenosha, Wisconsin, and fly on Launch Day, April 24, at Richard Bong Recreation Area in Kansasville.',
      },
      {
        id: 'plar',
        short: 'PLAR',
        name: 'Post-Launch Assessment Review',
        date: 'May 11, 2027',
        about: 'The post-launch report is due May 11; winners are announced June 15.',
      },
    ],
  },
}

/** Where a competition stands: its timeline, the current stage, and that stage's index. */
export function stageOf(slug) {
  const t = timelines[slug]
  if (!t) return null
  const index = t.stages.findIndex((s) => s.id === t.current)
  return { ...t, index, stage: t.stages[index] }
}
