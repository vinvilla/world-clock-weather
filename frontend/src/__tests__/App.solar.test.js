import { render, screen, act } from '@testing-library/react';
import App from '../App';

// Mock fetch (weather API)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      main: { temp: 72 },
      weather: [{ description: 'sunny', icon: '01d' }],
    }),
  })
);

// Mock supabase
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

beforeEach(() => {
  jest.clearAllMocks();
  // Reset to logged-out state by default
  const { supabase } = require('../supabase');
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  supabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
  });
});

test('shows auth overlay when no session', async () => {
  await act(async () => { render(<App />); });
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
});

test('renders DayNightStrip when logged in', async () => {
  mockLoggedIn();
  await act(async () => { render(<App />); });
  expect(screen.getByTestId('day-night-strip')).toBeInTheDocument();
});

test('renders city cards when logged in', async () => {
  mockLoggedIn();
  await act(async () => { render(<App />); });
  expect(screen.getByText('Hello, New York!')).toBeInTheDocument();
});
