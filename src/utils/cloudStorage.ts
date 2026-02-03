import { PasswordEntry } from './storage';
import { apiClient } from './api';

const SYNC_INTERVAL = 30000; // 30 seconds

export interface CloudStorageResult {
  success: boolean;
  data?: PasswordEntry[];
  error?: string;
}

// Initialize sync on app start
let syncIntervalId: number | null = null;

export const initializeSync = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
  }

  syncIntervalId = window.setInterval(() => {
    syncPasswords().catch(console.error);
  }, SYNC_INTERVAL);
};

export const stopSync = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};

// Sync passwords with the server
export const syncPasswords = async (passwords?: PasswordEntry[]): Promise<CloudStorageResult> => {
  try {
    // If passwords are provided, sync them up
    if (passwords) {
      await apiClient.syncPasswords(passwords, undefined);
      return { success: true };
    }

    // Otherwise, fetch the latest from server
    const response = await apiClient.getPasswords();
    return { success: true, data: response.passwords };
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
    return response.passwords;
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
    return false;
  }
};

// Delete password from cloud
export const deletePasswordFromCloud = async (passwordId: string): Promise<boolean> => {
  try {
    await apiClient.deletePassword(passwordId);
    return true;
  } catch (error) {
    console.error('Failed to delete password from cloud:', error);
    return false;
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