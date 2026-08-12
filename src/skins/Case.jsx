import { useEffect, useRef, useState } from 'react'
import { cubicBezier, scheduleTicks, sfx } from '../engine.js'
import { LogoCombo } from '../logos.jsx'

const DURATION = 5200
const EASE = [0.05, 0.72, 0.09, 1]
const easeFn = cubicBezier(...EASE)
const GAP = 28
const TARGET_INDEX = 24
const STRIP_LEN = 30

function cardWidth(vw) {
  return Math.min(vw * 0.72, 880)
}

function buildStrip(plays, targetId, seed) {
  const cards = []
  for (let i = 0; i < STRIP_LEN; i++) {
    cards.push(plays[Math.floor(Math.random() * plays.length)])
  }
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
  const [cardW, setCardW] = useState(() => cardWidth(window.innerWidth))
  const [offset, setOffset] = useState(() => {
    const w = cardWidth(window.innerWidth)
    return 1 * (w + GAP) + w / 2 - window.innerWidth / 2
  })
  const [animating, setAnimating] = useState(false)
  const [landedIndex, setLandedIndex] = useState(null)
  const viewportRef = useRef(null)
  const timeoutsRef = useRef([])
  const lastCount = useRef(0)

  useEffect(() => {
    const onResize = () => setCardW(cardWidth(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const clear = () => {
      timeoutsRef.current.forEach(window.clearTimeout)
      timeoutsRef.current = []
    }
    if (spin.count === lastCount.current || !spin.target) return clear
    lastCount.current = spin.count
    clear()

    const vw = viewportRef.current?.clientWidth ?? window.innerWidth
    const w = cardWidth(vw)
    const stride = w + GAP
    setCardW(w)
    const fresh = buildStrip(plays, spin.target.id, spin.count)
    setStrip(fresh)
    setLandedIndex(null)
    setAnimating(false)

    const start = 1 * stride + w / 2 - vw / 2
    setOffset(start)
    const final = TARGET_INDEX * stride + w / 2 - vw / 2

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimating(true)
        setOffset(final)
      })
    )

    if (!muted) scheduleTicks(final - start, DURATION, easeFn, stride, sfx.tick, timeoutsRef.current)
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setLandedIndex(TARGET_INDEX)
        const rect = viewportRef.current?.getBoundingClientRect()
        onLand(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined)
      }, DURATION + 80)
    )
    return clear
  }, [spin.count, spin.target, muted, onLand, plays])

  return (
    <div className="case-skin">
      <div className="case-viewport" ref={viewportRef}>
        <div
          className="case-strip"
          style={{
            gap: GAP,
            transform: `translateX(${-offset}px)`,
            transition: animating
              ? `transform ${DURATION}ms cubic-bezier(${EASE.join(',')})`
              : 'none',
          }}
        >
          {strip.map((p, i) => (
            <div
              key={`${i}-${p.id}`}
              className={`case-card${landedIndex === i ? ' is-hit' : ''}`}
              style={{ width: cardW }}
            >
              <LogoCombo playId={p.id} className="case" />
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
