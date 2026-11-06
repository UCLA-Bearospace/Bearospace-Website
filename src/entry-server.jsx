import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App.jsx'
import { pages } from './routes/pages.eager.js'
import { allPaths, getMeta } from './site/meta.js'
import { org } from './content/index.js'
import { decideIntroMode, readIntroEnv } from './intro/introMode'

// Used by scripts/prerender.mjs to write static HTML for every route.
export function render(url) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App pages={pages} />
      </StaticRouter>
    </StrictMode>,
  )
}

export { allPaths, getMeta, org, decideIntroMode, readIntroEnv }
