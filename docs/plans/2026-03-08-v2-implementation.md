# World Clock v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add Supabase auth + per-user city persistence, inline city add/remove, smaller cards, and a hover tooltip on the DayNightStrip.

**Architecture:** Supabase handles auth (email/password) and stores each user's cities in a `user_cities` table with RLS. The frontend loads cities from Supabase on mount instead of reading a hardcoded `CITIES` constant. City geocoding (name → lat/lon) is proxied through the Express backend so the OWM key stays server-side. `tz-lookup` derives the IANA timezone from lat/lon client-side.

**Tech Stack:** React 19, Express 4, `@supabase/supabase-js`, `tz-lookup`, existing `suncalc` + OWM.

---

## Supabase project details

- Project ref: `dzdauvxfhhmqsrlmeqvs`
- URL: `https://dzdauvxfhhmqsrlmeqvs.supabase.co`
- Credentials: already in `frontend/.env.local` as `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` (ask the user if missing)

---

## Task 1: Install deps + Supabase client + DB schema

**Files:**
- Create: `frontend/src/supabase.js`
- Modify: `frontend/package.json` (via npm install)

**Step 1: Install packages**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm install @supabase/supabase-js tz-lookup
```

Expected: both appear in `package.json` dependencies.

**Step 2: Create the Supabase client**

Create `frontend/src/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

**Step 3: Run the SQL migration**

Go to https://supabase.com/dashboard/project/dzdauvxfhhmqsrlmeqvs/sql/new and run:

```sql
create table if not exists user_cities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  lat         float not null,
  lon         float not null,
  timezone    text not null,
  owm_query   text not null,
  position    int not null,
  created_at  timestamptz default now()
);

alter table user_cities enable row level security;

create policy "users manage own cities" on user_cities
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

**Step 4: Verify**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm run build 2>&1 | tail -5
```

Expected: `Successfully compiled.` (or warnings only, no errors).

**Step 5: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/supabase.js frontend/package.json frontend/package-lock.json
git commit -m "feat: install @supabase/supabase-js + tz-lookup, add supabase client"
```

---

## Task 2: Backend geocode proxy

**Files:**
- Modify: `backend/server.js` (add GET /api/geocode before line 109)

**Step 1: Write the failing test (manual — backend has no test runner)**

```bash
# Start backend first (separate terminal):
cd /Users/vinayvillavan/Desktop/world-clock-weather/backend && node server.js

