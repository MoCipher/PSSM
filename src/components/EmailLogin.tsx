import { useState } from 'react';
import { apiClient } from '../utils/api';
import './EmailLogin.css';

interface Props {
  onLogin: (token: string, user: any) => void;
  onSwitchToRegister: () => void;
}

export default function EmailLogin({ onLogin, onSwitchToRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please enter your email and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.login(trimmedEmail, trimmedPassword);
      onLogin(response.token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-login">
      <div className="auth-card">
        <h1>🔐 Sign In</h1>
        <p>Sign in to access your passwords across all your devices</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          <p>Don't have an account? <button onClick={onSwitchToRegister} className="link-btn">Create Account</button></p>
        </div>
      </div>
    </div>
  );
}