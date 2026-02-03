import { useEffect, useState } from 'react';
import { User, Shield, Sliders, LogOut, Trash2, Download } from 'lucide-react';
import './AccountManagement.css';
import { useConfirm } from './ConfirmDialog';

interface Props {
  onLogout: () => void;
  onClose: () => void;
}

export default function AccountManagement({ onLogout, onClose }: Props) {
  const confirm = useConfirm();
  const [displayName, setDisplayName] = useState('');
  const [autoLockMinutes, setAutoLockMinutes] = useState(10);
  const [clipboardClearSeconds, setClipboardClearSeconds] = useState(30);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setDisplayName(localStorage.getItem('pm_display_name') || '');
    setAutoLockMinutes(Number(localStorage.getItem('pm_auto_lock') || 10));
    setClipboardClearSeconds(Number(localStorage.getItem('pm_clipboard_clear') || 30));
  }, []);

  const savePreferences = () => {
    localStorage.setItem('pm_display_name', displayName.trim());
    localStorage.setItem('pm_auto_lock', String(autoLockMinutes));
    localStorage.setItem('pm_clipboard_clear', String(clipboardClearSeconds));
    setStatus('Preferences saved');
    setTimeout(() => setStatus(''), 2000);
  };

  const resetPreferences = () => {
    localStorage.removeItem('pm_display_name');
    localStorage.removeItem('pm_auto_lock');
    localStorage.removeItem('pm_clipboard_clear');
    setDisplayName('');
    setAutoLockMinutes(10);
    setClipboardClearSeconds(30);
    setStatus('Preferences reset');
    setTimeout(() => setStatus(''), 2000);
  };

  const clearLocalCache = async () => {
    const ok = await confirm({
      title: 'Clear local cache',
      message: 'This will clear local preferences. Continue?',
      confirmText: 'Clear',
      cancelText: 'Cancel',
      tone: 'danger'
    });
    if (!ok) return;
    resetPreferences();
  };

  return (
    <div className="account-management" role="region" aria-labelledby="account-management-title">
      <div className="account-header">
        <div>
          <h3 id="account-management-title">Account Management</h3>
          <p className="muted">Manage preferences, security, and session controls.</p>
        </div>
        <button onClick={onClose} className="btn btn-secondary">Close</button>
      </div>

      <section className="account-card">
        <div className="card-title">
          <User size={18} />
          <h4>Profile</h4>
        </div>
        <div className="grid">
          <label className="field">
            <span>Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </label>
          <label className="field">
            <span>Default workspace</span>
            <input type="text" value="Personal Vault" readOnly />
          </label>
        </div>
      </section>

      <section className="account-card">
        <div className="card-title">
          <Shield size={18} />
          <h4>Security</h4>
        </div>
        <div className="grid">
          <label className="field">
            <span>Auto‑lock (minutes)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={autoLockMinutes}
              onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Clipboard clear (seconds)</span>
            <input
              type="number"
              min={5}
              max={120}
              value={clipboardClearSeconds}
              onChange={(e) => setClipboardClearSeconds(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="muted">Auto‑lock is client‑side and clears on logout.</p>
      </section>

      <section className="account-card">
        <div className="card-title">
          <Sliders size={18} />
          <h4>Preferences</h4>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={savePreferences}>Save Preferences</button>
          <button className="btn btn-secondary" onClick={resetPreferences}>Reset to Default</button>
          {status && <span className="status">{status}</span>}
        </div>
      </section>

      <section className="account-card">
        <div className="card-title">
          <Download size={18} />
          <h4>Data</h4>
        </div>
        <p className="muted">Use Export/Import on the main screen to back up or migrate passwords.</p>
        <button className="btn btn-secondary" onClick={onClose}>Go to Vault</button>
      </section>

      <section className="account-card danger">
        <div className="card-title">
          <LogOut size={18} />
          <h4>Session</h4>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onLogout}>Log out</button>
          <button className="btn btn-danger" onClick={clearLocalCache}>
            <Trash2 size={16} /> Clear local cache
          </button>
        </div>
      </section>
    </div>
  );
}
