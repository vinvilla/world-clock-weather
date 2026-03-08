# Sun & Moon Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real-astronomy day/night timeline strip and city card solar enrichment (sunrise/sunset, moon phase, full moon watch data) to the World Clock & Weather dashboard.

**Architecture:** All pure frontend — `suncalc` (~9KB) computes solar/lunar data from city lat/lon. A new `utils/solar.js` module exposes pure functions consumed by `App.jsx` (solarMap state, 60s interval), `CityCard.jsx` (card enrichment), and `DayNightStrip.jsx` (GMT-12→+14 gradient timeline).

**Tech Stack:** React (CRA), suncalc ^1.9, plain CSS, Jest + React Testing Library (built into CRA)

---

## Task 1: Install suncalc

**Files:**
- Modify: `frontend/package.json` (automatic via npm)

**Step 1: Install**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm install suncalc
```

**Step 2: Verify**

```bash
node -e "const s = require('suncalc'); console.log(typeof s.getTimes)"
```
Expected output: `function`

**Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: install suncalc for solar/lunar astronomy"
```

---

## Task 2: Create solar utility module (TDD)

**Files:**
- Create: `frontend/src/__tests__/solar.test.js`
- Create: `frontend/src/utils/solar.js`

**Step 1: Create the test directory and write failing tests**

Create `frontend/src/__tests__/solar.test.js`:

```js
import {
  getUTCOffset,
  getSolarData,
  getMoonData,
  getMoonPhaseName,
  buildStripGradient,
} from '../utils/solar';

// Fixed reference: London, 2026-03-08 12:00 UTC (midday = daytime)
const LONDON = { name: 'London', lat: 51.51, lon: -0.13, timezone: 'Europe/London' };
const NOON_UTC = new Date('2026-03-08T12:00:00Z');
const MIDNIGHT_UTC = new Date('2026-03-08T00:00:00Z');

describe('getUTCOffset', () => {
  test('London in March is UTC+0', () => {
    expect(getUTCOffset('Europe/London', NOON_UTC)).toBe(0);
  });

  test('New York in March is UTC-5 (EST)', () => {
    expect(getUTCOffset('America/New_York', NOON_UTC)).toBe(-5);
  });

  test('Singapore is always UTC+8', () => {
    expect(getUTCOffset('Asia/Singapore', NOON_UTC)).toBe(8);
  });
});

describe('getSolarData', () => {
  test('returns isDay=true for London at noon UTC', () => {
    const data = getSolarData(LONDON, NOON_UTC);
    expect(data.isDay).toBe(true);
  });

  test('returns isDay=false for London at midnight UTC', () => {
    const data = getSolarData(LONDON, MIDNIGHT_UTC);
    expect(data.isDay).toBe(false);
  });

  test('returns sunrise and sunset as formatted strings', () => {
    const data = getSolarData(LONDON, NOON_UTC);
    // Matches "HH:MM AM/PM" format
    expect(data.sunrise).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
    expect(data.sunset).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });

  test('returns countdown string', () => {
    const data = getSolarData(LONDON, NOON_UTC);
    expect(data.countdown).toMatch(/^(Sunrise|Sunset) in \d+h \d+m$/);
  });

  test('returns utcOffset number', () => {
    const data = getSolarData(LONDON, NOON_UTC);
    expect(typeof data.utcOffset).toBe('number');
  });
});

describe('getMoonData', () => {
  test('returns phase 0-1', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    expect(data.phase).toBeGreaterThanOrEqual(0);
    expect(data.phase).toBeLessThan(1);
  });

  test('returns illumination 0-100', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    expect(data.illumination).toBeGreaterThanOrEqual(0);
    expect(data.illumination).toBeLessThanOrEqual(100);
  });

  test('returns phaseName string', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    expect(typeof data.phaseName).toBe('string');
    expect(data.phaseName.length).toBeGreaterThan(0);
  });

  test('returns phaseEmoji string', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    expect(typeof data.phaseEmoji).toBe('string');
  });

  test('returns daysSinceFullMoon >= 0', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    expect(data.daysSinceFullMoon).toBeGreaterThanOrEqual(0);
  });

  test('returns nextFullMoonDate as a Date', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    expect(data.nextFullMoonDate).toBeInstanceOf(Date);
  });

  test('returns nextFullMoonLabel as formatted string', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    // e.g. "Mar 14"
    expect(data.nextFullMoonLabel).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });

  test('returns daysToNextFullMoon > 0', () => {
    const data = getMoonData(NOON_UTC, 'Europe/London');
    expect(data.daysToNextFullMoon).toBeGreaterThan(0);
  });
});

describe('getMoonPhaseName', () => {
  test('0.0 = New Moon', () => {
    expect(getMoonPhaseName(0.0)).toEqual({ name: 'New Moon', emoji: '🌑' });
  });
  test('0.5 = Full Moon', () => {
    expect(getMoonPhaseName(0.5)).toEqual({ name: 'Full Moon', emoji: '🌕' });
  });
  test('0.25 = First Quarter', () => {
    expect(getMoonPhaseName(0.25)).toEqual({ name: 'First Quarter', emoji: '🌓' });
  });
  test('0.75 = Last Quarter', () => {
    expect(getMoonPhaseName(0.75)).toEqual({ name: 'Last Quarter', emoji: '🌗' });
  });
});

describe('buildStripGradient', () => {
  test('returns a string starting with linear-gradient', () => {
    const gradient = buildStripGradient(NOON_UTC);
    expect(typeof gradient).toBe('string');
    expect(gradient.startsWith('linear-gradient')).toBe(true);
  });

  test('contains colour stops', () => {
    const gradient = buildStripGradient(NOON_UTC);
    expect(gradient).toContain('%');
  });
});
```

