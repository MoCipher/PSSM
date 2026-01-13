import React, { useMemo, useEffect, useRef } from 'react';
import './NavBar.css';
import debounce from '../utils/debounce';

interface Props {
  title?: string;
  onAdd?: () => void;
  onOpenAccount?: () => void;
  onOpenDashboard?: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  onSearch?: (q: string) => void;
  serverSearchEnabled?: boolean;
  onToggleServerSearch?: () => void;
  onHelp?: () => void;
}

export default function NavBar({ title = '🔐 Password Manager', onAdd, onOpenAccount, onOpenDashboard, theme, toggleTheme, onLogout, onSearch }: Props) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const debounced = useMemo(() => onSearch ? debounce((q: string) => onSearch(q), 400) : null, [onSearch]);

  useEffect(() => {
    return () => { if (debounced && (debounced as any).cancel) (debounced as any).cancel(); };
  }, [debounced]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (debounced) debounced(e.target.value);
    else if (onSearch) onSearch(e.target.value);
  };

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === '/') {
        const active = document.activeElement;
        const tag = active && (active as HTMLElement).tagName;
        // Only focus search if not typing in an input or textarea
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          ev.preventDefault();
          searchRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="nav-bar">
      <div className="nav-left">
        <h1 className="nav-title">{title}</h1>
      </div>
      <div className="nav-actions">
        <input aria-label="Search passwords" ref={searchRef} className="nav-search" placeholder="Search... (Press /)" onChange={handleSearch} title="Press / to focus" />
        <button className="btn btn-small" onClick={onOpenDashboard} aria-label="Open dashboard">Dashboard</button>
        <button className="btn btn-small" onClick={onOpenAccount} aria-label="Open account settings">Account</button>
        <button className="btn btn-primary" onClick={onAdd} aria-label="Add password">+ Add</button>
        <button
          className={`btn btn-small ${serverSearchEnabled ? 'active' : ''}`}
          onClick={onToggleServerSearch}
          aria-pressed={serverSearchEnabled}
          aria-label="Toggle server search"
        >
          Server
        </button>
        <button className="btn btn-secondary" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? 'Light' : 'Dark'}</button>
        <button className="btn" onClick={onHelp} aria-label="Keyboard shortcuts">?</button>
        <button className="btn" onClick={onLogout} aria-label="Logout">Logout</button>
      </div>
    </header>
  );
}
