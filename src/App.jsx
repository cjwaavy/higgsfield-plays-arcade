import { useCallback, useEffect, useRef, useState } from 'react'
import { PLAYS } from './plays.js'
import { useSettings, pickTarget, sfx, fireConfetti, setVolume, volumeToGain } from './engine.js'
import { BrandTile, HiggsfieldTile } from './logos.jsx'
import WheelSkin from './skins/Wheel.jsx'
import CaseSkin from './skins/Case.jsx'
import SlotsSkin from './skins/Slots.jsx'

const SKINS = {
  wheel: { label: 'The Wheel', glyph: '🎡', component: WheelSkin, verb: 'Spin the wheel' },
  case: { label: 'The Case', glyph: '📦', component: CaseSkin, verb: 'Open the case' },
  slots: { label: 'The Slots', glyph: '🎰', component: SlotsSkin, verb: 'Pull the lever' },
}

const TIP_KEY = 'higgsfield-plays.tipSeen'

export default function App() {
  const [settings, updateSettings] = useSettings()
  const [spin, setSpin] = useState({ spinning: false, target: null, count: 0 })
  const [result, setResult] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const confettiRef = useRef(null)
  const stageRef = useRef(null)

  useEffect(() => {
    try {
      if (!localStorage.getItem(TIP_KEY)) {
        setShowTip(true)
        localStorage.setItem(TIP_KEY, '1')
        const id = window.setTimeout(() => setShowTip(false), 9000)
        return () => window.clearTimeout(id)
      }
    } catch {}
  }, [])

  useEffect(() => {
    setVolume(settings.muted ? 0 : volumeToGain(settings.volume))
  }, [settings.muted, settings.volume])

  const skin = SKINS[settings.skin] ?? SKINS.wheel
  const SkinComponent = skin.component
  const lockedPlay = PLAYS.find((p) => p.id === settings.lockedPlayId) ?? null

  const requestSpin = useCallback(() => {
    setSpin((prev) => {
      if (prev.spinning) return prev
      const target = pickTarget(settings.lockedPlayId, result?.id ?? null)
      return { spinning: true, target, count: prev.count + 1 }
    })
    setOverlayOpen(false)
  }, [settings.lockedPlayId, result])

  const handleLand = useCallback(
    (origin) => {
      setSpin((prev) => {
        if (!prev.spinning) return prev
        setResult(prev.target)
        setOverlayOpen(true)
        if (!settings.muted) {
          sfx.win()
          sfx.confetti()
        }
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
        setOverlayOpen(false)
        return
      }
      if (modalOpen) return
      const tag = e.target?.tagName
      if (e.code === 'Space' && tag !== 'INPUT' && tag !== 'BUTTON' && tag !== 'SELECT') {
        e.preventDefault()
        if (overlayOpen) {
          setOverlayOpen(false)
          return
        }
        requestSpin()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [requestSpin, modalOpen, overlayOpen])

  const status = spin.spinning ? 'In play' : result ? result.kicker : 'Ready when you are'

  return (
    <div className="shell" data-skin={settings.skin}>
      <div className="grain" aria-hidden="true" />
      <button
        type="button"
        className="btn icon fullscreen-btn"
        aria-label="Toggle fullscreen"
        onClick={() => {
          if (document.fullscreenElement) document.exitFullscreen()
          else document.documentElement.requestFullscreen?.()
        }}
      >
        <FullscreenIcon />
      </button>
      {showTip && (
        <div className="first-tip fs-tip" role="status" onClick={() => setShowTip(false)}>
          go fullscreen for filming
        </div>
      )}

      <div className="machine-menu">
        <button
          type="button"
          className="btn icon hamburger-btn"
          aria-label="Choose a machine"
          aria-expanded={menuOpen}
          onClick={() => {
            setMenuOpen((v) => !v)
            setShowTip(false)
          }}
        >
          <BurgerIcon />
        </button>
        {menuOpen && (
          <div className="menu-panel" role="menu">
            {Object.keys(SKINS).map((id) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                className={`menu-item${settings.skin === id ? ' is-active' : ''}`}
                onClick={() => {
                  if (!spin.spinning) updateSettings({ skin: id })
                  setMenuOpen(false)
                }}
              >
                <span aria-hidden="true">{SKINS[id].glyph}</span> {SKINS[id].label}
              </button>
            ))}
          </div>
        )}
        {showTip && !menuOpen && (
          <div className="first-tip" role="status" onClick={() => setShowTip(false)}>
            <b>☰ switch machines</b> · click the wheel to spin · ⚙ rigs the result
          </div>
        )}
      </div>

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
      </main>

      <canvas ref={confettiRef} className="confetti" aria-hidden="true" />

      {overlayOpen && result && (
        <div
          className="win-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`You landed on ${result.title}`}
          onClick={() => setOverlayOpen(false)}
        >
          <p className="win-kicker">{result.kicker}</p>
          <h2 className="win-title">{result.title}</h2>
          <div className="win-lockup">
            <BrandTile playId={result.id} />
            <span className="win-x" aria-hidden="true">
              ×
            </span>
            <HiggsfieldTile />
          </div>
          <p className="win-hint">tap anywhere to close</p>
        </div>
      )}

      <div className="actions">
        <button
          type="button"
          className={`btn icon${lockedPlay ? ' is-locked' : ''}`}
          aria-label={lockedPlay ? `Settings — locked to ${lockedPlay.title}` : 'Settings'}
          onClick={() => setModalOpen(true)}
        >
          <GearIcon />
        </button>
      </div>

      {modalOpen && (
        <SettingsModal
          muted={settings.muted}
          volume={settings.volume}
          lockedPlayId={settings.lockedPlayId}
          onMuted={(v) => updateSettings({ muted: v })}
          onVolume={(v) => updateSettings({ volume: v })}
          onLocked={(v) => updateSettings({ lockedPlayId: v })}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

function SettingsModal({ muted, volume, lockedPlayId, onMuted, onVolume, onLocked, onClose }) {
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
            <span className="k">Volume</span>
            <span className="v">{volume <= 100 ? `${volume}%` : `+${volume - 100}dB`}</span>
          </div>
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={120}
            step={5}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value)
              onVolume(v)
              setVolume(muted ? 0 : volumeToGain(v))
              if (!muted && v > 0) sfx.clack()
            }}
            aria-label="Sound volume, values past 100 boost up to +20dB"
          />
          <div className="ends">
            <span>0</span>
            <span>100%</span>
            <span className="boost-label">+20dB</span>
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

function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
