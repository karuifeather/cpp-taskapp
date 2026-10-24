import { Link, NavLink } from 'react-router-dom';
import { APP_NAME } from '../config/app.js';

const links = [
  { to: '/', label: 'My Tasks', end: true },
  { to: '/tasks', label: 'Task Catalog' },
  { to: '/profile', label: 'Profile' },
  { to: '/login', label: 'Log In' },
  { to: '/signup', label: 'Sign Up' },
];

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="text-lg font-bold text-ink">
            {APP_NAME}
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand text-white' : 'text-muted hover:bg-brand-soft'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
    </div>
  );
}
