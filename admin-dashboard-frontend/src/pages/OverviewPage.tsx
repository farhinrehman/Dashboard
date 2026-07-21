import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/endpoints';
import { StatCard } from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';
import type { DashboardSummary } from '../types';

export function OverviewPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .getSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load dashboard stats.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <p style={{ color: 'var(--ink-soft)', marginBottom: 20 }}>
        Welcome back, {user?.firstName}. Here's what's happening across your workspace.
      </p>

      {error && <div className="form-error">{error}</div>}

      {summary && (
        <div className="stats-grid">
          <StatCard label="Total users" value={summary.totalUsers} tone="primary" />
          <StatCard label="Active users" value={summary.activeUsers} />
          <StatCard label="Admins" value={summary.adminCount} />
          <StatCard label="New (7 days)" value={summary.newUsersLast7Days} tone="amber" />
        </div>
      )}

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>Your role</h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          {user?.roles.includes('Admin')
            ? 'You have administrator access. Manage accounts and roles from the Users section.'
            : 'You have standard access. Contact an administrator for elevated permissions.'}
        </p>
      </div>
    </div>
  );
}
