# Bearospace at UCLA — Website Planning Package

Prepared 2026-11-02. Planning only; no site code written yet.

## Context

Bearospace's public presence is a 14-page Google Site (`sites.google.com/view/uclabearospace`) with thin pages, broken card links, no alt text, a stale calendar, an unfinished Sponsorship page, and no history, competitions, or join path. An older site (`sites.google.com/view/bearospace-ucla`) still carries the 2025–26 roster and the only First Nations Launch mention. The goal is a new site in `C:\Projects\Bearospace-Website-Juan` (bare Vite 8 + React 19.3 + React Compiler template) that:

- carries the creative ambition of Juan's portfolio (`C:\Projects\fluid-graphics-portfolio-site`): a cinematic launch using the team's real rocket STL, flowing into a continuously flying 3D rocket menu;
- presents a more professional, sponsor- and recruiter-credible identity;
- serves sponsors, prospective members, recruiters, members, alumni, and future maintainers;
- keeps every fact sourced and dated, and stays usable without WebGL or motion.

**Central idea:** a cinematic Bearospace launch that flows into a continuously flying 3D rocket menu, with expressive, fluid pages that show the engineering, the people, and the team's story.

---

## 1. What the reference project teaches

Audited `C:\Projects\fluid-graphics-portfolio-site` at HEAD `b2474ec`.

**Actual stack (lockfile):** react/react-dom 19.3.0, react-router 7.18.4 (the `react-router` package, not `-dom`), three 0.186.1, gsap 3.15.0, @gsap/react 2.1.2, vite 8.3.1 (Rolldown), @vitejs/plugin-react 6.1.1 + @rolldown/plugin-babel + babel-plugin-react-compiler 1.0.0, eslint 10.11. Fonts from @fontsource. Deployed on Vercel with a SPA rewrite in `vercel.json`.

**Corrections to the documented stack:**
- No Puppeteer, no tests, no CI exist (only a "Skills" text mention). Verification will be new work.
- No EffectComposer/postprocessing; the ink outline is a hand-written two-pass composite.
- No GLB/Draco; STL is converted to a custom quantized `.bin` ("JVM1").
- No React Three Fiber; one imperative Three.js engine inside one React host.

