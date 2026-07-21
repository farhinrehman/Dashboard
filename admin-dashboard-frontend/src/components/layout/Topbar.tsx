import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './layout.css';

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/users': 'Users'
};

export function Topbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = TITLES[location.pathname] ?? 'Dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <h1 className="topbar__title">{title}</h1>
      <button type="button" className="btn btn--ghost" onClick={handleLogout}>
        Sign out
      </button>
    </header>
  );
}
