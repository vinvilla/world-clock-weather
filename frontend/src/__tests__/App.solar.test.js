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
  expect(screen.getByText('Hello, New York!')).toBeInTheDocument();
});

test('App renders DayNightStrip', async () => {
  await act(async () => {
    render(<App />);
  });
  expect(screen.getByTestId('day-night-strip')).toBeInTheDocument();
});
