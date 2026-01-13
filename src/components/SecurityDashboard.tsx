import { useMemo } from 'react';
import { PasswordEntry } from '../utils/storage';
import './SecurityDashboard.css';

interface Props {
  passwords: PasswordEntry[];
}

function isWeak(p: PasswordEntry) {
  const pw = p.password || '';
  if (pw.length < 8) return true;
  const common = ['123456', 'password', 'qwerty', 'letmein'];
  if (common.some(c => pw.toLowerCase().includes(c))) return true;
  return false;
}

export default function SecurityDashboard({ passwords }: Props) {
  const stats = useMemo(() => {
    const weak: PasswordEntry[] = [];
    const duplicates: Record<string, PasswordEntry[]> = {};
    const old: PasswordEntry[] = [];

    const seen: Record<string, number> = {};

    passwords.forEach(p => {
      if (isWeak(p)) weak.push(p);

      const key = (p.password || '').trim();
      if (!key) return;
      if (!duplicates[key]) duplicates[key] = [];
      duplicates[key].push(p);

      const last = p.lastUsed || p.updatedAt || p.createdAt || 0;
      if (Date.now() - last > 1000 * 60 * 60 * 24 * 90) { // 90 days
        old.push(p);
      }

      seen[p.id] = 1;
    });

    const dupList = Object.values(duplicates).filter(group => group.length > 1);

    return { weak, duplicates: dupList, old };
  }, [passwords]);

  return (
    <div className="security-dashboard" role="region" aria-labelledby="security-dashboard-title">
      <h2 id="security-dashboard-title">Security Insights</h2>

      <section className="card">
        <h3>Overview</h3>
        <p className="calm">Quick actionable items to improve your vault security.</p>
        <div className="metrics">
          <div className="metric">
            <div className="metric-number">{passwords.length}</div>
            <div className="metric-label">Total credentials</div>
          </div>
          <div className="metric">
            <div className="metric-number">{stats.weak.length}</div>
            <div className="metric-label">Weak passwords</div>
          </div>
          <div className="metric">
            <div className="metric-number">{stats.duplicates.length}</div>
            <div className="metric-label">Duplicate passwords</div>
          </div>
          <div className="metric">
            <div className="metric-number">{stats.old.length}</div>
            <div className="metric-label">Not used in 90+ days</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Weak Passwords</h3>
        {stats.weak.length === 0 ? (
          <p className="calm">No weak passwords detected. Great job!</p>
        ) : (
          <ul className="insights-list">
            {stats.weak.map(p => (
              <li key={p.id}>
                <strong>{p.name}</strong> — {p.username} <span className="muted">(updated {new Date(p.updatedAt).toLocaleDateString()})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h3>Duplicate Passwords</h3>
        {stats.duplicates.length === 0 ? (
          <p className="calm">No duplicates found.</p>
        ) : (
          stats.duplicates.map((group, idx) => (
            <div key={idx} className="dup-group">
              <div className="dup-pw">Used by {group.length} entries</div>
              <ul>
                {group.map(p => (
                  <li key={p.id}>{p.name} — {p.username}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h3>Stale Entries</h3>
        {stats.old.length === 0 ? (
          <p className="calm">All entries used recently.</p>
        ) : (
          <ul className="insights-list">
            {stats.old.map(p => (
              <li key={p.id}>{p.name} — last used {p.lastUsed ? new Date(p.lastUsed).toLocaleDateString() : 'unknown'}</li>
            ))}
          </ul>
        )}
      </section>

      <p className="muted small">No network calls are made; this is a local analysis. For breach checking, export and use a secure offline tool or opt into a trusted breach API.</p>
    </div>
  );
}
