import { useEffect, useRef, useState } from 'react'
import { cubicBezier, scheduleTicks, sfx } from '../engine.js'

const DURATION = 4400
const EASE = [0.12, 0.66, 0.05, 1]
const easeFn = cubicBezier(...EASE)

const WEDGE_FILLS = ['#a3202f', '#12352a', '#c8801d', '#1d2b4f', '#7c2d12', '#0f4c5c', '#4a1d6e']

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function wedgePath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polar(cx, cy, r, startDeg)
  const [x2, y2] = polar(cx, cy, r, endDeg)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

export default function WheelSkin({ plays, spin, muted, onRequestSpin, onLand, verb }) {
  const [rotation, setRotation] = useState(0)
  const [animating, setAnimating] = useState(false)
  const rotationRef = useRef(0)
  const timeoutsRef = useRef([])
  const pointerRef = useRef(null)
  const lastCount = useRef(0)

  const wedge = 360 / plays.length

  useEffect(() => {
    const clear = () => {
      timeoutsRef.current.forEach(window.clearTimeout)
      timeoutsRef.current = []
    }
    if (spin.count === lastCount.current || !spin.target) return clear
    lastCount.current = spin.count
    clear()

    const idx = plays.findIndex((p) => p.id === spin.target.id)
    const current = rotationRef.current
    const jitter = (Math.random() - 0.5) * wedge * 0.6
    const desired = -idx * wedge + jitter
    const delta = ((desired - current) % 360 + 360) % 360
    const final = current + 4 * 360 + delta
    rotationRef.current = final

    setAnimating(true)
    // double rAF so the transition property lands before the transform change
    requestAnimationFrame(() => requestAnimationFrame(() => setRotation(final)))

    if (!muted) {
      scheduleTicks(final - current, DURATION, easeFn, wedge, sfx.tick, timeoutsRef.current)
    }
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setAnimating(false)
        const rect = pointerRef.current?.getBoundingClientRect()
        onLand(rect ? { x: rect.left + rect.width / 2, y: rect.bottom } : undefined)
      }, DURATION + 80)
    )
    return clear
  }, [spin.count, spin.target, muted, onLand, plays, wedge])

  return (
    <div className="wheel-skin">
      <div className="wheel-frame">
        <div className="wheel-pointer" ref={pointerRef} aria-hidden="true" />
        <svg
          viewBox="0 0 360 360"
          className="wheel-svg"
          role="img"
          aria-label="Prize wheel of plays"
        >
          <circle cx="180" cy="180" r="176" className="wheel-rim" />
          {Array.from({ length: 14 }).map((_, i) => {
            const [x, y] = polar(180, 180, 168, i * (360 / 14))
            return <circle key={i} cx={x} cy={y} r="4.2" className="wheel-bulb" style={{ animationDelay: `${i * 0.12}s` }} />
          })}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '180px 180px',
              transition: animating
                ? `transform ${DURATION}ms cubic-bezier(${EASE.join(',')})`
                : 'none',
            }}
          >
            {plays.map((p, i) => {
              const start = i * wedge - wedge / 2
              const end = start + wedge
              const [lx, ly] = polar(180, 180, 108, i * wedge)
              return (
                <g key={p.id}>
                  <path
                    d={wedgePath(180, 180, 158, start, end)}
                    fill={WEDGE_FILLS[i % WEDGE_FILLS.length]}
                    stroke="#f5c542"
                    strokeWidth="2"
                  />
                  <text
                    x={lx}
                    y={ly}
                    className="wedge-emoji"
                    transform={`rotate(${i * wedge} ${lx} ${ly})`}
                  >
                    {p.emoji}
                  </text>
                  <text
                    x={polar(180, 180, 140, i * wedge)[0]}
                    y={polar(180, 180, 140, i * wedge)[1]}
                    className="wedge-label"
                    transform={`rotate(${i * wedge} ${polar(180, 180, 140, i * wedge)[0]} ${polar(180, 180, 140, i * wedge)[1]})`}
                  >
                    {p.title}
                  </text>
                </g>
              )
            })}
            <circle cx="180" cy="180" r="34" className="wheel-hub" />
            <text x="180" y="187" className="wheel-hub-label">
              HP
            </text>
          </g>
        </svg>
      </div>
      <button type="button" className="btn go" onClick={onRequestSpin} disabled={spin.spinning}>
        {spin.spinning ? 'Spinning…' : verb}
      </button>
      <p className="stage-hint">or press space</p>
    </div>
  )
}
