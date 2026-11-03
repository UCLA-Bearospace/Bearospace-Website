// Checks that every supplied original in assets-src/ still matches the hash recorded in
// assets-src/MANIFEST.json. Originals are never edited; derivatives are generated elsewhere.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

export function verifyManifest(root = ROOT) {
  const dir = join(root, 'assets-src')
  const manifest = JSON.parse(readFileSync(join(dir, 'MANIFEST.json'), 'utf8'))
  const problems = []
  for (const file of manifest.files) {
    const path = join(dir, file.path)
    if (!existsSync(path)) {
      problems.push(`${file.path}: missing`)
      continue
    }
    const hash = createHash('sha256').update(readFileSync(path)).digest('hex')
    if (hash !== file.sha256) problems.push(`${file.path}: hash ${hash} does not match manifest ${file.sha256}`)
  }
  return { checked: manifest.files.length, problems }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { checked, problems } = verifyManifest()
  if (problems.length) {
    console.error(`assets-src: ${problems.length} problem(s)\n  ` + problems.join('\n  '))
    process.exit(1)
  }
  console.log(`assets-src: ${checked} originals match MANIFEST.json`)
}
