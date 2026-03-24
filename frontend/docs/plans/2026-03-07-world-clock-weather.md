# World Clock & Weather Dashboard Implementation Plan (v2 — with Claude AI)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a dark glassmorphism React dashboard with live clocks + OpenWeatherMap weather for 5 cities, plus a Claude-powered AI panel (natural language city search, weather Q&A, and all-cities summary). Backend proxies all Claude API calls to keep the Anthropic key server-side.

**Architecture:**
- `frontend/` — CRA React 19 app. Fetches weather directly from OpenWeatherMap. Calls `/api/claude` (proxied to backend) for all AI features.
- `backend/` — Express server on port 5001. Holds `ANTHROPIC_API_KEY`. Exposes `POST /api/claude`.
- Frontend proxy already configured in `package.json`: `"proxy": "http://localhost:5001"`

**Tech Stack:** React 19 (CRA), OpenWeatherMap API, Anthropic SDK (`@anthropic-ai/sdk`), Express, Google Fonts Inter

**Cities:**
| City | Timezone | Query |
|------|----------|-------|
| New York | America/New_York | New York,US |
| Los Angeles | America/Los_Angeles | Los Angeles,US |
| London | Europe/London | London,GB |
| Chennai | Asia/Kolkata | Chennai,IN |
| Singapore | Asia/Singapore | Singapore,SG |

---

