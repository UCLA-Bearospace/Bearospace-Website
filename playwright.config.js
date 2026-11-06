import { defineConfig, devices } from '@playwright/test'

// Runs against a production build with test hooks (`npm run build:test` → dist-test/),
// served by `vite preview`. Firefox and WebKit join in slice 10 (docs/PLAN.md §11).
//
// @visual screenshot comparisons use per-platform baselines committed from a developer
// machine, so CI skips them; run `npm run test:visual` locally. @perf needs a real GPU to
// itself, so it only runs when its project is asked for: `npm run test:perf`.
// Worker processes re-read this file without the CLI arguments, so pass the choice down
const perfRun = process.argv.includes('chromium-gpu') || process.env.BEARO_PERF === '1'
if (perfRun) process.env.BEARO_PERF = '1'

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // The 3D scene runs in every test (software WebGL on CI), so allow generous time
  timeout: 60_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    perfRun
      ? {
          // Frame-time probes need the real GPU; tests skip themselves on software renderers
          name: 'chromium-gpu',
          grep: /@perf/,
          use: {
            ...devices['Desktop Chrome'],
            launchOptions: {
              args: ['--enable-gpu', '--ignore-gpu-blocklist', ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : [])],
            },
          },
        }
      : {
          name: 'chromium',
          grepInvert: process.env.CI ? /@visual|@perf/ : /@perf/,
          use: {
            ...devices['Desktop Chrome'],
            // Software WebGL on GPU-less CI machines
            launchOptions: { args: ['--enable-unsafe-swiftshader'] },
          },
        },
  ],
  webServer: {
    command: 'npm run build:test && npx vite preview --outDir dist-test --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
