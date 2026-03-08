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
