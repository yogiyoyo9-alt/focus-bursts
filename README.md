# Focus Bursts

> One task. One burst. Repeat.

A minimal, distraction-free **Pomodoro-style focus timer** that lives in a single
HTML file. No build step, no dependencies, no account — open it in a browser and start
a burst.

## Features

- **Pick a burst length** — 5, 15, 25, or 45 minutes.
- **Animated progress ring** that winds down as you focus.
- **Start / pause / resume / reset** controls, plus a `Space` shortcut to start or pause.
- **Pleasant two-note chime** when a burst completes (generated with the Web Audio API — no sound files needed).
- **Daily stats** — bursts completed, minutes focused, and how many you've done in a row.
- **Today's session log** of what you worked on and when.
- **Tab title flashes** "✅ Burst complete!" so you notice even on another tab.
- **Your data stays local** — sessions are saved in the browser's `localStorage`, scoped per day. Nothing is sent anywhere.

## Usage

No installation required.

1. Open `index.html` in any modern web browser (double-click it, or drag it into a browser window).
2. Type what you're focusing on.
3. Choose a burst length and press **Start**.

That's it. To clear today's log, use the **clear** button under "Today's bursts".

## How it works

Everything — markup, styling, and logic — lives in [`index.html`](index.html). The timer
uses a single `setInterval` tick, the progress ring is an SVG `stroke-dashoffset`
animation, and completed sessions are persisted to `localStorage` under a per-day key
(e.g. `fb-2026-06-06`), so each day starts with a fresh slate.
