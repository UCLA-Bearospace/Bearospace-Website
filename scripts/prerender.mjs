// Writes static HTML for every route so pages load fast, work without JavaScript, and
// are readable by search engines. Runs after the client and SSR builds (`npm run build`).
//
//   node scripts/prerender.mjs <outDir>     (dist or dist-test)
//
// Output: <outDir>/<path>.html for every path in allPaths() (index.html for /), 404.html,
// and sitemap.xml + robots.txt when org.siteUrl is set.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const outDir = join(ROOT, process.argv[2] ?? 'dist')
const ssrEntry = join(ROOT, 'dist-ssr', 'entry-server.js')
const { render, allPaths, getMeta, org } = await import(pathToFileURL(ssrEntry).href)

// Inline the (small) stylesheet so first paint doesn't wait on a second request, and move
// the app script after the content so the browser treats the page text as the priority
let template = readFileSync(join(outDir, 'index.html'), 'utf8').replace(
  /<link rel="stylesheet" crossorigin href="\/assets\/([^"]+\.css)">/,
  (_, file) => `<style>${readFileSync(join(outDir, 'assets', file), 'utf8')}</style>`,
)
const scripts = template.match(/\s*<script type="module"[^>]*><\/script>|\s*<link rel="modulepreload"[^>]*>/g) ?? []
for (const s of scripts) template = template.replace(s, '')
const lowPriority = (tag) => tag.trim().replace(/^<(script|link)/, '<$1 fetchpriority="low"')
template = template.replace('</body>', `${scripts.map(lowPriority).join('\n    ')}\n  </body>`)
const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function page(path) {
  const meta = getMeta(path)
  const url = `${org.siteUrl ?? ''}${meta.path}`
  const head = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    // Canonical URLs must be absolute; added once a domain is chosen (checklist C14)
    org.siteUrl ? `<link rel="canonical" href="${escape(url)}" />` : '',
    `<meta name="robots" content="${meta.noindex ? 'noindex' : 'index,follow'}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escape(org.name)}" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    path === '/'
      ? `<script type="application/ld+json">${JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: org.name,
          description: org.mission,
          parentOrganization: { '@type': 'CollegeOrUniversity', name: 'University of California, Los Angeles' },
          ...(org.siteUrl ? { url: org.siteUrl } : {}),
        })}</script>`
      : '',
  ].join('\n    ')
  return template
    .replace(/<title>.*?<\/title>\s*/s, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`)
}

// Flat files (about.html, team/joel-venegas.html): Vercel's cleanUrls and `vite preview`
// both serve them at the clean URL (/about), without a trailing-slash redirect.
const paths = allPaths()
for (const path of paths) {
  const file = path === '/' ? join(outDir, 'index.html') : join(outDir, `${path}.html`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, page(path))
}
writeFileSync(join(outDir, '404.html'), page('/404'))

if (org.siteUrl) {
  const urls = paths.map((p) => `  <url><loc>${org.siteUrl}${p === '/' ? '' : p}</loc></url>`).join('\n')
  writeFileSync(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${org.siteUrl}/sitemap.xml\n`)
} else {
  writeFileSync(join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /\n')
  console.warn('prerender: org.siteUrl is not set, so no sitemap.xml was written (checklist C14)')
}

rmSync(join(ROOT, 'dist-ssr'), { recursive: true, force: true })
console.log(`prerender: ${paths.length} pages + 404.html → ${process.argv[2] ?? 'dist'}/`)
