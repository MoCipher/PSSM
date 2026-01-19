import { useState } from 'react';
import { apiClient } from '../utils/api';
import './EmailVerification.css';

interface Props {
  email: string;
  isLogin: boolean;
  onVerify: (token: string, user: any) => void;
  onBack: () => void;
  onResendCode: () => Promise<void>;
}

export default function EmailVerification({ email, isLogin, onVerify, onBack, onResendCode }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError('Please enter the verification code');
      setIsLoading(false);
      return;
    }

    if (trimmedCode.length !== 6 || !/^\d+$/.test(trimmedCode)) {
      setError('Please enter a valid 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.verifyCode(email, trimmedCode, isLogin);
      onVerify(response.token, response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await onResendCode();
      setError('');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="email-verification">
      <div className="verification-card">
        <h1>🔐 Verify Your Email</h1>
        <p>We sent a 6-digit verification code to:</p>
        <p className="email-display">{email}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="verification-actions">
          <button
            type="button"
            onClick={handleResendCode}
            className="btn btn-link"
            disabled={isResending}
          >
            {isResending ? 'Sending...' : 'Resend Code'}
          </button>
          <button type="button" onClick={onBack} className="btn btn-link">
            Change Email
          </button>
        </div>
      </div>
    </div>
  );
}