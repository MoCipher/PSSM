import { useState } from 'react';
import { hasMasterPassword } from '../utils/storage';
import './MasterPasswordLogin.css';

interface Props {
  onVerify: (password: string) => void;
}

export default function MasterPasswordLogin({ onVerify }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedPassword = password.trim();
    
    if (!trimmedPassword) {
      setError('Please enter your master password');
      return;
    }

    try {
      await onVerify(trimmedPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect master password');
      setPassword('');
      setShowReset(true);
    }
  };

  const handleReset = () => {
    if (confirm('⚠️ WARNING: This will delete ALL your saved passwords and reset your master password. This cannot be undone!\n\nAre you absolutely sure?')) {
      if (confirm('This is your last chance. Are you REALLY sure?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="master-password-login">
      <div className="login-card">
        <h1>🔐 Unlock Password Manager</h1>
        <p>Enter your master password to access your passwords</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Master Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your master password"
              required
              autoFocus
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="btn btn-primary">Unlock</button>
          
          {showReset && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                Having trouble? You can reset your master password, but this will delete all saved passwords.
              </p>
              <button 
                type="button" 
                onClick={handleReset} 
                className="btn btn-danger btn-small"
                style={{ width: '100%' }}
              >
                Reset Master Password (Deletes All Data)
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
