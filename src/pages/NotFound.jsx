import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="font-display text-6xl text-gold-dark">404</p>
      <h1 className="font-display text-2xl font-semibold text-ink">This page wandered off.</h1>
      <p className="max-w-sm text-ink-soft">
        The link may be old, or the page may have moved. Let's get you back on track.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-full bg-plum px-6 py-2.5 text-sm font-semibold text-paper transition hover:bg-plum-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
