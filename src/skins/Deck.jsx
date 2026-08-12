import { useEffect, useRef, useState } from 'react'
import { sfx } from '../engine.js'

const TIMES = { gather: 450, shuffle: 2050, fan: 2550, draw: 2950, flip: 3600 }

export default function DeckSkin({ plays, spin, muted, onRequestSpin, onLand, verb }) {
  const [phase, setPhase] = useState('idle') // idle | gather | shuffle | fan | draw | flip
  const [drawnIndex, setDrawnIndex] = useState(3)
  const timeoutsRef = useRef([])
  const drawnRef = useRef(null)
  const lastCount = useRef(0)

  const n = plays.length

  useEffect(() => {
    const clear = () => {
      timeoutsRef.current.forEach(window.clearTimeout)
      timeoutsRef.current = []
    }
    if (spin.count === lastCount.current || !spin.target) return clear
    lastCount.current = spin.count
    clear()

    setDrawnIndex(1 + Math.floor(Math.random() * (n - 2)))
    setPhase('gather')
    if (!muted) sfx.clack()
    const riffle = window.setInterval(() => {
      if (!muted) sfx.tick()
    }, 150)
    timeoutsRef.current.push(
      window.setTimeout(() => setPhase('shuffle'), TIMES.gather),
      window.setTimeout(() => {
        window.clearInterval(riffle)
        setPhase('fan')
      }, TIMES.shuffle),
      window.setTimeout(() => {
        setPhase('draw')
        if (!muted) sfx.clack()
      }, TIMES.fan),
      window.setTimeout(() => {
        setPhase('flip')
        if (!muted) sfx.pop()
      }, TIMES.draw),
      window.setTimeout(() => {
        const rect = drawnRef.current?.getBoundingClientRect()
        onLand(rect ? { x: rect.left + rect.width / 2, y: rect.top } : undefined)
      }, TIMES.flip)
    )
    return () => {
      window.clearInterval(riffle)
      clear()
    }
  }, [spin.count, spin.target, muted, onLand, n])

  const spreadDeg = 52
  const isStacked = phase === 'gather' || phase === 'shuffle'

  return (
    <div className="deck-skin">
      <div className={`deck-table phase-${phase}`}>
        {plays.map((_, i) => {
          const angle = (i - (n - 1) / 2) * (spreadDeg / (n - 1))
          const lift = Math.abs(i - (n - 1) / 2)
          const isDrawn = i === drawnIndex && (phase === 'draw' || phase === 'flip')
          return (
            <div
              key={i}
              ref={i === drawnIndex ? drawnRef : undefined}
              className={[
                'deck-card',
                isStacked ? 'is-stacked' : '',
                phase === 'shuffle' ? `is-shuffling s${i % 4}` : '',
                isDrawn ? 'is-drawn' : '',
                isDrawn && phase === 'flip' ? 'is-flipped' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                '--angle': `${angle}deg`,
                '--lift': `${lift * lift * 3.2}px`,
                '--i': i,
                zIndex: isDrawn ? 40 : 10 + i,
              }}
            >
              <div className="deck-card-inner">
                <div className="deck-face deck-back" aria-hidden="true">
                  <span>HP</span>
                </div>
                <div className="deck-face deck-front">
                  <span className="deck-corner tl" aria-hidden="true">
                    ✦
                  </span>
                  <span className="deck-emoji" aria-hidden="true">
                    {spin.target?.emoji ?? '✦'}
                  </span>
                  <span className="deck-title">{spin.target?.title ?? ''}</span>
                  <span className="deck-kicker">{spin.target?.kicker ?? ''}</span>
                  <span className="deck-corner br" aria-hidden="true">
                    ✦
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <button type="button" className="btn go" onClick={onRequestSpin} disabled={spin.spinning}>
        {spin.spinning ? 'Shuffling…' : verb}
      </button>
      <p className="stage-hint">or press space</p>
    </div>
  )
}
