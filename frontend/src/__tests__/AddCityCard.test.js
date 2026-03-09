import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCityCard from '../AddCityCard';

// Mock fetch for geocoding
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { name: 'Tokyo', lat: 35.68, lon: 139.69, country: 'JP', state: '' },
        { name: 'Tokyo Bay', lat: 35.5, lon: 139.8, country: 'JP', state: '' },
      ]),
    })
  );
});
afterEach(() => jest.clearAllMocks());

test('renders the + add card', () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  expect(screen.getByText(/add city/i)).toBeInTheDocument();
});

test('shows text input when clicked', async () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  await userEvent.click(screen.getByText(/add city/i));
  expect(screen.getByPlaceholderText(/search city/i)).toBeInTheDocument();
});

test('calls fetch after typing a city name', async () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  await userEvent.click(screen.getByText(/add city/i));
  await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Tokyo');
  await waitFor(() => expect(global.fetch).toHaveBeenCalled(), { timeout: 700 });
});

test('shows dropdown results after typing', async () => {
  render(<AddCityCard onAdd={jest.fn()} />);
  await userEvent.click(screen.getByText(/add city/i));
  await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Tokyo');
  await waitFor(() => expect(screen.getByText('Tokyo, JP')).toBeInTheDocument(), { timeout: 700 });
});

test('calls onAdd with city data when result selected', async () => {
  const onAdd = jest.fn();
  render(<AddCityCard onAdd={onAdd} />);
  await userEvent.click(screen.getByText(/add city/i));
  await userEvent.type(screen.getByPlaceholderText(/search city/i), 'Tokyo');
  await waitFor(() => screen.getByText('Tokyo, JP'), { timeout: 700 });
  await userEvent.click(screen.getByText('Tokyo, JP'));
  expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Tokyo',
    lat: 35.68,
    lon: 139.69,
    country: 'JP',
  }));
});
