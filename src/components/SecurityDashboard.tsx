import { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Copy, Clock } from 'lucide-react';
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

  const score = Math.max(0, 100 - (stats.weak.length * 8) - (stats.duplicates.length * 6) - (stats.old.length * 2));
  const grade = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 55 ? 'Fair' : 'Needs attention';

  return (
    <div className="security-dashboard" role="region" aria-labelledby="security-dashboard-title">
      <div className="dashboard-header">
        <div>
          <h2 id="security-dashboard-title">Security Center</h2>
          <p className="muted">Local-only analysis of your vault health.</p>
        </div>
        <div className="score">
          <div className="score-ring">
            <span>{score}</span>
          </div>
          <div className="score-label">{grade}</div>
        </div>
      </div>

      <section className="summary-grid">
        <div className="summary-card">
          <ShieldCheck size={18} />
          <div>
            <div className="summary-number">{passwords.length}</div>
            <div className="summary-label">Total credentials</div>
          </div>
        </div>
        <div className="summary-card warn">
          <AlertTriangle size={18} />
          <div>
            <div className="summary-number">{stats.weak.length}</div>
            <div className="summary-label">Weak passwords</div>
          </div>
        </div>
        <div className="summary-card warn">
          <Copy size={18} />
          <div>
            <div className="summary-number">{stats.duplicates.length}</div>
            <div className="summary-label">Duplicates</div>
          </div>
        </div>
        <div className="summary-card">
          <Clock size={18} />
          <div>
            <div className="summary-number">{stats.old.length}</div>
            <div className="summary-label">Stale entries</div>
          </div>
        </div>
      </section>

      <section className="insights">
        <div className="insight">
          <h3>Weak Passwords</h3>
          {stats.weak.length === 0 ? (
            <p className="muted">No weak passwords detected.</p>
          ) : (
            <ul>
              {stats.weak.map(p => (
                <li key={p.id}>
                  <strong>{p.name}</strong> — {p.username}
                  <span className="sub">Updated {new Date(p.updatedAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="insight">
          <h3>Duplicate Passwords</h3>
          {stats.duplicates.length === 0 ? (
            <p className="muted">No duplicates found.</p>
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
        </div>

        <div className="insight">
          <h3>Stale Entries</h3>
          {stats.old.length === 0 ? (
            <p className="muted">All entries used recently.</p>
          ) : (
            <ul>
              {stats.old.map(p => (
                <li key={p.id}>{p.name} — last used {p.lastUsed ? new Date(p.lastUsed).toLocaleDateString() : 'unknown'}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <p className="muted small">No network calls are made; this is a local analysis only.</p>
    </div>
  );
}
