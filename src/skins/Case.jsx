import { useEffect, useMemo, useRef, useState } from 'react'
import { cubicBezier, scheduleTicks, sfx } from '../engine.js'

const DURATION = 5200
const EASE = [0.05, 0.72, 0.09, 1]
const easeFn = cubicBezier(...EASE)
const CARD_W = 128
const GAP = 12
const STRIDE = CARD_W + GAP
const TARGET_INDEX = 52
const STRIP_LEN = 60

function buildStrip(plays, targetId, seed) {
  const cards = []
  for (let i = 0; i < STRIP_LEN; i++) {
    cards.push(plays[Math.floor(Math.random() * plays.length)])
  }
  // no accidental target-lookalike right next to the real stop
  const target = plays.find((p) => p.id === targetId) ?? plays[0]
  cards[TARGET_INDEX] = target
  for (const n of [TARGET_INDEX - 1, TARGET_INDEX + 1]) {
    if (cards[n]?.id === target.id) {
      cards[n] = plays[(plays.indexOf(target) + 1 + (seed % (plays.length - 1))) % plays.length]
    }
  }
  return cards
}

export default function CaseSkin({ plays, spin, muted, onRequestSpin, onLand, verb }) {
  const [strip, setStrip] = useState(() => buildStrip(plays, plays[0].id, 0))
  const [offset, setOffset] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [landedIndex, setLandedIndex] = useState(null)
  const viewportRef = useRef(null)
  const markerRef = useRef(null)
  const timeoutsRef = useRef([])
  const lastCount = useRef(0)

  useEffect(() => {
    const clear = () => {
      timeoutsRef.current.forEach(window.clearTimeout)
      timeoutsRef.current = []
    }
    if (spin.count === lastCount.current || !spin.target) return clear
    lastCount.current = spin.count
    clear()

    const vw = viewportRef.current?.clientWidth ?? 640
    const fresh = buildStrip(plays, spin.target.id, spin.count)
    setStrip(fresh)
    setLandedIndex(null)
    setAnimating(false)
    setOffset(0)

    const jitter = (Math.random() - 0.5) * CARD_W * 0.55
    const final = TARGET_INDEX * STRIDE + CARD_W / 2 - vw / 2 + jitter

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimating(true)
        setOffset(final)
      })
    )

    if (!muted) scheduleTicks(final, DURATION, easeFn, STRIDE, sfx.tick, timeoutsRef.current)
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setLandedIndex(TARGET_INDEX)
        const rect = markerRef.current?.getBoundingClientRect()
        onLand(rect ? { x: rect.left + rect.width / 2, y: rect.top + 30 } : undefined)
      }, DURATION + 80)
    )
    return clear
  }, [spin.count, spin.target, muted, onLand, plays])

  const cards = useMemo(() => strip, [strip])

  return (
    <div className="case-skin">
      <div className="case-viewport" ref={viewportRef}>
        <div className="case-shade left" aria-hidden="true" />
        <div className="case-shade right" aria-hidden="true" />
        <div className="case-marker" ref={markerRef} aria-hidden="true" />
        <div
          className="case-strip"
          style={{
            transform: `translateX(${-offset}px)`,
            transition: animating
              ? `transform ${DURATION}ms cubic-bezier(${EASE.join(',')})`
              : 'none',
          }}
        >
          {cards.map((p, i) => (
            <div
              key={`${i}-${p.id}`}
              className={`case-card${landedIndex === i ? ' is-hit' : ''}`}
              style={{ width: CARD_W }}
            >
              <span className="case-emoji" aria-hidden="true">
                {p.emoji}
              </span>
              <span className="case-name">{p.title}</span>
              <span className="case-kicker">{p.kicker}</span>
            </div>
          ))}
        </div>
      </div>
      <button type="button" className="btn go" onClick={onRequestSpin} disabled={spin.spinning}>
        {spin.spinning ? 'Rolling…' : verb}
      </button>
      <p className="stage-hint">or press space</p>
    </div>
  )
}
