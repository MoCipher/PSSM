import { encryptWithPassword, decryptWithPassword, generateSalt, deriveVerifier } from './encryption';

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  twoFactorSecret?: string;
  createdAt: number;
  updatedAt: number;
  lastUsed?: number;
}

const STORAGE_KEY = 'password_manager_data';
const MASTER_KEY = 'password_manager_master';

export const setMasterPassword = async (password: string): Promise<void> => {
  const trimmed = password.trim();
  const salt = generateSalt(16);
  const iterations = 200000;
  const verifier = await deriveVerifier(trimmed, salt, iterations);

  const payload = {
    version: 1,
    salt: btoa(String.fromCharCode(...Array.from(salt))),
    iterations,
    verifier
  };

  localStorage.setItem(MASTER_KEY, JSON.stringify(payload));
};

export const changeMasterPassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  // Load with old password, save with new password, update verifier
  const entries = await loadPasswords(oldPassword);
  await savePasswords(entries, newPassword);
  await setMasterPassword(newPassword);
};

export const deleteAccount = async (): Promise<void> => {
  localStorage.removeItem(MASTER_KEY);
  localStorage.removeItem(STORAGE_KEY);
};

export const verifyMasterPassword = async (password: string): Promise<boolean> => {
  const raw = localStorage.getItem(MASTER_KEY);
  if (!raw) return false;
  try {
    const stored = JSON.parse(raw);
    const saltStr: string = stored.salt;
    const saltArr = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
    const iterations = stored.iterations || 200000;
    const verifier = await deriveVerifier(password.trim(), saltArr, iterations);
    return verifier === stored.verifier;
  } catch (err) {
    console.error('Failed to verify master password', err);
    return false;
  }
};

export const hasMasterPassword = (): boolean => {
  return !!localStorage.getItem(MASTER_KEY);
};

export const savePasswords = async (passwords: PasswordEntry[], masterPassword: string): Promise<void> => {
  try {
    const json = JSON.stringify(passwords);
    const encrypted = await encryptWithPassword(json, masterPassword);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save passwords:', error);
    throw new Error('Failed to save passwords to storage');
  }
};

export const loadPasswords = async (masterPassword: string): Promise<PasswordEntry[]> => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return [];

  try {
    const decrypted = await decryptWithPassword(encrypted, masterPassword);
    const parsed = JSON.parse(decrypted) as PasswordEntry[];
    return parsed.map(p => ({ ...p, lastUsed: p.lastUsed || null }));
  } catch (error) {
    throw new Error('Failed to decrypt passwords. Wrong master password?');
  }
};

export const exportPasswords = (passwords: PasswordEntry[]): string => {
  return JSON.stringify(passwords, null, 2);
};

export const exportPasswordsCSV = (passwords: PasswordEntry[]): string => {
  const headers = ['Name', 'Username', 'Password', 'URL', 'Notes', '2FA Secret'];
  const rows = passwords.map(p => [
    p.name,
    p.username,
    p.password,
    p.url || '',
    p.notes || '',
    p.twoFactorSecret || ''
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csv;
};

export const importPasswords = (json: string): PasswordEntry[] => {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) {
      throw new Error('Invalid format: expected an array');
    }
    
    return data.map((item, index) => ({
      id: item.id || `imported-${Date.now()}-${index}`,
      name: item.name || '',
      username: item.username || '',
      password: item.password || '',
      url: item.url || '',
      notes: item.notes || '',
      twoFactorSecret: item.twoFactorSecret || '',
      createdAt: item.createdAt || Date.now(),
      updatedAt: item.updatedAt || Date.now(),
      lastUsed: item.lastUsed || null,
    }));
  } catch (error) {
    throw new Error('Failed to parse JSON file');
  }
};

export const importPasswordsCSV = (csv: string): PasswordEntry[] => {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const dataRows = lines.slice(1);
  
  return dataRows.map((row, index) => {
    const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    const entry: PasswordEntry = {
      id: `imported-csv-${Date.now()}-${index}`,
      name: values[0] || '',
      username: values[1] || '',
      password: values[2] || '',
      url: values[3] || '',
      notes: values[4] || '',
      twoFactorSecret: values[5] || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUsed: null,
    };
    
    return entry;
  });
};

export const setLastUsed = async (id: string, masterPassword: string): Promise<void> => {
  const entries = await loadPasswords(masterPassword);
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  entries[idx].lastUsed = Date.now();
  entries[idx].updatedAt = Date.now();
  await savePasswords(entries, masterPassword);
};

export const searchPasswords = async (query: string, masterPassword: string): Promise<PasswordEntry[]> => {
  const entries = await loadPasswords(masterPassword);
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(e =>
    (e.name || '').toLowerCase().includes(q) ||
    (e.username || '').toLowerCase().includes(q) ||
    (e.url || '').toLowerCase().includes(q)
  );
};
