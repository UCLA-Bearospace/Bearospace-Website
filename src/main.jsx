import { StrictMode, Suspense, lazy } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/saira/wght.css'
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/backdrop.css'
import './styles/site.css'
import App from './App.jsx'
import { pages } from './routes/pages.lazy.js'

const container = document.getElementById('root')

// Dev-only tuning tools at /lab/*; the whole branch is removed from production builds.
if (import.meta.env.DEV && location.pathname.startsWith('/lab')) {
  const RocketLab = lazy(() => import('./lab/RocketLab.jsx'))
  createRoot(container).render(
    <StrictMode>
      <Suspense fallback={null}>
        <RocketLab />
      </Suspense>
    </StrictMode>,
  )
} else {
  const app = (
    <StrictMode>
      <BrowserRouter>
        <App pages={pages} />
      </BrowserRouter>
    </StrictMode>
  )
  // Built pages are prerendered (scripts/prerender.mjs); the dev server serves an empty shell
  if (container.firstElementChild) hydrateRoot(container, app)
  else createRoot(container).render(app)
}
