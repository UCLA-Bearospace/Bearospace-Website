import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const root = createRoot(document.getElementById('root'))

// Dev-only tuning tools at /lab/*; the whole branch is removed from production builds.
if (import.meta.env.DEV && location.pathname.startsWith('/lab')) {
  const RocketLab = lazy(() => import('./lab/RocketLab.jsx'))
  root.render(
    <StrictMode>
      <Suspense fallback={null}>
        <RocketLab />
      </Suspense>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
