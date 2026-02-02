import { PasswordEntry } from './storage';

// Parse Bitwarden JSON export
export function parseBitwardenJSON(content: string): PasswordEntry[] {
  const data = JSON.parse(content);
  const passwords: PasswordEntry[] = [];

  if (data.items) {
    data.items.forEach((item: any) => {
      if (item.type === 1 && item.login) { // Login type
        passwords.push({
          id: crypto.randomUUID(),
          name: item.name || 'Imported Password',
          username: item.login.username || '',
          password: item.login.password || '',
          url: item.login.uri || '',
          notes: item.notes || '',
          twoFactorSecret: item.login.totp || '',
          createdAt: new Date(item.creationDate).getTime(),
          updatedAt: new Date(item.revisionDate).getTime(),
        });
      }
    });
  }

  return passwords;
}

// Parse 1Password JSON export
export function parse1PasswordJSON(content: string): PasswordEntry[] {
  const data = JSON.parse(content);
  const passwords: PasswordEntry[] = [];

  data.forEach((item: any) => {
    if (item.category === 'login') {
      let username = '';
      let password = '';
      let url = '';
      let notes = '';
      let totp = '';

      item.details?.fields?.forEach((field: any) => {
        if (field.designation === 'username') username = field.value;
        if (field.designation === 'password') password = field.value;
        if (field.type === 'totp') totp = field.value;
      });

      item.details?.sections?.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          if (field.type === 'URL') url = field.v;
        });
      });

      if (item.details?.notesPlain) notes = item.details.notesPlain;

      passwords.push({
        id: crypto.randomUUID(),
        name: item.title || 'Imported Password',
        username,
        password,
        url,
        notes,
        twoFactorSecret: totp,
        createdAt: new Date(item.created).getTime(),
        updatedAt: new Date(item.updated).getTime(),
      });
    }
  });

  return passwords;
}

// Parse LastPass CSV export
export function parseLastPassCSV(content: string): PasswordEntry[] {
  const lines = content.split('\n');
  const passwords: PasswordEntry[] = [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const rowData: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    passwords.push({
      id: crypto.randomUUID(),
      name: rowData['name'] || rowData['title'] || 'Imported Password',
      username: rowData['username'] || rowData['login'] || '',
      password: rowData['password'] || '',
      url: rowData['url'] || rowData['website'] || '',
      notes: rowData['notes'] || rowData['extra'] || '',
      twoFactorSecret: '',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    });
  }

  return passwords;
}

// Parse Google Passwords CSV export
export function parseGooglePasswordsCSV(content: string): PasswordEntry[] {
  const lines = content.split('\n');
  const passwords: PasswordEntry[] = [];

  // Skip header line if it exists
  const startIdx = lines[0].toLowerCase().includes('url') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue;

    passwords.push({
      id: crypto.randomUUID(),
      name: values[0] || 'Imported Password',
      username: values[1] || '',
      password: values[2] || '',
      url: values[0] || '',
      notes: '',
      twoFactorSecret: '',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    });
  }

  return passwords;
}

// Parse Apple/Safari Passwords CSV export (usually exported from iCloud)
export function parseAppleSafariCSV(content: string): PasswordEntry[] {
  const lines = content.split('\n');
  const passwords: PasswordEntry[] = [];

  // Safari format: Title, URL, Username, Password, Notes, OTPAuth
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    if (values.length < 3) continue;

    passwords.push({
      id: crypto.randomUUID(),
      name: values[0] || 'Imported Password',
      url: values[1] || '',
      username: values[2] || '',
      password: values[3] || '',
      notes: values[4] || '',
      twoFactorSecret: values[5] || '', // OTPAuth
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    });
  }

  return passwords;
}

// Helper to parse CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Auto-detect format and parse
export function autoDetectAndParse(content: string, filename: string): PasswordEntry[] {
  const lowerFilename = filename.toLowerCase();

  // Try JSON first
  if (lowerFilename.endsWith('.json')) {
    try {
      const json = JSON.parse(content);
      if (json.items) return parseBitwardenJSON(content);
      if (Array.isArray(json) && json[0]?.category === 'login') return parse1PasswordJSON(content);
      return [];
    } catch (e) {
      // Not JSON, continue
    }
  }

  // Try CSV
  if (lowerFilename.endsWith('.csv')) {
    // Detect format by content
    if (content.includes('aes256')) return parseLastPassCSV(content);
    if (content.includes('OTPAuth')) return parseAppleSafariCSV(content);
    return parseGooglePasswordsCSV(content);
  }

  throw new Error('Unsupported file format. Please use JSON or CSV.');
}
