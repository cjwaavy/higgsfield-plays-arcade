import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAYS } from './plays.js'
import { useSettings, pickTarget, sfx, fireConfetti, SKIN_IDS } from './engine.js'
import WheelSkin from './skins/Wheel.jsx'
import CaseSkin from './skins/Case.jsx'
import SlotsSkin from './skins/Slots.jsx'
import GachaSkin from './skins/Gacha.jsx'
import DeckSkin from './skins/Deck.jsx'

const SKINS = {
  wheel: { label: 'The Wheel', glyph: '🎡', component: WheelSkin, verb: 'Spin the wheel' },
  case: { label: 'The Case', glyph: '📦', component: CaseSkin, verb: 'Open the case' },
  slots: { label: 'The Slots', glyph: '🎰', component: SlotsSkin, verb: 'Pull the lever' },
  gacha: { label: 'The Gacha', glyph: '🔮', component: GachaSkin, verb: 'Turn the crank' },
  deck: { label: 'The Deck', glyph: '🃏', component: DeckSkin, verb: 'Draw a card' },
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function App() {
  const [settings, updateSettings] = useSettings()
  const [spin, setSpin] = useState({ spinning: false, target: null, count: 0 })
  const [result, setResult] = useState(null)
  const [playbookOpen, setPlaybookOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(null)
  const confettiRef = useRef(null)
  const stageRef = useRef(null)

  const skin = SKINS[settings.skin] ?? SKINS.wheel
  const SkinComponent = skin.component
  const lockedPlay = PLAYS.find((p) => p.id === settings.lockedPlayId) ?? null

  const requestSpin = useCallback(() => {
    setSpin((prev) => {
      if (prev.spinning) return prev
      const target = pickTarget(settings.lockedPlayId, result?.id ?? null)
      return { spinning: true, target, count: prev.count + 1 }
    })
    setPlaybookOpen(false)
  }, [settings.lockedPlayId, result])

  const handleLand = useCallback(
    (origin) => {
      setSpin((prev) => {
        if (!prev.spinning) return prev
        setResult(prev.target)
        if (!settings.muted) sfx.win()
        const canvas = confettiRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const point = origin
            ? { x: origin.x - rect.left, y: origin.y - rect.top }
            : { x: rect.width / 2, y: rect.height * 0.42 }
          fireConfetti(canvas, point)
        }
        return { ...prev, spinning: false }
      })
    },
    [settings.muted]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setModalOpen(false)
        return
      }
      if (modalOpen) return
      const tag = e.target?.tagName
      if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'BUTTON' && tag !== 'SELECT') {
        e.preventDefault()
        requestSpin()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestSpin, modalOpen])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return null
        if (s <= 1) {
          if (!settings.muted) sfx.win()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [secondsLeft, settings.muted])

  const status = spin.spinning ? 'In play' : result ? result.kicker : 'Ready when you are'

  return (
    <div className="shell" data-skin={settings.skin}>
      <div className="grain" aria-hidden="true" />
      <header className="masthead">
        <p className="marquee-lights" aria-hidden="true">
          ✦ ✦ ✦ ✦ ✦ ✦ ✦
        </p>
        <h1 className="wordmark">
          Higgsfield <span>Plays</span>
        </h1>
        <p className="tagline">
          {PLAYS.length} ways to get paid with AI video. <b>Pick a machine. Spin. Go build it.</b>
        </p>
      </header>

      <nav className="skin-rail" aria-label="Choose a machine">
        {SKIN_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`skin-tab${settings.skin === id ? ' is-active' : ''}`}
            onClick={() => {
              if (spin.spinning) return
              updateSettings({ skin: id })
            }}
            aria-pressed={settings.skin === id}
          >
            <span className="glyph" aria-hidden="true">
              {SKINS[id].glyph}
            </span>
            <span className="name">{SKINS[id].label}</span>
          </button>
        ))}
      </nav>

      <main className="stage" ref={stageRef}>
        <p className="eyebrow" aria-live="polite">
          {status}
        </p>
        <SkinComponent
          key={settings.skin}
          plays={PLAYS}
          spin={spin}
          result={result}
          muted={settings.muted}
          onRequestSpin={requestSpin}
          onLand={handleLand}
          verb={skin.verb}
        />
        <canvas ref={confettiRef} className="confetti" aria-hidden="true" />
      </main>

      {result && !spin.spinning && (
        <section className="result" aria-live="polite">
          <h2 className="result-title">
            <span className="result-emoji" aria-hidden="true">
              {result.emoji}
            </span>
            {result.title}
          </h2>
          <p className="hook">{result.hook}</p>
          <button type="button" className="reveal" onClick={() => setPlaybookOpen((v) => !v)}>
            {playbookOpen ? 'Hide the playbook' : 'Show me the playbook →'}
          </button>
          {playbookOpen && <Playbook play={result} />}
        </section>
      )}

      {secondsLeft !== null && (
        <div className={`timer${secondsLeft === 0 ? ' is-done' : ''}`}>
          {secondsLeft === 0 ? "Time's up — ship it" : formatClock(secondsLeft)}
        </div>
      )}

      <div className="actions">
        <button
          type="button"
          className="btn ghost"
          onClick={
            secondsLeft === null
              ? () => setSecondsLeft(settings.sprintMinutes * 60)
              : () => setSecondsLeft(null)
          }
        >
          {secondsLeft === null ? `Start ${settings.sprintMinutes} min sprint` : 'Stop timer'}
        </button>
        <button
          type="button"
          className={`btn icon${lockedPlay ? ' is-locked' : ''}`}
          aria-label={lockedPlay ? `Settings — locked to ${lockedPlay.title}` : 'Settings'}
          onClick={() => setModalOpen(true)}
        >
          <GearIcon />
        </button>
      </div>

      <footer className="footer">
        Price ranges are typical market rates, not guarantees — what you actually charge depends on
        your market and your work. Check Higgsfield's terms and each platform's synthetic-media
        rules before you sell, and disclose AI-generated content to clients and audiences.
      </footer>

      {modalOpen && (
        <SettingsModal
          minutes={settings.sprintMinutes}
          muted={settings.muted}
          lockedPlayId={settings.lockedPlayId}
          onMinutes={(v) => updateSettings({ sprintMinutes: v })}
          onMuted={(v) => updateSettings({ muted: v })}
          onLocked={(v) => updateSettings({ lockedPlayId: v })}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

function Playbook({ play }) {
  const difficultyLabel = ['', 'Anyone can start', 'Some craft required', 'Real skill or spend'][
    play.difficulty
  ]
  return (
    <section className="playbook">
      <div className="facts">
        <div className="fact">
          <p className="k">What you sell</p>
          <p className="v">{play.sell}</p>
        </div>
        <div className="fact">
          <p className="k">Going rate</p>
          <p className="v">{play.price}</p>
        </div>
        <div className="fact">
          <p className="k">First dollar in</p>
          <p className="v">{play.ramp}</p>
        </div>
        <div className="fact">
          <p className="k">Difficulty</p>
          <p className="v">
            <span className="pips" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`pip${n <= play.difficulty ? ' on' : ''}`} />
              ))}
            </span>{' '}
            {difficultyLabel}
          </p>
        </div>
      </div>
      <div className="cols">
        <div className="col">
          <h3>How you make it</h3>
          <ol>
            {play.build.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="col">
          <h3>Where the buyers are</h3>
          <ul>
            {play.find.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="tip">
        <b>The edge:</b> {play.tip}
      </p>
    </section>
  )
}

