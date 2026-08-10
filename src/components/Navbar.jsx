import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../lib/auth';
import ThreadMark from './ThreadMark';

export default function Navbar() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogOut() {
    await logOut();
    setOpen(false);
    navigate('/');
  }

  const links = !user
    ? [{ to: '/login', label: 'Log in' }]
    : profile?.role === 'admin'
    ? [{ to: '/admin', label: 'Dashboard' }]
    : [
        { to: '/volunteer', label: 'Browse chapters' },
        { to: '/volunteer/my-events', label: 'My events' },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="group flex items-center gap-2" onClick={() => setOpen(false)}>
          <ThreadMark className="h-7 w-7 shrink-0" />
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Klotho <span className="text-plum">Connect</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-sand/70 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link
              to="/signup"
              className="ml-2 rounded-full bg-plum px-5 py-2 text-sm font-semibold text-paper shadow-sm transition hover:bg-plum-dark"
            >
              Get started
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogOut}
              className="ml-2 rounded-full border border-sand-dark px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-rust hover:text-rust"
            >
              Log out
            </button>
          )}
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-dark md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            {open ? (
              <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            ) : (
              <path d="M1 4h16M1 9h16M1 14h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-sand px-5 pb-4 pt-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-sand/70"
            >
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-plum px-3 py-2.5 text-center text-sm font-semibold text-paper"
            >
              Get started
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogOut}
              className="mt-1 rounded-lg border border-sand-dark px-3 py-2.5 text-sm font-medium text-ink-soft"
            >
              Log out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
