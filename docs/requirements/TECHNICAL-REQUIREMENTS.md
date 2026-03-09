# Technical Requirements
**Project:** World Clock & Weather Dashboard
**Version:** 1.2
**Date:** 2026-03-08

---

## TR-01: Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend framework | React | 19.x | Create React App scaffold |
| Backend framework | Express | 4.x | Node.js HTTP server |
| AI SDK | @anthropic-ai/sdk | ^0.39 | Server-side only |
| Weather API | OpenWeatherMap | v2.5 (Current Weather) | Free tier |
| Solar library | suncalc | ^1.9 | Frontend only, ~9KB, zero deps |
| Font | Google Inter | 300–700 | Loaded via `<link>` in index.html |
| CSS | Plain CSS | — | No UI libraries, no Tailwind |
| Runtime | Node.js | ≥18 | Both frontend dev server and backend |
| Frontend | @supabase/supabase-js | ^2.x | Supabase JS client for auth + database |
| Frontend | tz-lookup | ^6.x | Derive IANA timezone string from lat/lon |

## TR-02: Project Structure

```
world-clock-weather/
  frontend/                  # CRA React app
    public/
      index.html             # Inter font link, page title
    src/
      App.jsx                # Root: weather fetch, grid, AI panel, solar state
      CityCard.jsx           # Single city card with live clock + solar enrichment
      AiPanel.jsx            # Claude-powered Q&A / search / summary
      DayNightStrip.jsx      # GMT-12→+14 day/night timeline strip
      DayNightStrip.css      # Strip-specific styles
      App.css                # All card/panel styles
      index.js               # ReactDOM entry point
      utils/
        solar.js             # getSolarData(), buildStripGradient(), moon phase helpers
      supabase.js            # Supabase client singleton
      AuthOverlay.jsx        # Auth sign-in/sign-up overlay
      AuthOverlay.css        # Auth overlay styles
      AddCityCard.jsx        # City search + add card
      AddCityCard.css        # AddCityCard styles
    .env.local               # REACT_APP_WEATHER_API_KEY (gitignored)
    package.json             # proxy: http://localhost:5001
  backend/
    server.js                # Express: POST /api/claude
    .env                     # ANTHROPIC_API_KEY, PORT=5001 (gitignored)
    package.json
  docs/
    requirements/            # This folder
    plans/                   # Implementation plans
```

## TR-03: API Contracts

### OpenWeatherMap (called from frontend)
```
GET https://api.openweathermap.org/data/2.5/weather
  ?q={city},{country_code}
  &appid={REACT_APP_WEATHER_API_KEY}
  &units=imperial

Response fields used:
  data.main.temp           → number (Fahrenheit, rounded)
  data.weather[0].description → string (condition)
  data.weather[0].icon     → string (icon code, e.g. "10d")

Icon URL: https://openweathermap.org/img/wn/{icon}@2x.png
```

### OWM Geocoding proxy (called from frontend via CRA proxy)
```
GET /api/geocode?q={city}

Response: [{name, lat, lon, country, state}]
```

### Backend Claude proxy (called from frontend via CRA proxy)
```
POST /api/claude
Content-Type: application/json

Body:
{
  feature: 'search' | 'ask' | 'summarize',
  query: string,             // user input text
  weatherData: {             // map of city → weather result
    [cityName]: {
      temp: number,
      condition: string,
      iconCode: string,
      error?: boolean
    }
  }
}

Response (search):
{
  type: 'search',
  matching_cities: string[],
  explanation: string
}

Response (ask | summarize):
{
  type: 'ask' | 'summarize',
  text: string
}

Error response:
{
  error: string,
  detail: string
}
```

## TR-04: Environment Variables

