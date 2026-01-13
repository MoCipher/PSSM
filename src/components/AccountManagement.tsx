import React, { useState } from 'react';
import './MasterPasswordSetup.css';
import { changeMasterPassword, deleteAccount } from '../utils/storage';

interface Props {
  masterPassword: string;
  onPasswordChanged: (newPassword: string) => void;
}

export default function AccountManagement({ masterPassword, onPasswordChanged }: Props) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(() => !!localStorage.getItem('password_manager_biometric'));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('');

    if (current.trim() !== masterPassword) {
      setError('Current master password is incorrect');
      return;
    }

    if (newPass.trim().length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPass !== confirm) {
      setError('New passwords do not match');
      return;
    }

    try {
      await changeMasterPassword(current, newPass);
      onPasswordChanged(newPass);
      setStatus('Master password updated');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (err) {
      console.error(err);
      setError('Failed to change master password');
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ This will permanently delete your account and all stored passwords. Proceed?')) return;
    await deleteAccount();
    window.location.reload();
  };

  const handleToggleBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setError('Biometric/WebAuthn not supported in this browser');
      return;
    }

    if (!biometricEnabled) {
      // Try to register a credential (simplified)
      try {
        const publicKey: any = {
          challenge: Uint8Array.from(window.crypto.getRandomValues(new Uint8Array(32))).buffer,
          rp: { name: 'Password Manager' },
          user: {
            id: Uint8Array.from(String(Date.now()).split('').map(s => s.charCodeAt(0))).buffer,
            name: 'user',
            displayName: 'User'
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }]
        };

        const cred = await navigator.credentials.create({ publicKey });
        if (cred) {
          localStorage.setItem('password_manager_biometric', '1');
          setBiometricEnabled(true);
          setStatus('Biometric login enabled');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to enable biometric login');
      }
    } else {
      localStorage.removeItem('password_manager_biometric');
      setBiometricEnabled(false);
      setStatus('Biometric login disabled');
    }
  };

  return (
    <div className="account-management" role="region" aria-labelledby="account-management-title">
      <h3 id="account-management-title">Account Management</h3>

      <section className="card">
        <h4 id="change-password-title">Change Master Password</h4>
        <form onSubmit={handleChangePassword} aria-labelledby="change-password-title">
          <div className="form-group">
            <label htmlFor="current-master">Current Master Password</label>
            <input id="current-master" autoFocus type="password" value={current} onChange={e => setCurrent(e.target.value)} required aria-required="true" aria-label="Current master password" />
          </div>

          <div className="form-group">
            <label htmlFor="new-master">New Master Password</label>
            <input id="new-master" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required aria-required="true" aria-label="New master password" />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-master">Confirm New Password</label>
            <input id="confirm-master" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required aria-required="true" aria-label="Confirm new master password" />
          </div>

          {error && <div className="error">{error}</div>}
          {status && <div className="status">{status}</div>}

          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary">Change Password</button>
          </div>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h4>Biometric Login</h4>
        <p className="calm">Enable biometric login (WebAuthn) for faster access on supported devices.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleToggleBiometric} className="btn btn-secondary">
            {biometricEnabled ? 'Disable Biometric' : 'Enable Biometric'}
          </button>
          <div style={{ alignSelf: 'center', color: '#666' }}>{biometricEnabled ? 'Enabled' : 'Disabled'}</div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h4>Recovery & Data</h4>
        <p className="calm">You can export your encrypted vault via Export/Import. Keep a secure backup of your master password — it cannot be recovered.</p>
        <div style={{ marginTop: 8 }}>
          <button type="button" onClick={handleDelete} className="btn btn-danger">Delete Account</button>
        </div>
      </section>
    </div>
  );
}