# In another terminal:
curl "http://localhost:5001/api/geocode?q=Tokyo" | head -c 200
```

Expected: `{"error":"Unknown route"}` or 404 (route doesn't exist yet).

**Step 2: Add the route to `backend/server.js`**

Insert before the `app.listen` call (after line 107):

```js
app.get('/api/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }
  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${process.env.REACT_APP_WEATHER_API_KEY || process.env.OWM_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    // Return only the fields we need
    const results = (Array.isArray(data) ? data : []).map(r => ({
      name:    r.name,
      lat:     r.lat,
      lon:     r.lon,
      country: r.country,
      state:   r.state ?? '',
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Geocoding failed', detail: err.message });
  }
});
```

> Note: OWM geocoding uses the same API key as weather. In `backend/.env` it may be stored as `REACT_APP_WEATHER_API_KEY` or `OWM_API_KEY` — check the file and use whichever name is there. Add a fallback: `process.env.REACT_APP_WEATHER_API_KEY || process.env.OWM_API_KEY`.

**Step 3: Verify**

Restart backend, then:

```bash
curl "http://localhost:5001/api/geocode?q=Tokyo" | python3 -m json.tool | head -20
```

Expected: JSON array with at least one result containing `name`, `lat`, `lon`, `country`.

**Step 4: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add backend/server.js
git commit -m "feat: add GET /api/geocode proxy route for OWM city search"
```

---

## Task 3: Smaller card sizes

**Files:**
- Modify: `frontend/src/App.css`

No test needed — pure CSS.

**Step 1: Update card size rules in `frontend/src/App.css`**

Find and replace each of these rules:

```css
/* BEFORE */
.city-card {
  padding: 28px 24px;
```
→
```css
.city-card {
  padding: 18px 16px;
```

```css
/* BEFORE */
.city-grid {
  gap: 24px;
```
→
```css
.city-grid {
  gap: 16px;
```

```css
/* BEFORE */
.city-greeting {
  font-size: 1.35rem;
```
→
```css
.city-greeting {
  font-size: 1.05rem;
```

```css
/* BEFORE */
.city-time {
  font-size: 2rem;
```
→
```css
.city-time {
  font-size: 1.5rem;
```

```css
/* BEFORE */
.weather-temp {
  font-size: 1.4rem;
```
→
```css
.weather-temp {
  font-size: 1.1rem;
```

```css
/* BEFORE */
.city-date {
  margin-top: -10px;
```
→
```css
.city-date {
  margin-top: -6px;
```

**Step 2: Verify build**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm run build 2>&1 | tail -3
```

**Step 3: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/App.css
git commit -m "style: reduce city card size to fit 6 cards comfortably at 3-per-row"
```

---

## Task 4: buildSolarMap refactor (accept cities array)

**Files:**
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/__tests__/App.solar.test.js`

**Step 1: Write the failing test**

Add to `frontend/src/__tests__/App.solar.test.js`:

```js
import { render, screen, act } from '@testing-library/react';
import App from '../App';

// (keep the existing beforeEach/afterEach mocks)

test('buildSolarMap works with a dynamic cities array', async () => {
  // This test ensures App works when cities come from state, not the constant.
  // It passes if App renders without crashing after cities load.
  await act(async () => {
    render(<App />);
  });
  // If buildSolarMap still references the removed CITIES constant, this will throw.
  expect(screen.getByTestId('day-night-strip')).toBeInTheDocument();
});
```

**Step 2: Run to verify it currently passes (baseline)**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern="App.solar" --forceExit 2>&1 | tail -10
```

**Step 3: Refactor `buildSolarMap` in `frontend/src/App.jsx`**

Change:
```js
function buildSolarMap(date) {
  return Object.fromEntries(
    CITIES.map(city => [
      city.name,
      { ...getSolarData(city, date), moon: getMoonData(date, city.timezone) }
    ])
  );
}
```

To:
```js
function buildSolarMap(cities, date) {
  return Object.fromEntries(
    cities.map(city => [
      city.name,
      { ...getSolarData(city, date), moon: getMoonData(date, city.timezone) }
    ])
  );
}
```

Also update the initial state call:
```js
// BEFORE:
const [solarMap, setSolarMap] = useState(() => buildSolarMap(new Date()));

// AFTER (pass empty array — will be rebuilt once cities load from Supabase):
const [solarMap, setSolarMap] = useState({});
```

And add a `citiesRef` for the solar interval (so the interval always uses current cities):
```js
const citiesRef = useRef(CITIES); // temporary — will be replaced in Task 8
```

Update the solar interval in `useEffect`:
```js
const solarInterval = setInterval(() => {
  setSolarMap(buildSolarMap(citiesRef.current, new Date()));
}, 60_000);
```

For now, keep `const CITIES = [...]` and `citiesRef.current = CITIES` in place — Task 8 removes it. Update the initial solar map computation in the load function to use `buildSolarMap(CITIES, new Date())` so the strip still works before Task 8 wires Supabase.

Add at the top of `App` component (after state declarations):
```js
const citiesRef = useRef(CITIES);
```

Change the initial solar map load inside `load()`:
```js
setSolarMap(buildSolarMap(CITIES, new Date()));
```

**Step 4: Run tests**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --forceExit 2>&1 | tail -10
```

Expected: 42+ passed, 0 failed.

**Step 5: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/App.jsx
git commit -m "refactor: buildSolarMap accepts cities array param, add citiesRef for interval"
```

---

## Task 5: CityCard × remove button

**Files:**
- Modify: `frontend/src/CityCard.jsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/src/__tests__/CityCard.solar.test.js`

**Step 1: Write the failing tests**

Add to the bottom of `frontend/src/__tests__/CityCard.solar.test.js`:

```js
import userEvent from '@testing-library/user-event';

test('shows remove button when onRemove prop provided', () => {
  const onRemove = jest.fn();
  render(
    <CityCard
      city="London"
      timezone="Europe/London"
      weatherData={{ temp: 55, condition: 'cloudy', iconCode: '04d', error: false }}
      loading={false}
      dimmed={false}
      solarData={baseSolarData}
      onRemove={onRemove}
    />
  );
  expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
});

test('calls onRemove when × button clicked', async () => {
  const onRemove = jest.fn();
  render(
    <CityCard
      city="London"
      timezone="Europe/London"
      weatherData={{ temp: 55, condition: 'cloudy', iconCode: '04d', error: false }}
      loading={false}
      dimmed={false}
      solarData={baseSolarData}
      onRemove={onRemove}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: /remove/i }));
  expect(onRemove).toHaveBeenCalledTimes(1);
});

test('does not show remove button when onRemove not provided', () => {
  renderCard(); // uses the existing helper which doesn't pass onRemove
  expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
});
```

**Step 2: Run to verify they fail**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern="CityCard" --forceExit 2>&1 | tail -15
```

Expected: 3 new failures.

**Step 3: Add onRemove prop to `frontend/src/CityCard.jsx`**

Change the function signature:
```js
function CityCard({ city, timezone, weatherData, loading, dimmed, solarData, onRemove }) {
```

Change the outer card div:
```jsx
<div className={`city-card${dimmed ? ' dimmed' : ''}`}>
  {onRemove && (
    <button
      className="city-card-remove"
      onClick={onRemove}
      aria-label="Remove city"
    >×</button>
  )}
  <div className="city-greeting">Hello, {city}!</div>
  ...
```

**Step 4: Add styles to `frontend/src/App.css`**

Append:
```css
/* Remove city button */
.city-card {
  position: relative; /* needed for absolute positioning of × button */
}

.city-card-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.city-card:hover .city-card-remove {
  opacity: 1;
}

.city-card-remove:hover {
  background: rgba(255, 80, 80, 0.3);
  color: #fff;
}
```

> Note: `.city-card` already has padding from App.css — the `position: relative` may need to be added to the existing rule, not as a second `.city-card` block. Check if `.city-card` already has `position: relative` and add it to the existing rule if so.

**Step 5: Run tests**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --forceExit 2>&1 | tail -10
```

Expected: all pass.

**Step 6: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/CityCard.jsx frontend/src/App.css
git commit -m "feat: add × remove button to city cards, shown on hover"
```

---

## Task 6: DayNightStrip hover tooltip

**Files:**
- Modify: `frontend/src/DayNightStrip.jsx`
- Modify: `frontend/src/DayNightStrip.css`
- Test: `frontend/src/__tests__/DayNightStrip.test.js`

**Step 1: Write the failing tests**

Add to `frontend/src/__tests__/DayNightStrip.test.js`:

```js
import { fireEvent } from '@testing-library/react';

test('tooltip is hidden initially', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  expect(screen.queryByTestId('dns-tooltip')).not.toBeInTheDocument();
});

test('tooltip appears on mousemove over the bar', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  const bar = screen.getByTestId('dns-bar');
  // Mock getBoundingClientRect
  bar.getBoundingClientRect = () => ({ left: 0, width: 1000 });
  fireEvent.mouseMove(bar, { clientX: 500 }); // middle = UTC+1
  expect(screen.getByTestId('dns-tooltip')).toBeInTheDocument();
});

test('tooltip shows GMT offset text', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  const bar = screen.getByTestId('dns-bar');
  bar.getBoundingClientRect = () => ({ left: 0, width: 1000 });
  fireEvent.mouseMove(bar, { clientX: 500 });
  expect(screen.getByTestId('dns-tooltip').textContent).toMatch(/GMT/);
});

