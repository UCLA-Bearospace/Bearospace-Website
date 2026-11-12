# Editing the Bearospace website

Everything the site says lives in plain files under `src/content/`. You don't need to touch any page code to add people, sponsors, photos, results, or a new season.

**The workflow:** edit a file (GitHub's web editor is fine) → open a pull request → wait for the checks → look at the preview link → merge.

The checks run `npm run validate` and tell you exactly what's wrong, for example:

```
projects.js › "2018-19-fnl-rocket" › contributors[2].personSlug: "jon-n" is not in people.js
```

That means: in `projects.js`, the entry `2018-19-fnl-rocket`, field `contributors[2].personSlug`.

## House rules

- **Every fact needs a source.** A URL, or who told you and when (e.g. `'Confirmed by Bianca Vasquez, 2027-01-15'`).
- **Don't guess.** Leave a field empty or `null`; pages hide anything empty. Unconfirmed things get `publish: false` and an item in [docs/CONTENT-CHECKLIST.md](docs/CONTENT-CHECKLIST.md).
- **Slugs never change** (`juan-ventura-romero`, `2018-19-fnl-rocket`). People link to them from résumés.
- **Seasons look like `2026-27`.**
- **Keep competition categories exactly as the organizer wrote them.** A report award stays a report award.

## Where things live

| File | What's in it |
|---|---|
| `org.js` | Name, mission, current season, location, website address (`siteUrl`) |
| `links.js` | Email, Instagram, LinkedIn, Discord (the Join page's main button; meeting and office-hour times are announced there), interest form |
| `divisions.js` | The four divisions |
| `disciplines.js` | The seven disciplines: what they do, work, tools, skills, where they sit on the rocket (`zones`), teams they work with |
| `systemMap.js` | The rocket's sections for the Engineering map. When the team confirms where the payload, recovery, and avionics bays really are, update their positions and set `approximate: false` |
| `people.js` | Each person once: name, headshot, links, consent |
| `roles.js` | Who did what in each season, plus open positions |
| `projects.js` | Project pages |
| `competitions.js` | Competitions and every recorded result |
| `milestones.js` | Other dated moments for the History page |
| `sponsors.js` | Sponsors and supporters (used by the opening, the "Supported by" strip, and the Sponsors page) |
| `gallery.js` | Photos and their descriptions |

Original images go in `assets-src/images/` (never edit them in place). `npm run images` makes the web versions automatically; it also runs before every build.

## Recipes

### Add a sponsor

1. Put the logo in `assets-src/images/logos/` (SVG if you have it).
2. Add a row to `src/content/sponsors.js`:

```js
{
  id: 'acme-aerospace',
  name: 'Acme Aerospace',
  relationship: 'sponsor', // sponsor | institutional | home-organization | partner | past-partner
  label: 'Supported by Acme Aerospace', // exactly what the site should say
  url: 'https://acme.example',
  logo: { onDark: 'logos/acme.svg', onLight: 'logos/acme.svg', invertOnDark: true },
  showInIntro: true, // also appears in the opening sequence
  introOrder: 3,
  introKicker: 'Supported by',
  order: 3,
  activeSeasons: ['2027-28'],
  verifiedAt: '2027-09-01', // when the team confirmed the wording and logo permission
  source: 'Confirmed by <name>, 2027-09-01',
},
```

That's all: the opening sequence, footer strip, and Sponsors page pick it up.

**A past partner** (an organization that met with the team or shared its expertise, not a sponsor) needs no logo or link. It appears only on the Sponsors page, under "Past meeting partners and collaborators", never in the intro or the "Supported by" strip:

```js
{
  id: 'mach-industries',
  name: 'Mach Industries',
  relationship: 'past-partner',
  label: 'Past partner',
  description: 'Mach Industries collaborated with Bearospace on a team meeting.',
  date: null, // e.g. '2026-04-15' once confirmed
  logo: null,
  showInIntro: false,
  order: 10,
  activeSeasons: [],
  verifiedAt: '2026-11-10',
  source: 'Content review by …',
},
```

### Start a new season

1. In `roles.js`, add rows for the new season. Don't edit or delete the old season's rows; they become history.

```js
role('natalie-lopez', '2027-28', 'Project Manager', 'management', 1, { source: 'https://…' }),
```

2. Add anyone new to `people.js` first (see below).
3. Move open positions in `openRoles` to the new season.
4. Change `currentSeason` in `org.js` to `'2027-28'`.

`/team` now shows the new season, the old one moves to `/team/season/2026-27`, and everyone's profile shows their full role history.

### Add a member

Add to `people.js`:

```js
person('maria-garcia', 'Maria Garcia', { ...shot('maria-garcia'), source: 'https://…' }),
```

- Put their photo at `assets-src/images/team/maria-garcia.png` (any size; it's cropped to a 4:5 portrait from the top, and a transparent or white background ends up on the same light panel as everyone else's). Keep `headshotVerified: false` until they confirm it's them: until then the photo is shown but not offered to search engines. No photo? Leave out `...shot(...)`; the site shows initials.
- Profile links are optional: `links: { linkedin: 'https://www.linkedin.com/in/…' }`.
- Ask before publishing a profile. Use `consent: false` for people who should only be named in history.

### A subteam with two halves, or a role on two teams

A subteam whose page should show tabs (like Avionics & Recovery) lists its halves in `parts` in `disciplines.js`, each with `id`, `name`, `summary`, `does`, `doesNot`, `work`, `skills`, and `source`; its own `responsibilities`, `work`, and `skills` stay `[]`. Give each lead role a `focus` with the part it leads (`focus: 'recovery'`), so it shows in that tab. A link to `/engineering/<slug>#<part>` opens that tab.

A role that spans two teams can appear under a second roster group too: `alsoGroup: { id: 'avionics-recovery', order: 3 }` (the order within that group).

### Add a project

Copy the `2018-19-fnl-rocket` entry in `projects.js`. Fill in only what you can source; leave the rest as `[]`. List contributors with what they actually did:

```js
contributors: [{ personSlug: 'juan-ventura-romero', contribution: 'Wrote the payload control software' }],
```

Keep `publish: false` until the status and facts are confirmed.

A past season's rocket belongs on History rather than Projects: add `place: 'history'`. It then shows inside its season on `/history` (summary, objectives, hardware, and "Read more" links) and has no page of its own.

### Record a competition result

Add a row to `results` in `competitions.js` with the organizer's category wording, the placement, `awardType` (`overall`, `flight`, `report`, `design`, or `participation`), and a `sourceUrl`. Only `confidence: 'confirmed'` rows can be published.

### Move a competition to its next stage

Each competition on `/competitions` has a stage tracker, in `src/content/competitionTimeline.js` (kept separate so it loads only on that page). When the team finishes a stage, change that competition's `current` to the next stage's `id` and `asOf` to today's date. At the start of a new season, replace its `season`, `stages` (with the organizer's dates), and `source` with the new handbook or calendar.

### Add photos

1. Put the original in `assets-src/images/gallery/` with a descriptive file name (`2027-04-launch-pad.jpg`).
2. Add it to `gallery.js` with alt text that describes what's in the photo. Only add a date, caption, or names you know.

The file name is also the photo's shareable address (`/gallery?photo=2027-04-launch-pad`), so don't rename a photo once it's live: links people have shared would stop opening it. A category's filter button appears once it has two or more photos.

## Checking your work locally

```bash
npm install
npm run validate   # content checks
npm run dev        # site at http://localhost:5173
```
