import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UsersPage } from '../pages/UsersPage';
import { usersApi } from '../api/endpoints';
import { AuthContext } from '../context/AuthContext';
import type { UserListItem, UserSummary } from '../types';

vi.mock('../api/endpoints', () => ({
  usersApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn()
  }
}));

const currentAdmin: UserSummary = { id: 'admin-1', email: 'admin@example.com', firstName: 'Ad', lastName: 'Min', roles: ['Admin'] };

const sampleUsers: UserListItem[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    firstName: 'Ad',
    lastName: 'Min',
    isActive: true,
    roles: ['Admin'],
    createdAtUtc: new Date().toISOString(),
    lastLoginUtc: null
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    isActive: true,
    roles: ['User'],
    createdAtUtc: new Date().toISOString(),
    lastLoginUtc: null
  }
];

// AuthContext isn't exported by default from the app module in the same way, so we
// provide a lightweight fake provider mirroring the real context's shape for this test.
function renderUsersPage() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: currentAdmin,
          isLoading: false,
          isAuthenticated: true,
          isAdmin: true,
          login: vi.fn(),
          register: vi.fn(),
          logout: vi.fn()
        }}
      >
        <UsersPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usersApi.getAll).mockResolvedValue(sampleUsers);
  });

  it('renders the list of users returned by the API', async () => {
    renderUsersPage();

    await waitFor(() => expect(screen.getByText('jane@example.com')).toBeInTheDocument());
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('2 total accounts')).toBeInTheDocument();
  });

  it('disables the remove button for the signed-in admin\'s own row', async () => {
    renderUsersPage();
    await waitFor(() => expect(screen.getByText('admin@example.com')).toBeInTheDocument());

    const rows = screen.getAllByRole('row');
    const adminRow = rows.find((r) => r.textContent?.includes('admin@example.com'));
    const removeButton = adminRow?.querySelector('button.btn--danger');

    expect(removeButton).toBeDisabled();
  });

  it('opens the create modal and submits a new user', async () => {
    const user = userEvent.setup();
    vi.mocked(usersApi.create).mockResolvedValue(sampleUsers[1]);

    renderUsersPage();
    await waitFor(() => expect(screen.getByText('admin@example.com')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add user/i }));
    expect(screen.getByText('Add user')).toBeInTheDocument();

    await user.type(screen.getByLabelText('First name'), 'New');
    await user.type(screen.getByLabelText('Last name'), 'Person');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Temporary password'), 'Password123');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(usersApi.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'Password123',
        firstName: 'New',
        lastName: 'Person',
        role: 'User'
      })
    );
  });
});
