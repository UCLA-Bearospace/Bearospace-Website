// Content validation (zod schemas + reference checks) arrives with the content model in slice 2.
// See docs/PLAN.md §10. Runs before every build via the "prebuild" script.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const contentDir = fileURLToPath(new URL('../src/content', import.meta.url))

if (existsSync(contentDir)) {
  console.error('validate-content: src/content exists but validation is not implemented yet (slice 2).')
  process.exit(1)
}
console.log('validate-content: no src/content yet, nothing to validate')