test('tooltip hides on mouseleave', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  const bar = screen.getByTestId('dns-bar');
  bar.getBoundingClientRect = () => ({ left: 0, width: 1000 });
  fireEvent.mouseMove(bar, { clientX: 500 });
  expect(screen.getByTestId('dns-tooltip')).toBeInTheDocument();
  fireEvent.mouseLeave(bar);
  expect(screen.queryByTestId('dns-tooltip')).not.toBeInTheDocument();
});

test('tooltip snaps to London when hovering near its pin', () => {
  // London is UTC+0. Strip offset formula: clientX/width * 26 - 12 = 0 → clientX = 12/26 * width
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  const bar = screen.getByTestId('dns-bar');
  bar.getBoundingClientRect = () => ({ left: 0, width: 1040 }); // 1040 * 12/26 = 480
  fireEvent.mouseMove(bar, { clientX: 480 });
  expect(screen.getByTestId('dns-tooltip').textContent).toContain('London');
});
```

**Step 2: Run to verify they fail**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern="DayNightStrip" --forceExit 2>&1 | tail -15
```

Expected: 5 new failures.

**Step 3: Update `frontend/src/DayNightStrip.jsx`**

```jsx
import { useState } from 'react';
import { buildStripGradient, getUTCOffset } from './utils/solar';
import './DayNightStrip.css';

const TOTAL_HOURS = 26; // GMT-12 to GMT+14
const AXIS_LABELS = [-12, -8, -4, 0, 4, 8, 12];
const SNAP_THRESHOLD = 1.5; // UTC hours

function pctFromOffset(offset) {
  return ((offset + 12) / TOTAL_HOURS) * 100;
}

function formatOffset(offset) {
  const sign = offset >= 0 ? '+' : '';
  const h = Math.floor(Math.abs(offset));
  const m = Math.round((Math.abs(offset) - h) * 60);
  return m > 0 ? `GMT ${sign}${offset < 0 ? '-' : ''}${h}:${String(m).padStart(2, '0')}`
               : `GMT ${sign}${offset}`;
}

function localTimeAtOffset(offset) {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + offset * 3600000);
  return local.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function DayNightStrip({ cities, solarMap }) {
  if (!cities || !solarMap) return null;

  const gradient = buildStripGradient(new Date());
  const nowOffset = getUTCOffset(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [tooltip, setTooltip] = useState(null); // { x, offset, city? }

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const rawOffset = pct * TOTAL_HOURS - 12;
    const offset = Math.round(rawOffset * 2) / 2; // snap to nearest 0.5

    // Find nearest city within threshold
    const nearestCity = cities.find(c => {
      const solar = solarMap[c.name];
      return solar && Math.abs(solar.utcOffset - rawOffset) < SNAP_THRESHOLD;
    });

    // Clamp tooltip x to stay within bar
    const tooltipX = Math.min(Math.max(pct * 100, 5), 95);

    setTooltip({ x: tooltipX, offset, city: nearestCity || null });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <div className="dns-wrapper" data-testid="day-night-strip">
      <div className="dns-axis">
        <span className="dns-gmt-label">GMT</span>
        {AXIS_LABELS.map(h => (
          <span key={h} className="dns-tick" style={{ left: `${pctFromOffset(h)}%` }}>
            {h >= 0 ? `+${h}` : h}
          </span>
        ))}
      </div>

      <div
        className="dns-bar"
        style={{ background: gradient }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        data-testid="dns-bar"
      >
        {cities.map(city => {
          const solar = solarMap[city.name];
          if (!solar) return null;
          return (
            <div key={city.name} className="dns-pin" style={{ left: `${pctFromOffset(solar.utcOffset)}%` }}>
              <span className="dns-pin-icon">{solar.isDay ? '☀️' : '🌙'}</span>
              <div className="dns-pin-line" />
              <span className="dns-pin-label">{city.name}</span>
            </div>
          );
        })}

        <div className="dns-now" style={{ left: `${pctFromOffset(nowOffset)}%` }}>
          <span className="dns-now-label">NOW</span>
          <div className="dns-now-line" />
        </div>

        {tooltip && (
          <div
            className="dns-tooltip"
            style={{ left: `${tooltip.x}%` }}
            data-testid="dns-tooltip"
          >
            <div className="dns-tooltip-offset">{formatOffset(tooltip.offset)}</div>
            <div className="dns-tooltip-time">{localTimeAtOffset(tooltip.offset)}</div>
            {tooltip.city && (() => {
              const solar = solarMap[tooltip.city.name];
              return (
                <>
                  <div className="dns-tooltip-city">
                    {solar.isDay ? '☀️' : '🌙'} {tooltip.city.name}
                  </div>
                  <div className="dns-tooltip-sun">↑{solar.sunrise} ↓{solar.sunset}</div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Add tooltip styles to `frontend/src/DayNightStrip.css`**

Append:

```css
/* Hover tooltip */
.dns-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  background: rgba(15, 12, 41, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 8px 12px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
  min-width: 110px;
}