| Variable | File | Used by | Description |
|----------|------|---------|-------------|
| `REACT_APP_WEATHER_API_KEY` | `frontend/.env.local` | Frontend (browser) | OpenWeatherMap API key |
| `ANTHROPIC_API_KEY` | `backend/.env` | Backend (server) | Anthropic Claude API key |
| `PORT` | `backend/.env` | Backend | Server port (default: 5001) |
| `REACT_APP_SUPABASE_URL` | `frontend/.env.local` | Frontend (browser) | Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | `frontend/.env.local` | Frontend (browser) | Supabase anon/public key |

## TR-05: Key Implementation Patterns

### Parallel fetch with partial failure tolerance
```js
const results = await Promise.allSettled(cities.map(c => fetchWeather(c.query)));
// Never use Promise.all — one failure would kill all cards
```

### Live clock with timezone
```js
useEffect(() => {
  const tick = () => setTimeStr(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date()));
  tick(); // fire immediately — no 1-second blank flash
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // cleanup prevents memory leak
}, [timezone]);
```

### CRA proxy to backend
The `"proxy": "http://localhost:5001"` field in `frontend/package.json` means:
- Any `fetch('/api/...')` from React is transparently forwarded to Express
- The Anthropic key never touches the browser

## TR-06: City & Timezone Reference

| City | IANA Timezone | OpenWeatherMap Query | lat | lon |
|------|--------------|----------------------|-----|-----|
| New York | America/New_York | New York,US | 40.71 | -74.01 |
| Los Angeles | America/Los_Angeles | Los Angeles,US | 34.05 | -118.24 |
| London | Europe/London | London,GB | 51.51 | -0.13 |
| Chennai | Asia/Kolkata | Chennai,IN | 13.08 | 80.27 |
| Singapore | Asia/Singapore | Singapore,SG | 1.35 | 103.82 |

## TR-07: Solar Data Patterns

### suncalc usage
```js
import SunCalc from 'suncalc';

// Sun times for a city
const times = SunCalc.getTimes(new Date(), lat, lon);
// times.sunrise, times.sunset, times.dawn, times.dusk
// times.nauticalDawn, times.nauticalDusk

// Moon illumination (global — same for all cities)
const moon = SunCalc.getMoonIllumination(new Date());
// moon.phase  → 0–1 (0=new, 0.5=full, 1=new again)
// moon.fraction → 0–1 illuminated fraction
```

### Day/night gradient build
```js
// Iterate UTC offsets -12 to +14 in 0.5h steps
// For each offset, classify as night/twilight/day using suncalc.getTimes()
// for lon = offset * 15, lat = 0 (equator representative)
// Build CSS linear-gradient string with colour stops
```

### City UTC offset (for pin positioning)
```js
const getUTCOffset = (timezone) => {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate - utcDate) / 3600000; // hours
};
// Pin position: (utcOffset + 12) / 26 * 100%
```

### Moon watch calculation
```js
// Days since last full moon
const daysSinceFull = phase >= 0.5
  ? (phase - 0.5) * 29.53
  : (phase + 0.5) * 29.53;

// Next full moon date: walk forward until phase crosses 0.5
function nextFullMoon(fromDate) {
  const d = new Date(fromDate);
  for (let i = 1; i <= 30; i++) {
    d.setDate(d.getDate() + 1);
    if (SunCalc.getMoonIllumination(d).phase >= 0.45 &&
        SunCalc.getMoonIllumination(d).phase <= 0.55) return new Date(d);
  }
}
```

## TR-08: Supabase Schema

**Table: `user_cities`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default gen_random_uuid() |
| user_id | uuid | References auth.users(id), not null |
| name | text | City display name |
| lat | float8 | Latitude |
| lon | float8 | Longitude |
| timezone | text | IANA timezone string (e.g. "America/New_York") |
| owm_query | text | OWM query string (e.g. "New York,US") |
| position | int4 | Display order |
| created_at | timestamptz | Default now() |

**RLS Policy:**
- Enable Row Level Security on the table
- Policy: `using (user_id = auth.uid())` — users can only access their own rows
