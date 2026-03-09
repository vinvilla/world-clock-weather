# Functional Requirements
**Project:** World Clock & Weather Dashboard
**Version:** 1.2
**Date:** 2026-03-08

---

## FR-01: City Cards

| ID | Requirement |
|----|-------------|
| FR-01.1 | Display a greeting "Hello, [City]!" on each card |
| FR-01.2 | Show live local time in HH:MM:SS AM/PM format, updating every second |
| FR-01.3 | Show current day, abbreviated month, and date below the clock |
| FR-01.4 | Show current temperature in Fahrenheit (rounded to nearest degree) |
| FR-01.5 | Show weather condition text (e.g. "partly cloudy") |
| FR-01.6 | Show weather icon from OpenWeatherMap icon CDN |
| FR-01.7 | Display 5 cities: New York, Los Angeles, London, Chennai, Singapore |

## FR-02: Loading & Error States

| ID | Requirement |
|----|-------------|
| FR-02.1 | Show pulsing skeleton cards while weather data is being fetched |
| FR-02.2 | If a city's weather API call fails, show "Weather unavailable" — clocks still work |
| FR-02.3 | A single city failure must not affect other cards |

## FR-03: AI Panel — Natural Language City Search

| ID | Requirement |
|----|-------------|
| FR-03.1 | User can type a query like "show cities in Asia" and press Search Cities |
| FR-03.2 | Matching city cards are highlighted; non-matching cards are dimmed |
| FR-03.3 | A "Show All Cities" button resets the filter |
| FR-03.4 | Claude returns a brief explanation of why those cities matched |

## FR-04: AI Panel — Weather Q&A

| ID | Requirement |
|----|-------------|
| FR-04.1 | User can type any weather-related question and press Ask |
| FR-04.2 | Pressing Enter submits the question |
| FR-04.3 | Claude answers using the live weather data fetched on page load |
| FR-04.4 | Response is displayed in the panel below the input |

## FR-05: AI Panel — Weather Summary

| ID | Requirement |
|----|-------------|
| FR-05.1 | A "Summarize All Weather" button triggers a Claude-generated summary |
| FR-05.2 | Summary is 2-3 sentences comparing weather across all 5 cities |
| FR-05.3 | Summary highlights interesting contrasts between cities |

## FR-07: Day/Night Timeline Strip

| ID | Requirement |
|----|-------------|
| FR-07.1 | Display a full-width horizontal strip spanning GMT-12 to GMT+14 between the header and city grid |
| FR-07.2 | Strip shows a real-astronomy day/night CSS gradient with night, astronomical/nautical/civil twilight, and day colour zones |
| FR-07.3 | Each of the 5 cities is shown as a pin at its current UTC offset position, with a day/night emoji and city name label |
| FR-07.4 | A "NOW" vertical marker shows the browser's current UTC offset |
| FR-07.5 | Strip gradient and pins update every 60 seconds |
| FR-07.6 | City name labels are hidden on mobile (<580px); icons remain |

## FR-08: City Card — Solar Enrichment

| ID | Requirement |
|----|-------------|
| FR-08.1 | Each city card shows whether it is currently Day or Night with a sun/moon emoji |
| FR-08.2 | Each card shows today's sunrise and sunset times in the city's local timezone |
| FR-08.3 | Each card shows a countdown to the next sunrise or sunset (e.g. "Sunset in 2h 14m") |
| FR-08.4 | Each card shows the current moon phase emoji, phase name, and illumination percentage |
| FR-08.5 | Each card shows how many days ago the last full moon was |
| FR-08.6 | Each card shows the date of the next full moon in the city's local timezone and how many days away it is |
| FR-08.7 | Solar enrichment data updates every 60 seconds |

## FR-06: Layout & Responsiveness

| ID | Requirement |
|----|-------------|
| FR-06.1 | 3-column grid on desktop (≥900px) |
| FR-06.2 | 2-column grid on tablet (580–900px) |
| FR-06.3 | 1-column on mobile (<580px) |
| FR-06.4 | AI panel spans full width below the city grid |

### FR-09: City Management

| ID | Requirement |
|----|-------------|
| FR-09.1 | Users can remove any displayed city via an inline × button shown on card hover |
| FR-09.2 | Users can add a city via a "+" ghost card that expands to a search input |
| FR-09.3 | Search uses the OWM geocoding API (proxied through the backend) to resolve city name → lat/lon |
| FR-09.4 | Timezone is derived client-side from lat/lon using the `tz-lookup` library |
| FR-09.5 | Maximum 6 cities per user; "+" card hidden when limit reached |
| FR-09.6 | City list is persisted per user in the Supabase `user_cities` table |

### FR-10: Authentication

| ID | Requirement |
|----|-------------|
| FR-10.1 | Users can sign in with email and password via Supabase Auth |
| FR-10.2 | Users can create a new account with email and password |
| FR-10.3 | On first login, a default set of 5 cities is seeded to the user's account |
| FR-10.4 | The app shows an auth overlay when no session is active; the main UI is hidden |
| FR-10.5 | Users can sign out; session is cleared and auth overlay is shown again |

### FR-11: DayNightStrip Hover Tooltip

| ID | Requirement |
|----|-------------|
| FR-11.1 | Hovering anywhere on the DayNightStrip bar shows a tooltip at the cursor position |
| FR-11.2 | Tooltip displays the UTC offset (e.g. GMT+5:30) and local time at that longitude |
| FR-11.3 | If a user's city is within ±1.5 UTC hours of the hover position, the tooltip snaps to show that city's name, day/night status, sunrise, and sunset times |
| FR-11.4 | Tooltip is hidden on mobile screens (max-width: 580px) |
