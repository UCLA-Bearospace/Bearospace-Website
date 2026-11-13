import { SOURCES } from './org.js'
import { people } from './people.js'

// Where members have gone: internships and full-time jobs, shown on /team ("Where our members
// have gone"), on each person's profile, and as a list of organizations on /join. Kept out of
// content/index.js so it only loads on those pages (see CONTENT.md).
//
//   personSlug  a slug in people.js (one entry per person)
//   positions   in the order to show them:
//     kind      'internship' or 'full-time'
//     org       the company or agency, as it calls itself
//     parent    optional: the group the company belongs to, e.g. Precision Castparts Corp.
//     times     optional: how many internships there (2 or more)
//     title     the exact job title; null until confirmed (checklist C27)
//
// Listing someone's employer needs their agreement (checklist C26).

const PCC = 'Precision Castparts Corp.'
const intern = (org, extra = {}) => ({ kind: 'internship', org, title: null, ...extra })
const fullTime = (org, extra = {}) => ({ kind: 'full-time', org, title: null, ...extra })

export const careers = [
  { personSlug: 'ronaldo-garcia', positions: [intern('PPG'), fullTime('PPG')] },
  { personSlug: 'michael-sicner', positions: [intern('Northrop Grumman'), fullTime('Northrop Grumman')] },
  { personSlug: 'dereck-rubio', positions: [intern('Northrop Grumman', { times: 2 }), fullTime('Mortenson')] },
  { personSlug: 'noah-tran', positions: [intern('Carlton Forge Works', { parent: PCC })] },
  { personSlug: 'emmanuel-jaimes', positions: [intern('Lockheed Martin')] },
  { personSlug: 'brandon-aguilar', positions: [intern('NASA')] },
  { personSlug: 'nicholas-equihua', positions: [intern('Northrop Grumman', { times: 2 })] },
  { personSlug: 'alexander-astorga', positions: [intern('Avibank', { parent: PCC })] },
].map((c) => ({ source: SOURCES.juanUpdate, ...c }))

const KIND = { internship: 'Intern', 'full-time': 'Full-time' }
const TIMES = { 2: 'twice', 3: 'three times' }

/** "Intern · Northrop Grumman (twice)", "Intern · Avibank (Precision Castparts Corp.)" */
export function describePosition(p) {
  const notes = [p.parent, p.times && (TIMES[p.times] ?? `${p.times} times`)].filter(Boolean)
  return `${p.title || KIND[p.kind]} · ${p.org}${notes.length ? ` (${notes.join(', ')})` : ''}`
}

/** Each entry with its person, in display order. */
export const careerList = () => careers.map((c) => ({ ...c, person: people.find((p) => p.slug === c.personSlug) }))

export const careersFor = (personSlug) => careers.find((c) => c.personSlug === personSlug)?.positions ?? []

/** Every organization named, once each, in the order they first appear. */
export const careerOrgs = () => [...new Set(careers.flatMap((c) => c.positions.map((p) => p.org)))]
