// Fails the build when shipped bytes exceed the budgets in docs/PLAN.md §9.5.
// Run after `npm run build`.
import { gzipSync } from 'node:zlib'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const KB = 1024

// The lazy 3D chunk is named after its entry component (src/scene3d/FlightScene.jsx).
const isScene = (name) => name.startsWith('FlightScene')

if (!existsSync(DIST)) {
  console.error('check-budgets: dist/ not found, run `npm run build` first')
  process.exit(1)
}

const assets = join(DIST, 'assets')
const js = readdirSync(assets).filter((f) => f.endsWith('.js'))
const gz = (path) => gzipSync(readFileSync(path)).length
const sum = (files) => files.reduce((n, f) => n + gz(join(assets, f)), 0)

const rows = [
  { name: 'Main JS (gz)', bytes: sum(js.filter((f) => !isScene(f))), limit: 110 * KB },
  { name: 'Scene chunk (gz)', bytes: sum(js.filter(isScene)), limit: 190 * KB },
]
const model = join(DIST, 'models', 'rocket.jvm2')
if (existsSync(model)) rows.push({ name: 'Rocket model (gz)', bytes: gz(model), limit: 60 * KB })

let failed = false
for (const { name, bytes, limit } of rows) {
  const over = bytes > limit
  failed ||= over
  console.log(`${over ? 'FAIL' : 'ok  '}  ${name.padEnd(20)} ${(bytes / KB).toFixed(1).padStart(7)} KB / ${limit / KB} KB`)
}
if (failed) process.exit(1)
