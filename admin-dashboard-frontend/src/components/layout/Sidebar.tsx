import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './layout.css';

const navItems = [
  { to: '/', label: 'Overview', icon: OverviewIcon },
  { to: '/users', label: 'Users', icon: UsersIcon, adminOnly: true }
];

export function Sidebar() {
  const { isAdmin, user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true" />
        <span>Admin Panel</span>
      </div>

      <nav className="sidebar__nav">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {user && (
        <div className="sidebar__footer">
          <span className={`ring ring--${isAdmin ? 'admin' : 'user'}`}>
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </span>
          <div className="sidebar__user-meta">
            <span className="sidebar__user-name">
              {user.firstName} {user.lastName}
            </span>
            <span className="sidebar__user-role">{isAdmin ? 'Admin' : 'User'}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 15c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 8.5c1.8.2 3 1.4 3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
