import { useState, useEffect, useCallback } from 'react';
import {
  PasswordEntry,
  hasMasterPassword,
  verifyMasterPassword,
  setMasterPassword as storageSetMasterPassword,
  loadPasswords,
  savePasswords
} from './utils/storage';
import PasswordList from './components/PasswordList';
import PasswordForm from './components/PasswordForm';
import MasterPasswordSetup from './components/MasterPasswordSetup';
import MasterPasswordLogin from './components/MasterPasswordLogin';
import ExportImport from './components/ExportImport';
import NavBar from './components/NavBar';
import AccountManagement from './components/AccountManagement';
import SecurityDashboard from './components/SecurityDashboard';
import useFocusTrap from './hooks/useFocusTrap';
import { useRef } from 'react';
import './App.css';
import { ToastProvider } from './components/Toast';
import { getSavedTheme, saveTheme, applyTheme, Theme } from './utils/theme';
import { serverSearch } from './utils/search';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterPassword, setMasterPasswordState] = useState<string>('');
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getSavedTheme() || 'light');
  const [search, setSearch] = useState<string>('');
  const [serverSearchEnabled, _setServerSearchEnabled] = useState<boolean>(false);
  const [serverResults, setServerResults] = useState<PasswordEntry[]>([]);
  const [_showHelp, setShowHelp] = useState(false);
  const accountPanelRef = useRef<HTMLDivElement | null>(null);
  const dashboardPanelRef = useRef<HTMLDivElement | null>(null);

  // Call focus trap hooks unconditionally (they check ref.current internally)
  useFocusTrap(accountPanelRef);
  useFocusTrap(dashboardPanelRef);

  useEffect(() => {
    if (isAuthenticated && masterPassword) {
      (async () => {
        try {
          const loaded = await loadPasswords(masterPassword);
          setPasswords(loaded);
        } catch (error) {
          console.error('Failed to load passwords:', error);
        }
      })();
    }
  }, [isAuthenticated, masterPassword]);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  // Run server search when enabled and query changes
  useEffect(() => {
    let mounted = true;
    if (!serverSearchEnabled || !search.trim()) {
      setServerResults([]);
      return;
    }

    (async () => {
      try {
        const results = await serverSearch(search.trim());
        if (mounted) setServerResults(results || []);
      } catch (err) {
        console.error('Server search failed', err);
        if (mounted) setServerResults([]);
      }
    })();

    return () => { mounted = false; };
  }, [serverSearchEnabled, search]);

  // Keyboard shortcut for help (?) and close overlays with Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const tag = active && (active as HTMLElement).tagName;
      if (e.key === '?' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        setShowHelp(h => !h);
      }

      if (e.key === 'Escape') {
        setShowAccount(false);
        setShowDashboard(false);
        setShowHelp(false);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleMasterPasswordSet = async (password: string) => {
    await storageSetMasterPassword(password); // Store verifier in localStorage
    setMasterPasswordState(password); // Set React state for encryption/decryption
    setIsAuthenticated(true);
  };

  const handleMasterPasswordVerify = async (password: string) => {
    if (await verifyMasterPassword(password)) {
      setMasterPasswordState(password); // Set React state for encryption/decryption
      setIsAuthenticated(true);
    } else {
      throw new Error('Incorrect master password');
    }
  };

  const handleSavePassword = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!masterPassword) {
      console.error('No master password available');
      alert('Error: No master password available. Please log in again.');
      return;
    }

    try {
      let updated: PasswordEntry[];
      if (editingPassword) {
        updated = passwords.map(p =>
          p.id === editingPassword.id
            ? { ...entry, id: p.id, createdAt: p.createdAt, updatedAt: Date.now() }
            : p
        );
      } else {
        const newEntry: PasswordEntry = {
          ...entry,
          id: `pw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        updated = [...passwords, newEntry];
      }

      setPasswords(updated);
      await savePasswords(updated, masterPassword);
      setShowForm(false);
      setEditingPassword(null);
    } catch (error) {
      console.error('Failed to save password:', error);
      alert('Failed to save password. Please try again.');
    }
  }, [masterPassword, passwords, editingPassword]);

  const handleDeletePassword = useCallback(async (id: string) => {
    if (!masterPassword) return;
    if (!confirm('Are you sure you want to delete this password?')) return;

    const updated = passwords.filter(p => p.id !== id);
    setPasswords(updated);
    await savePasswords(updated, masterPassword);
  }, [masterPassword, passwords]);

  const handleImport = (imported: PasswordEntry[]) => {
    setPasswords(imported);
  };

  const handleEditPassword = useCallback((entry: PasswordEntry) => {
    setEditingPassword(entry);
    setShowForm(true);
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMasterPasswordState('');
    setPasswords([]);
    setShowForm(false);
    setEditingPassword(null);
  };

  if (!hasMasterPassword()) {
    return (
      <ToastProvider>
        <MasterPasswordSetup onSet={handleMasterPasswordSet} />
      </ToastProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <MasterPasswordLogin onVerify={handleMasterPasswordVerify} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="app">
        <NavBar
          title="🔐 Password Manager"
          onAdd={() => setShowForm(true)}
          onOpenAccount={() => setShowAccount(true)}
          onOpenDashboard={() => setShowDashboard(true)}
          theme={theme}
          toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          onLogout={handleLogout}
          onSearch={(q) => setSearch(q)}
        />

      <main className="app-main">
        {showForm ? (
          <PasswordForm
            entry={editingPassword}
            onSave={handleSavePassword}
            onCancel={() => {
              setShowForm(false);
              setEditingPassword(null);
            }}
          />
        ) : (
          <>
            <div className="actions-bar">
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                + Add Password
              </button>
              <ExportImport passwords={passwords} masterPassword={masterPassword} onImport={handleImport} />
            </div>
            <PasswordList
              passwords={[...passwords.filter(p => {
                const q = (search || '').trim().toLowerCase();
                if (!q) return true;
                return (
                  (p.name || '').toLowerCase().includes(q) ||
                  (p.username || '').toLowerCase().includes(q) ||
                  (p.url || '').toLowerCase().includes(q)
                );
              }), ...serverResults]}
              onEdit={handleEditPassword}
              onDelete={handleDeletePassword}
              onAdd={() => setShowForm(true)}
              query={search}
            />
          </>
        )}
      </main>
      {showAccount && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="account-management-title">
          <div ref={accountPanelRef} className="overlay-panel" >
            <button className="close-btn" onClick={() => setShowAccount(false)}>Close</button>
            <AccountManagement masterPassword={masterPassword} onPasswordChanged={(p) => setMasterPasswordState(p)} />
          </div>
        </div>
      )}
      {showDashboard && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="security-dashboard-title">
          <div ref={dashboardPanelRef} className="overlay-panel large">
            <button className="close-btn" onClick={() => setShowDashboard(false)}>Close</button>
            <SecurityDashboard passwords={passwords} />
          </div>
        </div>
      )}
      </div>
    </ToastProvider>
  );
}

export default App;
