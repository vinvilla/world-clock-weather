import { useState } from 'react';
import { supabase } from './supabase';
import './AuthOverlay.css';

export default function AuthOverlay({ onLogin }) {
  const [mode, setMode]         = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
      const { data, error: authError } = await fn;
      if (authError) { setError(authError.message); return; }
      if (data?.user) onLogin(data.user);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <h2 className="auth-title">World Clock &amp; Weather</h2>
        <p className="auth-sub">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            className="auth-input"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'signin' ? (
            <>No account? <button className="auth-link" onClick={() => setMode('signup')}>Sign up</button></>
          ) : (
            <>Have an account? <button className="auth-link" onClick={() => setMode('signin')}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
