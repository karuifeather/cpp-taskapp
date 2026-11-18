import { Link, NavLink, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../config/app.js';
import { useAuth } from '../context/AuthContext.jsx';

const loggedInLinks = [
  { to: '/', label: 'My Tasks', end: true },
  { to: '/tasks', label: 'Task Catalog' },
  { to: '/profile', label: 'Profile' },
];

const loggedOutLinks = [
  { to: '/login', label: 'Log In' },
  { to: '/signup', label: 'Sign Up' },
];

const linkClass =
  'text-lg text-bar-text decoration-2 underline-offset-8 hover:underline sm:text-2xl';

export default function PageShell({ children }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Show nothing until we know whether someone is logged in (avoids a flash)
  const links = loading ? [] : user ? loggedInLinks : loggedOutLinks;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="bg-bar shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link
            to={user ? '/' : '/login'}
            className="font-logo text-3xl text-bar-text sm:text-5xl"
          >
            {APP_NAME}
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `${linkClass} ${isActive ? 'underline' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
            {user && (
              <button type="button" onClick={handleLogout} className={linkClass}>
                Log Out
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
