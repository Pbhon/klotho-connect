import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfileState] = useState(null);
  const [loading, setLoading] = useState(true);

  // While a signup flow is actively writing a brand-new account (see
  // Signup.jsx), this listener would otherwise fire the instant
  // createUserWithEmailAndPassword resolves -- well before the multi-step
  // Firestore writes that follow it finish -- read "no profile yet," and
  // clobber the real profile moments later with null. Signup.jsx sets
  // this flag for the duration of its own write sequence and sets the
  // resulting profile directly instead, so this listener just stays out
  // of the way until that's done.
  const creatingAccountRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfileState(null);
        setLoading(false);
        return;
      }

      if (creatingAccountRef.current) {
        setLoading(false);
        return;
      }

      setProfileState(await getUserProfile(firebaseUser.uid));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /** Re-fetches the profile for whoever is *currently* signed in, read
   *  live off the Firebase SDK rather than a possibly-stale closed-over
   *  `user` value. */
  async function refreshProfile() {
    const currentUser = auth.currentUser;
    if (currentUser) setProfileState(await getUserProfile(currentUser.uid));
  }

  /** Sets the profile directly -- used right after signup, when the
   *  caller already knows exactly what was written and doesn't need to
   *  (racily) re-fetch it. */
  function setProfile(newProfile) {
    setProfileState(newProfile);
  }

  function setCreatingAccount(value) {
    creatingAccountRef.current = value;
  }

  return (
      <AuthContext.Provider
          value={{ user, profile, loading, refreshProfile, setProfile, setCreatingAccount }}
      >
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}