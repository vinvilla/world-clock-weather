# Feature Cards Presentation Design

## Goal
A 9-slide PowerPoint deck showcasing World Clock & Weather features for the product team — structured by capability with feature cards and lo-fi mockups on each slide.

## Audience
Product team, using the deck as a reference/template to prompt Claude to build feature cards for other projects.

## Theme
- Background: white (`#FFFFFF`)
- Primary text: charcoal (`#1E1E2E`)
- Accent: purple gradient (`#7C3AED` → `#3B82F6`) for titles and highlights
- Each capability has its own accent color (see below)
- Body font: Calibri or equivalent sans-serif
- Slide size: 13.33" × 7.5" (standard widescreen 16:9)

## Slide Structure

### Slide 1 — Title
- App name: "World Clock & Weather"
- Tagline: "Live time, weather, and solar data — personalized for your cities"
- Date: March 2026
- Purple gradient background (exception to white theme — makes a strong opener)

### Slide 2 — Capabilities Overview
- Heading: "What It Does"
- 6 tiles in a 2×3 grid, each with:
  - Icon (emoji)
  - Capability name
  - 1-line description
- Tiles:
  1. 🌍 Global Time Awareness — Live clocks for any city, any timezone
  2. 🌤 Live Weather — Real-time conditions and temperature
  3. 🌓 Solar & Moon Tracking — Sunrise, sunset, and moon phase data
  4. 🔐 Personalized Accounts — Your own login and city list
  5. 🏙 City Management — Add and remove cities on the fly
  6. 🤖 AI Assistant — Ask questions, search, and summarize weather

### Slides 3–8 — Capability Feature Slides

Each slide layout:
- Left half: capability header + 2–4 feature cards stacked vertically
- Right half: lo-fi wireframe mockup

Each feature card contains:
- Feature name (bold)
- "You can…" benefit sentence (1 line)
- Status badge: ✅ Live

#### Slide 3 — 🌍 Global Time Awareness (accent: #3B82F6 blue)
Features:
1. Live City Clock — See the exact time in any city, updated every second
2. Day & Date Display — Know the weekday and date at a glance for each city
3. World Timeline Bar — See all timezones laid out on a single GMT axis
4. Hover Time Tooltip — Hover anywhere on the timeline to see the local time at that longitude

Lo-fi mockup: 3 city cards side by side showing time + date, timeline bar below with pins

#### Slide 4 — 🌤 Live Weather (accent: #F59E0B amber)
Features:
1. Current Temperature — Live °F reading pulled from OpenWeatherMap
2. Weather Condition & Icon — Description and icon (sunny, cloudy, rain, etc.)

Lo-fi mockup: single city card showing temp, condition, and weather icon

#### Slide 5 — 🌓 Solar & Moon Tracking (accent: #8B5CF6 violet)
Features:
1. Sunrise & Sunset Times — Know exactly when the sun rises and sets in each city
2. Day / Night Indicator — Visual cue whether it's currently daytime or nighttime
3. Moon Phase — Current phase name, emoji, and illumination percentage
4. Full Moon Watch — Days since last full moon and countdown to next one

Lo-fi mockup: bottom section of a city card showing sun times, moon phase row, and countdown

#### Slide 6 — 🔐 Personalized Accounts (accent: #10B981 green)
Features:
1. Email Sign-Up — Create an account with any email and password
2. Sign In — Securely log back in to restore your saved cities
3. Sign Out — Log out and keep your data safe

Lo-fi mockup: auth overlay card with email/password fields and Sign In button

#### Slide 7 — 🏙 City Management (accent: #EF4444 red)
Features:
1. Add Any City — Search by name, pick from results, city is added instantly
2. Remove a City — Hover over a card and click × to remove it
3. Cloud Persistence — Your city list is saved and restored on every login

Lo-fi mockup: city grid showing 5 cards + dashed "+" ghost card; one card with × hover button

#### Slide 8 — 🤖 AI Assistant (accent: #6366F1 indigo)
Features:
1. Ask Weather Questions — "Which city is warmest right now?" — Claude answers
2. Search & Filter Cities — "Show me Asian cities" — highlights matching cards
3. Weather Summary — One-click summary comparing conditions across all cities

Lo-fi mockup: AI panel at bottom of screen with input box and response bubble

### Slide 9 — Powered By
- Heading: "Built With"
- Clean 5-column grid of technology names + one-line role:
  - React — Frontend UI
  - Supabase — Auth & database
  - Claude AI — AI assistant
  - OpenWeatherMap — Weather data
  - SunCalc — Solar & moon calculations

## Output
- File: `docs/feature-cards.pptx`
- Built using `pptxgenjs` via a Node.js script at `docs/scripts/build-pptx.js`
- Run: `node docs/scripts/build-pptx.js`
