import { useEffect, useRef, useState } from 'react'
import { cubicBezier, scheduleTicks, sfx } from '../engine.js'
import { getBrand } from '../logos.jsx'

const DURATION = 4400
const EASE = [0.12, 0.66, 0.05, 1]
const easeFn = cubicBezier(...EASE)

// wheelofnames-style flat primaries, cycled across wedges
const WEDGE_FILLS = ['#3369E8', '#009925', '#EEB211', '#D50F25']
const DARK_TEXT_FILLS = new Set(['#009925', '#EEB211'])

function WedgeTile({ brand }) {
  const [, , vw, vh] = brand.viewBox.split(' ').map(Number)
  const scale = 19 / Math.max(vw, vh)
  const tx = (26 - vw * scale) / 2
  const ty = (26 - vh * scale) / 2
  return (
    <g transform="translate(320 167)">
      <rect
        width="26"
        height="26"
        rx="6.5"
        fill={brand.bg}
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.4"
      />
      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        {brand.paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} />
        ))}
      </g>
    </g>
  )
}

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function wedgePath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polar(cx, cy, r, startDeg)
  const [x2, y2] = polar(cx, cy, r, endDeg)
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
}

export default function WheelSkin({ plays, spin, muted, onRequestSpin, onLand }) {
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
              const brand = getBrand(p.id)
              return (
                <g key={p.id}>
                  <path d={wedgePath(180, 180, 176, start, end)} fill={fill} />
                  <g transform={`rotate(${i * wedge - 90} 180 180)`}>
                    <text
                      x="312"
                      y="180"
                      textAnchor="end"
                      className="wedge-name"
                      style={{ fontSize: 17 }}
                      fill={DARK_TEXT_FILLS.has(fill) ? '#101010' : '#ffffff'}
                    >
                      {p.short ?? p.title}
                    </text>
                    {brand && <WedgeTile brand={brand} />}
                  </g>
                </g>
              )
            })}
            <circle cx="180" cy="180" r="34" fill="#ffffff" />
          </g>
        </svg>
        {!spin.spinning && (
          <div className="wheel-cta" aria-hidden="true">
            Click to spin
          </div>
        )}
      </div>
    </div>
  )
}