function SettingsModal({ minutes, muted, lockedPlayId, onMinutes, onMuted, onLocked, onClose }) {
  const locked = PLAYS.find((p) => p.id === lockedPlayId) ?? null
  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Settings</h2>
        <p className="sub">Set up a take, then close this and film.</p>
        <div className="field">
          <div className="field-head">
            <span className="k">Creator mode</span>
          </div>
          <select
            className="select"
            value={lockedPlayId ?? ''}
            onChange={(e) => onLocked(e.target.value || null)}
            aria-label="Which play the spin lands on"
          >
            <option value="">Spin fairly — random result</option>
            {PLAYS.map((p) => (
              <option key={p.id} value={p.id}>
                Always land on {p.title}
              </option>
            ))}
          </select>
          <p className="hint">
            {locked ? (
              <>
                Every machine still runs its full animation and stops on <b>{locked.title}</b>{' '}
                every time. Nothing on the page gives it away.
              </>
            ) : (
              'Pick a play to lock the result before you record, so the take lands on the topic you prepared.'
            )}
          </p>
        </div>
        <div className="field">
          <div className="field-head">
            <span className="k">Sprint</span>
            <span className="v">{minutes} min</span>
          </div>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={minutes}
            onChange={(e) => onMinutes(Number(e.target.value))}
            aria-label="Sprint length in minutes"
          />
          <div className="ends">
            <span>5 min</span>
            <span>120 min</span>
          </div>
        </div>
        <label className="check">
          <input type="checkbox" checked={muted} onChange={(e) => onMuted(e.target.checked)} />
          Mute sound effects
        </label>
        <p className="saved">Saved for next time.</p>
        <button type="button" className="btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
