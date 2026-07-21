import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <h1 style={{ fontSize: 28 }}>Page not found</h1>
      <p style={{ color: 'var(--ink-soft)' }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn--primary" style={{ textDecoration: 'none' }}>
        Back to dashboard
      </Link>
    </div>
  );
}
