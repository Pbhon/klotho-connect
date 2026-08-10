import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logIn, getUserProfile } from '../lib/auth';

export default function Login() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await logIn(email, password);
      await refreshProfile();
      const profile = await getUserProfile(loggedInUser.uid);
      navigate(profile?.role === 'admin' ? '/admin' : '/volunteer');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('That email and password don\u2019t match an account.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a bit and try again.');
      } else {
        setError('Something went wrong logging in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-14">
      <h1 className="font-display text-3xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Log in to your Klotho Connect account.</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Password</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-rust-light px-3.5 py-2.5 text-sm text-rust" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-plum py-3 text-sm font-semibold text-paper transition hover:bg-plum-dark disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Klotho?{' '}
        <Link to="/signup" className="font-semibold text-plum hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
