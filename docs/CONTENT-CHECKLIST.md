# Content checklist

Every unresolved fact, missing asset, and pending confirmation for the Bearospace website lives here. Content that depends on an open item stays out of the site (`publish: false`) until the item is closed. When you close an item, record who confirmed it and when, and add the source to the content record.

Seeded 2026-11-02 from `docs/PLAN.md` §4.5 and §12.

## Decided

| Item | Decision | Decided by | Date |
|---|---|---|---|
| Anduril credit wording | "Supported by Anduril" in the intro and on the Sponsors page | Juan Ventura-Romero | 2026-11-02 |
| Rocket STL season | 2025–26 launch vehicle | Juan Ventura-Romero | 2026-11-02 |
| Hosting | Vercel | Juan Ventura-Romero | 2026-11-02 |
| Build order | Shell and no-WebGL baseline before the opening cinematic | Juan Ventura-Romero | 2026-11-02 |
| Content review | Applied the project manager's review of the content-review document: wording, Mach Industries, the changes below | Emmanuel Jaimes (PM), Juan Ventura-Romero | 2026-11-10 |
| Avionics and Recovery | One subteam, "Avionics & Recovery", in the renamed Avionics & Recovery division | Juan Ventura-Romero | 2026-11-10 |
| Payload Software | Its own subteam in the Payload division; Payload Electronics is Payload-only | Juan Ventura-Romero | 2026-11-10 |
| Projects page | "Coming soon" until current projects are confirmed; the 2018–19 rocket moved into History | Juan Ventura-Romero | 2026-11-10 |
| Sources on pages | Removed from most pages; History and Competitions keep outside links under "Read more". Sources stay in the content files | Juan Ventura-Romero | 2026-11-10 |
| AISES | AISES references removed at the PM's request. Historical records keep their official wording (competition categories such as "AISES Launch", First Nations Launch eligibility) | Emmanuel Jaimes (PM), Juan Ventura-Romero | 2026-11-10 |
| Wording | "Subteams" replaces "disciplines" in visible text | Juan Ventura-Romero | 2026-11-10 |
| Paused motion | The Flight Deck freezes in place instead of switching to a list | Juan Ventura-Romero | 2026-11-10 |

## Source discrepancies

| # | Item | Sources in conflict | Blocks | Owner | Status |
|---|---|---|---|---|---|
| D1 | 2024–25 First Nations Launch result | Organizer archive: 3rd, Mars Challenge oral reports + 3rd, Mars Challenge written reports. CEED Spring 2025 newsletter: "2nd in the Tribal Category". Old team site: "third place" (no category) | Competitions, History | | Open |
| D2 | 2015–16 FNL result filed under Tribal Launch | Organizer archive only | Competitions, History | | Open |
| D3 | 2014 "1st in flight" (UCLA AISES Bruin Rocketeers) missing from organizer archive | Samueli Newsroom, 2014-06-09 | History | | Open |
| D4 | NASA Student Launch 2020–21, 2021–22, 2025–26, 2026–27 list only "University of California, Los Angeles" | NASA team lists; old team site "Current Work"; CEED Winter 2026 (lost funding) | Competitions, History, Projects | | Open |
| D5 | 2019 motor supplier | MAE article (WSGC) vs 2018 proposal (Tripoli Wisconsin) | 2018–19 project page | | Open |
| D6 | First Nations Launch program status | WSGC Fall 2025 ("wrapping up") vs current FNL page (2026–27 season, Blue Origin funding) | Competitions explainer | | Open |
| D7 | "Jonathan Nguyen" (site) vs "johnathan nguyen" (headshot filename) | Current site | Team | | Open |
| D8 | 2025–26 rocket name and flight record | None found | Projects, Engineering | | Open |

## Team confirmations needed

