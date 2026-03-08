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
  expect(screen.getByText('Hello, London!')).toBeInTheDocument();
});