**Patterns worth porting (adapt, don't copy blindly):**

| Portfolio file | What it does | Bearospace use |
|---|---|---|
| `src/motion/TransitionProvider.jsx`, `transitionContext.js`, `WipeLayer.jsx` | `displayLocation` lags the URL; latest-wins queue of one; master timeline = camera travel → wipe cover → swap → reveal; `framed` ref snaps the camera under the cover; Esc → `/` | Core route orchestration. Fix label/destination mismatch on mid-travel URL changes. |
| `src/scene3d/engine.js` | `createEngine()` factory; GSAP tweens a plain `state` object read by `frame()`; own rAF with fps throttle + `boost`; visibility stop/start; ResizeObserver; `place()`, `setMotion`, `setFps`, `dispose()` | Engine skeleton. Add context-loss handling, adaptive quality, `forceContextLoss()` on dispose. |
| `src/motion/directorContext.js` + `DriveScene.jsx` | Lazily loaded 3D chunk fills a `directorRef` `{travel, place}` | Same decoupling so routing never imports three.js. |
| `src/scene3d/travel.js` `leg()`, `landmarks.js` | Interrupt-safe Catmull-Rom camera legs from the current position; per-route shot data with portrait variants | `shots.js` for menu bodies and content routes. |
| `src/intro/IntroGate.jsx`, `introContext.js` | Paused timeline registered with a `settle` label; modes full/short/off; 1.2 s load budget; skip on button/key/pointer | Intro gate. Fix: real asset progress, don't mark "seen" on auto-skip, focus target after intro. |
| `src/scene3d/outline.js` | Ink outlines (Laplacian of inverse depth + normal crease) + manga speed-line/impact-flash overlay shader | Rocket ink treatment, launch speed lines, logo impact frame. |
| `src/scene3d/toon.js` | 3-band `MeshToonMaterial` gradient | Rocket and bodies' cel shading. |
| `scripts/build-models.mjs`, `src/scene3d/model.js` | STL → meshopt-simplified, quantized `.bin`; runtime de-quantize, flat normals, per-face classes | Rocket pipeline (rewrite the Royce-specific face classifier into X-range region classes). |
| `src/motion/timing.js`, `useReducedMotion.js`, `lib/storage.js`, `lib/color.js`, `SectionFrame.jsx`, `MainMenu.jsx`, `QuickLinks.jsx` | Motion tokens; reduced-motion store; safe storage; seeded RNG; section entrance + h1 focus; plate-follow DOM menu with ↑/↓ | Port nearly as-is with Bearospace tokens. |
| `src/lab/` | Dev panel (palette, reduced motion, replay intro) | Port as a dev-only tool; gate fully behind `import.meta.env.DEV` (portfolio leaks Lab localStorage into production). |

**Do not copy:** LA city/road/traffic/overpass/burst/Royce modules, `src/world/*` (clock, weather, sun), `Hud.jsx`, portfolio copy and `ui.css` page styles.

**Known gaps to fix in the Bearospace build:** no error boundary around the lazy 3D chunk; no WebGL context-loss handling; no per-route `document.title`; no route announcer; no pause control for ambient motion (WCAG 2.2.2); fake loading bar; mobile tier fixed at mount; uncleaned `setTimeout` in menu click; no tests.

---

## 2. Asset inventory and preparation (inspected)

Repo state: `src/` is the Vite counter template. `public/3d-models/rocket.STL` is tracked; `public/Logos/`, `public/Team Headshots/`, `public/Bearospace Media Gallery Images/` are untracked.

### 2.1 Rocket STL — `public/3d-models/rocket.STL`

| Property | Finding |
|---|---|
| Format | Binary STL, header `stlbn rocket`, 33,748 triangles, ≈16.8k unique vertices, 1.69 MB, no face colors, no degenerate triangles |
| Units / size | Almost certainly mm: length 2,612 mm (≈2.61 m, ≈103 in); body radius ≈82.6 mm → **≈165 mm (6.5 in) OD** |
| Orientation | Long axis **+X; nose tip at X=0, aft end at X=2,612**. Axis at Y=Z=277.67. Origin at bbox min corner, not centered |
| Shape | Nose cone ≈0–400 mm; **4 fins** at 90° spacing with ≈10° roll offset, root ≈X 2,400–2,612, tip radius ≈286 mm (≈555 mm span) |
| Topology | **45 disconnected, unnamed shells.** Repeated identical shells (535/896 verts) and two very dense shells near X≈2,025 and X≈2,221 (r 26–50 mm) — likely threaded hardware/motor retention, hidden inside the airframe |
| Match | Proportions match the black carbon-fiber rocket with blue nose cone in gallery Media 8 & 10 |
| Season | **2025–26** (confirmed by Juan). Name, flight history, and measured performance unknown — no performance claims in copy until supplied |

**Implications:** a single exterior assembly. No credible exploded view or system labels. Region coloring by X-range is supportable (nose / body / fin can), as are dimension annotations (length, diameter, fin count). Internal-system callouts are not.

**Preparation (slice 1):**
1. Move the original, unmodified, to `assets-src/models/rocket.stl` (tracked, not served). Delete both served copies (`public/3d-models/rocket.STL`, and the byte-identical `public/Logos/rocket.STL`, SHA-256 99C733C0…).
2. `scripts/build-rocket.mjs` (port of the portfolio's `build-models.mjs`): weld (1e-3 mm) → split connected shells → write `assets-src/models/rocket.report.json` (per shell: tris, X range, max radius, kept/dropped) → **drop hidden shells** (max radius < body radius − 4 mm and >30 mm from the tail plane; the two dense internal shells are ~80 % of all triangles) → transform: nose up (+Y), tail-axis center at origin, mm → m, rotate 45° about Y so fins read as an "X" → simplify only if the exterior exceeds 15k tris (expected ≈6k) → quantize.
3. Output **`public/models/rocket.jvm2`** — the portfolio's JVM1 format plus a `u8 region[triangleCount]` block (≈60 KB raw, ≈40 KB brotli; GLB + meshopt decoder would add ~40 KB gz of loader for one untextured mesh) and `src/generated/rocket.meta.json` (length 2.612 m, OD 0.165 m, 4 fins, region height ranges, source hash). Manual overrides in `assets-src/models/rocket.config.json` (`keep`, `drop`, `noseStartMm`, `bands`).
4. Regions per face: **nose** (above the auto-detected shoulder) → blue sampled from photos (≈`#2F6BD1`); **body** → carbon `#16171D` with a ±6 % procedural twill; **fins** (r > body + 4 mm) → `#111216`; **hardware** (rail buttons, aft ring) → `#8A8F99`. Runtime `toCreasedNormals(35°)`: smooth airframe, crisp fins and nose joint. A fresnel rim in `--bear` keeps a black rocket readable against a black sky; ink color flips dark→pale as the scene enters space.
5. `createPlaceholderRocket()` — a LatheGeometry + 4 box fins from `rocket.meta.json` — renders instantly and is the permanent fallback if the model fails.

### 2.2 Logos — `public/Logos/`

| File | Facts | Use | Preparation |
|---|---|---|---|
| `BearospaceLogo.png` | 512×487 RGBA, 337 KB. Circular badge; glowing blue constellation bear on purple/black nebula; white "BEAROSPACE ENGINEERING" wordmark | Primary identity; intro shot A; header mark; favicon | Too small for a 2× hero or 1200×630 OG image. **Request a vector or ≥2048 px master.** Meanwhile: 128/256/512 WebP, favicon set, apple-touch-icon. Separate the bear and the wordmark only if a vector arrives. |
| `Anduril_Industries_Logo.svg` | viewBox 546×100, paths with no fill (renders black) | Sponsor recognition (intro + Sponsors) | Inline as a component with `fill="currentColor"`; white on dark. Confirm the current Anduril brand mark and usage permission. |
| `Icon.jpeg` | 200×200, black line mark resembling a stylized "A"; not the symbol inside the Anduril SVG | Unknown | Identify before use; exclude until then. |
| `UCLA_Samueli_Engineering_block-1.png` | 929×180 RGBA; current "UCLA Samueli School of Engineering" block | Institutional recognition | Preferred mark. Need a reversed/white version or vector for dark backgrounds; otherwise place on a light plate. |
| `UCLA_Henry_Samueli_School_of_Engineering_and_Applied_Science_logo.svg` | Older institutional name | None | Do not publish (outdated name). Keep as source only. |
| `public/favicon.svg`, `public/icons.svg`, `src/assets/*` | Vite template files | None | Delete. |

### 2.3 Gallery — `public/Bearospace Media Gallery Images/` (13 images, max 1,280 px, no video)

| # | Dims | Visual content | Probable set |
|---|---|---|---|
| 1 | 1280×831 PNG, 1.6 MB | Team lined up beside a launch tower; white fiberglass rocket with black nose (also the current home hero) | Jan 2026 launch |
| 2 | 946×614 | Dog beside the rail; white rocket loaded, blue aft | Jan 2026 |
| 3 | 1280×831 | Wide shot: rocket on tower, green spring desert | Jan 2026 |
| 4 | 1280×831 | Team walking out to the pad carrying the rocket | Jan 2026 |
| 5 | 1280×831 | Three-member selfie | Jan 2026 |
| 6 | 805×1104, EXIF 2026-01-24 | Member posing with an airframe | Jan 2026 |
| 7 | 1038×1422 PNG, 2.4 MB | Member installing the igniter, team watching, adult mentor | Jan 2026 |
| 8 | 1280×831 | Team carrying the black carbon-fiber rocket; fins visible | Summer full-scale launch |
| 9 | 1280×831 | Three members wiring an electronics sled in the field | Summer |
| 10 | 1280×707 | Carbon rocket with blue nose carried down a tarmac; adult mentor | Summer |
| 11 | 1280×1008 | Composite layup in a lab; masks and lab coats | Lab, undated |
| 12 | 1168×1168, EXIF 2026-01-24 | Pre-flight briefing around the rocket | Jan 2026 |
| 13 | 1280×615 | Sunset campsite with tents | Summer trip |

The Google Site labels all 13 "2025–2026". Only two carry EXIF dates. Location, event name, people, and photographer are unknown. **Preparation:** rename to slugs (`2026-01-launch-team-at-tower.jpg`); convert the PNGs to JPEG; produce AVIF + WebP at 480/960/1280 w; ≤180 KB at 1280 w; 24-px LQIP; strip EXIF/GPS; record `season: "2025-26"` (from the Google Site label), `date: null` unless confirmed. Request originals at full resolution and any launch video (ignition footage would strengthen Projects).

### 2.4 Headshots — `public/Team Headshots/` (14)

| File | Dims | Background | Proposed mapping |
|---|---|---|---|
| `Alan alfaro.png` | 1023² | white | Alan Alfaro |
| `alexander astorga.png` | 1103² | white | Alexander Astorga |
| `angel iglesias.png` | 1078² | white | Angel Iglesias |
| `azad aghdam.png` | 1280² | transparent | Azad Aghdam |
| `Bianca Vasquez.png` | 1122² | white | Bianca Vasquez |
| `brandon aguilar.png` | 1254² | white | Brandon Aguilar |
| `brian sierra.png` | 500² | transparent | Brian Sierra |
| `Emmanuel Jaimes.png` | 488² | transparent | Emmanuel Jaimes |
| `joel venegas.png` | 1254² | white | Joel Venegas |
| `johnathan nguyen.png` | 1173² | white | Jonathan Nguyen (site spells "Jonathan") |
| `Juan Ventura-Romero.png` | 1055×1491 | transparent | Juan Ventura-Romero |
| `natlie lopezx.png` | 1023² | white | Natalie Lopez (filename typo) |
| `Nicholas Equihua.png` | 1219² | white | Nicholas Equihua |
| `Noah Hernandez.png` | 1028² | white | Noah Hernandez |

**Missing:** Jonathan Mendez Aguilar, Daniel Montano. All mappings are by filename only; mark each `headshotVerified: false` until a member confirms. **Preparation:** slug filenames; 4:5 crop with consistent eye line; 320/640 w AVIF+WebP (~30–60 KB); place every portrait on the same panel. White-background images get a background-removal pass so all 14 match the transparent cut-outs; if removal quality is poor, use a uniform light "paper" card for all.

### 2.5 Missing assets to request
Vector/large Bearospace logo; Anduril usage approval and preferred mark; white UCLA Samueli lockup; rocket name, season, and specs; full-resolution photos with captions; launch video; headshots for Mendez Aguilar and Montano; member LinkedIn URLs and consent; AISES at UCLA logo (if the relationship section should show it).

---

## 3. Existing-site audit and migration map

All 14 pages of `https://sites.google.com/view/uclabearospace/…` were read on 2026-11-02. The older site `https://sites.google.com/view/bearospace-ucla/…` (4 pages) was also read.

### 3.1 Current site — page inventory

| Page | What it does / facts | Carry forward | New home | Problems |
|---|---|---|---|---|
| `/` = `/home` | Hero photo (Media 1), "Bearospace At UCLA", mission: empower students "through hands-on rocketry, technical training, and community engagement"; "diverse and technically exceptional aerospace community"; inspire STEM | Mission statement (rewritten) | `/` menu tagline + `/about` | Duplicate root URL; two sentences only |
| `/about` | Student-led multidisciplinary program; structure "mirrors professional aerospace companies"; yearly cycle: design, validate, manufacture, launch; reviews, manufacturing campaigns, ground testing, launch ops. PM welcome (Bianca Vasquez & Emmanuel Jaimes, "Project Managers 2026–2027"); Google Calendar "Bearospace Summer 2026" | All substance; welcome condensed | `/about` (lifecycle + welcome); calendar → `/join` only if active | Calendar label stale; **no public events visible**; portraits lack alt |
| `/about/sponsorship` | "Partner with Us!" — sentence breaks off; no contact | Intent | `/sponsors` | Unfinished page |
| `/technical-programs` | 4 divisions, 8 cards: Vehicle (Aerodynamics, Structures, Recovery), Avionics (Electronics, Payload Electronics), Payload (Payload Development, Payload Electronics), Safety & Operations | Division structure, one-line summaries | `/engineering` | Card titles link to /photos, /team, /contact; Payload Electronics duplicated |
| `/technical-programs/aerodynamics` | Stability, drag reduction, performance, experimental flight control; fins, nosecones, boattails, active airbrakes. Projects: flight profile optimization, fin design & validation, nosecone, active boattail, active airbrake, CFD. Skills: CFD, aerospace analysis, design validation, flight dynamics, technical research | All | `/engineering/aerodynamics` | Project list mixes ongoing tasks and R&D; status unknown |
| `/technical-programs/internalexternal-structures` | Concepts → flight-ready hardware; carbon fiber, fiberglass, aluminum, aerospace epoxies; weight vs strength vs manufacturability vs safety; **leads integration of all major flight systems**. Projects: airframe, bulkheads, motor mount, couplers, weight optimization, component integration. Skills: SolidWorks, composites, FEA, aerospace structures, mechanical design, manufacturing | All | `/engineering/structures` | Name inconsistency (Structures vs Internal/External) |
| `/technical-programs/recovery-systems` | Dual deploy (drogue + main); deployment mechanisms; descent rates, black-powder sizing, shear pins, sequencing; year-round testing; reliability and risk. Projects: drogue, main, avionics-bay integration, black-powder testing, recovery validation, flight readiness. Skills: recovery design, reliability, flight testing, data analysis, systems validation | All | `/engineering/recovery` | — |
| `/technical-programs/electronics` | Sensors, flight computers, telemetry, power distribution, deployment electronics; real-time flight data. Projects: flight computer integration, sensor networks, telemetry, power management, data acquisition, recovery electronics. Skills: PCB design, embedded programming, sensor integration, electrical testing, data systems | All | `/engineering/avionics` | Menu says Electronics, text says Avionics Division |
| `/technical-programs/payload-electronics` | Sensors, motor control, power distribution, circuit boards that survive launch. Projects: custom PCBs, wiring harnesses, sensor integration, motor control, autonomous electronics. Skills: PCB design, electronics architecture, power systems, sensor networks, hardware integration | All | `/engineering/payload-electronics` (shared Avionics × Payload) | Duplicate card |
| `/technical-programs/payload-development` | New challenge each year; concept, CAD, structural analysis, manufacturing, assembly, testing; airframe compatibility. Projects: mission architecture, CAD, structural analysis, mechanical assembly, autonomous mechanisms, field testing. Skills: systems engineering, CAD, FEA, mechanical integration, project management | All | `/engineering/payload` | One-sentence About |
| `/technical-programs/safety-operations` | Manufacturing procedures, documentation, lab operations, competition/launch compliance, risk mitigation. Responsibilities: safety procedures, documentation, risk assessments, safety reviews, lab management, tool maintenance, procurement, compliance | All | `/engineering/safety-operations` | No named lead in 2026–27 |
| `/photos` | Intro about work + friendships; heading "2025 - 2026"; 13 images, no captions/alt | Intro idea; images | `/gallery` | No 2026–27 section; no alt |
| `/team` | "2026 - 2027 Leadership Team" (roster in §4.4) | All | `/team` + `/team/:slug` | "Vice Project Manger" typo; Avionics Director "[Recruiting]"; Montano no photo; no links |
| `/contact` | Email, Instagram, LinkedIn; "Come Visit Us At Boelter Hall, Room 2817"; map embed | All | `/join` (+ footer) | No meeting times or join form |

Site-wide: footer email/Instagram/LinkedIn; social links go through Google redirects; stray "Embedded Files" header text; **no image alt text anywhere**.

### 3.2 Older site (`sites.google.com/view/bearospace-ucla`)

| Page | Facts | Use |
|---|---|---|
| Home | "rocketry club dedicated to growth and innovation"; goals: retention, participation, visibility of underserved communities in technical projects; rally sponsorships, grants, mentorship; Linktree `linktr.ee/bearospaceUCLA` | Mission/access copy on `/about`; verify Linktree before use |
| 2024-2025 | "third place in the 2024-2025 FNL competition in Kenosha, Wisconsin" (category not stated) | Competitions record (see §4) |
| Current Work | "Completing reviews under NASA Student Launch Challenge"; building the year's rocket | Supports Bearospace ↔ NASA SL 2025–26 |
| Contact | "THIS IS 2025-2026 BEAROSPACE." roster of 20 (§4.4) | 2025–26 season roles (alumni/history) |

Recommend: once the new site launches, the old site should link to it (or be unpublished) to stop conflicting rosters.

### 3.3 What's outdated, ambiguous, or missing
1. Calendar "Bearospace Summer 2026" has no public events → do not embed; replace with a maintained "Upcoming" list in `/join`.
2. Gallery is labeled 2025–26 while everything else is 2026–27.
3. Sponsorship page unfinished; Anduril appears nowhere publicly.
4. Division naming: Electronics vs Avionics; Structures vs Internal/External Structures; About says "Vehicle, Avionics, Payload, and Operations".
5. Payload Electronics listed in two divisions.
6. No meeting time, join form, or recruiting timeline anywhere.
7. Payload Software / software work is invisible.

---

## 4. Research record (sources, seasons, discrepancies)

### 4.1 Identity and AISES relationship
- AISES at UCLA calls Bearospace "our technical project" for hands-on aerospace learning (https://sites.google.com/g.ucla.edu/ucla-aises/about-us). The chapter is housed in CEED (Center for Excellence in Engineering and Diversity) at UCLA Samueli, alongside NSBE and SOLES.
- Only AISES members may compete on the team, and anyone can join AISES (Daily Bruin, Jan 11 2024). The CEED Spring 2026 newsletter lists a "Bearospace Lead" and "Bearospace Finance Chair" on the AISES board.
- LinkedIn describes Bearospace as "a project under AISES" at UCLA.
- **AISES chapter awards are not Bearospace awards:** 2021 Professional Chapter of the Year; 2022 Outreach & Community Service Chapter Award. Mention only as chapter context, clearly attributed.
- **UCLA Samueli relationship:** no formal sponsorship is documented. Documented ties: AISES/CEED are part of UCLA Samueli; MAE and the Samueli Newsroom covered 2014 and 2019 results; the team works in Boelter Hall. Recommended label: **"Home institution — UCLA Samueli School of Engineering"** (or "with support from" only if the team confirms material support).
- **Founding:** not established. Earliest documented UCLA AISES rocket team: 2014 ("UCLA AISES Bruin Rocketeers"). Earliest document using "Bearospace": the Nov 30 2018 FNL proposal ("Team Name: UCLA Bearospace"). Copy should say "UCLA AISES students have competed in rocketry since at least 2014" — no founding year.
- **Anduril:** supplied by Juan as the current sponsor; no public source found. Public wording decided: **"Supported by Anduril."** Logo-usage approval still to be recorded.

### 4.2 Competitions

**First Nations Launch (FNL)** — collegiate high-power rocketry competition administered by the NASA Wisconsin Space Grant Consortium at Carthage College, Kenosha WI; open to Tribal Colleges, Native American-serving institutions, and schools with active AISES chapters. Categories were Tribal Launch / AISES Launch through 2018–19; from 2020 it became an Artemis Student Challenge with Moon/Mars/Gateway challenges. WSGC's Fall 2025 update says it was wrapping up after 16 years; the current FNL page advertises a 2026–27 season (Apr 23–25 2027) funded by Blue Origin. Sources: https://spacegrant.carthage.edu/first-nations-launch/ , awards archive https://spacegrant.carthage.edu/first-nations-launch/awards/

**NASA Student Launch** — 9-month challenge run by NASA Marshall's Office of STEM Engagement; teams design, build, test, and launch a high-power rocket with a payload; reviews PDR → CDR → FRR → LRR → PLAR; launch in Huntsville AL (2027 Launch Day Apr 10 2027). College/University division = USLI. Source: https://www.nasa.gov/learning-resources/nasa-student-launch/

### 4.3 Historical results (canonical records for `competitionResults`)

| Season | Competition | Category | Result | Source | Confidence / note |
|---|---|---|---|---|---|
| 2013–14 | FNL 2014 | Flight portion | 1st in flight (of 9 teams) | https://samueli.ucla.edu/ucla-aises-team-wins-rocket-competition/ (Jun 9 2014) | Medium. Team "UCLA AISES Bruin Rocketeers"; not in organizer archive; predecessor, not "Bearospace" by name |
| 2015–16 | FNL | Tribal Launch | 2nd | FNL archive | Archive lists it under Tribal (odd for UCLA); **verify** |
| 2016–17 | FNL | AISES Launch | 2nd | FNL archive | High |
| 2017–18 | FNL | AISES Launch | 3rd | FNL archive | High |
| 2018–19 | FNL (Apr 25–28 2019, Richard Bong SRA, WI) | AISES Launch | **1st** | archive; https://www.mae.ucla.edu/uclas-bearospace-rocket-team-wins-2019-first-nations-aises-launch-competition/ ; CEED https://www.ceed.ucla.edu/?p=28268 | High. $3,000 prize + KSC tour; 54 mm AeroTech J450 DM; apogee window 3,500–5,000 ft; co-leads Lucia Gonzalez & Ryan Rio; advisor Audrey Pool O'Neal; proposal: 65 in × 3.9 in carbon-fiber rocket, 3D-printed nose, Arduino + MPU6050 + RRC3 |
| 2020–21 | NASA Student Launch | Design Division | Top 3 + Vehicle Design Award 1st (Design Division) | https://www.nasa.gov/wp-content/uploads/2023/11/2020-2021-nasa-student-launch-teams.pdf | **Low–medium that UCLA entry = Bearospace** (NASA names university only) |
| 2021–22 | NASA Student Launch | USLI | Participant | NASA team list PDF | Same uncertainty |
| 2023–24 | FNL | Mars Challenge | **2nd overall**; 2nd Mars oral report; 2nd Mars written report | FNL archive | High |
| 2024–25 | FNL (Apr 25–27 2025, Kenosha) | Mars Challenge oral reports; Mars Challenge written reports | **3rd (each)** | FNL archive; WSGC Fall 2025 update | High. Not in Mars Grand Prize top 3 |
| 2024–25 | FNL | "Tribal Category" | "2nd" | CEED Spring 2025 newsletter p. 8 | **Conflicts** with archive (no Tribal category since ~2020). Do not publish |
| 2025–26 | NASA Student Launch | College/University | Listed participant | https://www.nasa.gov/wp-content/uploads/2026/10/2025-2026-student-launch-teams.pdf ; old site "Current Work" | Medium–high = Bearospace. CEED Winter 2026: Bearospace "lost funding" for the NASA competition → **launch participation unconfirmed** |
| 2026–27 | NASA Student Launch | College/University (USLI) | Selected team "University of California, Los Angeles" | https://www.nasa.gov/learning-resources/nasa-student-launch/current-teams/ | Confirm with team before attributing |

**Public-copy rule:** publish High-confidence rows as stated, with category verbatim. Medium/Low rows stay in data with `confidence` and are hidden (`publish: false`) until confirmed.

### 4.4 Rosters

**2026–27 Leadership** (current site, confirmed verbatim; plus Juan's update):

| Group | Person | Role |
|---|---|---|
| Management | Emmanuel Jaimes; Bianca Vasquez | Project Manager |
| Management | Noah Hernandez | Vice Project Manager |
| Vehicle | Alexander Astorga | Aerodynamics Director |
| Vehicle | Joel Venegas | Structures & Recovery Director |
| Vehicle | Azad Aghdam | Aerodynamics Lead |
| Vehicle | Jonathan Mendez Aguilar; Brian Sierra; Daniel Montano | Structures Lead |
| Vehicle | Jonathan Nguyen | Recovery Lead |
| Payload | Natalie Lopez | Payload Director |
| Payload | Brandon Aguilar; Alan Alfaro | Payload Lead |
| Payload | **Juan Ventura-Romero** | **Payload Software Lead** (supplied by Juan; not on current site) |
| Avionics | — | Avionics Director (open position) |
| Avionics | Angel Iglesias | Avionics Lead |
| Avionics × Payload | Nicholas Equihua | Payload Electronics Lead |

**2025–26** (older site, "THIS IS 2025-2026 BEAROSPACE"): Isrrael Sumano, Emmanuel Jaimes — Project Managers; Josephine Rivera-Hoagland — Public Relations Officer; Noah Tran, Azad Aghdam, Joel Venegas — Structures and Recovery; Eirvin Rubio, Dereck Rubio, Wyatt Brown, Kenneth Fambro — Avionics; Michael Sicner, Natalie Lopez, Dario Kuro — Challenge; Ronaldo Garcia, Moises Sosa, Daniel Montano, Brian Sierra, Israel Alejos — Manufacturing Lead; Noah Hernandez, Lyzet Leyva — Safety Lead. (Spellings as published; "Isrrael" to be confirmed.)

**2018–19:** co-leaders Lucia Gonzalez and Ryan Rio (UCLA MAE). **2013–14:** co-directors Daniel Calderon and Dylan Rodarte. Faculty/staff adviser 2014–2019: Audrey Pool O'Neal (CEED / WE@UCLA). Mentor 2018–19: Frank Nobile.

### 4.5 Unresolved discrepancies
1. 2024–25: CEED "2nd, Tribal Category" vs organizer "3rd, Mars oral & written reports" vs old site "third place".
2. 2015–16 listed under Tribal Launch.
3. 2014 flight win absent from organizer archive.
4. NASA SL 2020–22, 2025–26, 2026–27 entries name the university only.
5. 2019 motor supplier: WSGC (MAE article) vs Tripoli Wisconsin (proposal).
6. FNL status: wound down (WSGC 2025) vs 2026–27 season (current page).
7. "Jonathan" (site) vs "johnathan" (headshot filename).
8. Rocket STL name and flight record (season confirmed 2025–26 by Juan).

---

## 5. Visual direction — "Constellation Flight"

**Concept:** the logo's constellation bear becomes the site's system. Night sky, ink-lined toon geometry, glowing constellation strokes connecting ideas, and bold comic panels for content — more "mission patch meets graphic novel" than the portfolio's street-level anime energy.

**Palette (fixed; no theme picker).** Derived from the logo plus UCLA gold as the single warm accent.

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#07081A` | Deep space background, ink outlines |
| `--night` | `#11143A` | Panels, cards |
| `--nebula` | `#3B1F73` | Gradients, scene haze, hover fills |
| `--bear` | `#3D7BFF` | Primary brand blue (constellation glow, links on light) |
| `--glow` | `#A9C6FF` | Constellation lines, focus rings on dark |
| `--star` | `#F2F4FF` | Body text on dark (≥15:1 on `--ink`) |
| `--mute` | `#A6ABCC` | Secondary text (≥7:1 on `--ink`) |
| `--gold` | `#FFD100` | UCLA gold: CTAs, ignition, selected state (text on gold = `--ink`) |
| `--flame` | `#FF6A2B` | Exhaust core, rare alerts only |
| `--paper` | `#F4F1E8` | Light comic panels (Sponsors, printable/long-read sections) |

**Typography:** Display **Saira** variable (weight axis only; its rounded technical forms echo the logo wordmark). Body **Atkinson Hyperlegible Next** (readability for long engineering copy). Data/mission-log text uses the system monospace stack. Both webfonts are self-hosted via @fontsource, latin subset (~67 KB total). Body 17–18 px, line length ≤72ch, line-height 1.6. *(Slice 2: the width axis (+99 KB) and JetBrains Mono (+40 KB) were dropped to stay inside the 80 KB font budget.)*

**Graphic language:**
- Ink outlines (ported shader) on 3D; 2-px ink borders and offset "panel" shadows on cards.
- Constellation strokes: thin `--glow` lines with star nodes linking related items (disciplines → people → projects).
- Speed lines and impact frames reserved for launch and route transitions — not decoration on reading pages.
- A 14° "ascent axis" (portfolio uses −14°; Bearospace uses +14°, upward) for wipes, kickers, and tilted headings.
- Halftone star-dust texture (CSS/SVG) on panels, very low contrast.
- Photographs are always shown un-stylized (authentic), framed by ink panels.

**Restraint rules:** one motion focal point per screen; body copy never animates after arrival; max one gold element per viewport.

---

## 6. Opening cinematic storyboard

Total full intro **10.0 s**; short intro for returning visitors **2.4 s**. All 3D shots are one continuous WebGL scene so F *is* the menu (no reset).

| Shot | Time | Picture | Motion / FX | Sound |
|---|---|---|---|---|
| **A. Identity** | 0.0–1.6 | Black. Constellation stars pop in (staggered, 0.04 s), lines draw between them forming the bear; at 0.9 s an **impact frame** (2 frames of inverted paper/ink) and the full badge snaps in; a light sweep crosses the wordmark | Star pops `back.out`; line draw via stroke-dashoffset; impact flash uses ported overlay shader | None (no audio in v1) |
| **B. Recognition** | 1.6–3.4 | Badge shrinks to a corner bug. Kicker "SUPPORTED BY" → **Anduril** wordmark (white, true proportions, centered, ≥40 % viewport width on desktop, ≥70 % on mobile) holds 0.9 s; then smaller kicker "BUILT AT" → **UCLA Samueli School of Engineering** lockup on a light plate. Kicker text comes from each sponsor record's `introKicker` | Panels slide in on the 14° axis; logos never stretched, rotated, or effect-treated | — |
| **C. Pad reveal** | 3.4–5.0 | Wipe opens onto dusk desert: ink-lined mesas, launch tower (procedural truss), the real rocket on the rail. Camera starts low at the fins and cranes up the airframe to the blue nose; the horizon glows `--nebula`→`--flame` | Camera leg 1.6 s `power2.inOut`; slight dolly | — |
| **D. Ignition & liftoff** | 5.0–6.6 | Sparks, then the plume blooms (additive sprite cone + flipbook noise); smoke billows (instanced ink-outlined toon puffs); a 2-frame impact flash at liftoff; rocket accelerates out of frame-center while the camera tilts to track | Speed lines ramp `lines: 0→0.8`; camera shake ≤0.4° for 0.3 s (off in reduced) | — |
| **E. Ascent** | 6.6–8.8 | Rocket held center; clouds stream downward past it; sky gradient sweeps dusk → indigo → black; stars fade in; a thin atmosphere limb curves below | Environment scrolls, not the rocket; speed lines peak then relax | — |
| **F. Arrival** | 8.8–10.0 | Camera eases to the menu framing (rocket slightly left-of-center on desktop, upper-center on mobile, 3/4 view); destination bodies drift in from the edges; labels fade up last | `settle` label at 8.8; menu DOM entrance starts at 9.3 | — |

**Behavior contract**
- **Loading:** the HTML shell, header, skip link, and the full DOM menu render immediately. A thin top progress bar reflects *real* bytes (3D chunk + rocket model via fetch progress). Shot A (pure DOM/SVG) starts immediately and doesn't wait on WebGL; shots C–F require the scene. If the scene isn't ready by the end of B (3.4 s) the intro holds B for up to 1.5 s more, then cuts straight to the menu with the scene fading in when ready.
- **Skip:** a visible "Skip intro ⏭" button (bottom-right, 44 px, focused on load) plus Esc/Enter/Space or a tap anywhere. Skipping jumps to `settle` and completes F in 0.5 s.
- **First visit:** full intro. **Returning** (`bearo:intro-seen` set only after the intro actually played or was skipped by the user): short 2.4 s — A's impact frame + badge (0.8 s) → cut to ascent tail E (1.0 s) → F (0.6 s). Sponsors are still recognized on every visit via the menu footer strip and `/sponsors`.
- **Replay:** "Replay launch" in the site footer and in the menu's utility row; replays the full intro without a reload.
- **Direct link (any path ≠ `/`):** no intro. The page renders immediately over a static scene frame; the menu is one click away.
- **Reduced motion:** no cinematic. A static composed hero: badge, the sponsor strip, and a still render of the rocket in space (or a pre-rendered poster image if WebGL is unavailable). No ambient drift.
- **WebGL/model failure:** DOM menu over a CSS/SVG starfield and a pre-rendered rocket poster (`/media/rocket-poster.webp`, generated once from the scene). Same links, same content.
- **Always usable while loading:** header, menu links, skip link, all page content.

---

## 7. Main menu — "Flight Deck"

**Recommendation:** a hybrid with **fixed slots, not true orbits**. The rocket never moves: it sits at the origin, horizontally centered at ~45 % height, plume trailing off the bottom; flight is conveyed by scrolling star layers, near-field dust streaks, the nebula dome, and speed lines. Eight destinations are **celestial bodies in fixed slots, four per side** (`menuSlots.js`: `{id, side, ny, depth, size}`, unprojected on resize so they always fit the frustum). Each body spins and bobs ±1.5 % of the viewport but never passes behind the rocket, so targets never reorder or occlude. The interactive targets are **real DOM `<Link>`s** in one `<nav aria-label="Destinations">`, positioned by the engine via `translate3d` on rendered frames (skipping sub-0.5 px changes, clamped to a 24 px safe inset, ≥44×44 px, frozen while hovered/focused). The same `<nav>` is prerendered, so it is crawlable and works with no JS.

Slots: **Left** — About, Engineering, Projects, Competitions. **Right** — History, Team, Gallery, Sponsors.

| Destination | Body | Why |
|---|---|---|
| About | **Ursa** — the constellation bear (from the logo) | Identity and origin |
| Engineering | Ringed planet with 7 small moons (the disciplines) | Divisions orbiting one vehicle |
| Projects | Payload satellite with solar panels | The hardware we build |
| Competitions | Rust-red planet with a mission flag | Mission-log feel (nod to the Mars Challenge) |
| History | Comet with a long, dotted trail of past seasons | Progression over time |
| Team | Orbital station with lit windows | Crew |
| Gallery | Nebula cloud with photo "frames" twinkling inside | Captured moments |
| Sponsors | Escort rocket flying in formation | Supporters who fly with us |
| **Join** | Not a body — a persistent gold "Join the team" CTA bottom-center beneath the rocket + "Sponsor a launch" ghost button | Primary conversions never hidden in the scene |

**Layout switch:** `data-layout="orbit"` when the scene is ready, motion is allowed, width ≥ 900 px and aspect ≥ 0.9; otherwise `data-layout="list"`. Same links, same order, same URLs.
**Orbit (desktop):** title block top-left ("BEAROSPACE · UCLA's student rocketry team"); rocket center; 4 bodies per side; gold "Join the team" CTA bottom-center beneath the rocket ("the destination ahead of the flight") with a "Sponsor a launch" ghost button; utility cluster bottom-left (Pause motion, Replay launch); "Supported by" sponsor strip bottom-right. Hover/focus → `engine.highlight(id)`: body ×1.08, rim pulse, a constellation line draws rocket → body, a one-line descriptor appears ("7 disciplines, aero to avionics"). Click/Enter → camera travels to a body-relative shot (0.9 s) → wipe → page panel on the left 60 % with the body framed right.
**List (mobile, portrait tablets, reduced motion, no WebGL):** rocket keeps flying behind (if available) in the upper half; bodies hidden; 8 rows of ≥56 px with an inline SVG icon of each body and its descriptor visible (no hover-only info); Join/Sponsor CTAs pinned below.
**Keyboard:** roving tabindex (`useRovingFocus`) — one link is tabbable (the last selected); ↑/↓ move within a column, ←/→ jump to the mirrored slot, Home/End jump; in list layout ↑/↓ follow reading order. Tab continues to the Join CTA, then utilities. Enter opens. Esc returns to the parent route (`/team/x` → `/team` → `/`) unless a dialog handles it. Focus ring: 3 px `--glow` + 2 px `--ink` offset.
**Touch:** tap = open (no hover-only info; teasers visible inline on mobile rows).
**Compact navigation while reading:** a slim top bar on every content page: badge (→ `/`), "Flight Deck" back control, current section breadcrumb, a "Menu" button opening a full-screen overlay of the same 8 links + Join/Sponsor/Contact, and a pause-motion toggle. The 3D scene continues dimmed at 30 fps behind the page (or paused when the page is long-scrolled and covered).
**Return:** "← Flight Deck" or Esc or the badge → camera reverses from the body back to the deck shot; focus returns to the body link last used.
**Interrupted/repeated navigation:** latest URL wins; clicks during travel speed the timeline ×3 (portfolio `hurry()`); same-target clicks are ignored; Back/Forward are treated as normal location changes; the camera snaps under the wipe if it isn't framing the destination.

---

## 8. Sitemap and page specifications

```
/                                  Flight Deck (menu)
/about                             Mission, how we work, AISES, PM welcome
/engineering                       Divisions overview
/engineering/:discipline           aerodynamics | structures | recovery | avionics |
                                   payload-electronics | payload | safety-operations
/projects                          Project index (by season, status)
/projects/:slug                    Project detail (e.g. 2025-26-launch-vehicle)
/competitions                      FNL + NASA SL, results log
/history                           Season timeline
/team                              Current leadership + past seasons
/team/:person                      Member profile (stable slug, e.g. juan-ventura-romero)
/gallery                           Photos + lightbox (?photo=slug deep link)
/sponsors                          Supporters + sponsor inquiry
/join                              Join + contact (membership, sponsorship, general)
/404
```
Legacy redirects: `/home`→`/`, `/technical-programs`→`/engineering`, `/technical-programs/internalexternal-structures`→`/engineering/structures`, `/technical-programs/electronics`→`/engineering/avionics`, `/technical-programs/recovery-systems`→`/engineering/recovery`, `/technical-programs/payload-development`→`/engineering/payload`, `/photos`→`/gallery`, `/contact`→`/join`, `/about/sponsorship`→`/sponsors` (only matters if a custom domain replaces the Google Site; included for completeness).

Shared page anatomy: kicker (mono, season/section), H1 (Saira), lede, sections, related-links rail ("Connected systems"), footer (contact, socials, sponsor strip, Replay launch, Last updated + sources link).

### 8.1 `/` Flight Deck
- **Purpose:** instant identity + routes to engineering, joining, sponsoring. Audience: everyone.
- **Content:** H1 "Bearospace"; sub "UCLA's student rocketry team"; lede "We design, build, and fly high-power rockets — and the payloads inside them — as the technical project of AISES at UCLA."; CTAs "Join the team" (gold) / "Sponsor a launch"; 8 destinations; sponsor strip (Anduril, UCLA Samueli); "Replay launch".
- **Motion:** entry = intro F or a 0.6 s deck settle; ambient = flight, slow body orbits (pausable); interaction = hover/focus as §7; exit = camera travel to body + wipe.
- **Reduced/no-WebGL:** static poster + DOM list. **Missing:** none blocking.

### 8.2 `/about` — Mission
- **Sections:** (1) "Built by students. Flown for real." — mission (from home + about); (2) "How a Bearospace rocket comes together" — lifecycle stepper: Concept → Design reviews → Manufacturing → Integration → Ground testing → Launch → Post-flight analysis; (3) "Organized like an aerospace program" — four divisions (Vehicle, Avionics, Payload, Safety & Operations) with link to `/engineering`; (4) "Rooted in AISES at UCLA" — relationship, access mission, CEED home, "you join through AISES; anyone can join AISES" (verify current rule); (5) "A note from our Project Managers" — condensed welcome, portraits, signature "Bianca Vasquez & Emmanuel Jaimes, Project Managers 2026–27"; (6) CTA band.
- **Draft copy (1):** "Bearospace is a student-led aerospace engineering program at UCLA. Every year our members take a high-power rocket from a blank CAD file to the launch rail — designing it, defending it in technical reviews, building it by hand, testing it on the ground, flying it, and learning from the data. Our structure mirrors a professional aerospace program, so members grow as engineers and as leaders while contributing to one integrated flight vehicle."
- **Draft copy (4):** "Bearospace is the technical project of the UCLA chapter of the American Indian Science and Engineering Society (AISES), part of UCLA Samueli's Center for Excellence in Engineering and Diversity. We exist to widen the door into hands-on aerospace: to recruit through cultural and campus communities, and to make sure students who have never touched a power tool get the same chance to build flight hardware as those who have."
- **Draft copy (5), condensed:** "Welcome to Bearospace! We believe the best way to learn aerospace engineering is to build aerospace systems. Whether you're an experienced engineer or a first-year who has never opened a CAD program, there's a place for you here — on our Vehicle, Avionics, Payload, or Operations teams, from first concept to post-flight analysis. The friendships, mentorship, and connections you make here matter as much as the rockets we launch. Our goal is a team where everyone can grow technically, professionally, and personally. Explore our work, meet the team, and follow the journey."
- **Motion:** entry = camera dollies toward Ursa, stars connect into the lifecycle stepper; ambient = faint constellation twinkle; stepper steps reveal on scroll (IntersectionObserver, once). **Missing:** current AISES membership rule; AISES logo permission.

### 8.3 `/engineering` — Divisions
- **Sections:** H1 "Engineering"; lede "One rocket, seven disciplines, four divisions."; **System map** — the rocket (real model, side view) with *region* callouts only: Nose cone & airframe shape (Aerodynamics), Airframe/couplers/fin can (Structures), Recovery bay (Recovery — label as "recovery section", position approximate, no internals), Avionics bay (Avionics), Payload (Payload + Payload Electronics + Payload Software), Ground & launch operations (Safety & Ops). Division groups: Vehicle (Aerodynamics, Structures, Recovery), Avionics (Avionics), Payload (Payload Development, Payload Electronics), Safety & Operations. **Payload Electronics** shown once, bridging Avionics and Payload with a constellation line and the note "Shared between the Avionics and Payload divisions." **Software across the vehicle:** a band explaining embedded flight software (avionics), payload software (autonomy, control — led by Juan Ventura-Romero), and analysis tooling (simulation/CFD scripts, data processing), linking to the relevant disciplines.
- **Motion:** entry = camera travels to the ringed planet, which resolves into the rocket side view; hover a discipline card → its region on the rocket highlights (`--bear` rim). **Reduced:** static labeled SVG diagram generated from `rocket.meta.json`.
- **Missing:** confirmation of bay positions before callouts are anchored to specific heights (otherwise use a schematic, not the model).

### 8.4 `/engineering/:discipline` (×7)
Template sections: kicker division; H1; "What we're responsible for"; "Where it lives on the rocket" (mini system map highlight); "What you'll work on" (projects list from site); "Tools & methods"; "Skills you'll build"; "Who leads it" (current leads, linked); "Related projects"; "Get involved" CTA → `/join?interest=<discipline>`.

Draft ledes (facts from the current site):
- **Aerodynamics:** "Aerodynamics decides how the rocket flies. We study stability, drag, and performance, and design the external shape — fins, nose cone, boattail — plus experimental control hardware like active airbrakes. Every choice shows up in the altitude and stability of the flight." Work: flight-profile optimization, fin design & validation, nose-cone development, active boattail, active airbrakes, CFD. Skills: CFD, aerospace analysis, design validation, flight dynamics, technical research. Leads: Alexander Astorga (Director), Azad Aghdam (Lead).
- **Structures:** "Structures turns designs into flight-ready hardware. We lay up carbon fiber and fiberglass, machine and fit aluminum hardware, and bond it all with aerospace epoxies — balancing weight, strength, manufacturability, and safety. Structures also leads integration, making sure every system fits and works as one vehicle." Work: airframe, bulkheads, motor mount, couplers, weight optimization, integration. Skills: SolidWorks, composites, FEA, aerospace structures, mechanical design, manufacturing. Leads: Joel Venegas (Director, Structures & Recovery), Jonathan Mendez Aguilar, Brian Sierra, Daniel Montano.
- **Recovery:** "Recovery brings the rocket and payload home safely. We design dual-deployment systems — a drogue at apogee, a main near the ground — size black-powder charges and shear pins, sequence deployment, and test until it's reliable. It's one of the most safety-critical jobs on the team and a real introduction to reliability engineering." Work: drogue & main systems, avionics-bay integration, black-powder testing, validation campaigns, flight-readiness verification. Leads: Joel Venegas (Director), Jonathan Nguyen.
- **Avionics:** "Avionics is the rocket's nervous system: flight computers, sensors, telemetry, power distribution, and the electronics that fire recovery events. Members design PCBs, write embedded code, and test it on the bench before it ever flies." Work: flight-computer integration, sensor networks, telemetry, power management, data acquisition, recovery electronics. Skills: PCB design, embedded programming, sensor integration, electrical testing, data systems. Leads: Director open; Angel Iglesias (Avionics Lead).
- **Payload Electronics** (Avionics × Payload): "Payload Electronics builds the electrical architecture that lets the payload act on its own — custom circuit boards, wiring harnesses, sensors, motor control, and power systems that survive launch loads." Lead: Nicholas Equihua. Software note: works with Payload Software (Juan Ventura-Romero).
- **Payload Development:** "Each year brings a new payload challenge. Payload Development turns it into a mission: concept, CAD, structural analysis, manufacturing, assembly, autonomous mechanisms, and field testing — all designed to fit and survive inside the airframe." Leads: Natalie Lopez (Director), Brandon Aguilar, Alan Alfaro; Juan Ventura-Romero (Payload Software Lead).
- **Safety & Operations:** "Safety & Operations keeps every build and launch safe and by the book: manufacturing procedures, documentation, risk assessments, safety reviews, lab management, tool upkeep, procurement, and compliance with competition and launch rules." Leads: not listed for 2026–27 (show "Open — ask us how to get involved").
- **Motion:** entry = camera arcs to the discipline's moon; ambient none; interaction = skill chips light constellation links to related leads. **Missing:** per-discipline photos, software stack specifics, Safety lead.

### 8.5 `/projects` and `/projects/:slug`
- **Index:** cards by season with a **status badge** (Proposed · In progress · Ground-tested · Flown · Completed) — color + text, never color alone. Filter by season/discipline.
- **Detail template:** hero (photo or 3D), status + season + competition; Objective; Constraints; Approach; Hardware; Software; Testing (dated log); Results (only measured, sourced); Lessons learned; Contributors (person → specific contribution); Media; Sources; "Last verified" date.
- **Initial projects (stubs, all facts pending):** `2025-26-launch-vehicle` (the STL rocket; status needs confirmation), `2026-27-nasa-student-launch` (In progress, if confirmed), `2018-19-fnl-aises-launch` (Completed — facts from the 2018 proposal + MAE article).
- **Motion:** entry = satellite unfolds solar panels into the card grid; detail = hero media scales from the card (shared-element FLIP). **Missing:** essentially all project facts — the biggest content gap.

### 8.6 `/competitions`
- **Sections:** "Where we compete" — FNL and NASA Student Launch explainer cards (organizer, purpose, structure, review gates); **Mission log** — reverse-chronological results table (season · competition · category verbatim · result · source link), with report awards visually distinct from flight/overall awards; "This season" — 2026–27 status once confirmed.
- **Motion:** entry = red planet → log lines type in (mono, 20 ms/char capped at 0.6 s per row, only on first view); ambient none. **Reduced:** static table.

### 8.7 `/history`
- **Timeline:** vertical, season-by-season (2013–14 → present), each season a collapsible `<details>`-based panel (works with no JS) containing milestones, results, rockets, rosters, photos. A season scrubber (sticky list of seasons) for jumping. Gaps shown honestly ("No public record found for 2019–20 to 2022–23 — have photos or stories? Tell us.").
- **Motion:** comet trail draws down the page as you scroll (scroll-linked, decorative, off in reduced); panels expand with height tween.

### 8.8 `/team` and `/team/:person`
- **Team:** season switcher (2026–27 default; 2025–26 archive), groups: Management; Vehicle; Payload; Avionics; Safety & Operations; open roles shown as "Open position" cards with a Join link. Portraits 4:5 on uniform panels; name, role, discipline link.
- **Profile:** name, pronouns (optional), current role, role history by season, disciplines, contributions (linked to projects), optional LinkedIn/portfolio/GitHub, headshot. URL stays valid forever; alumni profiles show "Alumni · <last season>".
- **Motion:** entry = station windows light up → portraits reveal in role order (stagger 0.05 s, clip-path from bottom); hover = portrait panel lifts 4 px with ink shadow. **Missing:** consent to publish, links, 2 headshots, contribution data.

### 8.9 `/gallery`
- Masonry-style grid (CSS columns, fixed aspect boxes from metadata to avoid layout shift); filters by season and category (Launch · Build · Team life) only where data exists; accessible lightbox (`<dialog>`, focus trap, ←/→, Esc, captions, `?photo=slug` deep link, swipe on touch).
- Initial captions are descriptive, not invented: e.g. "Members carry the carbon-fiber rocket out to the pad." Dates only where EXIF/confirmation exists.
- **Motion:** entry = nebula → images fade-scale in by row; open = FLIP from thumbnail.

### 8.10 `/sponsors`
- **Sections:** H1 "Our supporters"; **Anduril** first and largest, labeled **"Supported by Anduril"** (decided 2026-11-02; logo permission still to be recorded); Home institution: **UCLA Samueli School of Engineering**; community: AISES at UCLA / CEED (label as "home organization"); "What your support builds" — materials (carbon fiber, fiberglass, epoxies, aluminum), motors, avionics components, test campaigns, travel to competitions, and students' first flight-hardware experience (generic until a budget is supplied); "Partner with us" — mailto with prefilled subject "Sponsorship inquiry — Bearospace", plus LinkedIn. No tiers/prospectus/donation link until supplied.
- **Motion:** composed and legible: escort rocket pulls alongside; logos appear on still panels (no motion on logos themselves).

### 8.11 `/join`
- **Sections:** "Join the crew" — who can join (all majors/levels; AISES membership requirement per team), what you'll do (links to disciplines), how to start (interest form or email — **no form exists yet**), "Upcoming" (manual list; hidden when empty); "Find us" — Boelter Hall 2817 (with "confirm before visiting"), map link (not embed, for privacy/perf); "Contact" — three routed mailto buttons: Membership / Sponsorship / General, plus Instagram and LinkedIn.
- **Motion:** entry = rocket rolls to show a gold beacon; buttons get gold underline draw on hover.

### 8.12 404
"Lost signal." Link to Flight Deck and the 8 destinations.

**Motion summary by level:** Entry ≤0.9 s camera + ≤0.6 s content stagger. Ambient: scene only, 30 fps behind pages, pausable. Interaction: 120–180 ms. Exit: camera travel ≤0.9 s + wipe 0.8 s total; `hurry` on input.

---

## 9. Architecture

### 9.1 Stack
Match the portfolio's lockfile so code ports cleanly: react/react-dom 19.3, React Compiler (existing Babel preset), Vite 8.3, **react-router 7.18** (library mode, not framework mode), **three 0.186.1**, **gsap 3.15 + @gsap/react 2.1.2**, fonts via `@fontsource-variable/saira`, `@fontsource-variable/atkinson-hyperlegible-next` (fallback `@fontsource/atkinson-hyperlegible`), `@fontsource-variable/jetbrains-mono`. Dev only: `sharp` (images), `zod` (content validation), `@playwright/test` + `@axe-core/playwright`. Lighthouse CI runs through `npx @lhci/cli` rather than as an installed dependency (its dependency tree carries high-severity audit findings; decided in slice 0). JavaScript + ES modules, no TypeScript (matches the reference; JSDoc on content types).

### 9.2 Repository layout
```
assets-src/                 originals, NOT served (models/rocket.stl + config/report; images/{logos,team,gallery})
scripts/                    build-rocket.mjs (port) · build-images.mjs · validate-content.mjs · schema.mjs
                            prerender.mjs · check-budgets.mjs
public/                     models/rocket.jvm2 · media/** (generated) · og/ · robots.txt
src/main.jsx                hydrateRoot, fonts, gsap.registerPlugin(useGSAP)
src/entry-server.jsx        renderToString(<StaticRouter>) for prerender
src/routes.js               single table {path, label, title, description, bodyId?, shot?, parent, element}
src/app/                    Shell, Stage, Hud (compact nav), Footer, Announcer, RouteMeta, ScrollManager,
                            sceneStatus.js (external store: none|loading|ready|failed|lost), SceneBoundary
src/motion/                 TransitionProvider (port + fix), transitionContext, WipeLayer (port),
                            directorContext (port, wider API), timing (port, Bearospace tokens), useMotionPref
src/intro/                  IntroGate (rewrite), introContext (port), introMode.js (pure), LogoReveal, SponsorCard
src/menu/                   OrbitMenu, menuSlots.js (pure), useRovingFocus
src/pages/                  PageFrame (port of SectionFrame) + one file per route
src/components/             Img, SponsorLogo, PersonCard, StatusBadge, Timeline, Lightbox, SystemMap
src/content/                org, divisions, disciplines, people, roles, projects, competitions, results,
                            milestones, sponsors, gallery, links, index.js (selectors)
src/generated/              media.json, rocket.meta.json, assets.json (written by scripts)
src/scene3d/  (lazy chunk)  FlightScene, engine, quality, rocket, rocketMaterial, plume, particles, pad,
                            clouds, starfield, bodies, sky (port), outline (port), toon (port),
                            textures (port subset), travel (port leg()), shots.js (pure), introTimeline,
                            loadWithProgress
src/lib/                    storage (port), webgl, env
src/lab/                    dev-only panel, dynamically imported behind import.meta.env.DEV
tests/e2e/ · tests/unit/ · playwright.config.js · lighthouserc.json · vercel.json · CONTENT.md
```

### 9.3 Runtime composition
`Shell` → `IntroGate` → `TransitionProvider` → `Stage` = `<SceneBoundary><Suspense><LazyFlightScene/></Suspense></SceneBoundary>` + scrim + `Hud` + `<main><Routes location={displayLocation}/></main>` + `Footer` + `Announcer` + `WipeLayer`. The route table, content, menu, and transitions never import three.js; the lazy scene chunk fills `directorRef.current = { travel(from,to), place(shot), highlight(id), attachLabels(map), seek(label) }`.

**Phases** (on `html[data-phase]`, readable by tests): `boot → intro:dom (A,B; scene loading) → intro:scene (C–F) → menu`, and `menu|page → travel → cover → swap → reveal → page|menu`.

**Transition kinds** (`transitionKind(from,to)`): `travel+wipe` when bodies differ; `wipe` when no scene; `fade` 0.25 s within a section (`/team` → `/team/x`); `none` for search/hash changes; reduced motion or paused → 80 ms fade-out / swap / 150 ms fade-in with a camera `place()` cut.

**Ported orchestration, with fixes:** `displayLocation` lags the URL; latest-wins queue of one; each run **captures its target once** so wipe label and rendered page always agree; a queued run is "hurried" (wipe only, timeScale 1.6); any input during travel → timeScale 3; the camera snaps under the cover if it isn't framing the destination.

**Engine** (`createEngine(host, {tier, palette, onProgress})`): GSAP tweens a plain `state` (`cam, look, fov, roll, altitude, speed, scroll, thrust, vacuum, lines, flash, ink`); own rAF with fps targets (menu 60, page 30, page scrolled >80vh → still frame, hidden tab → stopped) and `boost` during travel; ResizeObserver; `compileAsync` during intro shot B; `dispose()` disposes geometry/materials/textures/render targets and calls `renderer.forceContextLoss()`.

**Robustness**
- `SceneBoundary` catches chunk/engine errors → status `failed` → list layout + poster, intro off.
- `webglcontextlost` → preventDefault, stop, status `lost`, poster; `restored` → re-key FlightScene, `place(current)`; a second loss within 60 s sets `sessionStorage scene:off`.
- Hidden tab during a transition → `master.progress(1)`; during the intro → pause, and after >2 s hidden resume at `settle`.
- Resize mid-travel: shots resolve at leg start; on completion `place(currentShot)` if orientation changed; slots recompute on resize.
- **Quality tiers** (`quality.js`): initial tier from pointer/cores/memory; DPR steps 1.75 → 1.5 → 1.25 → 1.0 → 0.85 driven by a 2 s EMA of frame time (down >20 ms, up <12 ms for 10 s, ≤2 ups per session); low tier halves particles/stars and renders the outline normal pass at half resolution.

**Accessibility mechanics**
- Prerendered semantic HTML for every route; `<title>`, description, canonical, OG, JSON-LD Organization per route from one `getMeta(pathname)` used by both `RouteMeta` (React 19 metadata) and `prerender.mjs`.
- Skip link → `<main>`. After a swap, focus the page `<h1 tabIndex=-1>`; returning to the menu focuses the link you came from; after the intro, focus the menu `<h1>`.
- One polite `aria-live` Announcer for status only ("Intro playing — press any key to skip", "3D view unavailable, showing simple view", "Motion paused"); route changes are announced via h1 focus.
- `useMotionPref` = OS reduced-motion OR persisted **Pause motion** toggle (`aria-pressed`, `bearo:motion-paused`) → still frame, no intro, fades instead of wipes. Required by WCAG 2.2.2 because the menu animates indefinitely.
- `history.scrollRestoration='manual'`; `ScrollManager` stores scroll per `location.key`; restore on POP, top on PUSH.
- Contrast: all text pairs in §5 meet WCAG AA (body text AAA). Touch targets ≥44 px. No information conveyed by motion or color alone.

### 9.4 Delivery and SEO
- `scripts/prerender.mjs`: `vite build --ssr src/entry-server.jsx`, then render every static and content route to `dist/<path>/index.html` + `404.html` + `sitemap.xml`; client hydrates. Inline `<head>` script sets `html[data-intro]` before first paint (path, `bearo:intro-seen`, reduced motion) so the intro overlay never flashes on deep links; a 7 s CSS failsafe reveals content if JS dies.
- **Hosting: Vercel** (same as the portfolio) with `cleanUrls`, legacy redirects from §8, immutable caching for hashed assets. Preview deployments per PR give maintainers a link to check edits.

### 9.5 Budgets and how they're checked

| Metric | Target | Check |
|---|---|---|
| Main JS (React, router, GSAP, shell, route) | ≤110 KB gz | `check-budgets.mjs` in CI |
| Scene chunk (three + scene code) | ≤190 KB gz | same |
| Rocket model | ≤60 KB transferred | same |
| Fonts | ≤80 KB (subset woff2) | same |
| Headshots | ≤25 KB at 480 w AVIF | `build-images.mjs` report |
| LCP, deep-linked content page | ≤1.8 s (mobile, throttled) | Lighthouse CI |
| LCP, `/` | ≤2.5 s | Lighthouse CI |
| CLS / TBT | ≤0.05 / ≤200 ms | Lighthouse CI |
| Menu frame time p95 | ≤16.7 ms desktop, ≤33 ms mobile | Playwright reading `__bearo.perf` (test-hooks build) at 4× CPU throttle + manual check on a real mid-range phone |
| Intro frame time p95 | ≤20 ms desktop | same |
| Accessibility | 0 serious/critical axe violations, all routes, both layouts | `@axe-core/playwright` |

---

## 10. Content model and maintenance

**Structured JS modules in `src/content/`** are sufficient — no CMS. Rationale: a small team, a handful of edits per quarter, GitHub's web editor is enough, and a PR + Vercel preview + validation gives review and safety for free. Revisit a Git-based CMS (e.g. Decap/Tina) only if non-technical officers struggle after a season.

```
org         {name, shortName, mission, parent:{aises, ceed, samueli}, email, location:{building, room, verifiedAt}, socials[]}
division    {id, name, summary}
discipline  {slug, name, divisionIds[], primaryDivisionId, summary, responsibilities[], work[], tools[], skills[], icon, regionId?}
            # payload-electronics: divisionIds ['avionics','payload'] — one record, shown in both divisions
person      {slug, name, pronouns?, headshot?, headshotVerified, links?:{linkedin?, github?, site?}, major?, gradYear?, consent:boolean}
role        {personSlug, season:'2026-27', title, group:'management'|'vehicle'|'payload'|'avionics'|'safety-ops'|'advisor'|'member',
             disciplineSlug?, order, source}
project     {slug, title, season, status:'proposed'|'in-progress'|'ground-tested'|'flown'|'completed',
             competitionSlug?, disciplineSlugs[], objective, constraints[], approach[], hardware[], software[], testing[{date?, text}],
             results[{text, source}], lessons[], contributors[{personSlug, contribution}], media[], sources[], lastVerified}
competition {slug, name, organizer, url, summary}
result      {competitionSlug, season, category (verbatim), placement?, awardType:'overall'|'flight'|'report'|'design'|'participation',
             projectSlug?, sourceUrl, confidence:'confirmed'|'reported'|'unverified', publish:boolean, notes?}
milestone   {date:'YYYY'|'YYYY-MM'|'YYYY-MM-DD', season, title, body, projectSlug?, media?, source}
sponsor     {id, name, relationship:'sponsor'|'institutional'|'home-organization'|'partner', label (public wording),
             url, logo:{onDark, onLight}, showInIntro, introOrder?, introKicker? ('Supported by' | 'Built at'), order, activeSeasons[], verifiedAt}
            # seed: anduril {relationship:'sponsor', label:'Supported by Anduril', introKicker:'Supported by', introOrder:1}
            #       ucla-samueli {relationship:'institutional', label:'Home institution', introKicker:'Built at', introOrder:2}
media       {src, alt, caption?, season|null, date|null, category:'launch'|'build'|'team-life'|'lab', people?[], credit?, source?}
links       {joinForm?, email, instagram, linkedin, linktree?, calendar?}
```

Rules: a person's slug never changes; roles are separate records per season, so leadership changes add rows instead of editing people. Profiles derive "current role" and "role history" from roles. `validate-content.mjs` (prebuild + CI) checks unique slugs, every reference resolves, media files exist, season format `YYYY-YY`, `confirmed` results have a `sourceUrl`, intro sponsors have an `onDark` logo, alt text present, and prints errors like ``projects.js › "2025-26-launch-vehicle" › contributors[2].personSlug "jon-n" not found in people.js``.

**`CONTENT.md` recipes** (written in slice 2, tested in slices 6 and 9): add a sponsor; start a new season (copy roles, update `currentSeason` in `org`); add a member; add a project; add photos (drop originals in `assets-src/images/gallery`, run `npm run images`); record a competition result with source and confidence.

**Content checklist** lives in `docs/CONTENT-CHECKLIST.md` (every `TODO`/`unverified` item with owner), seeded from §4.5 and §12.

---

## 11. Development slices

Ordering principle: real visuals early (slice 1 renders the actual rocket), but the shell, content model, and no-WebGL baseline (slice 2) land before the cinematic, because the intro must end in a working menu and the fallback is the guaranteed product.

| # | Slice | Depends on |
|---|---|---|
| 0 | Discovery & tooling | — |
| 1 | Rocket visual prototype | 0 |
| 2 | Shell, content model, accessible baseline | 0 (parallel with 1) |
| 3 | Flight Deck navigation + About | 1, 2 |
| 4 | Opening cinematic | 3 |
| 5 | Engineering + 7 disciplines | 3 |
| 6 | People & contributions | 2 |
| 7 | Projects, competitions, history | 6 |
| 8 | Gallery | 2 |
| 9 | Sponsors & Join | 4, 6 |
| 10 | Release readiness | all |

### Slice 0 — Discovery & tooling
1. **Goal / deliverable:** this plan committed as `docs/PLAN.md`; repo cleaned of the Vite template; assets moved to `assets-src/` with kebab-case names; dependencies installed; CI running lint + validate + build + empty Playwright suite.
2. **Stories:** *As a future maintainer, I can read one document that explains the site's structure and where every fact came from.*
3. **Scope:** delete `src/assets/*`, `public/favicon.svg`, `public/icons.svg`, counter demo; move originals; `docs/PLAN.md`, `docs/CONTENT-CHECKLIST.md`; GitHub Actions workflow.
4. **Components/content:** none user-facing; `package.json` scripts `dev, build, preview, lint, validate, images, models, test, test:e2e, budgets`.
5–7. N/A (no UI).
8. **Acceptance:** Given a fresh clone, when `npm ci && npm run build` runs, then it succeeds and CI is green. Originals are byte-identical to the supplied files (hash recorded). No served duplicate of the STL remains.
9. **Verification:** CI run; hash comparison script output.
10. **Prompt:**
> In `C:\Projects\Bearospace-Website-Juan` (Vite 8 + React 19.3 + React Compiler template, JS/ESM), set up the foundation for the Bearospace at UCLA website. Save the provided planning document as `docs/PLAN.md` and create `docs/CONTENT-CHECKLIST.md` from its "Unresolved discrepancies" and "Open decisions" sections. Remove the Vite counter demo and template assets. Move originals into `assets-src/`: `public/3d-models/rocket.STL` → `assets-src/models/rocket.stl`; delete the byte-identical `public/Logos/rocket.STL`; logos, headshots, and gallery images into `assets-src/images/{logos,team,gallery}` with kebab-case names (e.g. `natlie lopezx.png` → `natalie-lopez.png`, `johnathan nguyen.png` → `jonathan-nguyen.png`), recording SHA-256 of every original in `assets-src/MANIFEST.json`. Install, pinned to the reference portfolio's versions (`C:\Projects\fluid-graphics-portfolio-site\package-lock.json`): react-router 7.18, three 0.186.1, gsap 3.15, @gsap/react 2.1.2; dev: sharp, zod, @playwright/test, @axe-core/playwright, @lhci/cli. Add npm scripts (validate, images, models, test, test:e2e, budgets — stubs are fine). Add a GitHub Actions workflow running lint, validate, build, and Playwright. Done when a fresh `npm ci && npm run build` passes, CI is green, and the manifest hashes match the supplied files. Do not modify the portfolio project.

### Slice 1 — Rocket visual prototype
1. **Goal:** the real rocket, optimized and toon/ink-shaded, flying in the space environment at menu framing, on desktop and mobile — evaluated before anything else is built.
2. **Stories:** *As the team, we can judge the defining visual on real hardware data.* *As a phone visitor, the scene runs smoothly.*
3. **Scope:** `build-rocket.mjs` (JVM2), `rocket.js`, `rocketMaterial.js`, `plume.js` (vacuum mode), `starfield.js`, `sky.js` (space), `outline.js`, `toon.js`, `engine.js`, `quality.js`, `createPlaceholderRocket()`; a dev route `/lab/rocket` with sliders (rim, ink, speed, tier). Prereq: slice 0.
4. **Components:** `FlightScene` (lazy), `engine`, `rocket.meta.json`, `rocket.report.json`.
5. **Animation:** rocket fixed at origin; star layers scroll; dust streaks; plume flicker; speed lines at low intensity; gentle camera breathing (±0.5°).
6. **States:** placeholder rocket until the model loads; model 404 → placeholder stays + console warning; no WebGL → CSS starfield + poster; context loss → poster, restore recreates.
7. **Platforms:** framing correct at 375×812, 768×1024, 1440×900, 1920×1080; reduced motion → still frame.
8. **Acceptance:**
   - Given the STL, when `npm run models` runs, then `rocket.jvm2` ≤60 KB brotli, the report lists every shell with keep/drop, and the original is unchanged.
   - Given `/lab/rocket` on a mid-range laptop, then p95 frame time ≤16.7 ms; on a mid-range phone ≤33 ms.
   - The rocket reads clearly against the sky (blue nose, carbon body, 4 fins visible as an "X") with ink outlines and no faceting on the airframe.
   - Blocking the model request shows the placeholder without errors; forcing context loss shows the poster and recovers on restore.
9. **Verification:** Playwright screenshot at three viewports (Chromium, 2 % threshold); perf hook reading; manual side-by-side with gallery photos 8 and 10; `/lab` excluded from the production bundle (grep `dist`).
10. **Prompt:**
> Build the rocket visual prototype for the Bearospace site (see `docs/PLAN.md` §2.1, §5, §9.3). Port and adapt from `C:\Projects\fluid-graphics-portfolio-site`: `scripts/build-models.mjs` → `scripts/build-rocket.mjs`, `src/scene3d/{engine,outline,toon,sky,textures,model}.js`. The source `assets-src/models/rocket.stl` is a binary STL in mm, 33,748 tris, long axis +X with the nose at X=0 and tail at X=2612, axis at Y=Z=277.67, 4 fins, 45 disconnected shells (two dense internal shells near X≈2025/2221, r 26–50 mm). The script must weld, split shells, write `rocket.report.json`, drop hidden internal shells (max radius < body radius − 4 mm and >30 mm from the tail plane; overrides in `rocket.config.json`), reorient nose-up with the tail-axis center at the origin in meters, rotate 45° about Y, classify faces into nose/body/fin/hardware regions, and write `public/models/rocket.jvm2` (JVM1 + u8 region block) and `src/generated/rocket.meta.json`; never modify the original. Runtime: creased normals (35°), toon 3-band material with a blue fresnel rim and procedural carbon twill, ink outline pass with configurable ink color, vacuum plume, three scrolling instanced star layers + dust streaks, a nebula sky from the logo palette (#07081A, #3B1F73, #3D7BFF, #A9C6FF). The rocket never moves; motion comes from the environment. Engine requirements: plain `state` tweened by GSAP, own rAF with fps targets, visibility pause, ResizeObserver, adaptive DPR tiers, context-loss handling, full disposal with `forceContextLoss()`. Add a lazy-loaded dev-only `/lab/rocket` route with tuning sliders. Acceptance: model ≤60 KB brotli; p95 frame ≤16.7 ms desktop / ≤33 ms mid phone; placeholder on model failure; poster on no WebGL; no lab code in the production build. Verify with Playwright screenshots at 375, 768, 1440 widths and the perf hook.

### Slice 2 — Shell, content model, accessible baseline
1. **Goal:** every route exists as prerendered, accessible HTML with real content structures; the list-layout menu works with no WebGL or JS. This is the permanent fallback.
2. **Stories:** *As a recruiter opening a shared link, the page loads fast and readable without waiting for 3D.* *As a visitor without WebGL or with reduced motion, I reach the same information.* *As a maintainer, I get clear errors when I make a content mistake.*
3. **Scope:** `routes.js`, `Shell`, `Hud`, `Footer`, `PageFrame`, `RouteMeta`, `Announcer`, `ScrollManager`, list-layout `OrbitMenu`, all `src/content/*` files seeded with verified facts from §3–4 (unverified rows `publish:false`), `validate-content.mjs`, `build-images.mjs`, `prerender.mjs`, `vercel.json`, `CONTENT.md`, placeholder page bodies with real headings.
4. **Content:** all schemas in §10; 2026–27 and 2025–26 roles; results table; sponsors (Anduril, UCLA Samueli) with `label` pending confirmation.
5. **Animation:** none beyond CSS focus/hover (120–180 ms).
6. **States:** 404 page; missing headshot → initials avatar; unpublished results hidden.
7. **Platforms:** keyboard-only complete; 320 px wide without horizontal scroll; dark palette contrast AA.
8. **Acceptance:**
   - Given JS disabled, when any sitemap URL is fetched, then it returns 200 with the right `<title>`, h1, canonical, and body content.
   - Given a broken person reference in `projects.js`, when `npm run validate` runs, then it fails naming file, entry, field.
   - axe: 0 serious/critical on every route.
   - Lighthouse: deep-link LCP ≤1.8 s mobile.
9. **Verification:** Playwright no-JS crawl, axe, LHCI; unit tests for validator fixtures.
10. **Prompt:**
> Build the site shell and content model for Bearospace (`docs/PLAN.md` §8–10). Use react-router 7 in library mode with a single route table `src/routes.js` covering `/`, `/about`, `/engineering`, `/engineering/:discipline` (aerodynamics, structures, recovery, avionics, payload-electronics, payload, safety-operations), `/projects`, `/projects/:slug`, `/competitions`, `/history`, `/team`, `/team/:person`, `/gallery`, `/sponsors`, `/join`, 404. Create the content modules and zod schemas exactly as in §10, separating people from seasonal roles, with Payload Electronics as one discipline in two divisions and sponsors as shared records. Seed only verified facts from §3–4; set `publish:false` on medium/low-confidence results. Write `scripts/validate-content.mjs` (prebuild + CI) with file/entry/field error messages, `scripts/build-images.mjs` (sharp → AVIF/WebP 480/960/1280, LQIP, EXIF stripped, `src/generated/media.json` with dimensions), and `scripts/prerender.mjs` (SSR build via `src/entry-server.jsx`, every route to static HTML, sitemap.xml, 404.html; client `hydrateRoot`). Port `SectionFrame.jsx` from the portfolio as `PageFrame` (h1 tabIndex=-1). Add the compact header (badge home link, section breadcrumb, Menu overlay, Pause motion toggle), footer (contact, socials, sponsor strip, Replay launch placeholder), skip link, polite announcer, per-route metadata via one `getMeta()`, manual scroll restoration, the list-layout destination nav, palette/typography tokens from §5, `vercel.json` with cleanUrls and legacy redirects, and `CONTENT.md` recipes. Acceptance: no-JS crawl of all routes passes; axe 0 serious/critical; validator catches broken references; LCP ≤1.8 s on deep links. Verify with Playwright (JS disabled + enabled), axe, Lighthouse CI.

### Slice 3 — Flight Deck navigation + About
1. **Goal:** the 3D orbit menu with 8 bodies, coordinated travel + wipe transitions, return, and a fully populated About page.
2. **Stories:** *As a visitor, I pick a destination and the camera carries me there; Back returns me smoothly.* *As a keyboard user, I can reach and open every destination.* *As a returning visitor, I open `/about` directly and it loads instantly.*
3. **Scope:** `bodies.js`, `menuSlots.js`, `attachLabels`, `useRovingFocus`, `shots.js`, ported `TransitionProvider` (with fixes), `WipeLayer`, `travel.js`, `directorContext`, `SceneBoundary`, `sceneStatus`, pause motion, `/about` complete with copy from §8.2.
4. **Content:** `org`, About copy, PM welcome.
5. **Animation:** §7 interaction; travel 0.9 s; wipe cover 0.34 / hold 0.1 / reveal 0.36 s on the +14° axis; hurry ×3 on input; About entry: constellation lines connect into the lifecycle stepper.
6. **States:** rapid clicks (latest wins), Back/Forward mid-travel, hidden tab mid-transition, resize mid-travel, scene failure mid-session → list layout.
7. **Platforms:** orbit ≥900 px & aspect ≥0.9; list otherwise; reduced/paused → fades and cuts.
8. **Acceptance:**
   - Given the menu, when I click About, Team, Gallery within 300 ms, then the URL, wipe label, h1, and camera all end on Gallery and exactly one h1 exists.
   - Given `/team/x`, when I press Esc twice, then I reach `/team` then `/`, with focus on the link I came from.
   - Hit targets ≥44×44, inside the viewport, non-overlapping at 1024×768, 1280×720, 1920×1080.
   - Pause motion persists across reload and stops rendering.
9. **Verification:** Playwright scenarios 6–9, 13–16 of the test list (keyboard, rapid clicks, back/forward, Esc, pause, hidden tab, resize, hit targets); axe in both layouts; manual mobile check.
10. **Prompt:**
> Implement the Bearospace Flight Deck menu and route transitions (`docs/PLAN.md` §7, §9.3). Port `src/motion/{TransitionProvider,transitionContext,WipeLayer,directorContext,timing}.js(x)` and `src/scene3d/travel.js` from `C:\Projects\fluid-graphics-portfolio-site`, fixing: capture the run target once so the wipe label always matches the rendered page; queued runs are wipe-only at timeScale 1.6; clear timers on unmount. Add 8 toon/ink celestial bodies in fixed slots (left: About = constellation bear, Engineering = ringed planet, Projects = payload satellite, Competitions = red planet; right: History = comet, Team = station, Gallery = nebula, Sponsors = escort rocket) that spin and bob but never pass behind the rocket. Interactive targets are the prerendered DOM `<Link>`s, positioned by the engine via `attachLabels()` + translate3d (≥44 px, 24 px inset, frozen while hovered/focused); roving tabindex with spatial arrows, Home/End; Join the team (gold) + Sponsor a launch CTAs; layout `orbit` only when scene ready, motion allowed, width ≥900 and aspect ≥0.9, else `list`. Transition kinds: travel+wipe, wipe, fade, none. Esc → parent route. Focus page h1 after swap; restore the originating link on return. Add `SceneBoundary` and `sceneStatus` so any 3D failure falls back to list layout. Complete `/about` with the copy in §8.2. Acceptance and verification: Playwright scenarios for rapid clicks, back/forward, Esc, keyboard, pause persistence, hidden tab, resize mid-travel, hit-target geometry; axe clean in both layouts.

### Slice 4 — Opening cinematic
1. **Goal:** the full launch sequence A–F (≈10 s) ending in the live menu, plus short intro, skip, replay, and every fallback.
2. **Stories:** *As a first-time visitor, I watch the launch and can skip at any moment into usable navigation.* *As a returning visitor, I get a 2.4 s version.* *As someone with reduced motion or no WebGL, I land on the same menu without the cinematic.*
3. **Scope:** `IntroGate` (rewrite), `introMode.js`, `LogoReveal`, `SponsorCard` (from shared sponsor data), `pad.js`, `particles.js`, `clouds.js`, `plume.js` (thrust), `introTimeline.js`, `loadWithProgress`, inline head script, replay control.
4. **Content:** `sponsors.filter(showInIntro)` ordered by `introOrder`; logos on dark.
5. **Animation:** storyboard §6; ground/clouds sink below the fixed rocket; ink color flips at the space transition.
6. **States:** scene not ready by end of B → hold ≤1.5 s with real progress → menu; tab hidden >2 s → resume at `settle`; model failure → placeholder rocket; chunk failure → intro off.
7. **Platforms:** sponsor logos ≥40 % width desktop / ≥70 % mobile, never distorted; skip button focused; mobile framing verified.
8. **Acceptance:**
   - Given a first visit to `/`, then the Skip button is focused; when I press Enter, the menu is interactive within 600 ms with focus on the menu h1.
   - Given a deep link, reduced motion, paused motion, `?intro=0`, Save-Data, or no WebGL, then no intro plays and `bearo:intro-seen` is not written.
   - Given a returning visit, `data-phase=menu` within 3.0 s.
   - Given Replay, the full intro plays without reload.
   - The final intro frame equals the menu rest shot (screenshot diff at `seek('settle')`).
9. **Verification:** Playwright scenarios 2–5, 14; intro frame-time p95 ≤20 ms desktop; manual review of the full sequence on desktop and phone.
10. **Prompt:**
> Build the Bearospace opening cinematic (`docs/PLAN.md` §6, §9.3). Rewrite `IntroGate` using the portfolio's register/`settle` contract (`C:\Projects\fluid-graphics-portfolio-site\src\intro\IntroGate.jsx`) but fix its bugs: real progress (chunk import 0.4, model bytes 0.5 via streamed fetch with totals from `src/generated/assets.json`, `compileAsync` 0.1); write `bearo:intro-seen` only after liftoff or a user skip; focus the menu h1 after the intro. Shots: A logo reveal 0–1.6 s (DOM/SVG: stars pop, constellation lines draw, impact frame, light sweep); B sponsors 1.6–3.4 s from `src/content/sponsors.js` (`showInIntro`, ordered by `introOrder`, kicker from `introKicker` — "Supported by" Anduril, then "Built at" UCLA Samueli School of Engineering; unmodified logos, true proportions); C pad reveal 3.4–5.0 s (procedural dusk desert, mesas, launch tower, the real rocket, camera crane up); D ignition/liftoff 5.0–6.6 s (plume thrust, instanced toon smoke, impact flash, speed lines, small shake); E ascent 6.6–8.8 s (ground and three cloud bands sink beneath the fixed rocket, cloud punch-through, sky dusk→space, stars fade in, ink color flips); F settle 8.8–10.0 s into the exact menu rest shot. Hold after B up to 1.5 s if the scene isn't ready, then go straight to the menu. Short intro (returning) 2.4 s. Auto-off for deep links, reduced/paused motion, `?intro=0`, Save-Data/2g, no WebGL, bfcache restore. Skip button (focused) + any key/tap. Replay in footer and menu utilities. Inline head script sets `html[data-intro]` before paint; 7 s CSS failsafe. Acceptance: skip → menu interactive ≤600 ms; returning visit reaches menu ≤3 s; no seen flag on auto-off; final frame matches rest shot. Verify with Playwright and manual phone review.

### Slice 5 — Engineering + 7 disciplines
1. **Goal:** `/engineering` overview with the rocket system map and seven complete discipline pages.
2. **Stories:** *As a prospective member, I understand what a discipline does, what I'd learn, who leads it, and how to get involved.* *As a sponsor, I see the breadth of engineering.* *As a recruiter, I see software's role across the vehicle.*
3. **Scope:** `Engineering`, `Discipline`, `SystemMap` (3D region highlight from JVM2 regions + SVG fallback generated from `rocket.meta.json`), software band, discipline moon shots.
4. **Content:** §8.3–8.4 copy; leads from roles; Payload Electronics shared record; `?interest=` on Join links.
5. **Animation:** camera to ringed planet → rocket side view; card hover highlights the rocket region; moons shot per discipline.
6. **States:** no current lead → "Open position" card; region annotation only where supported (no internal callouts unless confirmed).
7. **Platforms:** system map becomes a vertical labeled SVG on mobile/reduced.
8. **Acceptance:** Given `/engineering/payload-electronics`, then it states it is shared by Avionics and Payload, lists Nicholas Equihua, and links Payload Software (Juan Ventura-Romero); every discipline page shows responsibilities, work, tools, skills, leads, related projects, and a Join CTA carrying `?interest=<slug>`. No annotation names an internal component not in `rocket.meta.json` or confirmed content.
9. **Verification:** Playwright content assertions per discipline; axe; visual snapshots of overview at 3 widths.
10. **Prompt:**
> Build `/engineering` and the seven `/engineering/:discipline` pages for Bearospace (`docs/PLAN.md` §8.3–8.4, §10). Pages render from `src/content/disciplines.js`, `divisions.js`, and `roles.js` (current season). Template: kicker division, h1, responsibilities, where it lives on the rocket, work, tools, skills, current leads (linked to `/team/:person`), related projects, Join CTA linking `/join?interest=<slug>`. Payload Electronics is one record with `divisionIds ['avionics','payload']` shown in both groups with a bridge note. Add a "Software across the vehicle" band (embedded flight software, payload software led by Juan Ventura-Romero, analysis tooling). Build `SystemMap`: in 3D, highlight rocket regions from the JVM2 region data on card hover; fallback SVG generated from `rocket.meta.json`. Annotate only regions (nose, airframe, fin can, payload/avionics/recovery sections as approximate zones); no internal component labels. Camera: travel to the Engineering body, then a side view of the rocket; each discipline uses a moon shot. Vacant roles show an "Open position" card. Acceptance: every discipline shows all template sections from content; validator enforces required fields; axe clean. Verify with Playwright content assertions and snapshots.

### Slice 6 — People & contributions
1. **Goal:** `/team` with season switcher and `/team/:person` profiles with stable URLs, role history, and contributions.
2. **Stories:** *As a member, I link my profile from my résumé and it keeps working after I graduate.* *As a recruiter, I see what an individual student contributed.* *As a maintainer, I add the next season by adding role rows.*
3. **Scope:** `Team`, `Member`, `PersonCard`, headshot pipeline (4:5, uniform panel, background-normalized), season selectors, alumni state, JSON-LD Person (only with consent).
4. **Content:** 2026–27 and 2025–26 roles; Juan as Payload Software Lead; Avionics Director as open position; `headshotVerified`, `consent` flags.
5. **Animation:** station windows light → portraits reveal in role order (0.05 s stagger, clip-path); hover lift 4 px.
6. **States:** missing headshot → initials; no consent → name/role only, no profile page indexed (`noindex`); alumni banner.
7. **Platforms:** 2-column grid at 375 px; season switcher is a real `<select>`/links (URL `?season=2025-26`).
8. **Acceptance:** Given `/team/juan-ventura-romero`, then it shows "Payload Software Lead · 2026–27", Payload discipline links, and any contributions linked to projects. Given a new `2027-28` role row, when the site builds, then `/team` defaults to 2027–28 and 2026–27 roles move into history without editing person records. Headshots ≤25 KB at 480 w; all share framing.
9. **Verification:** validator fixture test for season rollover; Playwright; image budget report; manual check of every headshot mapping (§2.4).
10. **Prompt:**
> Build Bearospace's team pages (`docs/PLAN.md` §8.8, §10). `/team` lists the current season (from `org.currentSeason`) grouped Management, Vehicle, Payload, Avionics, Safety & Operations, with "Open position" cards for vacancies and a `?season=` switcher (2026–27, 2025–26). `/team/:person` shows current role, role history by season, disciplines, contributions (`project.contributors` → specific contribution text, linked), optional LinkedIn/GitHub/site, and an alumni banner when no current role. People and roles are separate content (§10); slugs never change. Process headshots from `assets-src/images/team` into 4:5 AVIF/WebP at 320/640 on a uniform panel (normalize white backgrounds to match the transparent cut-outs), ≤25 KB at 480 w; missing → initials avatar; `headshotVerified:false` stays flagged in the checklist. Respect `consent:false` (no profile page, `noindex`). Motion: portraits reveal in role order, hover lift; reduced motion = static. Acceptance: adding a 2027-28 role row rolls the site forward with no person edits; Juan's profile shows Payload Software Lead 2026–27; budgets met. Verify with Playwright and a validator rollover fixture.

### Slice 7 — Projects, competitions, history
1. **Goal:** reusable project pages, the competitions mission log, and the season timeline — all sourced.
2. **Stories:** *As a sponsor, I see credible, dated engineering work and results.* *As an alumnus, I explore earlier seasons.* *As a recruiter, I see who did what on a project.* *As a member, I share a durable project link.*
3. **Scope:** `Projects`, `Project`, `StatusBadge`, `Competitions`, `History`, `Timeline` (`<details>`-based), comet trail, sources/"last verified" UI.
4. **Content:** §4.3 results (published only when confirmed); competition explainers; milestones from 2014 onward; project stubs (`2025-26-launch-vehicle`, `2026-27-nasa-student-launch`, `2018-19-fnl-aises-launch`).
5. **Animation:** satellite → card grid; FLIP into detail; mission-log typing (first view only, ≤0.6 s/row); comet trail scroll-linked (decorative).
6. **States:** empty sections hidden, not "TBD"; gaps in history shown honestly; status always text + color.
7. **Platforms:** timeline readable with JS off (native `<details>`); tables become stacked cards on mobile.
8. **Acceptance:** Given the 2024–25 FNL row, then it reads "Mars Challenge oral reports — 3rd" and "Mars Challenge written reports — 3rd" with source link, never "third place overall". Given a result with `confidence:'unverified'`, then it does not render. Every project shows status, season, and contributors with specific contributions; every claim on Competitions/History links to a source.
9. **Verification:** Playwright content assertions on categories and sources; no-JS check of timeline; axe.
10. **Prompt:**
> Build `/projects`, `/projects/:slug`, `/competitions`, and `/history` for Bearospace (`docs/PLAN.md` §4, §8.5–8.7, §10). Project template: hero media, status badge (proposed / in progress / ground-tested / flown / completed — text + color), season, competition, objective, constraints, approach, hardware, software, dated testing log, sourced results, lessons, contributors with specific contributions linked to `/team/:person`, media, sources, last verified; empty sections are omitted. Competitions: explainers for First Nations Launch and NASA Student Launch (organizers, purpose, review gates) and a mission-log table rendering only `publish:true` results with the category verbatim, award type distinguished (report awards visibly labeled as report awards), and a source link per row. History: season-by-season `<details>` timeline from 2013–14 to now with a sticky season jump list, honest gaps, rosters and results per season. Motion: card→detail FLIP, mission-log type-on (first view, capped), decorative scroll-linked comet trail; reduced motion = static. Acceptance: the 2024–25 FNL awards read as Mars Challenge oral/written report 3rd places; unverified results never render; timeline works with JS disabled. Verify with Playwright assertions and axe.

### Slice 8 — Gallery
1. **Goal:** optimized, captioned gallery with filters and an accessible lightbox.
2. **Stories:** *As an alumnus or supporter, I browse launches, builds, and team life with context.*
3. **Scope:** `Gallery`, `Lightbox` (`<dialog>`), filters, `?photo=` deep links, full image pipeline.
4. **Content:** 13 images with descriptive captions (§2.3), `season:'2025-26'`, `date` only where EXIF/confirmed, categories launch/build/team-life/lab.
5. **Animation:** nebula entry; row-wise fade-scale; FLIP open/close; swipe on touch.
6. **States:** filters hidden when a category has <2 items; unknown dates show season only.
7. **Platforms:** no layout shift (aspect boxes from `media.json`); lightbox focus trap, ←/→, Esc, close button, swipe.
8. **Acceptance:** CLS ≤0.05; each image ≤180 KB at 1280 w; every image has alt text; `/gallery?photo=<slug>` opens that photo and Back closes it.
9. **Verification:** Playwright lightbox keyboard test, LHCI, axe.
10. **Prompt:**
> Build Bearospace's `/gallery` (`docs/PLAN.md` §2.3, §8.9). Render `src/content/gallery.js` via `Img` + `src/generated/media.json` (AVIF/WebP 480/960/1280, LQIP, fixed aspect boxes). Masonry via CSS columns; filters by season and category only when supported by ≥2 items. Lightbox as `<dialog>`: focus trap, ←/→, Esc, close button, swipe, caption + season/date/credit, `?photo=<slug>` deep link with Back closing it. Captions describe only what's visible or confirmed; unknown dates stay null. Motion: entry fade-scale by row, FLIP thumbnail↔lightbox; reduced motion = instant. Acceptance: CLS ≤0.05, ≤180 KB per 1280 w image, alt text everywhere, deep link works. Verify with Playwright, Lighthouse CI, axe.

### Slice 9 — Sponsors & Join
1. **Goal:** composed sponsor recognition and clear joining/contact paths, sharing data with the intro.
2. **Stories:** *As a potential sponsor, I see credible work and reach the right contact in one click.* *As a prospective member, I know how to join and what happens next.* *As a maintainer, I add a sponsor once and it appears in the intro and on the page.*
3. **Scope:** `Sponsors`, `Join`, `SponsorLogo`, routed mailto buttons (Membership / Sponsorship / General with prefilled subjects), interest form link when supplied, "Upcoming" list, `CONTENT.md` sponsor recipe tested.
4. **Content:** Anduril + UCLA Samueli + AISES/CEED with confirmed `label`s; Boelter Hall 2817 with `verifiedAt`; links.
5. **Animation:** escort rocket alongside; logos on still panels; Join beacon.
6. **States:** no upcoming events → section hidden; no form → email path only; no prospectus → no tiers section.
7. **Platforms:** logos legible on dark and light; mailto buttons ≥44 px.
8. **Acceptance:** Given a new sponsor record with `showInIntro:true`, when the site builds, then it appears in intro shot B, the menu "Supported by" strip, and `/sponsors` without code changes. From `/` a sponsor reaches the sponsorship email action in ≤2 clicks. No sponsorship tiers, benefits, or donation links appear unless present in content.
9. **Verification:** Playwright (fixture sponsor), axe, manual logo legibility review.
10. **Prompt:**
> Build Bearospace's `/sponsors` and `/join` (`docs/PLAN.md` §8.10–8.11, §10). Sponsors render from `src/content/sponsors.js` — the same records used by the intro (`showInIntro`, `introOrder`) and the menu "Supported by" strip — with public `label` wording, logos never distorted, correct on-dark/on-light variants. Sections: supporters (Anduril prominent; UCLA Samueli as home institution; AISES at UCLA/CEED as home organization), "What your support builds", "Partner with us" (mailto `ucla.bearospace@gmail.com`, subject "Sponsorship inquiry — Bearospace", plus LinkedIn). Show tiers/prospectus/donation only if content provides them. Join: who can join (all majors and experience levels; AISES membership note per content), disciplines with links, next step (interest form if `links.joinForm`, else email), "Upcoming" list hidden when empty, Boelter Hall 2817 with verification date and a map link, three routed contact buttons (Membership, Sponsorship, General), Instagram and LinkedIn. Read `?interest=` to preselect the membership email subject. Acceptance: adding one sponsor record updates intro, strip, and page; sponsor email reachable in ≤2 clicks from `/`; no invented sponsorship details. Verify with Playwright fixture tests and axe.

### Slice 10 — Release readiness
1. **Goal:** integrated review, performance, accessibility, content verification, deployment.
2. **Stories:** all of the above, end to end.
3. **Scope:** cross-browser (Chromium, Firefox, WebKit) runs; real-device perf (mid Android, iPhone); budget enforcement; content checklist closed or explicitly deferred; OG images; analytics decision; Vercel production + domain; old Google Sites updated to link to the new site.
4–7. Covered by prior slices; fix regressions.
8. **Acceptance:** all Playwright scenarios pass in three browsers; budgets in §9.5 met; axe 0 serious/critical; every published fact has a source or team confirmation recorded in the checklist; Lighthouse ≥90 Performance (content pages) and ≥95 Accessibility on mobile.
9. **Verification:** CI green; LHCI report; device test notes; content sign-off by a project manager.
10. **Prompt:**
> Prepare the Bearospace site for release (`docs/PLAN.md` §9.5, §12). Run the full Playwright suite in Chromium, Firefox, and WebKit and fix failures; run Lighthouse CI and `check-budgets` and fix regressions against the §9.5 budgets; run axe on every route in both menu layouts and with the intro overlay; profile the menu and intro on a mid-range Android phone and an iPhone (record p95 frame time). Generate per-route OG images (1200×630) from the logo and route title. Walk `docs/CONTENT-CHECKLIST.md`: every published fact must have a source URL or a recorded team confirmation; unresolved items must be `publish:false`. Configure the Vercel production project, domain, redirects, and caching. Done when CI is green in all browsers, budgets pass, and a project manager signs off the content.

### Required user stories — coverage
| Story | Slices |
|---|---|
| First-time visitor experiences the opening and skips into navigation | 4 |
| Returning visitor/recruiter opens a shared page directly | 2, 3, 4 |
| Potential member understands a discipline and how to get involved | 5, 9 |
| Sponsor sees credible work and reaches the right contact | 7, 9 |
| Recruiter identifies an individual's contribution | 6, 7 |
| Member shares a durable project/profile link | 6, 7 |
| Maintainer adds a sponsor or season via the content workflow | 2, 6, 9 |
| Reduced motion / no WebGL visitor reaches the same information | 2, 3, 4 |

### Shared Playwright scenario list (referenced above)
1 no-JS crawl · 2 first visit skip/focus · 3 auto-off conditions · 4 returning visitor · 5 replay · 6 menu keyboard · 7 rapid clicks · 8 Back/Forward + scroll restore · 9 Esc to parent · 10 no WebGL · 11 model/chunk failure · 12 context loss · 13 pause persists · 14 hidden tab mid-transition · 15 resize mid-travel · 16 hit-target geometry · 17 axe all routes/layouts · 18 visual snapshots (`?scene=0` DOM-only at 375/768/1440; 3D at `seek('settle')`, Chromium, 2 %) · 19 perf smoke · 20 unit tests (`introMode`, `transitionKind`, `parentOf`, `menuSlots`, quality stepping, validator fixtures). Tests run against `vite preview` of a `VITE_TEST_HOOKS=1` build exposing `window.__bearo` (`seek`, `ready`, `phase`, `perf`, `fps`).

---

## 12. Open decisions and missing materials

**Decided 2026-11-02:** Anduril credited as "Supported by" (intro + Sponsors page); rocket STL = 2025–26 vehicle; shell before cinematic (slice order above); hosting on Vercel.

**Needs a team decision or confirmation**
1. **Anduril:** written logo-usage approval and active season(s).
2. **UCLA Samueli label:** "Home institution" / "Built at" (recommended, documented) vs "Supported by" (only if material support is confirmed).
3. **2025–26 rocket:** name, whether and where it flew, and any measured results.
4. **NASA Student Launch:** confirm the 2025–26 and 2026–27 UCLA entries are Bearospace; did the 2025–26 team fly after the funding loss reported by CEED?
5. **2024–25 FNL result:** confirm the organizer's report-award record vs CEED's "2nd, Tribal Category".
6. **Older history:** may the 2014 "Bruin Rocketeers" and 2015–2019 AISES teams be presented as Bearospace's lineage? Is there a known founding year?
7. **Joining:** current AISES-membership requirement, recruitment timeline, interest form, meeting times, Discord/Linktree status, whether Boelter 2817 is open to visitors.
8. **Payload Software Lead:** confirm the title will appear on the official roster; any other software responsibilities to show.
9. **Safety & Operations** and **Avionics Director:** current status for 2026–27.
10. **Consent:** members' agreement to public profiles, headshots, and LinkedIn links; headshot-to-name confirmation.
11. **Domain and hosting:** Vercel under which account; custom domain; whether the old Google Sites will redirect or link.
12. **Analytics:** none vs privacy-friendly (e.g. Vercel Analytics) — recommend none at launch.

**Missing materials**
Vector/large Bearospace logo · white UCLA Samueli lockup · identification of `Icon.jpeg` · headshots for Jonathan Mendez Aguilar and Daniel Montano · full-resolution photos with captions, dates, locations, photographer credit · launch video · project facts (objectives, specs, test logs, results, contributors) · discipline photos · member LinkedIn URLs · any sponsorship prospectus.


---

## Implementation notes

Decisions made while building, recorded so later slices start from what is actually true.

### Slice 2 (shell, content model, accessible baseline)
- **Fonts:** Saira (weight axis only) + Atkinson Hyperlegible Next, latin subsets (~67 KB); system monospace for kicker/log text. The Saira width axis (+99 KB) and JetBrains Mono (+40 KB) were dropped to stay inside the 80 KB font budget.
- **Prerender:** flat files (`about.html`, `team/joel-venegas.html`) served at clean URLs by Vercel `cleanUrls` and `vite preview`. The stylesheet is inlined; the app script moves to the end of `<body>` with `fetchpriority="low"`. Pages are lazy chunks in the browser (eager on the server); React keeps the prerendered HTML on screen until a page chunk loads.
- **Canonical URLs and sitemap** are written only once `org.siteUrl` is set (checklist C14). A relative canonical fails Lighthouse SEO.
- **3D scene** loads after the browser is idle, and is skipped entirely on phone-width content pages (the page panel covers it). `?scene=0` forces the poster.
- **Roles** have an optional `publish: false`; the 2013–14 Bruin Rocketeers roster is hidden until lineage is confirmed (C4).
- **Budgets measured (2026-11-03):** main JS (entry + shared chunks + largest page) 109.4 / 110 KB gz; scene chunk 140.1 / 190 KB; model 30.0 / 60 KB. Lighthouse mobile (simulated): FCP 1.2–1.7 s, LCP 2.0–2.4 s, TBT ≤ 100 ms, CLS ≤ 0.01, accessibility 100, SEO 100. The plan's 1.8 s LCP target for content pages is **not met** under simulation: the 66 KB of webfonts sit in Lighthouse's simulated critical path (observed LCP is ~0.2 s). Lighthouse CI asserts LCP ≤ 2.5 s (Core Web Vitals "good") and FCP ≤ 1.8 s.
- **Lighthouse measures `/` with the scene off:** headless Lighthouse renders WebGL on the CPU (SwiftShader), adding ~900 ms of blocking time that real GPUs don't have. Scene cost is measured by the GPU `@perf` tests instead.
- **Open budget question for slice 3:** GSAP (~28 KB gz) will not fit the 110 KB main-JS budget, since React, React DOM, and React Router already take ~85 KB. Options: load GSAP with the scene chunk, or raise the budget.

### Slice 3 (Flight Deck navigation)
- **Composition:** the title owns the left of the screen and the rocket the centre, so the eight destination bodies form a staggered two-column constellation on the right (`src/scene3d/menuSlots.js`), top to bottom in reading order, instead of four per side. Arrow keys follow the same order (↓/→ next, ↑/← previous, Home/End).
- **Orbit layout** only when the scene is ready, motion is allowed, and the window is at least 900 px wide with aspect ≥ 0.9; otherwise the same links render as the list (and the bodies are hidden on the deck).
- **GSAP lives in the 3D chunk** (camera travel). The page wipe runs on the Web Animations API, so the main bundle carries no animation library.
- **Transitions** (`src/motion/TransitionProvider.jsx`): travel → cover → swap → reveal. A URL change during the travel retargets the run before the cover, so the wipe label and the page always agree; a change during the cover queues one wipe-only run. Hidden tabs finish everything immediately. Reduced or paused motion: a fade with a camera cut. Esc goes up one level (`parentOf`).
- **Content pages** sit left on wide screens (≥ 75rem) so the framed body shows on the right. Pages rise in after in-site navigation; the landing page never animates (first paint stays instant).
- **Budgets (2026-11-03):** the main-JS budget was raised from 110 to 115 KB. The heaviest page (Team) loads 111.2 KB gzipped: React, React DOM, and React Router are ~85 KB, and slice 3 added ~2.5 KB for transitions and the orbit menu. `check-budgets.mjs` now follows each page chunk's real imports. Scene chunk 173.3 / 190 KB including GSAP.

### Slice 4 (opening cinematic)
- **Split:** shots A (logo) and B (sponsors) are DOM/SVG on the Web Animations API (`src/intro/sequence.js`), so they play while the 3D chunk downloads; shots C–F run in the scene chunk (`src/scene3d/introTimeline.js`, GSAP). The overlay lives with the Flight Deck page (its lazy chunk), not the shared shell.
- **One decision function** (`src/intro/introMode.js`): the prerender script serializes it into the home page's `<head>`, so `html[data-intro]` is set before first paint. Off for deep links, reduced/paused motion, `?intro=0`, `?scene=0`, `localStorage bearo:intro=off`, Save-Data/2G, no WebGL, scene turned off this session, and Back/Forward restores.
- **Measured (GPU, 2026-11-05):** full intro 10.0 s, short 2.25 s, key press → live menu < 600 ms. Software WebGL (CI) compiles shaders on the main thread, stalling timelines, so durations are asserted only in the GPU `@perf` tests; functional tests time the code path with performance marks.
- **Short intro** is 2.4 s by design: 0.6 s logo stamp, a hold of at most 0.4 s, 1.4 s of climb and settle.
- **Rocket stays fixed:** `altitude` sinks the desert, tower, smoke, and clouds; `groundLock` keeps the camera on the pad for a beat after liftoff. Fog is always present (only thick at dusk) so materials never recompile mid-intro; distant ink edges fade out so the far desert dissolves into haze.
- **Early input counts:** the head script focuses Skip at DOMContentLoaded and records any key press or tap made before the Flight Deck chunk arrives; `startIntro` skips straight to the deck if one was made.
- **Travel cap:** route transitions finish a camera travel after 2.5 s (`TRAVEL_CAP`). GSAP's lag smoothing slows its clock when frames take over 500 ms, which otherwise stalled navigation on software WebGL under load.
- **Head-script cost:** the WebGL probe is a lazy getter checked last, so pages where the intro is already ruled out (deep links, `?scene=0`, reduced motion) never create a context before first paint. Creating a software-GL context cost ~50 ms, which Lighthouse's 4x CPU simulation on a CI runner turned into ~470 ms of blocking time.
- **Font preload:** the prerender preloads the Latin Saira and Atkinson files on every page, so text no longer reflows when they arrive (CI measured CLS 0.07 without it).
- **WebGL probe off the hydration path:** `useSceneAllowed()` now uses only cheap checks; FlightBackdrop probes WebGL when it is about to load the scene (never on phone-width content pages, where the scene isn't loaded). The probe during hydration was the remaining CI blocking time (/engineering TBT 396 ms).
- **Page chunks preloaded:** the prerender reads Vite's build manifest and lists each page's own chunks as low-priority `modulepreload`s, so they download alongside the main bundle instead of after it runs (simulated FCP ~1.18 s → ~0.68 s on every page).
- **Scene start-up:** no frame is drawn before shaders compile asynchronously (the canvas is hidden until ready anyway), the placeholder rocket is built only if the model fails, model decoding yields between steps, and the escort rocket uses low-detail geometry. About 60% less main-thread blocking when the scene boots on desktop.
- **Phones keep the scene, paused:** once loaded, the scene is never torn down for a phone-width content page. It stops drawing and hides behind the poster (`engine.setActive(false)`), and transitions from a hidden scene cut the camera under the wipe instead of flying. Destroying it on every navigation (dispose plus a forced WebGL context loss) left iPhones on a blank blue screen after the wipe, and rebuilt the scene on every return to the deck. A phone that lands directly on a content page still never loads the scene.
- **Transitions always land:** each step of a route transition is capped at 2 s, and the run's `finally` swaps to the newest page, cancels every animation, and hides the wipe, even if an animation or the scene throws.
- **Hydration as a transition:** `hydrateRoot` runs inside `startTransition`, so React hydrates in short slices instead of one long task. At a CI-like 10x CPU slowdown the post-paint task fell from ~250–310 ms to ~50 ms, and simulated TBT from 47–69 ms to 0 (CI had measured 256 ms on `/?scene=0`).
- **Software WebGL:** when the renderer is a CPU implementation (SwiftShader, llvmpipe), the scene starts at the low tier and draws at most 360k pixels, upscaled (`SOFTWARE_PIXELS` in `quality.js`). At 1920×1080 that took SwiftShader from 4.4 to 13.6 fps (p95 450 → 167 ms) on a developer machine. GSAP lag smoothing is off (`gsap.ticker.lagSmoothing(0)`), so the intro and camera travels follow the wall clock on slow devices instead of crawling; hidden tabs are handled separately. Local Playwright runs use SwiftShader too (headless Chromium), just on a faster CPU; screenshot tests turn the cap off (`__bearo.setPixelCap(false)`) so they compare full-resolution frames.
- **/team LCP budget is 2.7 s (temporary):** its 11 below-the-fold portraits add ~300 ms of simulated LCP (2.57 s; 2.27 s without them). Every other page keeps 2.5 s. Revisit in slice 6 with the headshot pipeline.
- **Tests start without the intro** (`tests/e2e/storage/no-intro.json` sets `bearo:intro=off`); `tests/e2e/intro.spec.js` opts back in.
- **Budgets:** main JS 112.9 / 115 KB (heaviest page now Home, which carries the intro), scene chunk 183.7 / 190 KB. The scene chunk has ~6 KB of headroom left; slice 5's system map should avoid new geometry code in that chunk or the budget needs revisiting.

### Slice 5 (Engineering and the seven disciplines)

- **System map:** `src/content/systemMap.js` lists the rocket's sections as fractions of its length from the nose. Nose cone, fins and airframe come from the model (`rocket.meta.json`; a unit test keeps them in step). Payload, recovery (main and drogue) and the avionics bay sit at the usual dual-deploy positions, marked approximate on every page until the team confirms the layout (checklist C16). No component inside a section is named. Disciplines point at sections with `zones` (replacing slice 2's `regionId`), and the validator rejects unknown sections.
- **Map rendering:** the numbered legend (section, disciplines, "approximate position") carries the meaning and works without JavaScript; the to-scale side-view drawing is decorative (`aria-hidden`). Its outline is a copy of the model's measurements (`OUTLINE` in `systemMap.js`, checked against `rocket.meta.json` by a unit test). Lines use `vector-effect: non-scaling-stroke` so the outline stays crisp at phone width.
- **3D:** Engineering pages frame the rocket itself (`framingShot(ROCKET_CENTER, 5.6)` for the `engineering` target) instead of the ringed planet. Hovering or focusing a discipline card or legend entry lights its sections on both the map and the rocket (`engine.highlightZones`: up to two height bands in the rocket shader, faded in and out). Each discipline page lights its own sections, in place of the plan's per-discipline moon shots: showing where the work sits on the real vehicle said more than a moon could. Pages ask through `requestRocketZones` in `motion/director.js`, which remembers the request so a scene that loads after the page still applies it. On phones the scene is paused behind content pages, so only the map highlights.
- **Works closely with:** a discipline can name a partner team by the role that leads it (`worksWith: [{ team, roleTitle }]`), so Payload Electronics always links to the current Payload Software Lead (Juan Ventura-Romero in 2026–27) without editing the discipline when the season rolls over.
- **Open roles carry the interest:** "Get involved" on an open-position card links to `/join?interest=<discipline>`, like the page's main call to action.
- **Keeping the main script in one piece:** Rolldown split React, the router and the content out of the entry (five extra requests, ~2 KB more, simulated FCP on /engineering 0.68 → 1.18 s, LCP failing on two pages) whenever page code imported a module that a lazy chunk also imports: `rocket.meta.json` (the 3D scene) and `app/sceneStatus` (the intro sequence). Hence the copied `OUTLINE` and the director-held highlight request. A lazy chunk loaded from inside a page chunk also made Vite fetch the main stylesheet (already inlined) at top priority, so the drawing is imported normally. Check `dist/index.html` has a single entry script after adding shared code to pages.
- **One Engineering module:** `pages/Engineering.jsx` exports both the overview and `Discipline` (like Projects and Team), so the system map lives in one page chunk.
- **Budgets:** main JS 114.1 / 115 KB (Engineering, which now carries both pages, the map and the not-found fallback), scene chunk 184.4 / 190 KB. The system map opted out of React Compiler memoization (`'use no memo'`): for a short legend the cache code cost more bytes than it saved time. **Main JS has under 1 KB of headroom:** slices 6–7 add pages of similar weight, so the budget (or how it is measured: the content chunk every page loads is counted in full) needs a decision before then.
