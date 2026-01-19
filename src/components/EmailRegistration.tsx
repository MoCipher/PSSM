import { useState } from 'react';
import { apiClient } from '../utils/api';
import EmailVerification from './EmailVerification';
import './EmailRegistration.css';

interface Props {
  onRegister: (token: string, user: any) => void;
  onSwitchToLogin: () => void;
}

export default function EmailRegistration({ onRegister, onSwitchToLogin }: Props) {
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
      await apiClient.requestVerificationCode(trimmedEmail, false);
      setShowVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    await apiClient.requestVerificationCode(email.trim(), false);
  };

  const handleVerificationBack = () => {
    setShowVerification(false);
  };

  if (showVerification) {
    return (
      <EmailVerification
        email={email.trim()}
        isLogin={false}
        onVerify={onRegister}
        onBack={handleVerificationBack}
        onResendCode={handleResendCode}
      />
    );
  }

  return (
    <div className="email-registration">
      <div className="auth-card">
        <h1>🔐 Create Account</h1>
        <p>Enter your email address to create your account. We'll send you a verification code to complete registration.</p>

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
          <p>Already have an account? <button onClick={onSwitchToLogin} className="link-btn">Sign In</button></p>
        </div>
      </div>
    </div>
  );
}