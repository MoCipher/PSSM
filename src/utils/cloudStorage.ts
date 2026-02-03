import { PasswordEntry } from './storage';
import { apiClient } from './api';

export interface CloudStorageResult {
  success: boolean;
  data?: PasswordEntry[];
  error?: string;
}

const extractTotpSecret = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  if (!value.startsWith('otpauth://')) return value;
  try {
    const url = new URL(value);
    const secret = url.searchParams.get('secret');
    return secret || value;
  } catch {
    return value;
  }
};

const normalizePasswordEntry = (entry: any): PasswordEntry => {
  const rawSecret = entry.twoFactorSecret || entry.two_factor_secret;
  const twoFactorSecret = extractTotpSecret(rawSecret);
  return {
    id: entry.id,
    name: entry.name || '',
    username: entry.username || '',
    password: entry.password || '',
    url: entry.url || undefined,
    notes: entry.notes || undefined,
    twoFactorSecret: twoFactorSecret || undefined,
    createdAt: typeof entry.createdAt === 'number'
      ? entry.createdAt
      : (entry.created_at ? new Date(entry.created_at).getTime() : Date.now()),
    updatedAt: typeof entry.updatedAt === 'number'
      ? entry.updatedAt
      : (entry.updated_at ? new Date(entry.updated_at).getTime() : Date.now()),
    lastUsed: entry.lastUsed ?? entry.last_used ?? null,
  };
};

// Initialize sync on app start
let syncIntervalId: number | null = null;

export const initializeSync = () => {
  // DISABLED: Auto-sync was causing bulk-sync wipes due to state issues
  // Passwords will only sync explicitly on save/delete or import
  return;
};

export const stopSync = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};

// Sync passwords with the server
export const syncPasswords = async (passwords?: PasswordEntry[], syncType?: string): Promise<CloudStorageResult> => {
  try {
    // If passwords are provided, sync them up
    if (passwords) {
      await apiClient.syncPasswords(passwords, undefined, syncType);
      return { success: true };
    }

    // Otherwise, fetch the latest from server
    const response = await apiClient.getPasswords();
    const normalized = (response.passwords || []).map(normalizePasswordEntry);
    return { success: true, data: normalized };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    };
  }
};

// Load passwords from cloud (on app start)
export const loadPasswordsFromCloud = async (): Promise<PasswordEntry[]> => {
  try {
    const response = await apiClient.getPasswords();
    return (response.passwords || []).map(normalizePasswordEntry);
  } catch (error) {
    console.error('Failed to load passwords from cloud:', error);
    return [];
  }
};

// Save password to cloud
export const savePasswordToCloud = async (password: PasswordEntry): Promise<boolean> => {
  try {
    await apiClient.updatePassword(password.id, password);
    return true;
  } catch (error) {
    console.error('Failed to save password to cloud:', error);
    throw error;
  }
};

// Delete password from cloud
export const deletePasswordFromCloud = async (passwordId: string): Promise<boolean> => {
  try {
    await apiClient.deletePassword(passwordId);
    return true;
  } catch (error) {
    console.error('Failed to delete password from cloud:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!apiClient.getToken();
};

// Logout and clear sync
export const logout = () => {
  apiClient.clearToken();
  stopSync();
};