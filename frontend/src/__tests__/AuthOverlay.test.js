import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthOverlay from '../AuthOverlay';

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

import { supabase } from '../supabase';

afterEach(() => jest.clearAllMocks());

test('renders email and password fields', () => {
  render(<AuthOverlay onLogin={jest.fn()} />);
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
});

test('renders Sign In button by default', () => {
  render(<AuthOverlay onLogin={jest.fn()} />);
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});

test('toggles to Sign Up mode', async () => {
  render(<AuthOverlay onLogin={jest.fn()} />);
  await userEvent.click(screen.getByText(/sign up/i));
  expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
});

test('calls supabase signInWithPassword on submit', async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
  const onLogin = jest.fn();
  render(<AuthOverlay onLogin={onLogin} />);
  await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  }));
});

test('calls onLogin after successful sign in', async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
  const onLogin = jest.fn();
  render(<AuthOverlay onLogin={onLogin} />);
  await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'password123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(onLogin).toHaveBeenCalled());
});

test('shows error message on failed sign in', async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid credentials' } });
  render(<AuthOverlay onLogin={jest.fn()} />);
  await userEvent.type(screen.getByPlaceholderText(/email/i), 'bad@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument());
});

test('calls supabase signUp and onLogin after successful sign up', async () => {
  supabase.auth.signUp.mockResolvedValue({ data: { user: { id: '456' } }, error: null });
  const onLogin = jest.fn();
  render(<AuthOverlay onLogin={onLogin} />);
  await userEvent.click(screen.getByText(/sign up/i));
  await userEvent.type(screen.getByPlaceholderText(/email/i), 'new@example.com');
  await userEvent.type(screen.getByPlaceholderText(/password/i), 'newpass123');
  await userEvent.click(screen.getByRole('button', { name: /create account/i }));
  await waitFor(() => expect(supabase.auth.signUp).toHaveBeenCalledWith({
    email: 'new@example.com',
    password: 'newpass123',
  }));
  await waitFor(() => expect(onLogin).toHaveBeenCalled());
});
