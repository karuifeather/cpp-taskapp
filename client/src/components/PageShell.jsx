import { Link, NavLink } from 'react-router-dom';
import { APP_NAME } from '../config/app.js';

const links = [
  { to: '/', label: 'My Tasks', end: true },
  { to: '/tasks', label: 'Task Catalog' },
  { to: '/profile', label: 'Profile' },
  { to: '/login', label: 'Log In' },
  { to: '/signup', label: 'Sign Up' },
];

// Show "QuestMaster" from the config as "Quest Master" in the logo
const logoText = APP_NAME.replace(/([a-z])([A-Z])/g, '$1 $2');

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen">
      <header className="bg-bar shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link to="/" className="font-logo text-3xl text-bar-text sm:text-5xl">
            {logoText}
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `text-lg text-bar-text decoration-2 underline-offset-8 hover:underline sm:text-2xl ${
                    isActive ? 'underline' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