.dns-tooltip-offset {
  font-size: 0.7rem;
  font-weight: 700;
  color: #a78bfa;
  letter-spacing: 0.3px;
}

.dns-tooltip-time {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  font-variant-numeric: tabular-nums;
  margin: 2px 0;
}

.dns-tooltip-city {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 4px;
  margin-top: 4px;
}

.dns-tooltip-sun {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
}
```

**Step 5: Run tests**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --forceExit 2>&1 | tail -10
```

Expected: all pass.

**Step 6: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/DayNightStrip.jsx frontend/src/DayNightStrip.css
git commit -m "feat: add hover tooltip to DayNightStrip showing UTC offset, local time, city snap"
```

---

## Task 7: AuthOverlay component

**Files:**
- Create: `frontend/src/AuthOverlay.jsx`
- Create: `frontend/src/AuthOverlay.css`
- Test: `frontend/src/__tests__/AuthOverlay.test.js`

**Step 1: Write the failing tests**

Create `frontend/src/__tests__/AuthOverlay.test.js`:

```js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthOverlay from '../AuthOverlay';

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

import { supabase } from '../supabase';

afterEach(() => jest.clearAllMocks());

test('renders email and password fields', () => {
  render(<AuthOverlay onLogin={jest.fn()} />);
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
});

test('renders Sign In button by default', () => {
  render(<AuthOverlay onLogin={jest.fn()} />);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

test('toggles to Sign Up mode', async () => {
  render(<AuthOverlay onLogin={jest.fn()} />);
  await userEvent.click(screen.getByText(/sign up/i));
  expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
});

test('calls supabase signInWithPassword on submit', async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
  const onLogin = jest.fn();
  render(<AuthOverlay onLogin={onLogin} />);
  await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  }));
});

test('calls onLogin after successful sign in', async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
  const onLogin = jest.fn();
  render(<AuthOverlay onLogin={onLogin} />);
  await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(onLogin).toHaveBeenCalled());
});

