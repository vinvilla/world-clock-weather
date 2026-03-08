# Test Cases
**Project:** World Clock & Weather Dashboard
**Version:** 1.0
**Date:** 2026-03-08

---

## Overview

42 automated tests across 4 test suites, all living in `frontend/src/__tests__/`.

Run the full suite:
```bash
cd frontend
npm test -- --watchAll=false --forceExit
```

Expected output: `Tests: 42 passed, 42 total`

---

## Suite 1: `solar.test.js` — Solar Utility Functions

Tests the pure functions in `frontend/src/utils/solar.js`.

### TC-S01: `getUTCOffset`

| ID | Test Name | Inputs | Expected Output |
|----|-----------|--------|-----------------|
| TC-S01.1 | London in March is UTC+0 | timezone=`Europe/London`, date=`2026-03-08T12:00Z` | `0` |
| TC-S01.2 | New York in March is UTC-4 (EDT — DST active 2026-03-08) | timezone=`America/New_York`, date=`2026-03-08T12:00Z` | `-4` |
| TC-S01.3 | Singapore is always UTC+8 | timezone=`Asia/Singapore`, date=`2026-03-08T12:00Z` | `8` |

> Note: New York returns -4 (EDT), not -5 (EST), because DST springs forward on the second Sunday of March. In 2026, that is March 8 — the exact test date.

---

### TC-S02: `getSolarData`

| ID | Test Name | Inputs | Expected Output |
|----|-----------|--------|-----------------|
| TC-S02.1 | Returns isDay=true for London at noon | lat=51.51, lon=-0.13, date=noon UTC | `isDay: true` |
| TC-S02.2 | Returns isDay=false for London at midnight | lat=51.51, lon=-0.13, date=midnight UTC | `isDay: false` |
| TC-S02.3 | Returns formatted sunrise/sunset strings | London, noon UTC | Both match `H:MM AM/PM` regex |
| TC-S02.4 | Returns countdown string | London, noon UTC | Matches `"Sunrise/Sunset in Xh Ym"` |
| TC-S02.5 | Returns utcOffset as number | London, noon UTC | `typeof utcOffset === 'number'` |

---

### TC-S03: `getMoonData`

| ID | Test Name | Inputs | Expected Output |
|----|-----------|--------|-----------------|
| TC-S03.1 | Phase is within 0–1 | `2026-03-08T12:00Z`, UTC | `0 ≤ phase < 1` |
| TC-S03.2 | Illumination is within 0–100 | `2026-03-08T12:00Z`, UTC | `0 ≤ illumination ≤ 100` |
| TC-S03.3 | phaseName is a non-empty string | `2026-03-08T12:00Z`, UTC | string length > 0 |
| TC-S03.4 | phaseEmoji is a string | `2026-03-08T12:00Z`, UTC | typeof string |
| TC-S03.5 | daysSinceFullMoon ≥ 0 | `2026-03-08T12:00Z`, UTC | `≥ 0` |
| TC-S03.6 | nextFullMoonDate is a Date instance | `2026-03-08T12:00Z`, UTC | instanceof Date |
| TC-S03.7 | nextFullMoonLabel is "Mon DD" format | `2026-03-08T12:00Z`, UTC | Matches `"Mar 14"` pattern |
| TC-S03.8 | daysToNextFullMoon is positive | `2026-03-08T12:00Z`, UTC | `> 0` |
| TC-S03.9 | daysSinceFullMoon ~14–15 days at new moon | known new moon date `2026-01-20T12:00Z` | `13 ≤ days ≤ 17` |

> TC-S03.9 is the moon watch boundary test: at new moon (phase ≈ 0) we are roughly halfway through the 29.53-day cycle, so days since the previous full moon should be ~14.8 days.

---

### TC-S04: `getMoonPhaseName`

| ID | Test Name | Input phase | Expected |
|----|-----------|-------------|----------|
| TC-S04.1 | 0.0 = New Moon | `0.0` | `{ name: 'New Moon', emoji: '🌑' }` |
| TC-S04.2 | 0.5 = Full Moon | `0.5` | `{ name: 'Full Moon', emoji: '🌕' }` |
| TC-S04.3 | 0.25 = First Quarter | `0.25` | `{ name: 'First Quarter', emoji: '🌓' }` |
| TC-S04.4 | 0.75 = Last Quarter | `0.75` | `{ name: 'Last Quarter', emoji: '🌗' }` |

**Phase boundary map (8 equal segments of the 29.53-day cycle):**

| Phase range | Name | Emoji |
|-------------|------|-------|
| 0.0 – 0.0625 | New Moon | 🌑 |
| 0.0625 – 0.1875 | Waxing Crescent | 🌒 |
| 0.1875 – 0.3125 | First Quarter | 🌓 |
| 0.3125 – 0.4375 | Waxing Gibbous | 🌔 |
| 0.4375 – 0.5625 | Full Moon | 🌕 |
| 0.5625 – 0.6875 | Waning Gibbous | 🌖 |
| 0.6875 – 0.8125 | Last Quarter | 🌗 |
| 0.8125 – 1.0 | Waning Crescent | 🌘 |

