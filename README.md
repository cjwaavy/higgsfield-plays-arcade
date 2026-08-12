# Higgsfield Plays — Arcade Edition

Seven ways to get paid with AI video. Five machines to pick one.

A night-arcade spinner for choosing a Higgsfield money-making play. Every machine runs the
same seven plays and the same playbooks — the skins are the show:

- 🎡 **The Wheel** — classic prize wheel with tapering spin
- 📦 **The Case** — case-opening horizontal carousel with a center marker
- 🎰 **The Slots** — three reels, a lever, and a jackpot line
- 🔮 **The Gacha** — crank the machine, pop the capsule
- 🃏 **The Deck** — shuffle the deck, draw a card, flip it

Confetti on every landing. Web-audio ticks that genuinely taper with the easing curve.

## Creator mode (rigging)

Open settings (gear) and lock the result, or visit `?land=yt-shorts`. Every machine still
runs its full animation and stops on the locked play. The URL param is consumed and
scrubbed from the address bar so nothing on screen gives it away. `?skin=wheel|case|slots|gacha|deck`
pre-selects a machine the same way.

Space bar spins. Sprint timer and mute live in settings. Everything persists in localStorage.

## Dev

```sh
npm install
npm run dev    # local dev server
npm run build  # production build to dist/
```

Vite + React, no other runtime dependencies.
