import { useState, useEffect, useCallback } from 'react';
import { PasswordEntry } from '../utils/storage';
import { generateTOTP } from '../utils/totp';
import './PasswordList.css';
import { useToast } from './Toast';

interface Props {
  passwords: PasswordEntry[];
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
  query?: string;
}

export default function PasswordList({ passwords, onEdit, onDelete, onAdd, query }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [totpCodes, setTotpCodes] = useState<Record<string, string>>({});
  const [totpTimers, setTotpTimers] = useState<Record<string, number>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const showToast = useToast();

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('Copied to clipboard', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [showToast]);

  const refreshTOTP = useCallback((entry: PasswordEntry) => {
    if (!entry.twoFactorSecret) return;
    try {
      const code = generateTOTP(entry.twoFactorSecret);
      setTotpCodes(prev => ({ ...prev, [entry.id]: code }));
      setTotpTimers(prev => ({ ...prev, [entry.id]: 30 }));
    } catch {
      // Ignore errors
    }
  }, []);

  const togglePasswordVisibility = useCallback((id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Initialize TOTP codes and timers
  useEffect(() => {
    passwords.forEach(entry => {
      if (entry.twoFactorSecret && !totpCodes[entry.id]) {
        try {
          const code = generateTOTP(entry.twoFactorSecret);
          setTotpCodes(prev => ({ ...prev, [entry.id]: code }));
          setTotpTimers(prev => ({ ...prev, [entry.id]: 30 }));
        } catch {
          // Ignore errors
        }
      }
    });
  }, [passwords]);

  // TOTP countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTotpTimers(prev => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach(id => {
          const newTime = prev[id] - 1;
          if (newTime <= 0) {
            // Refresh the code when timer reaches 0
            const entry = passwords.find(p => p.id === id);
            if (entry?.twoFactorSecret) {
              try {
                const code = generateTOTP(entry.twoFactorSecret);
                setTotpCodes(codes => ({ ...codes, [id]: code }));
                updated[id] = 30;
              } catch {
                updated[id] = 0;
              }
            } else {
              updated[id] = 0;
            }
          } else {
            updated[id] = newTime;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [passwords]);

  if (passwords.length === 0) {
    return (
      <div className="empty-state">
        <h2>Welcome — your vault is empty</h2>
        <p className="calm">Start by adding your first password. We recommend a long, unique master password.</p>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={() => onAdd && onAdd()} className="btn btn-primary">Add Your First Password</button>
        </div>
        <p className="muted" style={{ marginTop: '0.75rem' }}>Tip: Use the password generator for strong credentials.</p>
      </div>
    );
  }

  return (
    <div className="password-list">
      {passwords
        .filter(p => {
          const q = (query || '').trim().toLowerCase();
          if (!q) return true;
          return (
            (p.name || '').toLowerCase().includes(q) ||
            (p.username || '').toLowerCase().includes(q) ||
            (p.url || '').toLowerCase().includes(q)
          );
        })
        .map((entry) => {
          return (
            <div key={entry.id} className="password-card">
              <div className="password-header">
                <div>
                  <h3>{entry.name}</h3>
                  {entry.url && (
                    <a href={entry.url} target="_blank" rel="noopener noreferrer" className="url-link">
                      {entry.url}
                    </a>
                  )}
                </div>
                <div className="card-actions">
                  <button onClick={() => onEdit(entry)} className="btn btn-small">Edit</button>
                  <button onClick={() => onDelete(entry.id)} className="btn btn-small btn-danger">Delete</button>
                </div>
              </div>

              <div className="password-details">
                <div className="detail-row">
                  <label>Username:</label>
                  <div className="value-with-copy">
                    <span>{entry.username}</span>
                    <button
                      onClick={() => copyToClipboard(entry.username, `${entry.id}-username`)}
                      className="copy-btn"
                      title="Copy username"
                    >
                      {copiedId === `${entry.id}-username` ? '✓' : '📋'}
                    </button>
                  </div>
                </div>

                <div className="detail-row">
                  <label>Password:</label>
                  <div className="value-with-copy">
                    <span className="password-value">
                      {visiblePasswords.has(entry.id) ? entry.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className="toggle-btn"
                      title={visiblePasswords.has(entry.id) ? 'Hide password' : 'Show password'}
                    >
                      {visiblePasswords.has(entry.id) ? '👁️' : '👁️‍🗨️'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(entry.password, `${entry.id}-password`)}
                      className="copy-btn"
                      title="Copy password"
                    >
                      {copiedId === `${entry.id}-password` ? '✓' : '📋'}
                    </button>
                  </div>
                </div>

                {entry.twoFactorSecret && (
                  <div className="detail-row">
                    <label>2FA Code:</label>
                    <div className="value-with-copy">
                      <div className="totp-container">
                        <span className="totp-code">{totpCodes[entry.id] || 'Generating...'}</span>
                        {totpTimers[entry.id] !== undefined && (
                          <div className="totp-timer">
                            <div 
                              className="totp-timer-bar" 
                              style={{ width: `${(totpTimers[entry.id] / 30) * 100}%` }}
                            />
                            <span className="totp-timer-text">{totpTimers[entry.id]}s</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          refreshTOTP(entry);
                          copyToClipboard(totpCodes[entry.id] || '', `${entry.id}-totp`);
                        }}
                        className="copy-btn"
                        title="Copy 2FA code"
                      >
                        {copiedId === `${entry.id}-totp` ? '✓' : '📋'}
                      </button>
                      <button
                        onClick={() => refreshTOTP(entry)}
                        className="refresh-btn"
                        title="Refresh code"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                )}

                {entry.notes && (
                  <div className="detail-row">
                    <label>Notes:</label>
                    <span>{entry.notes}</span>
                  </div>
                )}

                {entry.lastUsed ? (
                  <div className="last-used">Last used: {new Date(entry.lastUsed).toLocaleString()}</div>
                ) : null}
              </div>
            </div>
          );
        })}
    </div>
  );
}
