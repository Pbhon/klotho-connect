import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signUpVolunteer, signUpAdmin, AdminCodeError } from '../lib/auth';
import { getChaptersByState } from '../lib/firestore';
import { US_STATES } from '../constants/states';
import Spinner from '../components/Spinner';

const NEW_CHAPTER = '__new__';

export default function Signup() {
  const { user, loading: authLoading, setProfile, setCreatingAccount } = useAuth();

  const [role, setRole] = useState('volunteer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [code, setCode] = useState('');
  const [state, setState] = useState('');
  const [chapters, setChapters] = useState([]);
  const [chapterChoice, setChapterChoice] = useState('');
  const [newChapterName, setNewChapterName] = useState('');
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);

  useEffect(() => {
    if (!state) {
      setChapters([]);
      setChapterChoice('');
      return;
    }
    setLoadingChapters(true);
    getChaptersByState(state)
        .then((list) => {
          setChapters(list);
          setChapterChoice(list.length ? '' : NEW_CHAPTER);
        })
        .finally(() => setLoadingChapters(false));
  }, [state]);

  // Highest priority: the account was just created successfully. Nothing
  // else below gets a chance to run until this actually navigates.
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  // While the account is being created, show a takeover spinner instead
  // of the form. This also means `submitting` never flips back to false
  // on the success path, so the "already logged in, go home" check below
  // can never race in front of the real destination (see handleSubmit).
  if (submitting) {
    return (
        <Spinner
            label={role === 'admin' ? 'Setting up your chapter…' : 'Creating your account…'}
        />
    );
  }

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords don\u2019t match.');
      return;
    }
    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.');
      return;
    }
    if (role === 'admin') {
      if (!state) return setError('Choose your chapter\u2019s state.');
      if (!chapterChoice) return setError('Choose or create your chapter.');
      if (chapterChoice === NEW_CHAPTER && !newChapterName.trim()) {
        return setError('Give your new chapter a name.');
      }
      if (!code.trim()) return setError('Enter your chapter-lead signup code.');
    }

    setSubmitting(true);
    setCreatingAccount(true);
    try {
      if (role === 'volunteer') {
        const { profile } = await signUpVolunteer({ name, email, password });
        setProfile(profile);
        setCreatingAccount(false);
        setRedirectTo('/volunteer');
      } else {
        const { profile } = await signUpAdmin({
          name,
          email,
          password,
          code: code.trim(),
          state,
          chapterId: chapterChoice === NEW_CHAPTER ? null : chapterChoice,
          newChapterName: chapterChoice === NEW_CHAPTER ? newChapterName : undefined,
        });
        setProfile(profile);
        setCreatingAccount(false);
        setRedirectTo('/admin');
      }
      // Deliberately not resetting `submitting` here -- see the comment
      // above the takeover-spinner check.
    } catch (err) {
      setCreatingAccount(false);
      if (err instanceof AdminCodeError) {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists for that email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('That email address doesn\u2019t look right.');
      } else {
        setError('Something went wrong creating your account. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-14">
        <h1 className="font-display text-3xl font-semibold text-ink">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-soft">Join as a volunteer, or register your chapter.</p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-sand-dark bg-paper-dim p-1">
          <button
              type="button"
              onClick={() => setRole('volunteer')}
              className={`rounded-full py-2 text-sm font-semibold transition ${
                  role === 'volunteer' ? 'bg-plum text-paper shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
          >
            Volunteer
          </button>
          <button
              type="button"
              onClick={() => setRole('admin')}
              className={`rounded-full py-2 text-sm font-semibold transition ${
                  role === 'admin' ? 'bg-plum text-paper shadow-sm' : 'text-ink-soft hover:text-ink'
              }`}
          >
            Chapter lead
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <Field label="Full name">
            <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                autoComplete="name"
            />
          </Field>
          <Field label="Email">
            <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Password">
              <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm password">
              <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
              />
            </Field>
          </div>

          {role === 'admin' && (
              <div className="mt-1 flex flex-col gap-4 rounded-card border border-sand-dark bg-paper-dim/60 p-4">
                <Field label="Chapter-lead signup code" hint="Given to you by Klotho national leadership.">
                  <input
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="input"
                      autoComplete="off"
                  />
                </Field>
                <Field label="State">
                  <select
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="input"
                  >
                    <option value="" disabled>Choose a state</option>
                    {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                {state && (
                    <Field label="Chapter">
                      {loadingChapters ? (
                          <p className="text-sm text-ink-soft">Checking for existing chapters…</p>
                      ) : (
                          <select
                              required
                              value={chapterChoice}
                              onChange={(e) => setChapterChoice(e.target.value)}
                              className="input"
                          >
                            {chapters.length === 0 && (
                                <option value={NEW_CHAPTER}>No chapters in {state} yet — create the first one</option>
                            )}
                            {chapters.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                            {chapters.length > 0 && (
                                <option value={NEW_CHAPTER}>+ Create a new chapter in {state}</option>
                            )}
                          </select>
                      )}
                    </Field>
                )}

                {chapterChoice === NEW_CHAPTER && (
                    <Field label="New chapter name" hint="Usually a city or campus, e.g. \u201cColumbus\u201d.">
                      <input
                          required
                          value={newChapterName}
                          onChange={(e) => setNewChapterName(e.target.value)}
                          className="input"
                      />
                    </Field>
                )}
              </div>
          )}

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
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-plum hover:underline">Log in</Link>
        </p>
      </div>
  );
}

function Field({ label, hint, children }) {
  return (
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">{label}</span>
        {children}
        {hint && <span className="text-xs text-ink-soft">{hint}</span>}
      </label>
  );
}