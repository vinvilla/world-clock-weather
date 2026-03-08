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
  const pins = screen.getAllByText('☀️');
  expect(pins.length).toBeGreaterThanOrEqual(1);
});

test('night city shows moon emoji', () => {
  render(<DayNightStrip cities={CITIES} solarMap={solarMap} />);
  const pins = screen.getAllByText('🌙');
  expect(pins.length).toBeGreaterThanOrEqual(1);
});
