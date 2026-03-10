import React, { useState } from 'react';
import { loginBankUser } from '../api/client';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('bank.admin');
  const [password, setPassword] = useState('Credere@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await loginBankUser(username, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-shell">
      <div className="card login-card">
        <p className="intro-kicker">Bank Access</p>
        <h2>Credere AI Secure Sign-In</h2>
        <p className="login-subtext">
          Use your bank credentials to access Financial Intake, retain analysis history, and track prior credit decisions.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button type="submit" disabled={loading || !username || !password}>
            {loading ? 'Signing in...' : 'Login to Bank Workspace'}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}

        <div className="login-demo-note">
          <strong>Demo users</strong>
          <p>`bank.admin` / `Credere@123`</p>
          <p>`credit.officer` / `Officer@123`</p>
        </div>
      </div>
    </section>
  );
}
