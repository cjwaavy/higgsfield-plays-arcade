import { useEffect, useRef, useState } from 'react'
import { cubicBezier, scheduleTicks, sfx } from '../engine.js'

const DURATION = 4400
const EASE = [0.12, 0.66, 0.05, 1]
const easeFn = cubicBezier(...EASE)

// wheelofnames-style flat primaries, cycled across wedges
const WEDGE_FILLS = ['#3369E8', '#009925', '#EEB211', '#D50F25']
const DARK_TEXT_FILLS = new Set(['#009925', '#EEB211'])

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
    // pointer sits at 3 o'clock (90° clockwise from top)
    const desired = 90 - idx * wedge + jitter
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
        onLand(rect ? { x: rect.left, y: rect.top + rect.height / 2 } : undefined)
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
          aria-label="Prize wheel of plays — click to spin"
          onClick={onRequestSpin}
        >
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
              const fill = WEDGE_FILLS[i % WEDGE_FILLS.length]
              const long = p.title.length > 13
              return (
                <g key={p.id}>
                  <path d={wedgePath(180, 180, 176, start, end)} fill={fill} />
                  <text
                    x="346"
                    y="180"
                    textAnchor="end"
                    className="wedge-name"
                    style={{ fontSize: long ? 14 : 19 }}
                    fill={DARK_TEXT_FILLS.has(fill) ? '#101010' : '#ffffff'}
                    transform={`rotate(${i * wedge - 90} 180 180)`}
                  >
                    {p.title}
                  </text>
                </g>
              )
            })}
            <circle cx="180" cy="180" r="38" fill="#ffffff" />
          </g>
        </svg>
      </div>
      <button type="button" className="btn go" onClick={onRequestSpin} disabled={spin.spinning}>
        {spin.spinning ? 'Spinning…' : verb}
      </button>
      <p className="stage-hint">tap the wheel or press space</p>
    </div>
  )
}
