// DashboardLayout - sidebar + content area shared by the customer, provider and admin dashboards.
// On phones the sidebar becomes a slide-in menu opened from the top bar.
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';
import { Avatar } from './ui';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ links, roleLabel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`dash ${menuOpen ? 'menu-open' : ''}`}>
      <aside className="sidebar" aria-label={`${roleLabel} menu`}>
        <div className="sidebar__brand"><Logo /></div>
        <div className="sidebar__user">
          <Avatar name={user?.name} image={user?.profile_image} size={40} />
          <div>
            <strong>{user?.name}</strong>
            <span>{roleLabel}</span>
          </div>
        </div>

        <nav className="sidebar__nav">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar__link ${isActive ? 'active' : ''}`}
            >
              <Icon name={link.icon} size={19} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__foot">
          <NavLink to="/" className="sidebar__link"><Icon name="home" size={19} /> Back to website</NavLink>
          <button type="button" className="sidebar__link" onClick={handleLogout}>
            <Icon name="logout" size={19} /> Logout
          </button>
        </div>
      </aside>

      <div className="dash__overlay" onClick={() => setMenuOpen(false)} />

      <div className="dash__main">
        <div className="dash__topbar">
          <button type="button" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <Logo />
        </div>
        <main className="dash__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Page title block used at the top of every dashboard page.
export function DashHead({ title, subtitle, children }) {
  return (
    <div className="dash__head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