---

### TC-S05: `buildStripGradient`

| ID | Test Name | Input | Expected |
|----|-----------|-------|----------|
| TC-S05.1 | Returns a CSS linear-gradient string | `2026-03-08T12:00Z` | starts with `"linear-gradient"` |
| TC-S05.2 | Contains percentage colour stops | `2026-03-08T12:00Z` | contains `"%"` |

---

## Suite 2: `App.solar.test.js` — App-Level Solar Integration

Tests that the root `App` component mounts correctly with solar state initialized.

Fetch is mocked to return a stub weather response (temp 70°F, clear sky, icon `01d`) so no real API calls are made.

| ID | Test Name | Expected |
|----|-----------|----------|
| TC-A01 | App renders without crashing with solar data | `"Hello, New York!"` is in the document |
| TC-A02 | App renders the DayNightStrip component | element with `data-testid="day-night-strip"` is in the document |

---

## Suite 3: `DayNightStrip.test.js` — DayNightStrip Component

Tests the full-width GMT timeline strip rendered between the app header and city grid.

Fixture data: 3 cities (New York night UTC-5, London day UTC+0, Singapore day UTC+8) with stub solar map.

| ID | Test Name | Expected |
|----|-----------|----------|
| TC-D01 | Renders the strip container | element with `data-testid="day-night-strip"` present |
| TC-D02 | Renders a city name pin for each city | "New York", "London", "Singapore" all in document |
| TC-D03 | Renders the NOW marker | text "NOW" present |
| TC-D04 | Renders the GMT axis label | text "GMT" present |
| TC-D05 | Day city shows sun emoji ☀️ | at least one ☀️ rendered |
| TC-D06 | Night city shows moon emoji 🌙 | at least one 🌙 rendered |

---

## Suite 4: `CityCard.solar.test.js` — CityCard Solar Enrichment

Tests the solar section rendered at the bottom of each city card.

Fixture: London card with `isDay=true`, sunrise 6:42 AM, sunset 6:31 PM, countdown "Sunset in 2h 14m", Waxing Gibbous 74%, last full moon 3 days ago, next full moon Mar 14 (6 days).

| ID | Test Name | Expected |
|----|-----------|----------|
| TC-C01 | Shows sunrise time | "6:42 AM" in document |
| TC-C02 | Shows sunset time | "6:31 PM" in document |
| TC-C03 | Shows countdown | "Sunset in 2h 14m" in document |
| TC-C04 | Shows "Day" label when isDay=true | "Day" in document |
| TC-C05 | Shows "Night" label when isDay=false | "Night" in document |
| TC-C06 | Shows moon phase name | "Waxing Gibbous" in document |
| TC-C07 | Shows moon illumination percentage | "74%" in document |
| TC-C08 | Shows days since last full moon | "3 days ago" in document |
| TC-C09 | Shows next full moon label | "Mar 14" in document |
| TC-C10 | Shows days to next full moon | "6 days" in document |
| TC-C11 | Renders gracefully when solarData is undefined | card renders without crash, "Hello, London!" visible |

> TC-C11 guards against the case where solar data hasn't loaded yet (first render before the 60-second interval fires). The solar section is simply omitted; the rest of the card is unaffected.

---

## Test Coverage Summary

| Suite | File | Tests | Feature area |
|-------|------|-------|--------------|
| solar.test.js | `utils/solar.js` | 23 | UTC offsets, sunrise/sunset, moon phase, gradient |
| App.solar.test.js | `App.jsx` | 2 | Root component with solar state |
| DayNightStrip.test.js | `DayNightStrip.jsx` | 6 | GMT timeline strip rendering |
| CityCard.solar.test.js | `CityCard.jsx` | 11 | Card solar enrichment + moon watch data |
| **Total** | | **42** | |

---

## Key Design Decisions Reflected in Tests

1. **DST-aware UTC offset**: TC-S01.2 tests New York as UTC-4 (EDT), not UTC-5 (EST), because the test date 2026-03-08 is exactly the DST spring-forward day. This ensures `getUTCOffset` uses the real `Intl` API rather than hardcoded offsets.

2. **Moon watch boundary (TC-S03.9)**: The 13–17 day range at new moon validates the `daysSinceFullMoon` formula across both branches of the ternary (`phase ≥ 0.5` vs `phase < 0.5`).

3. **Null safety (TC-C11)**: Solar data loads asynchronously; the card must not crash when `solarData` is `undefined` on first render.

4. **No real API calls**: App.solar.test.js mocks `global.fetch` to prevent network calls, so tests run offline and deterministically.
