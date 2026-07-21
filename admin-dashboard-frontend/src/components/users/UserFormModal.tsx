import { useState, type FormEvent } from 'react';
import type { Role } from '../../types';
import { extractErrorMessage } from '../../utils/errors';

export interface UserFormValues {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

interface UserFormModalProps {
  title: string;
  initial?: UserFormValues;
  requirePassword?: boolean;
  emailReadOnly?: boolean;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => Promise<void>;
}

const EMPTY: UserFormValues = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'User',
  isActive: true
};

export function UserFormModal({
  title,
  initial,
  requirePassword = false,
  emailReadOnly = false,
  onCancel,
  onSubmit
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(extractErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
      <div className="modal">
        <h2 id="user-form-title">{title}</h2>

        {error && <div className="form-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="uf-firstName">First name</label>
            <input
              id="uf-firstName"
              required
              value={values.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="uf-lastName">Last name</label>
            <input
              id="uf-lastName"
              required
              value={values.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="uf-email">Email</label>
            <input
              id="uf-email"
              type="email"
              required
              readOnly={emailReadOnly}
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          {requirePassword && (
            <div className="field">
              <label htmlFor="uf-password">Temporary password</label>
              <input
                id="uf-password"
                type="password"
                minLength={8}
                required
                value={values.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="uf-role">Role</label>
            <select id="uf-role" value={values.role} onChange={(e) => update('role', e.target.value as Role)}>
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          {initial && (
            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                id="uf-active"
                type="checkbox"
                checked={values.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                style={{ width: 'auto' }}
              />
              <label htmlFor="uf-active" style={{ margin: 0 }}>
                Account is active
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}