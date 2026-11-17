# GOD'S EYE // BLACKOUT WATCH

A self-contained, spy-HUD style geospatial dashboard that visualizes **verified global
electronic-system malfunctions** — outages, cyber-physical attacks and their rumor halo —
on a time-scrubbing 3D globe **and** an unrolled (equirectangular) flat map, so you can
replay the month forwards and backwards and watch patterns emerge at global scale.

Concept inspired by the open-source
[God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) project
(Vite + Cesium + pluggable data layers). That stack needs Cesium ion/API keys, so this
overlay ships as a fully self-contained Next.js app implementing the same idea —
no API keys, no database, no paid services required.

## What's inside

- **23 verified events, 11 Oct – 17 Nov 2026 UTC**, aggregated from Downdetector-style
  reporting via news wires and official notices (USA Today, CBS, AP, Guardian, Telegraph,
  Nippon.com, Forbes, fact-checkers). Every event carries citations; nothing is invented.
  Where a source never published a time of day, the event is placed at 12:00 UTC and
  flagged **date-level precision**.
- **Two views:** `GLOBE` (react-globe.gl / three.js, auto-rotating orbital view) and
  `FLAT MAP` (d3-geo equirectangular projection — the whole planet unrolled at once,
  scroll = zoom, drag = pan, double-click = reset).
- **Timeline scrubber:** LIVE jump, PLAY replay at 1H/6H/24H per second, prev/next event
  hops, ±6h steps, drag to scrub anywhere. SCAN WINDOW controls how long a signal stays
  lit (24H/72H/168H/cumulative).
- **Filters:** sector (with ALL/NONE toggles), minimum severity, attack-attributed-only.
- **Pattern analysis panel:** cluster / campaign / cascade / legacy / signal-vs-noise notes.
- **Intel cards:** click any marker, timeline tick or feed row for summary, impact, cause,
  response, duration and source links; attack status is explicitly labeled
  (ATTACK-ATTRIBUTED / NO ATTACK EVIDENCE / ATTRIBUTION UNCLEAR / UNVERIFIED RUMOR).

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · three.js
(react-globe.gl) · d3-geo + world-atlas (flat map). **No database, no env vars, no
external API keys.** The event dataset is plain TypeScript in
`src/lib/events.ts`; a JSON export for other God's Eye deployments lives in
`data/gods-eye-blackout-watch.json` (regenerate with `npm run export:data`, needs bun).

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Node **20.9+** required (22 LTS recommended). First load compiles for a few seconds.

## Deploy

### Vercel (recommended)

Next.js-native, zero config, free tier is plenty for this app:

```bash
# Option A — from GitHub (recommended):
#   1. git init && git add -A && git commit -m "Blackout Watch v1.0"
#   2. push to a new GitHub repo
#   3. vercel.com → Add New Project → import the repo → Deploy (accept defaults)
#
# Option B — from the CLI:
npm i -g vercel
vercel --prod
```

No build overrides needed; Vercel auto-detects Next.js. No environment variables.
`next.config.ts` needs no changes — the defaults work as-is.

### Railway (alternative — fully supported)

Railway suits you if you want the app as an always-on container service:

1. Push the repo to GitHub, then Railway → New Project → Deploy from GitHub repo.
2. Railway (Nixpacks) auto-detects: build = `npm run build`, start =
   `next start` (the `start` script, respects Railway's `PORT`). If it asks, set
   **Start Command**: `npm start`.
3. Add no variables (optional: `NODE_VERSION=22`).
4. Under Settings → Networking, **Generate Domain** to expose port 3000.

## Editing the data

All events, categories, severities and window constants live in
`src/lib/events.ts` (`EVENTS`, `CATEGORY_META`, `SEVERITY_META`,
`WINDOW_START/END`, `DATA_CUTOFF`). Edit, save, and the app hot-reloads.
Keep the honesty policy: every event must cite real sources, and rumor claims stay
in the `rumor` category, segregated from real incidents.

## Map layers for other God's Eye deployments

`data/gods-eye-blackout-watch.json` is a portable layer payload
(`$schema: gods-eye-blackout-watch/v1`) with window metadata, legend definitions and
all events with `lat/lng/ts/category/severity/attackStatus/sources` — feed it into
Cesium-based God's Eye View or any geospatial stack that accepts GeoJSON-style points.
