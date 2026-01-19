import { useState } from 'react';
import { apiClient } from '../utils/api';
import EmailVerification from './EmailVerification';
import './EmailLogin.css';

interface Props {
  onLogin: (token: string, user: any) => void;
  onSwitchToRegister: () => void;
}

export default function EmailLogin({ onLogin, onSwitchToRegister }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.requestVerificationCode(trimmedEmail, true);
      setShowVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    await apiClient.requestVerificationCode(email.trim(), true);
  };

  const handleVerificationBack = () => {
    setShowVerification(false);
  };

  if (showVerification) {
    return (
      <EmailVerification
        email={email.trim()}
        isLogin={true}
        onVerify={onLogin}
        onBack={handleVerificationBack}
        onResendCode={handleResendCode}
      />
    );
  }

  return (
    <div className="email-login">
      <div className="auth-card">
        <h1>🔐 Sign In</h1>
        <p>Enter your email address to sign in. We'll send you a verification code to complete login.</p>

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

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Sending Code...' : 'Send Verification Code'}
          </button>
        </form>

        <div className="auth-switch">
          <p>Don't have an account? <button onClick={onSwitchToRegister} className="link-btn">Create Account</button></p>
        </div>
      </div>
    </div>
  );
}