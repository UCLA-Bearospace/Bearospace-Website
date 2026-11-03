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
| `npm run test:e2e` | Playwright tests against the production build (run `npx playwright install chromium` once first) |
| `npm run assets:verify` | Check supplied originals against `assets-src/MANIFEST.json` |
| `npm run budgets` | Check built bundle sizes against the budgets in the plan |
| `npm run models` / `npm run images` | Generate web-ready rocket model and images (slices 1 and 2) |

## Assets

`assets-src/` holds the original files exactly as supplied: the rocket STL, logos, headshots, and gallery photos. Never edit them. Scripts generate optimized copies into `public/` and `src/generated/`. If you add an original, add its entry and SHA-256 to `assets-src/MANIFEST.json`.