### Task 1: Create backend

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env`
- Create: `backend/server.js`

**Step 1: Create `backend/package.json`**

```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2"
  }
}
```

**Step 2: Create `backend/.env`**

```
ANTHROPIC_API_KEY=your_anthropic_key_here
PORT=5001
```

> User must replace `your_anthropic_key_here` with their real key from console.anthropic.com.
> This file must be gitignored — add a `backend/.gitignore` with `.env` in it.

**Step 3: Create `backend/.gitignore`**

```
.env
node_modules/
```

**Step 4: Create `backend/server.js`**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 5001;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

// The 5 cities the dashboard knows about
const CITIES = [
  { name: 'New York',    timezone: 'America/New_York',    region: 'Americas' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', region: 'Americas' },
  { name: 'London',      timezone: 'Europe/London',       region: 'Europe'   },
  { name: 'Chennai',     timezone: 'Asia/Kolkata',        region: 'Asia'     },
  { name: 'Singapore',   timezone: 'Asia/Singapore',      region: 'Asia'     },
];

app.post('/api/claude', async (req, res) => {
  const { feature, query, weatherData } = req.body;

  try {
    let response;

    if (feature === 'search') {
      // Natural language city search using tool use
      const tools = [{
        name: 'filter_cities',
        description: 'Filter the city list based on user criteria (region, weather, etc.)',
        input_schema: {
          type: 'object',
          properties: {
            matching_cities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Names of cities that match the user criteria'
            },
            explanation: {
              type: 'string',
              description: 'Brief explanation of why these cities match'
            }
          },
          required: ['matching_cities', 'explanation']
        }
      }];

      const messages = [{
        role: 'user',
        content: `Available cities: ${CITIES.map(c => `${c.name} (${c.region})`).join(', ')}.\n\nUser request: "${query}"\n\nFilter the cities list based on the user's request.`
      }];

      const result = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        tools,
        tool_choice: { type: 'tool', name: 'filter_cities' },
        messages
      });

      const toolUse = result.content.find(b => b.type === 'tool_use');
      res.json({
        type: 'search',
        matching_cities: toolUse.input.matching_cities,
        explanation: toolUse.input.explanation
      });

    } else if (feature === 'ask') {
      // Q&A about weather data
      const weatherSummary = Object.entries(weatherData)
        .map(([city, d]) => d.error
          ? `${city}: weather unavailable`
          : `${city}: ${d.temp}°F, ${d.condition}`)
        .join('\n');

      const result = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        system: `You are a helpful weather assistant. Here is the current weather data:\n${weatherSummary}\n\nAnswer questions concisely and conversationally.`,
        messages: [{ role: 'user', content: query }]
      });

      res.json({ type: 'ask', text: result.content[0].text });

    } else if (feature === 'summarize') {
      // Summarize all cities' weather
      const weatherSummary = Object.entries(weatherData)
        .map(([city, d]) => d.error
          ? `${city}: weather unavailable`
          : `${city}: ${d.temp}°F, ${d.condition}`)
        .join('\n');

      const result = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Here is current weather across 5 cities:\n${weatherSummary}\n\nWrite a friendly 2-3 sentence summary comparing the weather across these cities. Highlight interesting contrasts.`
        }]
      });

      res.json({ type: 'summarize', text: result.content[0].text });
    }

  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Claude API request failed', detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
```

**Step 5: Install backend dependencies**

```bash
cd "/Users/vinayvillavan/Desktop/VSCode Apps/backend"
npm install
```

---

### Task 2: Add Inter font to index.html

**Files:**
- Modify: `frontend/public/index.html`

Add in `<head>` after existing meta tags:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

Update `<title>`:
```html
<title>World Clock & Weather</title>
```

---

### Task 3: Create App.css

**Files:**
- Create: `frontend/src/App.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  min-height: 100vh;
  color: #fff;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 64px;
}

.app-header {
  text-align: center;
  margin-bottom: 48px;
}

.app-header h1 {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-header p {
  margin-top: 8px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 300;
}

/* City Grid */
.city-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  max-width: 1100px;
}

@media (max-width: 900px) {
  .city-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 580px) {
  .city-grid { grid-template-columns: 1fr; }
}

/* City Card */
.city-card {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 20px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
}

.city-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.city-card.dimmed {
  opacity: 0.3;
  transform: scale(0.97);
}

.city-card.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.city-greeting {
  font-size: 1.35rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: -0.3px;
}

.city-time {
  font-size: 2rem;
  font-weight: 700;
  color: #a78bfa;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}

.city-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: -10px;
  letter-spacing: 0.3px;
}

.city-weather {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.city-weather img {
  width: 44px;
  height: 44px;
}

.weather-info { display: flex; flex-direction: column; }

.weather-temp {
  font-size: 1.4rem;
  font-weight: 600;
  color: #60a5fa;
}

.weather-condition {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: capitalize;
}

.weather-error {
  font-size: 0.85rem;
  color: rgba(255, 100, 100, 0.7);
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Skeleton */
.skeleton {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  height: 16px;
}
.skeleton.wide { width: 70%; }
.skeleton.narrow { width: 40%; }
.skeleton.tall { height: 40px; width: 55%; }

/* AI Panel */
.ai-panel {
  width: 100%;
  max-width: 1100px;
  margin-top: 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 28px 28px;
}

.ai-panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: #a78bfa;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.ai-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.ai-input::placeholder { color: rgba(255,255,255,0.3); }
.ai-input:focus { border-color: rgba(167, 139, 250, 0.5); }

.ai-btn {
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s, transform 0.1s;
}

.ai-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.ai-btn:active { transform: translateY(0); }
.ai-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.ai-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.ai-response {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  font-size: 0.9rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.85);
  min-height: 52px;
}

.ai-response.loading {
  animation: pulse 1.2s ease-in-out infinite;
  color: rgba(255,255,255,0.4);
}

.ai-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-tag {
  display: inline-block;
  background: rgba(167, 139, 250, 0.15);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 0.78rem;
  color: #a78bfa;
  margin-right: 6px;
  margin-top: 8px;
}
```

---

### Task 4: Create CityCard.jsx

**Files:**
- Create: `frontend/src/CityCard.jsx`

```jsx
import { useState, useEffect } from 'react';

function CityCard({ city, timezone, weatherData, loading, dimmed }) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).format(now));
      setDateStr(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone, weekday: 'long', month: 'short', day: 'numeric',
      }).format(now));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  if (loading) {
    return (
      <div className="city-card loading">
        <div className="skeleton wide" />
        <div className="skeleton tall" />
        <div className="skeleton narrow" />
        <div className="skeleton wide" />
      </div>
    );
  }

  return (
    <div className={`city-card${dimmed ? ' dimmed' : ''}`}>
      <div className="city-greeting">Hello, {city}!</div>
      <div className="city-time">{timeStr}</div>
      <div className="city-date">{dateStr}</div>
      {weatherData?.error ? (
        <div className="weather-error">Weather unavailable</div>
      ) : (
        <div className="city-weather">
          {weatherData?.iconCode && (
            <img
              src={`https://openweathermap.org/img/wn/${weatherData.iconCode}@2x.png`}
              alt={weatherData.condition}
            />
          )}
          <div className="weather-info">
            <span className="weather-temp">{weatherData?.temp ?? '--'}°F</span>
            <span className="weather-condition">{weatherData?.condition ?? 'Loading...'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CityCard;
```

---

### Task 5: Create AiPanel.jsx

**Files:**
- Create: `frontend/src/AiPanel.jsx`

```jsx
import { useState } from 'react';

function AiPanel({ weatherData, onSearchResult }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  const callClaude = async (feature, queryOverride) => {
    setLoading(true);
    setActiveFeature(feature);
    setResponse('');
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, query: queryOverride ?? query, weatherData }),
      });
      const data = await res.json();
      if (data.error) {
        setResponse('Error: ' + data.detail);
        return;
      }
      if (feature === 'search') {
        onSearchResult(data.matching_cities);
        setResponse(
          `Showing: ${data.matching_cities.join(', ')}. ${data.explanation}`
        );
      } else {
        setResponse(data.text);
      }
    } catch (err) {
      setResponse('Could not reach the backend. Is it running on port 5001?');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) callClaude('ask');
  };

  const handleSummarize = () => callClaude('summarize', 'summarize all cities');
  const handleSearch = () => { if (query.trim()) callClaude('search'); };
  const handleAsk = () => { if (query.trim()) callClaude('ask'); };

  return (
    <div className="ai-panel">
      <div className="ai-panel-title">
        ✦ Ask Claude about the weather
      </div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          placeholder='Try "show cities in Asia" or "compare London and New York"'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="ai-btn" onClick={handleAsk} disabled={loading || !query.trim()}>
          Ask
        </button>
        <button className="ai-btn secondary" onClick={handleSearch} disabled={loading || !query.trim()}>
          Search Cities
        </button>
      </div>

      <div className="ai-actions">
        <button className="ai-btn secondary" onClick={handleSummarize} disabled={loading}>
          ✦ Summarize All Weather
        </button>
        {activeFeature === 'search' && response && (
          <button className="ai-btn secondary" onClick={() => { onSearchResult(null); setResponse(''); }}>
            Show All Cities
          </button>
        )}
      </div>

      {(response || loading) && (
        <div className={`ai-response${loading ? ' loading' : ''}`}>
          {loading ? 'Claude is thinking...' : response}
        </div>
      )}
    </div>
  );
}

