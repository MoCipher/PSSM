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
  lastUsed?: number | null;
}

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
      lastUsed: item.lastUsed ?? null,
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
  
  // header parsing intentionally ignored for now
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
