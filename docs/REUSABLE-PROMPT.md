# World Clock & Weather Dashboard — Reusable Build Prompt

> Paste everything below the line into any AI assistant to rebuild this project from scratch.

---

Build a **World Clock & Weather Dashboard** — a full-stack web app with a React frontend and a Node.js/Express backend.

## What to Build

A dark glassmorphism dashboard showing 5 city cards. Each card displays a live ticking local clock and current weather. Below the cards is an AI-powered panel that lets users search, ask questions, and get summaries — powered by the Claude API.

---

## Functional Requirements

### City Cards (5 cities)
- Show "Hello, [City]!" as the card headline
- Live local time updating every second (HH:MM:SS AM/PM)
- Day, month, date below the clock
- Current temperature in °F (rounded)
- Weather condition text (e.g. "partly cloudy")
- Weather icon from OpenWeatherMap
- Cities: **New York, Los Angeles, London, Chennai, Singapore**

### States
- **Loading:** pulsing skeleton cards while weather fetches (no spinner — prevents layout shift)
- **Error:** "Weather unavailable" per card if API fails; clocks still tick; other cards unaffected

### AI Panel (below the grid)
1. **Ask:** freeform weather question → Claude answers using live data (Enter key submits)
2. **Search Cities:** natural language filter → "show cities in Asia" dims non-matching cards; "Show All Cities" resets
3. **Summarize All Weather:** button → Claude writes a 2-3 sentence comparison of all 5 cities

---

## Technical Requirements

### Stack
- **Frontend:** React 19 (Create React App), plain CSS only — no UI libraries
- **Backend:** Node.js + Express (port 5001)
- **AI:** `@anthropic-ai/sdk` — server-side only, model `claude-haiku-4-5`
- **Weather:** OpenWeatherMap Current Weather API (free tier, `units=imperial`)
- **Font:** Google Inter (300–700) via `<link>` in index.html

### Project Structure
```
project/
  frontend/        # CRA React app
    src/
      App.jsx      # Root: weather fetch state + grid + AI panel
      CityCard.jsx # Card: clock via Intl.DateTimeFormat + weather display
      AiPanel.jsx  # Claude features: ask / search / summarize
      App.css      # All styles (glassmorphism, grid, AI panel)
      index.js     # ReactDOM.createRoot entry point
    public/index.html
    .env.local     # REACT_APP_WEATHER_API_KEY=...
    package.json   # "proxy": "http://localhost:5001"
  backend/
    server.js      # Express: POST /api/claude (3 features)
    .env           # ANTHROPIC_API_KEY=..., PORT=5001
    package.json
```

### Security: API Keys
- `REACT_APP_WEATHER_API_KEY` in `frontend/.env.local` → accessed via `process.env.REACT_APP_WEATHER_API_KEY`
- `ANTHROPIC_API_KEY` in `backend/.env` → accessed via `process.env.ANTHROPIC_API_KEY` (server-side only)
- Both files gitignored. Anthropic key never touches the browser.
- Frontend calls `/api/claude` → CRA proxy forwards to `http://localhost:5001`

### Key Implementation Patterns

**Parallel weather fetch (partial failure tolerance):**
```js
const results = await Promise.allSettled(CITIES.map(c => fetchWeather(c.query)));
// Never use Promise.all — one failure kills all cards
```

**Live clock (no blank flash on mount):**
```js
useEffect(() => {
  const tick = () => setTimeStr(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date()));
  tick();                         // fire immediately
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // required cleanup
}, [timezone]);
```

**Backend `/api/claude` endpoint — 3 features:**
- `search`: use Claude tool use (`filter_cities` tool, `tool_choice: forced`) to return matching city names + explanation
- `ask`: Claude answers with weather data in system prompt
- `summarize`: Claude writes a short comparison paragraph

### Visual Design
- **Background:** `linear-gradient(135deg, #0f0c29, #302b63, #24243e)`
- **Cards:** `background: rgba(255,255,255,0.07)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.13)`, `border-radius: 20px`
- **Card hover:** `transform: translateY(-4px)`, `box-shadow: 0 20px 40px rgba(0,0,0,0.3)`
- **Dimmed card (search filter):** `opacity: 0.25`, `transform: scale(0.97)`
- **Clock color:** `#a78bfa` (soft purple)
- **Temperature color:** `#60a5fa` (soft blue)
- **Grid:** 3 cols ≥900px / 2 cols 580–900px / 1 col <580px

### Cities & Timezones
| City | IANA Timezone | API Query |
|------|--------------|-----------|
| New York | America/New_York | New York,US |
| Los Angeles | America/Los_Angeles | Los Angeles,US |
| London | Europe/London | London,GB |
| Chennai | Asia/Kolkata | Chennai,IN |
| Singapore | Asia/Singapore | Singapore,SG |

---

## How to Run

1. Get a free OpenWeatherMap key at openweathermap.org (takes ~10 min to activate)
2. Get an Anthropic key at console.anthropic.com
3. Add to `frontend/.env.local`: `REACT_APP_WEATHER_API_KEY=your_key`
4. Add to `backend/.env`: `ANTHROPIC_API_KEY=your_key` and `PORT=5001`
5. `cd backend && npm install && node server.js`
6. `cd frontend && npm start` (in a separate terminal)

---

## Definition of Done
- [ ] All 5 city cards show correct timezone clocks ticking every second
- [ ] Weather loads within 3 seconds, skeleton shown during load
- [ ] Removing weather API key shows "Weather unavailable" — no crash
- [ ] AI Ask answers questions correctly using live weather data
- [ ] AI Search dims non-matching cards; Show All Cities resets
- [ ] AI Summarize returns a readable 2-3 sentence paragraph
- [ ] Neither `.env.local` nor `backend/.env` is in git history
- [ ] Layout correct on desktop (3 cols), tablet (2 cols), mobile (1 col)
