import { createContext, use } from 'react'

/** { displayLocation }: the location the page is showing, which lags the URL while a transition runs. */
export const TransitionContext = createContext(null)

export const useSceneTransition = () => use(TransitionContext)
