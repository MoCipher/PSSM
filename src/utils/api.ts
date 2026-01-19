const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
}

interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

interface PasswordSyncResponse {
  success: boolean;
  syncedAt: string;
  count: number;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication methods
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async verifyToken(): Promise<{ valid: boolean; user: { userId: string; email: string } }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Password sync methods
  async getPasswords(): Promise<{ passwords: any[] }> {
    return this.request('/passwords');
  }

  async syncPasswords(passwords: any[], lastSyncTimestamp?: string): Promise<PasswordSyncResponse> {
    return this.request('/passwords/sync', {
      method: 'POST',
      body: JSON.stringify({ passwords, lastSyncTimestamp }),
    });
  }

  async updatePassword(id: string, data: any): Promise<{ success: boolean; password: any }> {
    return this.request(`/passwords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePassword(id: string): Promise<{ success: boolean; deletedId: string }> {
    return this.request(`/passwords/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();