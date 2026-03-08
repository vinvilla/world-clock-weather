# Sun & Moon Feature — Design Document
**Project:** World Clock & Weather Dashboard
**Feature:** Day/Night Timeline Strip + City Card Solar Enrichment
**Date:** 2026-03-08
**Status:** Approved

---

## Overview

Add real-astronomy sun and moon data to the dashboard in two layers:
1. **DayNightStrip** — a full-width horizontal timeline spanning GMT-12 to GMT+14 showing the live day/night gradient with city pins
2. **City card enrichment** — each card gains sunrise/sunset times, day/night state, countdown to next transition, moon phase, and full moon watch data

No backend changes. All computation is pure frontend using the `suncalc` library.

---

## Architecture

### New dependency
`suncalc` (~9KB, zero sub-dependencies) installed in `frontend/`.

### New files
```
frontend/src/
  utils/solar.js        ← pure functions: getSolarData(city), buildStripGradient()
  DayNightStrip.jsx     ← GMT timeline strip component
  DayNightStrip.css     ← strip-specific styles
```

### Modified files
- `frontend/src/App.jsx` — add lat/lon to CITIES, mount solar state, render `<DayNightStrip>`
- `frontend/src/CityCard.jsx` — render solar enrichment section
- `frontend/src/App.css` — card solar section styles

### Data flow
1. On mount + every 60s, `App.jsx` calls `getSolarData()` for all cities → stores in `solarMap` state
2. Each `CityCard` receives its city's solar data as a prop
3. `DayNightStrip` receives the full `solarMap` + renders the gradient timeline

---

## City Data: lat/lon additions

Each city in the `CITIES` array gains `lat` and `lon`:

| City | lat | lon | UTC offset example |
|------|-----|-----|--------------------|
| New York | 40.71 | -74.01 | UTC-5 (EST) |
| Los Angeles | 34.05 | -118.24 | UTC-8 (PST) |
| London | 51.51 | -0.13 | UTC+0 (GMT) |
| Chennai | 13.08 | 80.27 | UTC+5:30 (IST) |
| Singapore | 1.35 | 103.82 | UTC+8 (SGT) |

---

## City Card Enrichment

Each card gains a new solar section below the weather row:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━
☀️  Day
↑ 6:42 AM    ↓ 6:31 PM
Sunset in 2h 14m

🌔 Waxing Gibbous  74%
Last full moon:  3 days ago
Next full moon:  Mar 14  (in 6 days)
```

### Solar data per city (from `suncalc.getTimes()`)
- `isDay` — boolean: current time between `sunrise` and `sunset`
- `sunrise` / `sunset` — formatted in city's local timezone
- `nextEvent` — whichever of sunrise/sunset comes next; countdown in `Xh Ym`

### Moon data (global, same value for all cities)
- Phase fraction from `suncalc.getMoonIllumination(now).phase` (0–1)
- Phase name + emoji mapped from 8 equal segments of the 29.53-day cycle
- Illumination % = `Math.round(fraction * 100)`
- **Days since last full moon**: if phase ≥ 0.5 → `(phase − 0.5) × 29.53`; else → `(phase + 0.5) × 29.53`
- **Next full moon date**: walk forward day-by-day until `getMoonIllumination(d).phase` crosses 0.5; format to each city's local timezone so the calendar date is correct per city

### Moon phase map
| Range | Emoji | Name |
|-------|-------|------|
| 0–0.0625 | 🌑 | New Moon |
| 0.0625–0.1875 | 🌒 | Waxing Crescent |
| 0.1875–0.3125 | 🌓 | First Quarter |
| 0.3125–0.4375 | 🌔 | Waxing Gibbous |
| 0.4375–0.5625 | 🌕 | Full Moon |
| 0.5625–0.6875 | 🌖 | Waning Gibbous |
| 0.6875–0.8125 | 🌗 | Last Quarter |
| 0.8125–1.0 | 🌘 | Waning Crescent |

---

## DayNightStrip Component

### Layout
Full-width strip placed between the app header and the city grid.

```
GMT  -12  -10   -8   -6   -4   -2    0   +2   +4   +6   +8  +10  +12  +14
      ████████████▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓░░░░░░░▓▓████████████
           🗽                 🏙️                🇮🇳     🇸🇬
         New York           London           Chennai  Singapore
                              ▲ NOW
```

### Day/night gradient
- Iterate UTC offsets from -12 to +14 in 0.5h steps (52 samples)
- For each offset, pick a representative latitude (equator, lat=0) and compute `suncalc.getTimes()` for `lon = offset * 15`
- Classify each sample as: **night** / **astronomical twilight** / **nautical twilight** / **civil twilight** / **day**
- Build a CSS `linear-gradient` string with colour stops:
  - Night: `rgba(10, 10, 30, 0.95)`
  - Astronomical twilight: `rgba(20, 20, 60, 0.8)`
  - Nautical twilight: `rgba(40, 30, 80, 0.7)`
  - Civil twilight: `rgba(180, 100, 40, 0.6)` (amber glow)
  - Day: `rgba(135, 180, 255, 0.35)` (light blue)

### City pins
- Each city's UTC offset computed from `Intl.DateTimeFormat` with its timezone at current time
- Pin position: `(utcOffset + 12) / 26 * 100%` left
- Pin shows: day/night emoji + city name label below
- Labels hidden on mobile (<580px), icons remain

### NOW marker
- Vertical line at current UTC offset (browser's local offset)
- Labelled "NOW" above the strip
- Updates every 60s with the gradient

### Update cadence
- Solar gradient + city pins recomputed every 60s via `setInterval` in `App.jsx`
- No API calls — pure math, negligible CPU

---

## Non-functional impacts

- **NFR-05.3 updated**: source file count in `src/` increases (adds `utils/`, `DayNightStrip.jsx`, `DayNightStrip.css`)
- **NFR-01**: solar computation is synchronous and sub-millisecond; no performance impact
- **Bundle size**: `suncalc` adds ~9KB gzipped — well within NFR-01.4 budget

---

## Out of scope (this iteration)
- Supabase / persistence (not needed — all computed client-side)
- Animated sun/moon arc across the strip (future enhancement)
- Configurable city list from UI (separate feature)