test('shows error message on failed sign in', async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });
  render(<AuthOverlay onLogin={jest.fn()} />);
  await userEvent.type(screen.getByPlaceholderText(/email/i), 'bad@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
});
```

**Step 2: Run to verify they fail**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern="AuthOverlay" --forceExit 2>&1 | tail -15
```

Expected: 6 failures.

**Step 3: Create `frontend/src/AuthOverlay.jsx`**

```jsx
import { useState } from 'react';
import { supabase } from './supabase';
import './AuthOverlay.css';

export default function AuthOverlay({ onLogin }) {
  const [mode, setMode]       = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
      const { data, error: authError } = await fn;
      if (authError) { setError(authError.message); return; }
      if (data?.user) onLogin(data.user);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <h2 className="auth-title">World Clock & Weather</h2>
        <p className="auth-sub">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'signin' ? (
            <>No account? <button className="auth-link" onClick={() => setMode('signup')}>Sign up</button></>
          ) : (
            <>Have an account? <button className="auth-link" onClick={() => setMode('signin')}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Create `frontend/src/AuthOverlay.css`**

```css
.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 12, 41, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.auth-card {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 20px;
  padding: 40px 36px;
  width: 100%;
  max-width: 380px;
}

.auth-title {
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(90deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
}

.auth-sub {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 24px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.auth-input:focus { border-color: rgba(167, 139, 250, 0.6); }
.auth-input::placeholder { color: rgba(255, 255, 255, 0.3); }

.auth-btn {
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  border: none;
  border-radius: 10px;
  padding: 12px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 4px;
  transition: opacity 0.2s;
}

.auth-btn:hover { opacity: 0.88; }
.auth-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.auth-error {
  font-size: 0.82rem;
  color: rgba(255, 100, 100, 0.9);
  margin: 0;
}

.auth-toggle {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  margin-top: 20px;
  margin-bottom: 0;
}

.auth-link {
  background: none;
  border: none;
  color: #a78bfa;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  padding: 0;
  text-decoration: underline;
}
```

**Step 5: Run tests**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --forceExit 2>&1 | tail -10
```

Expected: all pass.

**Step 6: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/AuthOverlay.jsx frontend/src/AuthOverlay.css frontend/src/__tests__/AuthOverlay.test.js
git commit -m "feat: add AuthOverlay with email/password sign in and sign up"
```

---

## Task 8: AddCityCard component

**Files:**
- Create: `frontend/src/AddCityCard.jsx`
- Create: `frontend/src/AddCityCard.css`
- Test: `frontend/src/__tests__/AddCityCard.test.js`

**Step 1: Write the failing tests**

Create `frontend/src/__tests__/AddCityCard.test.js`:

```js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCityCard from '../AddCityCard';

// Mock fetch for geocoding
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'JP', state: '' },
        { name: 'Tokyo Bay', lat: 35.5, lon: 139.8, country: 'JP', state: '' },
      ]),
    })
  );
});
afterEach(() => jest.clearAllMocks());

test('renders the + add card', () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  expect(screen.getByText(/add city/i)).toBeInTheDocument();
});

test('shows text input when clicked', async () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  await userEvent.click(screen.getByText(/add city/i));
  expect(screen.getByPlaceholderText(/search city/i)).toBeInTheDocument();
});

test('calls fetch after typing a city name', async () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  await userEvent.click(screen.getByText(/add city/i));
  await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Tokyo');
  await waitFor(() => expect(global.fetch).toHaveBeenCalled(), { timeout: 700 });
});

test('shows dropdown results after typing', async () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  await userEvent.click(screen.getByText(/add city/i));
  await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Tokyo');
  await waitFor(() => expect(screen.getByText('Tokyo, JP')).toBeInTheDocument(), { timeout: 700 });
});

test('calls onAdd with city data when result selected', async () => {
  const onAdd = jest.fn();
  render(<AddCityCard onAdd={onAdd} />);
  await userEvent.click(screen.getByText(/add city/i));
  await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Tokyo');
  await waitFor(() => screen.getByText('Tokyo, JP'), { timeout: 700 });
  await userEvent.click(screen.getByText('Tokyo, JP'));
  expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Tokyo',
    lat: 35.68,
    lon: 139.69,
    country: 'JP',
  }));
});
```

**Step 2: Run to verify they fail**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern="AddCityCard" --forceExit 2>&1 | tail -15
```

Expected: 5 failures.

**Step 3: Create `frontend/src/AddCityCard.jsx`**

