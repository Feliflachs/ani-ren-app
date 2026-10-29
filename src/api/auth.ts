import type { ApiClient } from './client';

export type SessionUser = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  avatarId?: string | null;
  createdAt: string;
};

export type LoginResponse = { user: SessionUser; token: string; expiresAt: string };

export function createAuthApi(client: ApiClient) {
  return {
    login: (handle: string, password: string) =>
      client.request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { handle, password },
        authenticated: false,
      }),
    register: (handle: string, password: string) =>
      client.request<{ user: SessionUser }>('/auth/register', {
        method: 'POST',
        body: { handle, password },
        authenticated: false,
      }),
    session: () => client.request<{ user: SessionUser }>('/auth/me'),
    logout: () => client.request<void>('/auth/logout', { method: 'POST' }),
  };
}
