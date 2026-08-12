import { useEffect, useRef, useState } from 'react'
import { cubicBezier, scheduleTicks, sfx } from '../engine.js'
import { Tile, getBrand, HF_BRAND } from '../logos.jsx'

const CELL = 84
const ROUNDS = 5
const REEL_DURATIONS = [2100, 2800, 3500]
const EASE = [0.18, 0.84, 0.28, 1.02]
const easeFn = cubicBezier(...EASE)

function computeZoom() {
  return Math.max(
    1,
    Math.min((window.innerHeight - 430) / 360, (window.innerWidth * 0.8) / 360, 2.4)
  )
}

export default function SlotsSkin({ plays, spin, muted, onRequestSpin, onLand, verb }) {
  const [zoom, setZoom] = useState(() => computeZoom())
  const [offsets, setOffsets] = useState([0, 0, 0])
  const [animating, setAnimating] = useState(false)
  const [leverDown, setLeverDown] = useState(false)
  const [litReels, setLitReels] = useState([false, false, false])
  const timeoutsRef = useRef([])
  const cabinetRef = useRef(null)
  const lastCount = useRef(0)

  useEffect(() => {
    const onResize = () => setZoom(computeZoom())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const stripLen = plays.length * (ROUNDS + 1)
  // Outer reels cycle the brand tiles; the middle reel interleaves Higgsfield marks so a
  // win line reads [brand] [Higgsfield] [brand] — the brand × Higgsfield method.
  const outerStrip = Array.from({ length: stripLen }, (_, i) => getBrand(plays[i % plays.length].id))
  const middleStrip = Array.from({ length: stripLen }, (_, i) =>
    i % 2 === 1 ? HF_BRAND : getBrand(plays[(i >> 1) % plays.length].id)
  )
  const strips = [outerStrip, middleStrip, outerStrip]

  useEffect(() => {
    const clear = () => {
      timeoutsRef.current.forEach(window.clearTimeout)
      timeoutsRef.current = []
    }
    if (spin.count === lastCount.current || !spin.target) return clear
    lastCount.current = spin.count
    clear()

    const targetIdx = plays.findIndex((p) => p.id === spin.target.id)
    const outerIndex = plays.length * ROUNDS + targetIdx
    const middleIndex = outerIndex % 2 === 1 ? outerIndex : outerIndex + 1 // nearest HF cell
    const finals = [outerIndex, middleIndex, outerIndex].map((idx) => idx * CELL - CELL)

    setLeverDown(true)
    setLitReels([false, false, false])
    if (!muted) sfx.clunk()
    timeoutsRef.current.push(window.setTimeout(() => setLeverDown(false), 550))

    setAnimating(false)
    setOffsets([0, 0, 0])
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimating(true)
        setOffsets(finals)
      })
    )

    REEL_DURATIONS.forEach((dur, r) => {
      if (!muted && r === 0) {
        scheduleTicks(finals[0], dur, easeFn, CELL * 2, sfx.tick, timeoutsRef.current)
      }
      timeoutsRef.current.push(
        window.setTimeout(() => {
          if (!muted) sfx.clack()
          setLitReels((prev) => {
            const next = [...prev]
            next[r] = true
            return next
          })
        }, dur)
      )
    })
    timeoutsRef.current.push(
      window.setTimeout(() => {
        const rect = cabinetRef.current?.getBoundingClientRect()
        onLand(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined)
      }, REEL_DURATIONS[2] + 150)
    )
    return clear
  }, [spin.count, spin.target, muted, onLand, plays])

  return (
    <div className="slots-skin">
      <div className="slots-cabinet" ref={cabinetRef} style={{ zoom }}>
        <div className="slots-top" aria-hidden="true">
          <span className="slots-sign">JACKPOT PAYS IN PLAYS</span>
        </div>
        <div className="slots-window">
          {[0, 1, 2].map((r) => (
            <div key={r} className={`reel${litReels[r] ? ' is-lit' : ''}`}>
              <div
                className="reel-strip"
                style={{
                  transform: `translateY(${-offsets[r]}px)`,
                  transition: animating
                    ? `transform ${REEL_DURATIONS[r]}ms cubic-bezier(${EASE.join(',')})`
                    : 'none',
                }}
              >
                {strips[r].map((brand, i) => (
                  <div key={`${r}-${i}`} className="reel-cell" style={{ height: CELL }}>
                    <Tile brand={brand} className="slot" />
                  </div>
                ))}
              </div>
              <div className="reel-glass" aria-hidden="true" />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`lever${leverDown ? ' is-down' : ''}`}
          onClick={onRequestSpin}
          disabled={spin.spinning}
          aria-label={verb}
        >
          <span className="lever-arm" />
          <span className="lever-knob" />
        </button>
      </div>
      <button type="button" className="btn go" onClick={onRequestSpin} disabled={spin.spinning}>
        {spin.spinning ? 'Reels rolling…' : verb}
      </button>
      <p className="stage-hint">or press space</p>
    </div>
  )
}
