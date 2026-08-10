import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

/** Wrap a page in this to require sign-in, and optionally a specific role.
 *  Signed-out visitors go to /login. Signed-in users with the wrong role
 *  get bounced to their own home instead of seeing a dead end. */
export default function ProtectedRoute({ role, children }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <Spinner label="Checking your account…" />;
  if (!user || !profile) return <Navigate to="/login" replace />;

  if (role && profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/volunteer'} replace />;
  }

  return children;
}
