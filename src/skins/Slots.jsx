import { useEffect, useRef, useState } from 'react'
import { cubicBezier, scheduleTicks, sfx } from '../engine.js'

const CELL = 92
const ROUNDS = 5
const REEL_DURATIONS = [2100, 2800, 3500]
const EASE = [0.18, 0.84, 0.28, 1.02]
const easeFn = cubicBezier(...EASE)

export default function SlotsSkin({ plays, spin, muted, onRequestSpin, onLand, verb }) {
  const [offsets, setOffsets] = useState([0, 0, 0])
  const [animating, setAnimating] = useState(false)
  const [leverDown, setLeverDown] = useState(false)
  const [litReels, setLitReels] = useState([false, false, false])
  const timeoutsRef = useRef([])
  const cabinetRef = useRef(null)
  const lastCount = useRef(0)

  const stripLen = plays.length * (ROUNDS + 1)
  const strip = Array.from({ length: stripLen }, (_, i) => plays[i % plays.length])

  useEffect(() => {
    const clear = () => {
      timeoutsRef.current.forEach(window.clearTimeout)
      timeoutsRef.current = []
    }
    if (spin.count === lastCount.current || !spin.target) return clear
    lastCount.current = spin.count
    clear()

    const targetIdx = plays.findIndex((p) => p.id === spin.target.id)
    const finalIndex = plays.length * ROUNDS + targetIdx
    const final = finalIndex * CELL - CELL // show target in middle window of 3

    setLeverDown(true)
    setLitReels([false, false, false])
    if (!muted) sfx.clunk()
    timeoutsRef.current.push(window.setTimeout(() => setLeverDown(false), 550))

    setAnimating(false)
    setOffsets([0, 0, 0])
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimating(true)
        setOffsets([final, final, final])
      })
    )

    REEL_DURATIONS.forEach((dur, r) => {
      if (!muted && r === 0) {
        scheduleTicks(final, dur, easeFn, CELL * 2, sfx.tick, timeoutsRef.current)
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
      <div className="slots-cabinet" ref={cabinetRef}>
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
                {strip.map((p, i) => (
                  <div key={`${r}-${i}`} className="reel-cell" style={{ height: CELL }}>
                    {p.emoji}
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