| # | Item | Blocks | Owner | Status |
|---|---|---|---|---|
| C1 | Written approval to use the Anduril logo; active season(s) | Intro, Sponsors | Juan Ventura-Romero | Done 2026-11-07: approved; Anduril is a full sponsor |
| C2 | UCLA Samueli label: "Home institution" / "Built at" vs "Supported by" | Intro, Sponsors | | Open |
| C3 | Whether the 2025–26 team flew at NASA Student Launch after the reported funding loss | Competitions, Projects | | Open |
| C4 | Whether 2014–2019 UCLA AISES rocket teams are presented as Bearospace's lineage; any known founding year | History | | Open (History now reads "rocketry at UCLA"; the About section is gone) |
| C5 | Current AISES membership requirement for competing | About, Join | Juan Ventura-Romero | Closed 2026-11-10: AISES references removed at the PM's request; the site states no membership rule |
| C6 | Recruitment timeline, interest form, meeting times | Join | | Open |
| C7 | Discord and Linktree (`linktr.ee/bearospaceUCLA`) status | Join, footer | Juan Ventura-Romero | Discord done 2026-11-07 (`discord.gg/SUWtpwJ8AB`); Linktree open |
| C8 | Whether Boelter Hall 2817 is open to visitors | Join | Juan Ventura-Romero | Done 2026-11-07: drop in during meeting or office-hour times announced on Discord |
| C9 | "Payload Software Lead" on the official 2026–27 roster; other software responsibilities | Team, Engineering | Juan Ventura-Romero | Payload Software is its own subteam (2026-11-10); the "Software across the vehicle" section is gone. Its page text is a draft for Juan to confirm (C21) |
| C10 | Safety & Operations lead and Avionics Director status for 2026–27 | Team, Engineering | Juan Ventura-Romero | Avionics Director done 2026-11-10: no such role (Avionics & Recovery combined; open-role card removed). Safety & Operations lead open |
| C11 | Each member's consent to a public profile, headshot, and links | Team | | Open |
| C12 | Headshot-to-name mapping confirmed by each member (mapped by filename only) | Team | | Open |
| C13 | Spelling of "Isrrael Sumano" (2025–26 roster) | Team history | | Open |
| C14 | Custom domain; whether the old Google Sites redirect or link to the new site | Release | | Open |
| C15 | Analytics (recommended: none at launch) | Release | | Open |
| C16 | Real positions of the payload section, recovery bays, and avionics bay on the 2025–26 rocket (the system map shows typical dual-deploy positions, marked approximate) | Engineering system map (`src/content/systemMap.js`) | | Open |
| C17 | Add Mach Industries as a "past partner" (a meeting collaboration, never a full sponsor): logo, approval, and wording | Sponsors | Juan Ventura-Romero | Added 2026-11-10 (PM review): name-only card under "Past meeting partners and collaborators", no logo, neutral wording. Date and details of the meeting open |
| C18 | 2025–26 corrections from the PM: Kenneth Fambro is Payload Lead; "Dario Kuro" is Dario Kuroda; Emmanuel Jaimes was Structures and Manufacturing Director | Team | Emmanuel Jaimes (PM) | Done 2026-11-10 |
| C19 | 2023–24 roster names (the PM can provide them) | Team history | Emmanuel Jaimes (PM) | Open |
| C20 | An airbrakes subteam (the directors are to be consulted first; not yet) | Engineering, Team | Juan Ventura-Romero | Later |
| C21 | Payload Software page text (summary, responsibilities, work, skills) drafted from facts already on the site | Engineering | Juan Ventura-Romero | Draft; Juan to confirm |
| C22 | 2018–19 roster: hidden (`publish: false`) after the PM review removed the 2018–19 team page | Team history | | Open: publish again only if the team wants the roster shown |
| C23 | Avionics & Recovery tabs: each half's summary and lists come from the old program pages; the "Not part of" lists (where each half's job ends) are drafted | Engineering | Juan Ventura-Romero | Draft; Juan to confirm |

## Missing materials

| # | Item | Needed for | Owner | Status |
|---|---|---|---|---|
| M1 | Vector or ≥2048 px Bearospace logo (current PNG is 512×487) | Hero, social preview images, favicon | | Open |
| M2 | White/reversed UCLA Samueli School of Engineering lockup or vector | Intro, Sponsors on dark backgrounds | Juan | Done 2026-11-05 (`ucla-samueli-block-rev.png`) |
| M3 | Identify `Icon.jpeg` (200×200 black line mark) | — | | Open |
| M4 | Headshots: Jonathan Mendez Aguilar, Daniel Montano | Team | | Open |
| M5 | Full-resolution gallery originals with captions, dates, locations, photographer credit | Gallery | | Open |
| M6 | Launch video (ignition/liftoff) | Projects, Gallery | | Open |
| M7 | Project facts: objectives, specs, test logs, measured results, contributors | Projects | | Open |
| M8 | Photos per engineering discipline | Engineering | | Open |
| M9 | Member LinkedIn/GitHub/portfolio URLs | Team profiles | | Open |
| M10 | Sponsorship prospectus, tiers, or donation link (only if they exist) | Sponsors | | Open |
| M11 | AISES at UCLA logo and permission (if shown) | About | | Closed 2026-11-10: AISES references removed at the PM's request |
| M12 | Updated headshot for Alexander Astorga (PM request) | Team | | Open |
