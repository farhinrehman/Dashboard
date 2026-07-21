import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';
import { AuthProvider } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { authApi, dashboardApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';

vi.mock('../api/endpoints', () => ({
  authApi: { login: vi.fn(), register: vi.fn(), logout: vi.fn() },
  dashboardApi: { getMe: vi.fn(), getSummary: vi.fn() }
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    tokenStorage.clear();
    vi.clearAllMocks();
  });

  it('submits credentials and redirects on success', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      accessTokenExpiresAtUtc: new Date().toISOString(),
      user: { id: '1', email: 'jane@example.com', firstName: 'Jane', lastName: 'Doe', roles: ['User'] }
    });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'Password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Dashboard home')).toBeInTheDocument());
    expect(authApi.login).toHaveBeenCalledWith('jane@example.com', 'Password123');
  });

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup();
    const axiosError = new AxiosError('Request failed');
    axiosError.response = {
      data: { message: 'Invalid credentials.' },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as never
    };
    vi.mocked(authApi.login).mockRejectedValue(axiosError);

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'WrongPassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials.');
  });

  it('redirects immediately if already authenticated', async () => {
    tokenStorage.setTokens('access', 'refresh');
    vi.mocked(dashboardApi.getMe).mockResolvedValue({
      id: '1',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      roles: ['User']
    });

    renderLogin();

    await waitFor(() => expect(screen.getByText('Dashboard home')).toBeInTheDocument());
  });
});
