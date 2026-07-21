import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute, AdminRoute } from '../components/ProtectedRoute';
import { dashboardApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';

vi.mock('../api/endpoints', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
  dashboardApi: { getMe: vi.fn(), getSummary: vi.fn() }
}));

function renderWithRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Overview page</div>} />
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<div>Users page</div>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /login', async () => {
    renderWithRoute('/');
    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
  });

  it('renders protected content for authenticated users', async () => {
    tokenStorage.setTokens('access', 'refresh');
    vi.mocked(dashboardApi.getMe).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      firstName: 'A',
      lastName: 'B',
      roles: ['User']
    });

    renderWithRoute('/');
    await waitFor(() => expect(screen.getByText('Overview page')).toBeInTheDocument());
  });

  it('redirects non-admin users away from admin-only routes', async () => {
    tokenStorage.setTokens('access', 'refresh');
    vi.mocked(dashboardApi.getMe).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      firstName: 'A',
      lastName: 'B',
      roles: ['User']
    });

    renderWithRoute('/users');
    await waitFor(() => expect(screen.getByText('Overview page')).toBeInTheDocument());
  });

  it('allows admin users to reach admin-only routes', async () => {
    tokenStorage.setTokens('access', 'refresh');
    vi.mocked(dashboardApi.getMe).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      firstName: 'A',
      lastName: 'B',
      roles: ['Admin']
    });

    renderWithRoute('/users');
    await waitFor(() => expect(screen.getByText('Users page')).toBeInTheDocument());
  });
});
