import { useLocation, useNavigate } from 'react-router'
import { useMotionAllowed } from '../motion/useMotionPref'
import { useSceneAllowed } from '../lib/webgl'
import { useSceneStatus } from '../app/sceneStatus'
import { replayIntro, requestReplay } from './introStore'

/** "Replay launch": plays the full opening again (only where it can play). */
export default function ReplayLaunch({ className = 'button button--ghost' }) {
  const motion = useMotionAllowed()
  const scene = useSceneAllowed()
  const status = useSceneStatus()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // Hidden where the scene can't run (no WebGL shows up as 'off' once the scene tries to load)
  if (!motion || !scene || status === 'off' || status === 'failed') return null

  function replay() {
    if (pathname === '/') replayIntro()
    else {
      requestReplay()
      navigate('/')
    }
  }

  return (
    <button type="button" className={className} onClick={replay}>
      Replay launch
    </button>
  )
}