```jsx
import { useState, useRef } from 'react';
import tzlookup from 'tz-lookup';
import './AddCityCard.css';

export default function AddCityCard({ onAdd }) {
  const [active, setActive]     = useState(false);
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const debounceRef             = useRef(null);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(result) {
    const timezone = tzlookup(result.lat, result.lon);
    const cc = result.country.toUpperCase();
    onAdd({
      name:      result.name,
      lat:       result.lat,
      lon:       result.lon,
      country:   result.country,
      timezone,
      owm_query: `${result.name},${cc}`,
    });
    setActive(false);
    setQuery('');
    setResults([]);
  }

  if (!active) {
    return (
      <div className="add-city-card" onClick={() => setActive(true)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setActive(true)}>
        <span className="add-city-icon">+</span>
        <span className="add-city-label">Add city</span>
      </div>
    );
  }

  return (
    <div className="add-city-card add-city-card--active">
      <input
        className="add-city-input"
        placeholder="Search city…"
        value={query}
        onChange={handleInput}
        autoFocus
      />
      {loading && <div className="add-city-loading">Searching…</div>}
      {results.length > 0 && (
        <ul className="add-city-dropdown">
          {results.map((r, i) => (
            <li key={i} className="add-city-result" onClick={() => handleSelect(r)}>
              {r.name}{r.state ? `, ${r.state}` : ''}, {r.country}
            </li>
          ))}
        </ul>
      )}
      <button className="add-city-cancel" onClick={() => { setActive(false); setQuery(''); setResults([]); }}>
        Cancel
      </button>
    </div>
  );
}
```

**Step 4: Create `frontend/src/AddCityCard.css`**

```css
.add-city-card {
  background: rgba(255, 255, 255, 0.04);
  border: 2px dashed rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  min-height: 120px;
  transition: border-color 0.2s, background 0.2s;
}

.add-city-card:hover {
  border-color: rgba(167, 139, 250, 0.5);
  background: rgba(167, 139, 250, 0.05);
}

.add-city-card--active {
  align-items: stretch;
  justify-content: flex-start;
  cursor: default;
  min-height: 160px;
  position: relative;
}

.add-city-icon {
  font-size: 1.8rem;
  color: rgba(255, 255, 255, 0.3);
  line-height: 1;
}

.add-city-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
}

.add-city-input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 10px 12px;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  width: 100%;
}

.add-city-input:focus { border-color: rgba(167, 139, 250, 0.6); }
.add-city-input::placeholder { color: rgba(255, 255, 255, 0.3); }

.add-city-dropdown {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  background: rgba(20, 15, 50, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
}

.add-city-result {
  padding: 9px 12px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: background 0.15s;
}

.add-city-result:hover { background: rgba(167, 139, 250, 0.15); }

.add-city-loading {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.35);
  padding: 6px 2px;
}

.add-city-cancel {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.8rem;
  cursor: pointer;
  margin-top: auto;
  padding: 4px 0;
  font-family: 'Inter', sans-serif;
  text-align: left;
}

.add-city-cancel:hover { color: rgba(255, 255, 255, 0.6); }
```

**Step 5: Run tests**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --forceExit 2>&1 | tail -10
```

Expected: all pass.

**Step 6: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/AddCityCard.jsx frontend/src/AddCityCard.css frontend/src/__tests__/AddCityCard.test.js
git commit -m "feat: add AddCityCard component with OWM geocoding search and tz-lookup"
```

---

## Task 9: App.jsx — Supabase auth + cities in state

**Files:**
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/__tests__/App.solar.test.js` (update existing mocks)

This is the integration task — wires auth, Supabase city loading/saving, and all new components together.

**Step 1: Write/update integration tests**

Add to `frontend/src/__tests__/App.solar.test.js`:

```js
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

test('shows auth overlay when no session', async () => {
  await act(async () => { render(<App />); });
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
});
```

Also update the two existing tests to mock a logged-in session:

```js
// At the top of the file, set up a helper to mock a logged-in session:
function mockLoggedIn() {
  const { supabase } = require('../supabase');
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: 'user-123' } } },
  });
  supabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'New York', lat: 40.71, lon: -74.01, timezone: 'America/New_York', owm_query: 'New York,US', position: 1 },
        { id: '2', name: 'London', lat: 51.51, lon: -0.13, timezone: 'Europe/London', owm_query: 'London,GB', position: 2 },
      ],
      error: null,
    }),
  });
}
```

**Step 2: Run to verify new test fails (logged-out case)**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern="App.solar" --forceExit 2>&1 | tail -15
```

