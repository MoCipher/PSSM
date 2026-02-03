import { useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  LayoutDashboard,
  User,
  Server,
  HelpCircle,
  LogOut
} from 'lucide-react';
import './NavBar.css';
import debounce from '../utils/debounce';

interface Props {
  title?: string;
  onAdd?: () => void;
  onOpenAccount?: () => void;
  onOpenDashboard?: () => void;
  onLogout: () => void;
  onSearch?: (q: string) => void;
  serverSearchEnabled?: boolean;
  onToggleServerSearch?: () => void;
  onHelp?: () => void;
  extraActions?: React.ReactNode;
}

export default function NavBar({ title = 'Password Manager', onAdd, onOpenAccount, onOpenDashboard, onLogout, onSearch, serverSearchEnabled = false, onToggleServerSearch, onHelp, extraActions }: Props) {
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
        <div className="search-wrap">
          <Search size={16} />
          <input
            aria-label="Search passwords"
            ref={searchRef}
            className="nav-search"
            placeholder="Search... (Press /)"
            onChange={handleSearch}
            title="Press / to focus"
          />
        </div>
        <button className="icon-btn" onClick={onOpenDashboard} aria-label="Open dashboard">
          <LayoutDashboard size={16} />
        </button>
        <button className="icon-btn" onClick={onOpenAccount} aria-label="Open account settings">
          <User size={16} />
        </button>
        <button className="icon-btn primary" onClick={onAdd} aria-label="Add password" title="Add password">
          <Plus size={16} />
        </button>
        {extraActions}
        <button
          className={`icon-btn ${serverSearchEnabled ? 'active' : ''}`}
          onClick={onToggleServerSearch}
          aria-pressed={serverSearchEnabled}
          aria-label="Toggle server search"
        >
          <Server size={16} />
        </button>
        <button className="icon-btn" onClick={onHelp} aria-label="Keyboard shortcuts">
          <HelpCircle size={16} />
        </button>
        <button className="icon-btn" onClick={onLogout} aria-label="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
