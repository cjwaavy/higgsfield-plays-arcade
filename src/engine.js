// Shared machinery: settings persistence, sounds, easing math, confetti.
import { useCallback, useEffect, useState } from 'react'
import { PLAYS, normalizePlayId } from './plays.js'

const SETTINGS_KEY = 'higgsfield-plays.settings'
const DEFAULTS = { sprintMinutes: 30, muted: false, lockedPlayId: null, skin: 'wheel' }

export const SKIN_IDS = ['wheel', 'case', 'slots']

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULTS
    const s = JSON.parse(raw)
    return {
      sprintMinutes:
        typeof s.sprintMinutes === 'number' && s.sprintMinutes >= 5 && s.sprintMinutes <= 120
          ? s.sprintMinutes
          : DEFAULTS.sprintMinutes,
      muted: typeof s.muted === 'boolean' ? s.muted : DEFAULTS.muted,
      lockedPlayId: normalizePlayId(s.lockedPlayId),
      skin: SKIN_IDS.includes(s.skin) ? s.skin : DEFAULTS.skin,
    }
  } catch {
    return DEFAULTS
  }
}

function consumeUrlParams() {
  try {
    const params = new URLSearchParams(window.location.search)
    const land = normalizePlayId(params.get('land') ?? params.get('play'))
    const skin = params.get('skin')
    const cleanSkin = SKIN_IDS.includes(skin) ? skin : null
    if (params.get('land') || params.get('play') || cleanSkin) {
      params.delete('land')
      params.delete('play')
      params.delete('skin')
      const rest = params.toString()
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash
      )
    }
    return { land, skin: cleanSkin }
  } catch {
    return { land: null, skin: null }
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS)
  useEffect(() => {
    const stored = loadSettings()
    const url = consumeUrlParams()
    const merged = {
      ...stored,
      ...(url.land ? { lockedPlayId: url.land } : {}),
      ...(url.skin ? { skin: url.skin } : {}),
    }
    setSettings(merged)
    if (url.land || url.skin) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
      } catch {}
    }
  }, [])
  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])
  return [settings, update]
}

export function pickTarget(lockedPlayId, currentId) {
  const locked = PLAYS.find((p) => p.id === lockedPlayId)
  if (locked) return locked
  const pool = PLAYS.filter((p) => p.id !== currentId)
  const src = pool.length ? pool : PLAYS
  return src[Math.floor(Math.random() * src.length)]
}

// ---------- audio ----------
let audioCtx = null
function ctx() {
  if (typeof window === 'undefined') return null
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext
    if (!AC) return null
    audioCtx ??= new AC()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function blip(freq, dur, gain, type = 'sine', when = 0) {
  const c = ctx()
  if (!c) return
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export const sfx = {
  tick: () => blip(1180, 0.035, 0.035, 'triangle'),
  clack: () => blip(320, 0.06, 0.05, 'square'),
  clunk: () => {
    blip(150, 0.09, 0.09, 'square')
    blip(96, 0.14, 0.07, 'sine', 0.02)
  },
  pop: () => {
    blip(420, 0.05, 0.08, 'square')
    blip(880, 0.09, 0.05, 'sine', 0.03)
  },
  win: () => {
    blip(523.25, 0.18, 0.07)
    blip(659.25, 0.22, 0.06, 'sine', 0.09)
    blip(783.99, 0.3, 0.06, 'sine', 0.18)
    blip(1046.5, 0.4, 0.05, 'sine', 0.27)
  },
  // party-popper: cork thump + filtered noise burst + sparkle crackles
  confetti: () => {
    const c = ctx()
    if (!c) return
    blip(190, 0.08, 0.14, 'square')
    const len = Math.floor(c.sampleRate * 0.3)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4)
    const src = c.createBufferSource()
    src.buffer = buf
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1900
    bp.Q.value = 0.7
    const g = c.createGain()
    g.gain.value = 0.3
    src.connect(bp).connect(g).connect(c.destination)
    src.start()
    for (let i = 0; i < 7; i++) {
      blip(1300 + Math.random() * 2100, 0.045, 0.035, 'triangle', 0.06 + i * 0.05 + Math.random() * 0.03)
    }
  },
}

// ---------- easing ----------
// Numeric cubic-bezier(x1,y1,x2,y2) evaluator: progress y for time-fraction x.
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t) => ((ay * t + by) * t + cy) * t
  const solveT = (x) => {
    let t = x
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x
      const d = (3 * ax * t + 2 * bx) * t + cx
      if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break
      t -= err / d
    }
    return Math.min(1, Math.max(0, t))
  }
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solveT(x)))
}

// Times (ms) at which an eased sweep of `distance` crosses each multiple of `spacing`.
// Used to schedule tick sounds that genuinely taper with the animation.
export function crossingTimes(distance, durationMs, ease, spacing) {
  const times = []
  let next = spacing
  const steps = 400
  for (let i = 1; i <= steps && next < distance; i++) {
    const t = i / steps
    const traveled = ease(t) * distance
    while (traveled >= next) {
      times.push(t * durationMs)
      next += spacing
    }
  }
  return times
}

export function scheduleTicks(distance, durationMs, ease, spacing, fn, registry) {
  for (const t of crossingTimes(distance, durationMs, ease, spacing)) {
    registry.push(window.setTimeout(fn, t))
  }
}

// ---------- confetti ----------
const CONFETTI_COLORS = ['#f5c542', '#ff4d5a', '#39e6c8', '#ff9d2e', '#7dd3fc', '#fef3c7']

export function fireConfetti(canvas, origin) {
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const g = canvas.getContext('2d')
  g.scale(dpr, dpr)
  const ox = origin?.x ?? w / 2
  const oy = origin?.y ?? h * 0.45
  const parts = Array.from({ length: 110 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9
    const speed = 5 + Math.random() * 8.5
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      life: 1,
      decay: 0.008 + Math.random() * 0.008,
    }
  })
  let raf
  const step = () => {
    g.clearRect(0, 0, w, h)
    let alive = false
    for (const p of parts) {
      if (p.life <= 0) continue
      alive = true
      p.vy += 0.22
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.life -= p.decay
      g.save()
      g.translate(p.x, p.y)
      g.rotate(p.rot)
      g.globalAlpha = Math.max(0, p.life)
      g.fillStyle = p.color
      g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62)
      g.restore()
    }
    if (alive) raf = requestAnimationFrame(step)
    else g.clearRect(0, 0, w, h)
  }
  cancelAnimationFrame(raf)
  step()
}
