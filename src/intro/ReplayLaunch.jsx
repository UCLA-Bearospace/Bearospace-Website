import { useLocation, useNavigate } from 'react-router'
import { useMotionAllowed } from '../motion/useMotionPref'
import { useSceneAllowed } from '../lib/webgl'
import { replayIntro, requestReplay } from './introStore'

/** "Replay launch": plays the full opening again (only where it can play). */
export default function ReplayLaunch({ className = 'button button--ghost' }) {
  const motion = useMotionAllowed()
  const scene = useSceneAllowed()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  if (!motion || !scene) return null

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
