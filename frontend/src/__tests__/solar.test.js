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

  test('New York in March is UTC-4 (EDT — DST active by 2026-03-08)', () => {
    expect(getUTCOffset('America/New_York', NOON_UTC)).toBe(-4);
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

  test('daysSinceFullMoon is roughly 14-15 days at new moon phase', () => {
    // Phase ~0 = new moon = halfway between two full moons = ~14.8 days since last
    // Use a known approximate new moon per SunCalc: 2026-01-20 (phase ~0.052)
    const newMoonDate = new Date('2026-01-20T12:00:00Z');
    const { daysSinceFullMoon } = getMoonData(newMoonDate, 'UTC');
    expect(daysSinceFullMoon).toBeGreaterThanOrEqual(13);
    expect(daysSinceFullMoon).toBeLessThanOrEqual(17);
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
