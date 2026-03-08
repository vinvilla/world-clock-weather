---
name: adding-cities
description: This skill should be used when the user asks to "add a city", "remove a city", "change a city", "add Tokyo" (or any city name), or "update the city list" in the world-clock-weather project.
---

# Adding Cities to World Clock & Weather

## Critical: Two Separate CITIES Arrays

There are **two independent CITIES arrays** that must BOTH be updated. They have different schemas and neither imports from the other.

| File | Location | Schema |
|------|----------|--------|
| `frontend/src/App.jsx` | line 6 | `{ name, timezone, query }` |
| `backend/server.js` | line 13 | `{ name, timezone, region }` |

Missing one causes a silent runtime bug — no build error fires.

## Frontend Entry: `frontend/src/App.jsx`

```js
{ name: 'Tokyo', timezone: 'Asia/Tokyo', query: 'Tokyo,JP' }
```

- `name` — display name shown on the card
- `timezone` — IANA tz database string (see table below)
- `query` — OpenWeatherMap city query: `"CityName,CountryCode"` — **no space after comma**, **two-letter ISO 3166-1 alpha-2 country code**

## Backend Entry: `backend/server.js`

```js
{ name: 'Tokyo', timezone: 'Asia/Tokyo', region: 'Asia' }
```

- `name` — must match the frontend `name` exactly (used as the key in `weatherData`)
- `timezone` — same IANA string as frontend
- `region` — used by Claude's `filter_cities` tool for search queries. Valid values from existing entries: `'Americas'`, `'Europe'`, `'Asia'`

## IANA Timezone Reference

| City | Correct IANA timezone |
|------|-----------------------|
| Tokyo, Japan | `Asia/Tokyo` |
| Sydney, Australia | `Australia/Sydney` |
| Dubai, UAE | `Asia/Dubai` |
| Paris, France | `Europe/Paris` |
| São Paulo, Brazil | `America/Sao_Paulo` |
| Toronto, Canada | `America/Toronto` |
| Chicago, US | `America/Chicago` |
| Seoul, South Korea | `Asia/Seoul` |

**Do NOT use**: abbreviations (`JST`, `GMT+9`), POSIX names (`Japan`), or UTC offsets.

## OpenWeatherMap Query Format

Pattern: `"CityName,CountryCode"` — no space, two-letter country code only.

| City | Correct query |
|------|---------------|
| Tokyo | `Tokyo,JP` |
| Sydney | `Sydney,AU` |
| Dubai | `Dubai,AE` |
| Paris | `Paris,FR` |
| Toronto | `Toronto,CA` |

Wrong: `'Tokyo, Japan'`, `'Tokyo, JP'`, `'Tokyo,JA'`, `'Tokyo,JAP'`

## Also Update: Hardcoded City Count

`frontend/src/App.jsx` line 56 has a hardcoded count in the subtitle:

```jsx
<p>Live time and weather across 5 cities</p>
```

Update the number when adding or removing cities.

## Common Mistakes

| Mistake | Why it's wrong |
|---------|----------------|
| Only updating `App.jsx` | Backend CITIES powers AI city-search — missing cities are invisible to Claude |
| `'Tokyo,JA'` or `'Tokyo,JAP'` | Must be ISO alpha-2: `JP` |
| `'Asia/Japan'` or `'JST'` | Must be IANA format: `Asia/Tokyo` |
| Adding `query` to backend entry | Backend has no `query` field — silently ignored |
| Adding `region` to frontend entry | Frontend has no `region` field — silently ignored |
| Forgetting the subtitle count | "5 cities" stays wrong after adding a 6th |
