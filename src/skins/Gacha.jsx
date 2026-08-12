import { useEffect, useMemo, useRef, useState } from 'react'
import { sfx } from '../engine.js'

const CAPSULE_TONES = [
  ['#ff4d5a', '#ffe8ea'],
  ['#39e6c8', '#e6fffa'],
  ['#f5c542', '#fff7dd'],
  ['#7dd3fc', '#eef9ff'],
  ['#c084fc', '#f6eeff'],
  ['#ff9d2e', '#fff1e0'],
]

const TIMES = { drop: 1500, wobble: 2350, pop: 3050, land: 3400 }

function scatterCapsules(n) {
  return Array.from({ length: n }, (_, i) => {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random()) * 34
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 58 + Math.sin(angle) * radius * 0.72,
      tone: CAPSULE_TONES[i % CAPSULE_TONES.length],
      delay: Math.random() * 0.7,
      size: 26 + Math.random() * 10,
    }
  })
}

export default function GachaSkin({ plays, spin, muted, onRequestSpin, onLand, verb }) {
  const [phase, setPhase] = useState('idle') // idle | crank | drop | wobble | pop
  const [tone, setTone] = useState(CAPSULE_TONES[0])
  const capsules = useMemo(() => scatterCapsules(12), [])
  const timeoutsRef = useRef([])
  const trayRef = useRef(null)
  const lastCount = useRef(0)

  useEffect(() => {
    const clear = () => {
      timeoutsRef.current.forEach(window.clearTimeout)
      timeoutsRef.current = []
    }
    if (spin.count === lastCount.current || !spin.target) return clear
    lastCount.current = spin.count
    clear()

    setTone(CAPSULE_TONES[Math.floor(Math.random() * CAPSULE_TONES.length)])
    setPhase('crank')
    if (!muted) sfx.clunk()
    const rattle = window.setInterval(() => {
      if (!muted) sfx.tick()
    }, 190)
    timeoutsRef.current.push(
      window.setTimeout(() => {
        window.clearInterval(rattle)
        setPhase('drop')
        if (!muted) sfx.clack()
      }, TIMES.drop),
      window.setTimeout(() => setPhase('wobble'), TIMES.wobble),
      window.setTimeout(() => {
        setPhase('pop')
        if (!muted) sfx.pop()
      }, TIMES.pop),
      window.setTimeout(() => {
        const rect = trayRef.current?.getBoundingClientRect()
        onLand(rect ? { x: rect.left + rect.width / 2, y: rect.top } : undefined)
      }, TIMES.land)
    )
    return () => {
      window.clearInterval(rattle)
      clear()
    }
  }, [spin.count, spin.target, muted, onLand])

  const cranking = phase === 'crank'
  const capsuleOut = phase === 'drop' || phase === 'wobble' || phase === 'pop'

  return (
    <div className="gacha-skin">
      <div className={`gacha-machine phase-${phase}`}>
        <div className="gacha-dome">
          {capsules.map((c, i) => (
            <span
              key={i}
              className={`gacha-capsule${cranking ? ' is-rattling' : ''}`}
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: c.size,
                height: c.size,
                animationDelay: `${c.delay}s`,
                '--top': c.tone[0],
                '--bottom': c.tone[1],
              }}
            />
          ))}
          <div className="gacha-dome-shine" aria-hidden="true" />
        </div>
        <div className="gacha-body">
          <button
            type="button"
            className={`gacha-crank${cranking ? ' is-turning' : ''}`}
            onClick={onRequestSpin}
            disabled={spin.spinning}
            aria-label={verb}
          >
            <span className="crank-cross" />
          </button>
          <div className="gacha-chute" aria-hidden="true" />
        </div>
        <div className="gacha-tray" ref={trayRef}>
          {capsuleOut && (
            <div
              className={`gacha-prize ${phase}`}
              style={{ '--top': tone[0], '--bottom': tone[1] }}
            >
              <span className="prize-top" aria-hidden="true" />
              <span className="prize-bottom" aria-hidden="true" />
              {phase === 'pop' && (
                <span className="prize-reveal" aria-hidden="true">
                  {spin.target?.emoji}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <button type="button" className="btn go" onClick={onRequestSpin} disabled={spin.spinning}>
        {spin.spinning ? 'Vending…' : verb}
      </button>
      <p className="stage-hint">or press space</p>
    </div>
  )
}
