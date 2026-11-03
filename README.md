# Bearospace at UCLA — website

The website for Bearospace, UCLA's student rocketry team and the technical project of AISES at UCLA. It's built with React 19, Vite 8, React Router, Three.js, and GSAP.

- **Plan, architecture, and build slices:** [docs/PLAN.md](docs/PLAN.md)
- **Open facts, confirmations, and missing materials:** [docs/CONTENT-CHECKLIST.md](docs/CONTENT-CHECKLIST.md)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Validate content, then build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (`node --test`) |
| `npm run test:e2e` | Playwright tests against a test build (`npm run build:test`, with `window.__bearo` hooks). Run `npx playwright install chromium` once first |
| `npm run test:visual` | Screenshot comparisons (local only; baselines are per-platform) |
| `npm run test:perf` | Frame-time budgets on the real GPU (local only; skipped on software renderers) |
| `npm run assets:verify` | Check supplied originals against `assets-src/MANIFEST.json` |
| `npm run budgets` | Check built bundle sizes against the plan's budgets, and that no dev/test code shipped |
| `npm run models` | Rebuild `public/models/rocket.jvm2` from `assets-src/models/rocket.stl` |
| `npm run images` | Generate web-ready images (slice 2) |

## 3D scene

The flying rocket lives in `src/scene3d/` and loads as its own chunk. The page never depends on it: a static poster drawn from the real rocket's outline shows while it loads, and stays if WebGL is unavailable, the scene fails, or the GPU context is lost twice. Visitors can pause the motion, and reduced-motion settings get a still frame.

- **Model pipeline:** `npm run models` drops the STL's internal parts (see `assets-src/models/rocket.report.json`), converts it to metres with the nose up, tags each triangle as nose, body, fin, or hardware, and writes `rocket.jvm2` plus `src/generated/rocket.meta.json`. Overrides go in `assets-src/models/rocket.config.json`. A unit test fails if the model is older than the STL.
- **Tuning:** `npm run dev`, then open `/lab/rocket` for live sliders (speed, plume, camera, ink, quality tier). The lab never ships in production builds.

## Assets

`assets-src/` holds the original files exactly as supplied: the rocket STL, logos, headshots, and gallery photos. Never edit them. Scripts generate optimized copies into `public/` and `src/generated/`. If you add an original, add its entry and SHA-256 to `assets-src/MANIFEST.json`.
