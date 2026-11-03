import { Route, Routes } from 'react-router'
import Shell from './app/Shell'

// Every URL the site serves. `pages` comes from src/routes/pages.lazy.js in the browser
// and pages.eager.js when prerendering. Titles and descriptions live in src/site/meta.js;
// the URL list used for prerendering and the sitemap is allPaths() there.
export default function App({ pages: P }) {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<P.Home />} />
        <Route path="about" element={<P.About />} />
        <Route path="engineering" element={<P.Engineering />} />
        <Route path="engineering/:discipline" element={<P.Discipline />} />
        <Route path="projects" element={<P.Projects />} />
        <Route path="projects/:slug" element={<P.Project />} />
        <Route path="competitions" element={<P.Competitions />} />
        <Route path="history" element={<P.History />} />
        <Route path="team" element={<P.Team />} />
        <Route path="team/season/:season" element={<P.TeamSeason />} />
        <Route path="team/:person" element={<P.Member />} />
        <Route path="gallery" element={<P.Gallery />} />
        <Route path="sponsors" element={<P.Sponsors />} />
        <Route path="join" element={<P.Join />} />
        <Route path="*" element={<P.NotFound />} />
      </Route>
    </Routes>
  )
}
