import { useState } from 'react';
import { apiClient } from '../utils/api';
import './EmailRegistration.css';

interface Props {
  onRegister: (token: string, user: any) => void;
  onSwitchToLogin: () => void;
}

export default function EmailRegistration({ onRegister, onSwitchToLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (trimmedPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.register(trimmedEmail, trimmedPassword);
      onRegister(response.token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-registration">
      <div className="auth-card">
        <h1>🔐 Create Account</h1>
        <p>Create your account to securely store and sync your passwords across devices</p>

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
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          <p>Already have an account? <button onClick={onSwitchToLogin} className="link-btn">Sign In</button></p>
        </div>
      </div>
    </div>
  );
}