**Step 3: Rewrite `frontend/src/App.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react';
import CityCard from './CityCard';
import AiPanel from './AiPanel';
import DayNightStrip from './DayNightStrip';
import AuthOverlay from './AuthOverlay';
import AddCityCard from './AddCityCard';
import { getSolarData, getMoonData } from './utils/solar';
import { supabase } from './supabase';
import './App.css';

const DEFAULT_CITIES = [
  { name: 'New York',    timezone: 'America/New_York',    owm_query: 'New York,US',    lat: 40.71, lon: -74.01  },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', owm_query: 'Los Angeles,US', lat: 34.05, lon: -118.24 },
  { name: 'London',      timezone: 'Europe/London',       owm_query: 'London,GB',      lat: 51.51, lon: -0.13   },
  { name: 'Chennai',     timezone: 'Asia/Kolkata',        owm_query: 'Chennai,IN',     lat: 13.08, lon: 80.27   },
  { name: 'Singapore',   timezone: 'Asia/Singapore',      owm_query: 'Singapore,SG',   lat: 1.35,  lon: 103.82  },
];

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

async function fetchWeather(query) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { temp: Math.round(data.main.temp), condition: data.weather[0].description, iconCode: data.weather[0].icon, error: false };
}

function buildSolarMap(cities, date) {
  return Object.fromEntries(
    cities.map(city => [
      city.name,
      { ...getSolarData(city, date), moon: getMoonData(date, city.timezone) },
    ])
  );
}

async function loadUserCities(userId) {
  const { data, error } = await supabase
    .from('user_cities')
    .select('*')
    .eq('user_id', userId)
    .order('position');
  if (error) throw error;
  if (data.length === 0) {
    // First login — seed defaults
    const rows = DEFAULT_CITIES.map((c, i) => ({ ...c, user_id: userId, position: i + 1 }));
    const { data: inserted } = await supabase.from('user_cities').insert(rows).select();
    return inserted || DEFAULT_CITIES.map((c, i) => ({ ...c, id: String(i), user_id: userId, position: i + 1 }));
  }
  return data;
}

function App() {
  const [session, setSession]                     = useState(undefined); // undefined=loading, null=logged out
  const [cities, setCities]                       = useState([]);
  const [weatherMap, setWeatherMap]               = useState({});
  const [weatherLoading, setWeatherLoading]       = useState(false);
  const [highlightedCities, setHighlightedCities] = useState(null);
  const [solarMap, setSolarMap]                   = useState({});
  const citiesRef                                 = useRef([]);

  // Keep ref in sync with state for solar interval
  useEffect(() => { citiesRef.current = cities; }, [cities]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load cities + weather when session available
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function init() {
      const loaded = await loadUserCities(session.user.id);
      if (cancelled) return;
      setCities(loaded);
      setSolarMap(buildSolarMap(loaded, new Date()));
      setWeatherLoading(true);
      const results = await Promise.allSettled(loaded.map(c => fetchWeather(c.owm_query)));
      if (cancelled) return;
      const map = {};
      results.forEach((r, i) => {
        map[loaded[i].name] = r.status === 'fulfilled' ? r.value : { error: true };
      });
      setWeatherMap(map);
      setWeatherLoading(false);
    }
    init();

    const solarInterval = setInterval(() => {
      setSolarMap(buildSolarMap(citiesRef.current, new Date()));
    }, 60_000);

    return () => { cancelled = true; clearInterval(solarInterval); };
  }, [session]);

  async function handleAddCity(cityData) {
    if (cities.length >= 6) return;
    const newCity = {
      ...cityData,
      user_id:  session.user.id,
      position: cities.length + 1,
    };
    const { data } = await supabase.from('user_cities').insert([newCity]).select();
    const saved = data?.[0] ?? { ...newCity, id: Date.now().toString() };
    const next = [...cities, saved];
    setCities(next);
    setSolarMap(buildSolarMap(next, new Date()));
    // Fetch weather for new city
    try {
      const w = await fetchWeather(saved.owm_query);
      setWeatherMap(m => ({ ...m, [saved.name]: w }));
    } catch {
      setWeatherMap(m => ({ ...m, [saved.name]: { error: true } }));
    }
  }

  async function handleRemoveCity(cityId) {
    await supabase.from('user_cities').delete().eq('id', cityId);
    const next = cities.filter(c => c.id !== cityId);
    setCities(next);
    setSolarMap(buildSolarMap(next, new Date()));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCities([]);
    setWeatherMap({});
    setSolarMap({});
  }

  // Loading state
  if (session === undefined) return null;

  // Logged out
  if (session === null) {
    return <AuthOverlay onLogin={() => {}} />;
    // onAuthStateChange will update session, which re-renders
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>World Clock & Weather</h1>
        <p>Live time and weather across your cities</p>
        <button className="auth-signout-btn" onClick={handleSignOut}>Sign out</button>
      </header>

      <DayNightStrip cities={cities} solarMap={solarMap} />

      <div className="city-grid">
        {cities.map(city => (
          <CityCard
            key={city.id || city.name}
            city={city.name}
            timezone={city.timezone}
            weatherData={weatherMap[city.name]}
            loading={weatherLoading}
            dimmed={highlightedCities !== null && !highlightedCities.includes(city.name)}
            solarData={solarMap[city.name]}
            onRemove={() => handleRemoveCity(city.id)}
          />
        ))}
        {cities.length < 6 && <AddCityCard onAdd={handleAddCity} />}
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

**Step 4: Add sign-out button style to `frontend/src/App.css`**

Append:
```css
.auth-signout-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 6px 14px;
  color: rgba(255, 255, 255, 0.55);
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s, color 0.2s;
}
.auth-signout-btn:hover { background: rgba(255, 255, 255, 0.13); color: #fff; }
```

**Step 5: Run all tests**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --forceExit 2>&1 | tail -15
```

Expected: all pass. If existing App.solar tests fail because they don't mock supabase yet, update their `beforeEach` to call `mockLoggedIn()`.

**Step 6: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add frontend/src/App.jsx frontend/src/App.css
git commit -m "feat: wire Supabase auth + city CRUD into App — cities loaded from DB, add/remove live"
```

---

## Task 10: Update requirements docs + TEST-CASES.md

**Files:**
- Modify: `docs/requirements/FUNCTIONAL-REQUIREMENTS.md` (v1.1 → v1.2)
- Modify: `docs/requirements/TECHNICAL-REQUIREMENTS.md` (v1.1 → v1.2)
- Modify: `docs/requirements/NON-FUNCTIONAL-REQUIREMENTS.md` (v1.1 → v1.2)
- Modify: `docs/TEST-CASES.md` (v1.0 → v1.1)

**Step 1: Update FUNCTIONAL-REQUIREMENTS.md**

- Bump version to 1.2, date to 2026-03-08
- Add FR-09: City Management (inline ✕ remove, "+" add card, 6 city max, OWM geocoding, tz-lookup, Supabase persist)
- Add FR-10: Authentication (email/password login/signup via Supabase Auth, cities load per user, sign out)
- Add FR-11: DayNightStrip hover tooltip (UTC offset, local time, city snap within ±1.5h, hidden on mobile)

**Step 2: Update TECHNICAL-REQUIREMENTS.md**

- Bump version to 1.2
- TR-01: Add `@supabase/supabase-js ^2.x` (frontend), `tz-lookup ^1.x` (frontend) rows
- TR-02: Add `supabase.js`, `AuthOverlay.jsx/.css`, `AddCityCard.jsx/.css` to project structure
- TR-03: Add `GET /api/geocode?q={city}` to API contracts
- TR-04: Add `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` to env vars table
- TR-06: Remove — city list is now dynamic (Supabase), not a static reference table. Replace with note.
- Add TR-08: Supabase schema (`user_cities` table columns, RLS policy)

**Step 3: Update NON-FUNCTIONAL-REQUIREMENTS.md**

- Bump version to 1.2
- Add NFR-08: Security — Supabase anon key safe to expose in frontend (RLS enforces row ownership); OWM key stays server-side; `user_cities` RLS policy ensures users can only access their own rows

**Step 4: Update TEST-CASES.md**

- Bump version to 1.1
- Add Suite 5: `AuthOverlay.test.js` (6 tests) — render, toggle, signIn call, onLogin callback, error display
- Add Suite 6: `AddCityCard.test.js` (5 tests) — render +, show input, fetch geocode, show dropdown, call onAdd
- Add Suite 7: new tests from `DayNightStrip.test.js` (5 new tests) — tooltip hidden, appears on mousemove, shows GMT, hides on mouseleave, snaps to city
- Add Suite 8: new tests from `CityCard.solar.test.js` (3 new tests) — shows × button, calls onRemove, hidden without onRemove
- Update total count from 42 to ~61

**Step 5: Commit**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather
git add docs/requirements/ docs/TEST-CASES.md
git commit -m "docs: update requirements to v1.2 and TEST-CASES to v1.1 for v2 features"
```

---

## Summary of all commits in this plan

1. `feat: install @supabase/supabase-js + tz-lookup, add supabase client`
2. `feat: add GET /api/geocode proxy route for OWM city search`
3. `style: reduce city card size to fit 6 cards comfortably at 3-per-row`
4. `refactor: buildSolarMap accepts cities array param, add citiesRef for interval`
5. `feat: add × remove button to city cards, shown on hover`
6. `feat: add hover tooltip to DayNightStrip showing UTC offset, local time, city snap`
7. `feat: add AuthOverlay with email/password sign in and sign up`
8. `feat: add AddCityCard component with OWM geocoding search and tz-lookup`
9. `feat: wire Supabase auth + city CRUD into App — cities loaded from DB, add/remove live`
10. `docs: update requirements to v1.2 and TEST-CASES to v1.1 for v2 features`
