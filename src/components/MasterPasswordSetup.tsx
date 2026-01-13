import { useState } from 'react';
import { setMasterPassword } from '../utils/storage';
import './MasterPasswordSetup.css';

interface Props {
  onSet: (password: string) => void;
}

export default function MasterPasswordSetup({ onSet }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (trimmedPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError('Passwords do not match');
      return;
    }

    try {
      await setMasterPassword(trimmedPassword);
      onSet(trimmedPassword);
    } catch (err) {
      setError('Failed to set master password');
    }
  };

  return (
    <div className="master-password-setup">
      <div className="setup-card">
        <h1>🔐 Setup Master Password</h1>
        <p>Create a master password to encrypt your passwords. This password cannot be recovered.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Master Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoFocus
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

          <button type="submit" className="btn btn-primary">Create Master Password</button>
        </form>
      </div>
    </div>
  );
}
