// Server search stub — replace with real API integration if/when available.
import { PasswordEntry } from './storage';

export async function serverSearch(query: string): Promise<PasswordEntry[]> {
  // TODO: call backend API to search encrypted vault (server-side search requires secure design)
  // For now this is a no-op returning an empty array so the UI can opt into server search later.
  return [];
}

export default { serverSearch };
