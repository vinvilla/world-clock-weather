# World Clock & Weather Dashboard — Reusable Project Prompt

> Copy and paste everything below the horizontal rule into any AI assistant to recreate this project from scratch.

---

Build a **World Clock & Weather Dashboard** as a single-page React application. The app displays a dark glassmorphism card grid showing live local time and current weather conditions for 5 major cities around the world.

---

## Functional Requirements

1. **Greeting** — Each city card displays "Hello, [City Name]!" as the headline.
2. **Live Local Clock** — Each card shows the current local time in the city's timezone, updating every second (HH:MM:SS AM/PM format). Below the time, show the current day, abbreviated month, and date (e.g. "Tuesday, Mar 7").
3. **Current Weather** — Each card shows:
   - Temperature in Fahrenheit (rounded to nearest degree)
   - Weather condition text (e.g. "partly cloudy", "light rain")
   - Weather icon from OpenWeatherMap's icon CDN
4. **Loading State** — While weather data is being fetched, each card shows a pulsing skeleton shimmer placeholder (not a spinner).
5. **Error State** — If the API call for a city fails (bad key, network error, etc.), the card still renders with the live clock and shows "Weather unavailable" in the weather section. The app must not crash.
6. **5 Cities:**
   | City | Timezone |
   |------|----------|
   | New York | America/New_York |
   | Los Angeles | America/Los_Angeles |
   | London | Europe/London |
   | Chennai | Asia/Kolkata |
   | Singapore | Asia/Singapore |

---

## Technical Requirements

### Stack
- **React 19** with Create React App (CRA) — `npx create-react-app frontend`
- **No UI libraries** — pure CSS only (no Tailwind, no MUI, no Chakra)
- **No router, no backend, no database**
- **OpenWeatherMap Current Weather API** (free tier — 1,000 calls/day)

### API Integration
- Use the OpenWeatherMap **Current Weather** endpoint:
  ```
  GET https://api.openweathermap.org/data/2.5/weather?q={city},{country_code}&appid={key}&units=imperial
  ```
- Store the API key in `.env.local` as `REACT_APP_WEATHER_API_KEY` (CRA exposes `REACT_APP_` prefixed vars to the browser)
- Fetch all 5 cities in **parallel** using `Promise.allSettled()` on mount — never sequential
- Fetch once on mount, no auto-refresh needed
- Use `encodeURIComponent` on the city query string

### Component Structure
```
src/
  App.jsx         — root: manages weather state, renders grid
  CityCard.jsx    — single card: greeting, clock, weather
  App.css         — all styles
src/index.js      — CRA entry point
```

### Clock Implementation
- Use `Intl.DateTimeFormat` with the city's IANA timezone for all time/date rendering
- Run `setInterval(tick, 1000)` inside `useEffect` per card
- Return a cleanup function `() => clearInterval(interval)` to prevent memory leaks

### Visual Design — Dark Glassmorphism
- **Body background**: deep dark purple gradient — `linear-gradient(135deg, #0f0c29, #302b63, #24243e)`
- **Cards**: `background: rgba(255,255,255,0.07)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.13)`, `border-radius: 20px`
- **Card hover**: `transform: translateY(-4px)` with `box-shadow`
- **Font**: Google Inter — load via `<link>` in `public/index.html`
- **Greeting color**: white `#fff`
- **Time color**: soft purple `#a78bfa`
- **Temperature color**: soft blue `#60a5fa`
- **Weather icon**: `https://openweathermap.org/img/wn/{iconCode}@2x.png` (44×44px)

### Layout — Responsive CSS Grid
```css
grid-template-columns: repeat(3, 1fr);   /* desktop */
grid-template-columns: repeat(2, 1fr);   /* ≤900px */
grid-template-columns: 1fr;              /* ≤580px */
gap: 24px;
max-width: 1100px;
```

### Page Header
- Title: "World Clock & Weather" — gradient text (purple to blue)
- Subtitle: "Live time and weather across 5 cities" — muted white

### Error Handling Pattern
Use `Promise.allSettled()` (not `Promise.all()`) so one failed city never blocks the others:
```js
const results = await Promise.allSettled(cities.map(c => fetchWeather(c.query)));
results.forEach((result, i) => {
  map[cities[i].name] = result.status === 'fulfilled'
    ? result.value
    : { error: true };
});
```

### .gitignore
Never commit `.env.local` — it is already in CRA's default `.gitignore`. Verify with:
```bash
grep ".env.local" .gitignore
```

---

## How to Run

1. Get a free API key at [openweathermap.org](https://openweathermap.org) (takes ~10 min to activate)
2. Create `.env.local` in the project root:
   ```
   REACT_APP_WEATHER_API_KEY=your_key_here
   ```
3. `npm start` — opens at `http://localhost:3000`

---

## Definition of Done

- [ ] All 5 city cards render with correct timezone clocks ticking every second
- [ ] Weather data (temp, condition, icon) loads within 2 seconds
- [ ] Skeleton shimmer visible during loading
- [ ] Removing the API key shows "Weather unavailable" on all cards — app doesn't crash
- [ ] Layout looks correct on desktop (3 cols), tablet (2 cols), mobile (1 col)
- [ ] `.env.local` is NOT in git history
