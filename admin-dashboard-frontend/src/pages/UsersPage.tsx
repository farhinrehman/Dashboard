import { useEffect, useState } from 'react';
import { usersApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../utils/errors';
import type { Role, UserListItem } from '../types';
import { UserFormModal, type UserFormValues } from '../components/users/UserFormModal';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ mode: 'create' } | { mode: 'edit'; target: UserListItem } | null>(
    null
  );

  const loadUsers = () => {
    setLoading(true);
    usersApi
      .getAll()
      .then(setUsers)
      .catch(() => setError('Could not load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  const handleCreate = async (values: UserFormValues) => {
    await usersApi.create({
      email: values.email,
      password: values.password!,
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role
    });
    setModalState(null);
    loadUsers();
  };

  const handleUpdate = async (id: string, values: UserFormValues) => {
    await usersApi.update(id, {
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
      isActive: values.isActive
    });
    setModalState(null);
    loadUsers();
  };

  const handleDelete = async (target: UserListItem) => {
    if (!window.confirm(`Remove ${target.firstName} ${target.lastName}? This cannot be undone.`)) return;
    try {
      await usersApi.remove(target.id);
      loadUsers();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not remove this user.'));
    }
  };

  return (
    <div>
      <div className="toolbar">
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{users.length} total accounts</p>
        <button type="button" className="btn btn--primary" onClick={() => setModalState({ mode: 'create' })}>
          + Add user
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Loading users…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
                  No users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.roles.includes('Admin') ? 'badge--admin' : 'badge--user'}`}>
                    {u.roles.includes('Admin') ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge--active' : 'badge--inactive'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(u.createdAtUtc).toLocaleDateString()}</td>
                <td style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setModalState({ mode: 'edit', target: u })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    disabled={u.id === currentUser?.id}
                    onClick={() => handleDelete(u)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalState?.mode === 'create' && (
        <UserFormModal
          title="Add user"
          onCancel={() => setModalState(null)}
          onSubmit={handleCreate}
          requirePassword
        />
      )}
      {modalState?.mode === 'edit' && (
        <UserFormModal
          title="Edit user"
          initial={{
            email: modalState.target.email,
            firstName: modalState.target.firstName,
            lastName: modalState.target.lastName,
            role: modalState.target.roles.includes('Admin') ? 'Admin' : ('User' as Role),
            isActive: modalState.target.isActive
          }}
          emailReadOnly
          onCancel={() => setModalState(null)}
          onSubmit={(values) => handleUpdate(modalState.target.id, values)}
        />
      )}
    </div>
  );
}