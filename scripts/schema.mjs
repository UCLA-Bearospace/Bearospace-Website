// Shapes of every content collection (docs/PLAN.md §10). Dev-only: zod never ships.
import { z } from 'zod'
import { ZONE_IDS } from '../src/content/systemMap.js'

const season = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'season must look like 2026-27')
  .refine((s) => (Number(s.slice(0, 4)) + 1) % 100 === Number(s.slice(5)), 'season years must be consecutive (e.g. 2026-27)')
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use lowercase-words-with-dashes')
const url = z.url()
const text = z.string().min(1)
const date = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'date must be YYYY, YYYY-MM, or YYYY-MM-DD')
const source = z.string().min(1, 'every fact needs a source (URL or who supplied it)')

export const schemas = {
  divisions: z.object({ id: slug, name: text, summary: text }),

  disciplines: z.object({
    slug,
    name: text,
    divisionIds: z.array(slug).min(1),
    primaryDivisionId: slug,
    summary: text,
    lede: text,
    responsibilities: z.array(text).min(1),
    work: z.array(text), // may be empty: Safety & Operations lists responsibilities only
    tools: z.array(text), // may be empty: not every program page lists tools
    skills: z.array(text).min(1),
    // Where it sits on the rocket (system map); at least one section
    zones: z.array(z.enum(ZONE_IDS)).min(1),
    worksWith: z.array(z.object({ team: text, roleTitle: text }).strict()).optional(),
    source,
  }),

  people: z.object({
    slug,
    name: text,
    headshot: z.string().nullable(),
    headshotVerified: z.boolean(),
    consent: z.boolean(),
    pronouns: z.string().optional(),
    links: z.object({ linkedin: url.optional(), github: url.optional(), site: url.optional() }).strict(),
    source,
  }),

  roles: z.object({
    personSlug: slug,
    season,
    title: text,
    group: slug,
    order: z.number(),
    disciplineSlug: slug.optional(),
    also: z.array(slug).optional(),
    publish: z.boolean().optional(),
    source,
  }),

  openRoles: z.object({ season, title: text, group: slug, order: z.number(), disciplineSlug: slug.optional(), source }),

  groups: z.object({ id: slug, label: text }),

  projects: z
    .object({
      slug,
      title: text,
      season,
      status: z.enum(['proposed', 'in-progress', 'ground-tested', 'flown', 'completed']).nullable(),
      competitionSlug: slug.optional(),
      disciplineSlugs: z.array(slug),
      summary: text,
      objective: z.array(text),
      constraints: z.array(text),
      approach: z.array(text),
      hardware: z.array(text),
      software: z.array(text),
      testing: z.array(z.object({ date: date.optional(), text })),
      results: z.array(z.object({ text, source })),
      lessons: z.array(text),
      contributors: z.array(z.object({ personSlug: slug, contribution: text })),
      media: z.array(z.object({ src: text, alt: text.optional(), caption: text.optional() })),
      sources: z.array(z.object({ label: text, url: url.nullable() })).min(1),
      lastVerified: date,
      publish: z.boolean(),
      // 'history': shown inside its season on the History page instead of on Projects
      place: z.enum(['projects', 'history']).optional(),
    })
    .refine((p) => !p.publish || p.status, { message: 'a published project needs a status', path: ['status'] }),

  competitions: z.object({
    slug,
    name: text,
    shortName: text,
    organizer: text,
    url,
    summary: z.array(text).min(1),
    source,
  }),

  results: z
    .object({
      competitionSlug: slug,
      season,
      category: text,
      placement: z.number().int().positive().nullable(),
      awardType: z.enum(['overall', 'flight', 'report', 'design', 'participation']),
      team: text.optional(),
      projectSlug: slug.optional(),
      sourceUrl: url.nullable(),
      confidence: z.enum(['confirmed', 'reported', 'unverified']),
      publish: z.boolean(),
      notes: text.optional(),
    })
    .refine((r) => r.confidence !== 'confirmed' || r.sourceUrl, { message: 'a confirmed result needs a sourceUrl', path: ['sourceUrl'] })
    .refine((r) => !r.publish || r.confidence === 'confirmed', {
      message: 'only confirmed results can be published (record the confirmation first)',
      path: ['publish'],
    }),

  milestones: z.object({ date, season, title: text, body: text, projectSlug: slug.optional(), source, publish: z.boolean() }),

  sponsors: z
    .object({
      id: slug,
      name: text,
      relationship: z.enum(['sponsor', 'institutional', 'home-organization', 'partner', 'past-partner']),
      label: text,
      url: url.optional(),
      description: text.optional(), // shown under past partners
      date: date.nullable().optional(), // when a past collaboration happened, once known
      logo: z.object({ onDark: z.string().nullable(), onLight: z.string().nullable(), invertOnDark: z.boolean().optional() }).nullable(),
      showInIntro: z.boolean(),
      introOrder: z.number().optional(),
      introKicker: text.optional(),
      order: z.number(),
      activeSeasons: z.array(season),
      verifiedAt: date.nullable(),
      source,
    })
    .refine((s) => !s.showInIntro || (s.logo && s.introOrder !== undefined && s.introKicker), {
      message: 'sponsors shown in the intro need a logo, introOrder, and introKicker',
      path: ['showInIntro'],
    }),

  gallery: z.object({
    src: text,
    alt: z.string().min(8, 'describe the photo in at least a few words'),
    caption: text.nullable(),
    season: season.nullable(),
    date: date.nullable(),
    category: z.enum(['launch', 'build', 'team-life', 'lab']),
    people: z.array(slug),
    credit: text.nullable(),
    source,
  }),
}

export const orgSchema = z.object({
  name: text,
  shortName: text,
  tagline: text,
  lede: text,
  mission: text,
  currentSeason: season,
  siteUrl: url.nullable(),
  location: z.object({ building: text, room: text, campus: text, verifiedAt: date.nullable(), source }),
  parents: z.record(z.string(), z.object({ name: text, full: text, url })),
  source,
})
