# World Clock & Weather Dashboard — Design Doc
Date: 2026-03-07

## Overview
A single-page React app displaying a dark glassmorphism dashboard with live local time and current weather for 5 cities. The app greets each city ("Hello, New York!"), shows a ticking local clock, and fetches real weather from OpenWeatherMap.

## Cities & Timezones
| City | IANA Timezone |
|------|---------------|
| New York | America/New_York |
| Los Angeles | America/Los_Angeles |
| London | Europe/London |
| Chennai | Asia/Kolkata |
| Singapore | Asia/Singapore |

## Architecture
Single-page CRA (React 19) app. No router. No backend. No database.

### Files
- `src/App.jsx` — root component, manages weather fetch state, renders grid
- `src/CityCard.jsx` — individual card: greeting, live clock, weather icon + temp + condition
- `src/App.css` — all styles: dark gradient bg, glassmorphism cards, responsive grid
- `.env.local` — `REACT_APP_WEATHER_API_KEY=<your_key>` (gitignored)

## Data Flow
1. App mounts → 5 parallel `fetch` calls to OpenWeatherMap Current Weather API
   - Endpoint: `https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units=imperial`
2. Weather stored in state: `{ city, temp, condition, iconCode, error }`
3. Each CityCard runs `setInterval(1000)` to tick local time via `Intl.DateTimeFormat`
4. Weather is fetched once on mount (no auto-refresh for demo)

## Card Layout
```
Hello, New York!
02:45:30 PM  |  Tuesday, Mar 7
[icon]  72°F  Partly Cloudy
```

## Visual Design
- **Background**: deep dark gradient — `#0f0c29` → `#302b63` → `#24243e`
- **Cards**: `rgba(255,255,255,0.08)` bg, `backdrop-filter: blur(12px)`, `1px solid rgba(255,255,255,0.15)` border, `border-radius: 20px`
- **Font**: Google Inter (loaded via `<link>` in index.html)
- **Grid**: 3 cols desktop / 2 cols tablet / 1 col mobile (CSS Grid)
- **Loading state**: pulsing skeleton shimmer on each card
- **Error state**: "Weather unavailable" message in card, app still functional

## API Key Learning Pattern
The `.env.local` file teaches the standard pattern used across all API-key projects:
- Prefix: `REACT_APP_` (required by CRA to expose to browser)
- Usage: `process.env.REACT_APP_WEATHER_API_KEY`
- Never commit `.env.local` — already in CRA's default `.gitignore`

## Out of Scope
- Supabase / auth (not needed)
- Weather auto-refresh
- City search / customization
- Animations / transitions (keeping scope focused)