export default AiPanel;
```

---

### Task 6: Create App.jsx

**Files:**
- Create: `frontend/src/App.jsx`

```jsx
import { useState, useEffect } from 'react';
import CityCard from './CityCard';
import AiPanel from './AiPanel';
import './App.css';

const CITIES = [
  { name: 'New York',    timezone: 'America/New_York',    query: 'New York,US' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', query: 'Los Angeles,US' },
  { name: 'London',      timezone: 'Europe/London',       query: 'London,GB' },
  { name: 'Chennai',     timezone: 'Asia/Kolkata',        query: 'Chennai,IN' },
  { name: 'Singapore',   timezone: 'Asia/Singapore',      query: 'Singapore,SG' },
];

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

async function fetchWeather(query) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].description,
    iconCode: data.weather[0].icon,
    error: false,
  };
}

function App() {
  const [weatherMap, setWeatherMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [highlightedCities, setHighlightedCities] = useState(null);

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled(CITIES.map(c => fetchWeather(c.query)));
      const map = {};
      results.forEach((result, i) => {
        map[CITIES[i].name] = result.status === 'fulfilled'
          ? result.value
          : { error: true };
      });
      setWeatherMap(map);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>World Clock & Weather</h1>
        <p>Live time and weather across 5 cities</p>
      </header>

      <div className="city-grid">
        {CITIES.map(city => (
          <CityCard
            key={city.name}
            city={city.name}
            timezone={city.timezone}
            weatherData={weatherMap[city.name]}
            loading={loading}
            dimmed={highlightedCities !== null && !highlightedCities.includes(city.name)}
          />
        ))}
      </div>

      <AiPanel
        weatherData={weatherMap}
        onSearchResult={setHighlightedCities}
      />
    </div>
  );
}

export default App;
```

---

### Task 7: Update src/index.js

**Files:**
- Modify: `frontend/src/index.js`

```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### Task 8: Install dependencies and run

**Step 1: Install backend deps**
```bash
cd "/Users/vinayvillavan/Desktop/VSCode Apps/backend"
npm install
```

**Step 2: Start backend**
```bash
cd "/Users/vinayvillavan/Desktop/VSCode Apps/backend"
node server.js
```
Expected: `Backend listening on port 5001`

**Step 3: Start frontend (separate terminal)**
```bash
cd "/Users/vinayvillavan/Desktop/VSCode Apps/frontend"
npm start
```
Expected: Browser opens `http://localhost:3000` with the dashboard.

**Step 4: Commit**
```bash
cd "/Users/vinayvillavan/Desktop/VSCode Apps"
git add frontend/src/ frontend/public/index.html backend/ docs/
git commit -m "feat: world clock and weather dashboard with Claude AI panel"
```
> Do NOT commit `frontend/.env.local` or `backend/.env`.
