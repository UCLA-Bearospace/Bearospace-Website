import { getSceneStatus, subscribeSceneStatus } from '../app/sceneStatus'
import { announce } from '../app/announcer'
import { endIntro, setIntroPhase } from './introStore'
import { INTRO_SEEN_KEY } from './introMode'

// Runs one play of the opening sequence (docs/PLAN.md §6). Plain JS: no React, so pause,
// skip, and cancel are simple. The DOM shots run on the Web Animations API; the 3D
// shots run in the scene chunk (director.intro).
//
//   full   A logo 0–1.6 s · B sponsors 1.6–3.4 s · (hold ≤ 1.5 s for the scene) · C–F 6.6 s
//   short  logo stamp 0.6 s · (hold ≤ 0.4 s) · top of the climb + settle 1.4 s  (2.4 s)
//
// Skip (button, any key, any tap) lands on the Flight Deck at once. The "seen" flag is
// written at liftoff or on a skip, never when the intro didn't play. A hidden tab
// pauses; back after more than 2 s, it resumes at the settle.

const HOLD = { full: 1500, short: 400 }
const AWAY_MS = 2000
const BACK = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'

function markSeen() {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function startIntro({ mode, overlay, getDirector }) {
  const anims = new Set()
  let ctl = null // the 3D part's controls, once it starts
  let stopped = false
  let hiddenAt = 0
  let holdTimer = 0
  let unsubscribe = null
  const q = (sel) => overlay.querySelector(sel)
  const qa = (sel) => [...overlay.querySelectorAll(sel)]

  function anim(el, keyframes, options) {
    if (!el) return null
    const a = el.animate(keyframes, { fill: 'both', ...options })
    anims.add(a)
    a.finished.catch(() => {}).then(() => anims.delete(a))
    return a
  }
  const hide = (el, delay, duration, to) =>
    anim(el, [{ opacity: 1 }, to ? { opacity: 0, transform: to } : { opacity: 0 }], { delay, duration, easing: 'ease-in', fill: 'forwards' })

  // A: constellation → impact frame → badge with a light sweep (1.6 s)
  // B: each intro sponsor in turn, kicker + logo, sliding along the ascent axis (1.8 s)
  function playFull() {
    qa('.intro__star').forEach((s, i) =>
      anim(s, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, delay: 60 + i * 40, easing: BACK }),
    )
    qa('.intro__line').forEach((l, i) =>
      anim(l, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 420, delay: 380 + i * 25, easing: OUT }),
    )
    hide(q('.intro__constellation'), 950, 220)
    anim(q('.intro__flash'), [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: 140, delay: 900 })
    anim(q('.intro__badge'), [{ opacity: 0, transform: 'scale(1.25)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, delay: 920, easing: OUT })
    anim(q('.intro__sweep'), [{ transform: 'translateX(-140%) skewX(-14deg)' }, { transform: 'translateX(140%) skewX(-14deg)' }], {
      duration: 520,
      delay: 1050,
      easing: 'ease-in-out',
    })
    hide(q('.intro__badge'), 1600, 260, 'translateY(-28vh) scale(0.45)')

    // Sponsors start once the badge is out of the way
    const sponsors = qa('.intro__sponsor')
    const slot = 1520 / Math.max(1, sponsors.length)
    sponsors.forEach((el, i) => {
      const t0 = 1840 + slot * i
      anim(el, [{ opacity: 0, transform: 'translateX(-10%)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 300, delay: t0, easing: OUT })
      hide(el, t0 + slot - 260, 230, 'translateX(10%)')
    })
    return 3400
  }

  // Returning visitors: a quick logo stamp (0.6 s)
  function playShort() {
    hide(q('.intro__constellation'), 0, 1)
    anim(q('.intro__badge'), [{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 220, easing: OUT })
    anim(q('.intro__flash'), [{ opacity: 0 }, { opacity: 0.8, offset: 0.3 }, { opacity: 0 }], { duration: 110, delay: 150 })
    hide(q('.intro__badge'), 430, 170, 'scale(0.9)')
    return 600
  }

  /** The director once the scene is ready; null if it fails or the hold runs out. */
  function waitForScene(ms) {
    const ready = () => getSceneStatus() === 'ready' && getDirector()
    if (ready()) return Promise.resolve(getDirector())
    setIntroPhase('hold')
    return new Promise((resolve) => {
      const settle = (value) => {
        clearTimeout(holdTimer)
        unsubscribe?.()
        unsubscribe = null
        resolve(value)
      }
      unsubscribe = subscribeSceneStatus(() => {
        if (ready()) settle(getDirector())
        else if (['failed', 'off', 'lost'].includes(getSceneStatus())) settle(null)
      })
      holdTimer = setTimeout(() => settle(null), ms)
    })
  }

  async function run() {
    performance.mark('intro:start') // with intro:end, how long the sequence held the page
    setIntroPhase('dom')
    q('.intro__skip')?.focus({ preventScroll: true })
    if (skippedEarly) return skip()
    announce('Intro playing. Press any key to skip.')
    const total = mode === 'full' ? playFull() : playShort()
    // A silent "clock" animation: pausing it pauses the DOM shots' timing too
    const clock = anim(overlay, [{ opacity: 1 }, { opacity: 1 }], { duration: total, fill: 'none' })
    await clock.finished.catch(() => {})
    if (stopped) return
    const director = await waitForScene(HOLD[mode])
    if (stopped) return
    if (!director?.intro) return end()
    setIntroPhase('scene')
    ctl = director.intro(mode, { onLiftoff: markSeen })
    await ctl.finished
    end()
  }

  function cleanup() {
    stopped = true
    clearTimeout(holdTimer)
    unsubscribe?.()
    window.removeEventListener('keydown', onInput, true)
    window.removeEventListener('pointerdown', onInput, true)
    document.removeEventListener('visibilitychange', onVisibility)
    for (const a of anims) a.cancel()
    anims.clear()
  }

  /** Land on the Flight Deck. */
  function end() {
    if (stopped) return
    cleanup()
    const focusWasHere = !document.activeElement || document.activeElement === document.body || overlay.contains(document.activeElement)
    endIntro()
    performance.mark('intro:end')
    if (focusWasHere) document.getElementById('deck-title')?.focus({ preventScroll: true })
    document.documentElement.dataset.introEnded = ''
    setTimeout(() => delete document.documentElement.dataset.introEnded, 900)
  }

  function skip() {
    if (stopped) return
    performance.mark('intro:skip')
    markSeen()
    if (ctl) ctl.skip() // finishes the 3D part on the deck; its `finished` then ends us
    else end()
  }

  function onInput(e) {
    if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return
    skip()
  }

  function onVisibility() {
    if (document.hidden) {
      hiddenAt = performance.now()
      for (const a of anims) a.pause()
      ctl?.pause()
      return
    }
    const away = performance.now() - hiddenAt
    if (away > AWAY_MS) {
      // Long gone: don't replay the middle of the show
      for (const a of anims) a.finish()
      ctl?.seekSettle()
    } else for (const a of anims) a.play()
    ctl?.resume()
  }

  // The head script's listeners catch input before this chunk arrives (scripts/prerender.mjs)
  const skippedEarly = !!window.__introSkip
  if (window.__introEarly) {
    window.removeEventListener('keydown', window.__introEarly, true)
    window.removeEventListener('pointerdown', window.__introEarly, true)
  }
  delete window.__introSkip
  delete window.__introEarly
  window.addEventListener('keydown', onInput, true)
  window.addEventListener('pointerdown', onInput, true)
  document.addEventListener('visibilitychange', onVisibility)
  run()

  return {
    skip,
    /** Stop without landing (a replay is starting, or the page is going away). */
    cancel() {
      if (stopped) return
      cleanup()
      ctl?.skip()
    },
  }
}
