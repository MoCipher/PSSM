import { useState } from 'react';
import { Lock } from 'lucide-react';
import './PasswordLogin.css';

interface Props {
  onLogin: (token: string, user: any) => void;
}

export default function PasswordLogin({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Invalid password');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      onLogin(data.token, data.user);
    } catch (err) {
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="password-login">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <Lock size={40} />
            <h1>Password Manager</h1>
            <p>Enter your password to access</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || !password}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
