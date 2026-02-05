import { useState, useEffect, useCallback, useRef } from 'react';
import { PasswordEntry } from './utils/storage';
import PasswordList from './components/PasswordList';
import PasswordForm from './components/PasswordForm';
import PasswordLogin from './components/PasswordLogin';
import AccountManagement from './components/AccountManagement';
import ExportImport from './components/ExportImport';
import NavBar from './components/NavBar';
import SecurityDashboard from './components/SecurityDashboard';
import LoadingScreen from './components/LoadingScreen';
import useFocusTrap from './hooks/useFocusTrap';
import './App.css';
import { ToastProvider } from './components/Toast';
import { useConfirm } from './components/ConfirmDialog';
import { useAlert } from './components/AlertDialog';
import { serverSearch } from './utils/search';
import {
  isAuthenticated,
  loadPasswordsFromCloud,
  savePasswordToCloud,
  deletePasswordFromCloud,
  logout,
  initializeSync,
  stopSync
} from './utils/cloudStorage';
import { apiClient } from './utils/api';

function App() {
  const confirm = useConfirm();
  const alert = useAlert();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'login'>('checking');
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [search, setSearch] = useState<string>('');
  const [serverSearchEnabled, setServerSearchEnabled] = useState<boolean>(false);
  const [serverResults, setServerResults] = useState<PasswordEntry[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const accountPanelRef = useRef<HTMLDivElement | null>(null);
  const dashboardPanelRef = useRef<HTMLDivElement | null>(null);
  const helpPanelRef = useRef<HTMLDivElement | null>(null);

  useFocusTrap(accountPanelRef);
  useFocusTrap(dashboardPanelRef);
  useFocusTrap(helpPanelRef);

  // Check authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          await apiClient.verifyToken();
          const loadedPasswords = await loadPasswordsFromCloud();
          setPasswords(loadedPasswords);
          setAuthState('authenticated');
          initializeSync();
        } catch (error) {
          console.error('Authentication failed:', error);
          logout();
          setAuthState('login');
        }
      } else {
        setAuthState('login');
      }
    };

    checkAuth();

    return () => {
      stopSync();
    };
  }, []);

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
      }
    })();

    return () => { 
      mounted = false;
    };
  }, [serverSearchEnabled, search]);

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

  const handleLogin = async (token: string, _userData: any) => {
    apiClient.setToken(token);
    setAuthState('authenticated');
    setSearch('');
    setServerResults([]);
    const loadedPasswords = await loadPasswordsFromCloud();
    setPasswords(loadedPasswords);
    initializeSync();
  };

  const handleLogout = () => {
    logout();
    setPasswords([]);
    setSearch('');
    setServerResults([]);
    setServerSearchEnabled(false);
    setAuthState('login');
    setShowForm(false);
    setEditingPassword(null);
  };

  const handleToggleServerSearch = () => {
    setServerSearchEnabled(prev => !prev);
  };

  const handleSavePassword = useCallback(async (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (authState !== 'authenticated') {
      console.error('Not authenticated');
      await alert({ message: 'Error: Not authenticated. Please log in again.' });
      return;
    }

    const previous = passwords;
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

      if (editingPassword) {
        await savePasswordToCloud(updated.find(p => p.id === editingPassword.id)!);
      } else {
        const newEntry = updated.find(p => !passwords.some(existing => existing.id === p.id));
        if (newEntry) {
          await savePasswordToCloud(newEntry);
        }
      }

      setShowForm(false);
      setEditingPassword(null);
    } catch (error) {
      setPasswords(previous);
      console.error('Failed to save password:', error);
      await alert({ message: 'Failed to save password. Please try again.' });
    }
  }, [authState, passwords, editingPassword, alert]);

  const handleDeletePassword = useCallback(async (id: string) => {
    if (authState !== 'authenticated') return;
    const ok = await confirm({
      title: 'Delete password',
      message: 'Are you sure you want to delete this password?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      tone: 'danger'
    });
    if (!ok) return;

    try {
      await deletePasswordFromCloud(id);
      const updated = passwords.filter(p => p.id !== id);
      setPasswords(updated);
    } catch (error) {
      console.error('Failed to delete password:', error);
      await alert({ message: 'Failed to delete password. Please try again.' });
    }
  }, [authState, passwords, confirm, alert]);

  const handleImport = (imported: PasswordEntry[]) => {
    setPasswords(imported);
  };

  const handleEditPassword = useCallback((entry: PasswordEntry) => {
    setEditingPassword(entry);
    setShowForm(true);
  }, []);

  // Show loading screen on initial load
  if (isInitialLoading) {
    return (
      <ToastProvider>
        <LoadingScreen onLoadComplete={() => setIsInitialLoading(false)} />
      </ToastProvider>
    );
  }

  if (authState === 'checking') {
    return (
      <ToastProvider>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          Loading...
        </div>
      </ToastProvider>
    );
  }

  if (authState === 'login') {
    return (
      <ToastProvider>
        <PasswordLogin onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="app">
        <NavBar
          title="Password Manager"
          onAdd={() => setShowForm(true)}
          onOpenAccount={() => setShowAccount(true)}
          onOpenDashboard={() => setShowDashboard(true)}
          onLogout={handleLogout}
          onSearch={(q) => setSearch(q)}
          serverSearchEnabled={serverSearchEnabled}
          onToggleServerSearch={handleToggleServerSearch}
          onHelp={() => setShowHelp(true)}
          extraActions={
            <ExportImport passwords={passwords} masterPassword="" onImport={handleImport} />
          }
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
            <PasswordList
              passwords={[...passwords, ...serverResults]}
              onEdit={handleEditPassword}
              onDelete={handleDeletePassword}
              onAdd={() => setShowForm(true)}
              query={search}
            />
          )}
        </main>

        {showAccount && (
          <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="account-management-title">
            <div ref={accountPanelRef} className="overlay-panel">
              <AccountManagement
                onLogout={handleLogout}
                onClose={() => setShowAccount(false)}
              />
            </div>
          </div>
        )}

        {showDashboard && (
          <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="security-dashboard-title">
            <div ref={dashboardPanelRef} className="overlay-panel large">
              <div className="overlay-header">
                <div />
                <button className="close-btn" onClick={() => setShowDashboard(false)}>Close</button>
              </div>
              <SecurityDashboard passwords={passwords} />
            </div>
          </div>
        )}
        {showHelp && (
          <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="keyboard-shortcuts-title">
            <div ref={helpPanelRef} className="overlay-panel">
              <button className="close-btn" onClick={() => setShowHelp(false)}>Close</button>
              <div className="help-panel">
                <h3 id="keyboard-shortcuts-title">Keyboard Shortcuts</h3>
                <ul className="help-list">
                  <li><span>Focus search</span><kbd>/</kbd></li>
                  <li><span>Open help</span><kbd>?</kbd></li>
                  <li><span>Close overlays</span><kbd>Esc</kbd></li>
                </ul>
                <p className="help-note">Server search can be toggled from the toolbar.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