**Step 2: Run tests — expect ALL to fail**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern=solar
```

Expected: multiple failures — "Cannot find module '../utils/solar'"

**Step 3: Create `frontend/src/utils/solar.js`**

```js
import SunCalc from 'suncalc';

// ─── UTC Offset ───────────────────────────────────────────────────────────────

/**
 * Returns the UTC offset in hours for a given timezone at a given date.
 * e.g. 'America/New_York' in March → -5
 */
export function getUTCOffset(timezone, date = new Date()) {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate - utcDate) / 3_600_000;
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

function formatTime(date, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatCountdown(ms) {
  const totalMins = Math.round(Math.abs(ms) / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m}m`;
}

// ─── Moon Phase ───────────────────────────────────────────────────────────────

const PHASES = [
  { max: 0.0625,  name: 'New Moon',        emoji: '🌑' },
  { max: 0.1875,  name: 'Waxing Crescent', emoji: '🌒' },
  { max: 0.3125,  name: 'First Quarter',   emoji: '🌓' },
  { max: 0.4375,  name: 'Waxing Gibbous',  emoji: '🌔' },
  { max: 0.5625,  name: 'Full Moon',       emoji: '🌕' },
  { max: 0.6875,  name: 'Waning Gibbous',  emoji: '🌖' },
  { max: 0.8125,  name: 'Last Quarter',    emoji: '🌗' },
  { max: 1.0,     name: 'Waning Crescent', emoji: '🌘' },
];

export function getMoonPhaseName(phase) {
  const entry = PHASES.find(p => phase < p.max) ?? PHASES[PHASES.length - 1];
  return { name: entry.name, emoji: entry.emoji };
}

// ─── Solar Data (per city) ────────────────────────────────────────────────────

/**
 * Returns full solar enrichment data for a city.
 * city: { name, lat, lon, timezone }
 */
export function getSolarData(city, date = new Date()) {
  const times = SunCalc.getTimes(date, city.lat, city.lon);
  const isDay = date >= times.sunrise && date <= times.sunset;

  const nextEvent = isDay ? times.sunset : times.sunrise;
  const nextLabel = isDay ? 'Sunset' : 'Sunrise';
  const countdown = `${nextLabel} in ${formatCountdown(nextEvent - date)}`;

  return {
    isDay,
    sunrise: formatTime(times.sunrise, city.timezone),
    sunset: formatTime(times.sunset, city.timezone),
    countdown,
    utcOffset: getUTCOffset(city.timezone, date),
  };
}

// ─── Moon Data (global — same for all cities, local date per timezone) ────────

/**
 * Returns moon phase + full moon watch data.
 * The phase value is global; the full moon local DATE depends on the city timezone.
 */
export function getMoonData(date = new Date(), timezone = 'UTC') {
  const { phase, fraction } = SunCalc.getMoonIllumination(date);
  const { name: phaseName, emoji: phaseEmoji } = getMoonPhaseName(phase);
  const illumination = Math.round(fraction * 100);

  // Days since last full moon
  const SYNODIC = 29.530589;
  const daysSinceFullMoon = Math.round(
    phase >= 0.5 ? (phase - 0.5) * SYNODIC : (phase + 0.5) * SYNODIC
  );

  // Next full moon: walk forward until phase crosses into Full Moon band
  const nextFullMoonDate = findNextFullMoon(date);
  const daysToNextFullMoon = Math.ceil(
    (nextFullMoonDate - date) / 86_400_000
  );
  const nextFullMoonLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
  }).format(nextFullMoonDate);

  return {
    phase,
    phaseName,
    phaseEmoji,
    illumination,
    daysSinceFullMoon,
    nextFullMoonDate,
    nextFullMoonLabel,
    daysToNextFullMoon,
  };
}

function findNextFullMoon(fromDate) {
  const d = new Date(fromDate);
  for (let i = 1; i <= 31; i++) {
    d.setDate(d.getDate() + 1);
    const p = SunCalc.getMoonIllumination(d).phase;
    if (p >= 0.4375 && p <= 0.5625) return new Date(d);
  }
  // Fallback: estimate from synodic period
  const SYNODIC = 29.530589;
  const phase = SunCalc.getMoonIllumination(fromDate).phase;
  const daysToFull = phase < 0.5 ? (0.5 - phase) * SYNODIC : (1.5 - phase) * SYNODIC;
  const result = new Date(fromDate);
  result.setDate(result.getDate() + Math.round(daysToFull));
  return result;
}

// ─── Strip Gradient ───────────────────────────────────────────────────────────

const NIGHT      = 'rgba(8, 8, 25, 0.97)';
const ASTRO_TWI  = 'rgba(15, 15, 50, 0.85)';
const NAUT_TWI   = 'rgba(30, 25, 75, 0.75)';
const CIVIL_TWI  = 'rgba(180, 95, 35, 0.65)';
const DAY_COLOR  = 'rgba(120, 170, 255, 0.30)';

/**
 * Builds a CSS linear-gradient string for the day/night strip.
 * Samples UTC offsets from -12 to +14 in 0.5h steps.
 */
export function buildStripGradient(date = new Date()) {
  const TOTAL_HOURS = 26; // -12 to +14
  const STEP = 0.5;
  const stops = [];

  for (let offset = -12; offset <= 14; offset += STEP) {
    const lon = offset * 15;
    const times = SunCalc.getTimes(date, 0, lon); // lat=0, equator representative

    let color;
    if (date >= times.sunrise && date <= times.sunset) {
      color = DAY_COLOR;
    } else if (date >= times.dawn && date < times.sunrise) {
      color = CIVIL_TWI;
    } else if (date > times.sunset && date <= times.dusk) {
      color = CIVIL_TWI;
    } else if (date >= times.nauticalDawn && date < times.dawn) {
      color = NAUT_TWI;
    } else if (date > times.dusk && date <= times.nauticalDusk) {
      color = NAUT_TWI;
    } else if (date >= times.astronomicalDawn && date < times.nauticalDawn) {
      color = ASTRO_TWI;
    } else if (date > times.nauticalDusk && date <= times.astronomicalDusk) {
      color = ASTRO_TWI;
    } else {
      color = NIGHT;
    }

    const pct = ((offset + 12) / TOTAL_HOURS) * 100;
    stops.push(`${color} ${pct.toFixed(1)}%`);
  }

  return `linear-gradient(to right, ${stops.join(', ')})`;
}
```

**Step 4: Run tests — expect all to pass**

```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm test -- --watchAll=false --testPathPattern=solar
```

Expected: all tests PASS

**Step 5: Commit**

```bash
git add frontend/src/utils/solar.js frontend/src/__tests__/solar.test.js
git commit -m "feat: add solar.js utility with suncalc — sunrise/sunset/moon/gradient"
```

---

## Task 3: Update App.jsx — add lat/lon, solarMap state, 60s interval

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Write failing test**

Create `frontend/src/__tests__/App.solar.test.js`:

```js
import { render, screen, act } from '@testing-library/react';
import App from '../App';

// Mock fetch to prevent real API calls in tests
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        main: { temp: 70 },
        weather: [{ description: 'clear sky', icon: '01d' }],
      }),
    })
  );
});

afterEach(() => jest.clearAllMocks());

test('App renders without crashing with solar data', async () => {
  await act(async () => {
    render(<App />);
  });
  // City cards should be present
  expect(screen.getByText('Hello, New York!')).toBeInTheDocument();
});

test('App renders DayNightStrip', async () => {
  await act(async () => {
    render(<App />);
  });
  expect(screen.getByTestId('day-night-strip')).toBeInTheDocument();
});
```

**Step 2: Run — expect DayNightStrip test to fail**

```bash
npm test -- --watchAll=false --testPathPattern=App.solar
```

Expected: FAIL — "Unable to find an element by: [data-testid="day-night-strip"]"

**Step 3: Update `frontend/src/App.jsx`**

Replace the full file:

```jsx
import { useState, useEffect } from 'react';
import CityCard from './CityCard';
import AiPanel from './AiPanel';
import DayNightStrip from './DayNightStrip';
import { getSolarData, getMoonData } from './utils/solar';
import './App.css';

const CITIES = [
  { name: 'New York',    timezone: 'America/New_York',    query: 'New York,US',    lat: 40.71,  lon: -74.01  },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', query: 'Los Angeles,US', lat: 34.05,  lon: -118.24 },
  { name: 'London',      timezone: 'Europe/London',       query: 'London,GB',      lat: 51.51,  lon: -0.13   },
  { name: 'Chennai',     timezone: 'Asia/Kolkata',        query: 'Chennai,IN',     lat: 13.08,  lon: 80.27   },
  { name: 'Singapore',   timezone: 'Asia/Singapore',      query: 'Singapore,SG',   lat: 1.35,   lon: 103.82  },
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

function buildSolarMap(date) {
  const moon = getMoonData(date);
  return Object.fromEntries(
    CITIES.map(city => [
      city.name,
      {
        ...getSolarData(city, date),
        moon: getMoonData(date, city.timezone),
      },
    ])
  );
}

function App() {
  const [weatherMap, setWeatherMap]     = useState({});
  const [loading, setLoading]           = useState(true);
  const [highlightedCities, setHighlightedCities] = useState(null);
  const [solarMap, setSolarMap]         = useState(() => buildSolarMap(new Date()));

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled(
        CITIES.map(c => fetchWeather(c.query))
      );
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

    // Refresh solar data every 60 seconds
    const solarInterval = setInterval(() => {
      setSolarMap(buildSolarMap(new Date()));
    }, 60_000);

    return () => clearInterval(solarInterval);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>World Clock & Weather</h1>
        <p>Live time and weather across 5 cities</p>
      </header>

      <DayNightStrip cities={CITIES} solarMap={solarMap} />

      <div className="city-grid">
        {CITIES.map(city => (
          <CityCard
            key={city.name}
            city={city.name}
            timezone={city.timezone}
            weatherData={weatherMap[city.name]}
            loading={loading}
            dimmed={highlightedCities !== null && !highlightedCities.includes(city.name)}
            solarData={solarMap[city.name]}
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

**Step 4: Run tests — expect to pass**

```bash
npm test -- --watchAll=false --testPathPattern=App.solar
```

Expected: PASS (DayNightStrip will be created as a stub in the next task)

> Note: This will fail until Task 4 creates DayNightStrip. That's expected — proceed to Task 4 immediately.

**Step 5: Commit after Task 4 passes**

(Hold commit — combine with Task 4 commit below)

---

## Task 4: Create DayNightStrip component

**Files:**
- Create: `frontend/src/DayNightStrip.jsx`
- Create: `frontend/src/DayNightStrip.css`
- Create: `frontend/src/__tests__/DayNightStrip.test.js`

**Step 1: Write failing test**

Create `frontend/src/__tests__/DayNightStrip.test.js`:

```js
import { render, screen } from '@testing-library/react';
import DayNightStrip from '../DayNightStrip';

const CITIES = [
  { name: 'New York',  timezone: 'America/New_York',    lat: 40.71, lon: -74.01  },
  { name: 'London',    timezone: 'Europe/London',       lat: 51.51, lon: -0.13   },
  { name: 'Singapore', timezone: 'Asia/Singapore',      lat: 1.35,  lon: 103.82  },
];

const solarMap = {
  'New York':  { isDay: false, utcOffset: -5, sunrise: '6:42 AM', sunset: '6:07 PM', countdown: 'Sunrise in 8h 0m' },
  'London':    { isDay: true,  utcOffset: 0,  sunrise: '6:40 AM', sunset: '6:08 PM', countdown: 'Sunset in 3h 0m'  },
  'Singapore': { isDay: true,  utcOffset: 8,  sunrise: '7:14 AM', sunset: '7:21 PM', countdown: 'Sunset in 1h 0m'  },
};

test('renders the strip container', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  expect(screen.getByTestId('day-night-strip')).toBeInTheDocument();
});

test('renders a pin for each city', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  expect(screen.getByText('New York')).toBeInTheDocument();
  expect(screen.getByText('London')).toBeInTheDocument();
  expect(screen.getByText('Singapore')).toBeInTheDocument();
});

