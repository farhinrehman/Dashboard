import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authApi, dashboardApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';

vi.mock('../api/endpoints', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  },
  dashboardApi: {
    getMe: vi.fn(),
    getSummary: vi.fn()
  }
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.clearAllMocks();
  });

  it('starts unauthenticated with no stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login stores tokens and sets the current user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      accessTokenExpiresAtUtc: new Date().toISOString(),
      user: { id: '1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', roles: ['Admin'] }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('jane@example.com', 'Password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(tokenStorage.getAccessToken()).toBe('access-1');
  });

  it('logout clears tokens and user state', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      accessTokenExpiresAtUtc: new Date().toISOString(),
      user: { id: '1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', roles: ['User'] }
    });
    vi.mocked(authApi.logout).mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login('jane@example.com', 'Password123');
    });
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('restores the session from a stored token on mount', async () => {
    tokenStorage.setTokens('existing-access', 'existing-refresh');
    vi.mocked(dashboardApi.getMe).mockResolvedValue({
      id: '2',
      email: 'restored@example.com',
      firstName: 'Res',
      lastName: 'Tored',
      roles: ['User']
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('restored@example.com');
  });
});
