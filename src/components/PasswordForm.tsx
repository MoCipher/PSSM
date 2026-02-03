import { useState, useEffect } from 'react';
import { Eye, EyeOff, Wand2 } from 'lucide-react';
import { PasswordEntry } from '../utils/storage';
import { validateSecret, generateTOTPQRCode } from '../utils/totp';
import './PasswordForm.css';
import PasswordGenerator from './PasswordGenerator';
import { useConfirm } from './ConfirmDialog';

interface Props {
  entry: PasswordEntry | null;
  onSave: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function PasswordForm({ entry, onSave, onCancel }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [showSecretInput, setShowSecretInput] = useState(false);
  const [secretError, setSecretError] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (entry) {
      setName(entry.name);
      setUsername(entry.username);
      setPassword(entry.password);
      setUrl(entry.url || '');
      setNotes(entry.notes || '');
      setTwoFactorSecret(entry.twoFactorSecret || '');
      setShowSecretInput(!!entry.twoFactorSecret);
    } else {
      // Reset form for new entry
      setName('');
      setUsername('');
      setPassword('');
      setUrl('');
      setNotes('');
      setTwoFactorSecret('');
      setShowSecretInput(false);
      setSecretError('');
      setQrCodeUrl('');
    }
  }, [entry]);

  useEffect(() => {
    const trimmedSecret = twoFactorSecret.trim();
    if (trimmedSecret && name && validateSecret(trimmedSecret)) {
      try {
        const qrString = generateTOTPQRCode(trimmedSecret, 'Password Manager', name);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`);
      } catch {
        setQrCodeUrl('');
      }
    } else {
      setQrCodeUrl('');
    }
  }, [twoFactorSecret, name]);

  const handleSecretChange = (value: string) => {
    // Trim whitespace from the secret
    const trimmed = value.trim();
    setTwoFactorSecret(trimmed);
    setSecretError('');
    
    // Only validate if there's a value and it's not empty after trimming
    if (trimmed && !validateSecret(trimmed)) {
      setSecretError('Invalid 2FA secret format - will still be saved but may not work');
    }
  };

  const generatePassword = () => {
    setShowGenerator(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim the secret before saving
    const trimmedSecret = twoFactorSecret.trim();
    
    // Warn but don't prevent saving if secret is invalid
    if (trimmedSecret && !validateSecret(trimmedSecret)) {
      const proceed = await confirm({
        title: 'Invalid 2FA secret',
        message: 'The 2FA secret format appears invalid. Do you want to save it anyway? You can edit it later.',
        confirmText: 'Save anyway',
        cancelText: 'Cancel'
      });
      if (!proceed) {
        return;
      }
    }

    onSave({
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
      twoFactorSecret: trimmedSecret || undefined,
    });
  };

  return (
    <div className="password-form-container">
      <form onSubmit={handleSubmit} className="password-form">
        <h2>{entry ? 'Edit Password' : 'Add New Password'}</h2>

        <div className="form-group">
          <label htmlFor="name">Name/Service *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Gmail, GitHub"
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username/Email *</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <div className="password-input-group">
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="button" onClick={generatePassword} className="btn btn-small">
              <Wand2 size={14} /> Generate
            </button>
          </div>
        </div>

        <PasswordGenerator
          visible={showGenerator}
          onClose={() => setShowGenerator(false)}
          onGenerate={(p) => { setPassword(p); setShowGenerator(false); }}
        />

        <div className="form-group">
          <label htmlFor="url">URL</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes..."
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={showSecretInput}
              onChange={(e) => {
                setShowSecretInput(e.target.checked);
                if (!e.target.checked) {
                  setTwoFactorSecret('');
                  setQrCodeUrl('');
                }
              }}
            />
            Enable 2FA (TOTP)
          </label>
          
          {showSecretInput && (
            <div className="two-factor-section">
              <input
                type="text"
                value={twoFactorSecret}
                onChange={(e) => handleSecretChange(e.target.value)}
                placeholder="Enter 2FA secret (base32)"
                className={secretError ? 'error' : ''}
              />
              {secretError && <div className="error-text">{secretError}</div>}
              {qrCodeUrl && (
                <div className="qr-code-container">
                  <img src={qrCodeUrl} alt="2FA QR Code" />
                  <p className="qr-hint">Scan with your authenticator app</p>
                </div>
              )}
              <p className="hint">
                Enter the secret key from your authenticator app setup. Usually a base32 string.
              </p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}
