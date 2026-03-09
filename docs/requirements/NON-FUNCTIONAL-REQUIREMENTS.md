# Non-Functional Requirements
**Project:** World Clock & Weather Dashboard
**Version:** 1.2
**Date:** 2026-03-08

---

## NFR-01: Performance

| ID | Requirement |
|----|-------------|
| NFR-01.1 | Weather data must load within 3 seconds on a standard broadband connection |
| NFR-01.2 | Clock ticks must render within 50ms of each second boundary |
| NFR-01.3 | Claude AI responses must appear within 5 seconds for Q&A and summarize features |
| NFR-01.4 | Page initial load (JS bundle) must complete within 5 seconds on broadband |

## NFR-02: Security

| ID | Requirement |
|----|-------------|
| NFR-02.1 | The Anthropic API key must never be exposed in the browser bundle or network requests |
| NFR-02.2 | All Claude API calls must be proxied through the Express backend |
| NFR-02.3 | API keys must be stored in `.env` / `.env.local` files and excluded from git via `.gitignore` |
| NFR-02.4 | The OpenWeatherMap API key is stored in `.env.local` with `REACT_APP_` prefix (CRA convention) |

## NFR-03: Reliability

| ID | Requirement |
|----|-------------|
| NFR-03.1 | The app must not crash if one or more OpenWeatherMap API calls fail |
| NFR-03.2 | The app must not crash if the backend is unreachable (Claude features show an error message) |
| NFR-03.3 | Each city's clock must continue to tick regardless of weather fetch status |

## NFR-04: Usability

| ID | Requirement |
|----|-------------|
| NFR-04.1 | Loading state must use skeleton cards (not a spinner) to prevent layout shift |
| NFR-04.2 | AI response area shows "Claude is thinking..." while waiting |
| NFR-04.3 | All interactive buttons must be disabled during an in-progress AI request |
| NFR-04.4 | The UI must work correctly in the latest versions of Chrome, Firefox, and Safari |

## NFR-05: Maintainability

| ID | Requirement |
|----|-------------|
| NFR-05.1 | Cities and their timezones must be defined in a single `CITIES` constant — no duplication |
| NFR-05.2 | Component styles may live in a paired CSS file (e.g. `DayNightStrip.css`) — no inline styles, no CSS-in-JS |
| NFR-05.3 | Pure utility functions must live in `src/utils/` — not scattered in component files |
| NFR-05.4 | Backend routes must be self-contained in `server.js` |
| NFR-05.5 | Solar/astronomy computation must be isolated in `utils/solar.js` — not embedded in components |

## NFR-06: API Usage Limits

| ID | Requirement |
|----|-------------|
| NFR-06.1 | OpenWeatherMap: weather is fetched once on mount — no auto-refresh (free tier: 1,000 calls/day) |
| NFR-06.2 | Anthropic: use `claude-haiku-4-5` model for all AI panel calls to minimise cost |
| NFR-06.3 | Claude max_tokens capped at 500 for search, 400 for Q&A, 300 for summary |

## NFR-07: Solar Feature

| ID | Requirement |
|----|-------------|
| NFR-07.1 | Solar data (sunrise, sunset, moon phase) must update every 60 seconds — no more frequently |
| NFR-07.2 | The suncalc library must remain the only astronomy dependency — no additional solar APIs |
| NFR-07.3 | The day/night strip gradient must render without perceptible layout shift or flicker on update |
| NFR-07.4 | suncalc bundle addition must not cause initial page load to exceed the NFR-01.4 5-second budget |

### NFR-08: Security

| ID | Requirement |
|----|-------------|
| NFR-08.1 | The Supabase anon key is safe to expose in the frontend bundle; access is governed by RLS policies |
| NFR-08.2 | The OWM API key must remain server-side only; frontend geocoding requests go through the `/api/geocode` proxy |
| NFR-08.3 | Supabase `user_cities` RLS policy enforces that users can only read, insert, update, and delete their own rows |