test('renders the NOW marker', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  expect(screen.getByText('NOW')).toBeInTheDocument();
});

test('renders GMT axis labels', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  expect(screen.getByText('GMT')).toBeInTheDocument();
});

test('day city shows sun emoji', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  // London and Singapore are daytime
  const pins = screen.getAllByText('☀️');
  expect(pins.length).toBeGreaterThanOrEqual(1);
});

test('night city shows moon emoji', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  const pins = screen.getAllByText('🌙');
  expect(pins.length).toBeGreaterThanOrEqual(1);
});
```

**Step 2: Run — expect all to fail**

```bash
npm test -- --watchAll=false --testPathPattern=DayNightStrip
```

Expected: FAIL — "Cannot find module '../DayNightStrip'"

**Step 3: Create `frontend/src/DayNightStrip.jsx`**

```jsx
import { useMemo } from 'react';
import { buildStripGradient, getUTCOffset } from './utils/solar';
import './DayNightStrip.css';

const TOTAL_HOURS = 26; // GMT-12 to GMT+14
const AXIS_LABELS = [-12, -8, -4, 0, 4, 8, 12];

function pctFromOffset(offset) {
  return ((offset + 12) / TOTAL_HOURS) * 100;
}

export default function DayNightStrip({ cities, solarMap }) {
  const gradient = useMemo(() => buildStripGradient(new Date()), []);
  const nowOffset = useMemo(() => getUTCOffset(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ), []);

  return (
    <div className="dns-wrapper" data-testid="day-night-strip">
      <div className="dns-axis">
        <span className="dns-gmt-label">GMT</span>
        {AXIS_LABELS.map(h => (
          <span
            key={h}
            className="dns-tick"
            style={{ left: `${pctFromOffset(h)}%` }}
          >
            {h >= 0 ? `+${h}` : h}
          </span>
        ))}
      </div>

      <div className="dns-bar" style={{ background: gradient }}>
        {/* City pins */}
        {cities.map(city => {
          const solar = solarMap[city.name];
          if (!solar) return null;
          return (
            <div
              key={city.name}
              className="dns-pin"
              style={{ left: `${pctFromOffset(solar.utcOffset)}%` }}
            >
              <span className="dns-pin-icon">{solar.isDay ? '☀️' : '🌙'}</span>
              <div className="dns-pin-line" />
              <span className="dns-pin-label">{city.name}</span>
            </div>
          );
        })}

        {/* NOW marker */}
        <div
          className="dns-now"
          style={{ left: `${pctFromOffset(nowOffset)}%` }}
        >
          <span className="dns-now-label">NOW</span>
          <div className="dns-now-line" />
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create `frontend/src/DayNightStrip.css`**

```css
.dns-wrapper {
  width: 100%;
  max-width: 1100px;
  margin-bottom: 32px;
  user-select: none;
}

/* Axis row */
.dns-axis {
  position: relative;
  height: 20px;
  margin-bottom: 4px;
}

.dns-gmt-label {
  position: absolute;
  left: 0;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.dns-tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.3);
}

/* The gradient bar */
.dns-bar {
  position: relative;
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: visible;
}

/* City pins */
.dns-pin {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.dns-pin-icon {
  font-size: 1rem;
  line-height: 1;
  margin-top: -18px;
}

.dns-pin-line {
  width: 1px;
  height: 48px;
  background: rgba(255, 255, 255, 0.25);
}

.dns-pin-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 4px;
  white-space: nowrap;
}

/* NOW marker */
.dns-now {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.dns-now-label {
  font-size: 0.6rem;
  font-weight: 700;
  color: #a78bfa;
  margin-top: -16px;
  letter-spacing: 0.5px;
}

.dns-now-line {
  width: 2px;
  height: 48px;
  background: rgba(167, 139, 250, 0.7);
  border-radius: 2px;
}

/* Hide city labels on mobile */
@media (max-width: 580px) {
  .dns-pin-label { display: none; }
  .dns-tick      { display: none; }
}
```

**Step 5: Run tests — expect all to pass**

```bash
npm test -- --watchAll=false --testPathPattern="DayNightStrip|App.solar"
```

Expected: all PASS

**Step 6: Commit**

```bash
git add frontend/src/App.jsx \
        frontend/src/DayNightStrip.jsx \
        frontend/src/DayNightStrip.css \
        frontend/src/__tests__/App.solar.test.js \
        frontend/src/__tests__/DayNightStrip.test.js
git commit -m "feat: add DayNightStrip GMT timeline and wire solar state in App"
```

---

## Task 5: Enrich CityCard with solar data

**Files:**
- Modify: `frontend/src/CityCard.jsx`
- Modify: `frontend/src/App.css`
- Create: `frontend/src/__tests__/CityCard.solar.test.js`

**Step 1: Write failing tests**

Create `frontend/src/__tests__/CityCard.solar.test.js`:

```js
import { render, screen } from '@testing-library/react';
import CityCard from '../CityCard';

const baseSolarData = {
  isDay: true,
  sunrise: '6:42 AM',
  sunset: '6:31 PM',
  countdown: 'Sunset in 2h 14m',
  utcOffset: 0,
  moon: {
    phaseName: 'Waxing Gibbous',
    phaseEmoji: '🌔',
    illumination: 74,
    daysSinceFullMoon: 3,
    nextFullMoonLabel: 'Mar 14',
    daysToNextFullMoon: 6,
  },
};

const nightSolarData = { ...baseSolarData, isDay: false };

function renderCard(solarData = baseSolarData) {
  render(
    <CityCard
      city="London"
      timezone="Europe/London"
      weatherData={{ temp: 55, condition: 'cloudy', iconCode: '04d', error: false }}
      loading={false}
      dimmed={false}
      solarData={solarData}
    />
  );
}

test('shows sunrise time', () => {
  renderCard();
  expect(screen.getByText(/6:42 AM/)).toBeInTheDocument();
});

test('shows sunset time', () => {
  renderCard();
  expect(screen.getByText(/6:31 PM/)).toBeInTheDocument();
});

test('shows countdown', () => {
  renderCard();
  expect(screen.getByText('Sunset in 2h 14m')).toBeInTheDocument();
});

test('shows Day label when isDay=true', () => {
  renderCard();
  expect(screen.getByText('Day')).toBeInTheDocument();
});

test('shows Night label when isDay=false', () => {
  renderCard(nightSolarData);
  expect(screen.getByText('Night')).toBeInTheDocument();
});

test('shows moon phase name', () => {
  renderCard();
  expect(screen.getByText(/Waxing Gibbous/)).toBeInTheDocument();
});

test('shows moon illumination', () => {
  renderCard();
  expect(screen.getByText(/74%/)).toBeInTheDocument();
});

test('shows days since last full moon', () => {
  renderCard();
  expect(screen.getByText(/3 days ago/)).toBeInTheDocument();
});

test('shows next full moon label', () => {
  renderCard();
  expect(screen.getByText(/Mar 14/)).toBeInTheDocument();
});

test('shows days to next full moon', () => {
  renderCard();
  expect(screen.getByText(/6 days/)).toBeInTheDocument();
});

test('renders gracefully when solarData is undefined', () => {
  render(
    <CityCard
      city="London"
      timezone="Europe/London"
      weatherData={{ temp: 55, condition: 'cloudy', iconCode: '04d', error: false }}
      loading={false}
      dimmed={false}
      solarData={undefined}
    />
  );
  // Should not crash — card still renders
  expect(screen.getByText('Hello, London!')).toBeInTheDocument();
});
```

**Step 2: Run — expect failures**

```bash
npm test -- --watchAll=false --testPathPattern=CityCard.solar
```

Expected: FAIL — sunrise/sunset/moon fields not rendered yet

**Step 3: Update `frontend/src/CityCard.jsx`**

Replace the full file:

```jsx
import { useState, useEffect } from 'react';

function CityCard({ city, timezone, weatherData, loading, dimmed, solarData }) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now));
      setDateStr(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        month: 'short',
        day: 'numeric',
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

      {solarData && (
        <div className="city-solar">
          <div className="solar-daynight">
            <span className="solar-icon">{solarData.isDay ? '☀️' : '🌙'}</span>
            <span className="solar-label">{solarData.isDay ? 'Day' : 'Night'}</span>
          </div>
          <div className="solar-times">
            <span>↑ {solarData.sunrise}</span>
            <span>↓ {solarData.sunset}</span>
          </div>
          <div className="solar-countdown">{solarData.countdown}</div>

          {solarData.moon && (
            <div className="solar-moon">
              <div className="moon-phase-row">
                <span className="moon-emoji">{solarData.moon.phaseEmoji}</span>
                <span className="moon-name">{solarData.moon.phaseName}</span>
                <span className="moon-illumination">{solarData.moon.illumination}%</span>
              </div>
              <div className="moon-watch">
                <span>Last full moon: {solarData.moon.daysSinceFullMoon} days ago</span>
              </div>
              <div className="moon-watch">
                <span>
                  Next full moon: {solarData.moon.nextFullMoonLabel}
                  &nbsp;(in {solarData.moon.daysToNextFullMoon} days)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CityCard;
```

**Step 4: Add solar styles to `frontend/src/App.css`**

Append to the end of `App.css`:

```css
/* Solar enrichment */
.city-solar {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.solar-daynight {
  display: flex;
  align-items: center;
  gap: 6px;
}

.solar-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.solar-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.solar-times {
  display: flex;
  gap: 14px;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.5);
}

.solar-countdown {
  font-size: 0.8rem;
  color: #a78bfa;
  font-weight: 500;
}

.solar-moon {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.moon-phase-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.moon-emoji {
  font-size: 1rem;
}

.moon-name {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.moon-illumination {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-left: auto;
}

.moon-watch {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.5;
}
```

**Step 5: Run all tests — expect all to pass**

```bash
npm test -- --watchAll=false
```

Expected: all suites PASS

**Step 6: Commit**

```bash
git add frontend/src/CityCard.jsx \
        frontend/src/App.css \
        frontend/src/__tests__/CityCard.solar.test.js
git commit -m "feat: enrich city cards with sunrise/sunset, moon phase, full moon watch data"
```

---

## Task 6: Smoke test in browser

**Step 1: Start both servers**

Terminal 1:
```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/backend
node server.js
```

Terminal 2:
```bash
cd /Users/vinayvillavan/Desktop/world-clock-weather/frontend
npm start
```

**Step 2: Verify checklist**

Open `http://localhost:3000` and confirm:

- [ ] DayNightStrip renders between the header and city grid
- [ ] Gradient shows dark (night) and light (day) bands across the timeline
- [ ] All 5 city pins appear with correct sun/moon emoji
- [ ] "NOW" marker is visible
- [ ] Each city card shows sunrise/sunset times
- [ ] Each city card shows a countdown ("Sunset in Xh Ym")
- [ ] Each card shows moon phase emoji + name + illumination %
- [ ] Each card shows "Last full moon: N days ago"
- [ ] Each card shows "Next full moon: [date] (in N days)"
- [ ] No console errors

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: sun/moon feature complete — day/night strip + card solar enrichment"
```
