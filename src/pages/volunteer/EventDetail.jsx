import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getEvent, getChapter, isSignedUp, signUpForEvent, cancelSignup, getSignupCount,
} from '../../lib/firestore';
import { formatEventDateTime, isPast } from '../../lib/format';
import Spinner from '../../components/Spinner';

export default function EventDetail() {
  const { eventId } = useParams();
  const { profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [signedUp, setSignedUp] = useState(false);
  const [count, setCount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const ev = await getEvent(eventId);
    const [ch, mine, c] = await Promise.all([
      getChapter(ev.chapterId),
      isSignedUp(eventId, profile.uid),
      getSignupCount(eventId),
    ]);
    setEvent(ev);
    setChapter(ch);
    setSignedUp(mine);
    setCount(c);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (!event) return <Spinner label="Loading event…" />;

  const past = isPast(event.dateTime);
  const goalMet = count !== null && count >= event.volunteersNeeded;

  async function handleToggleSignup() {
    setError('');
    setBusy(true);
    try {
      if (signedUp) {
        await cancelSignup(eventId, profile.uid);
      } else {
        await signUpForEvent({
          eventId,
          chapterId: event.chapterId,
          uid: profile.uid,
          name: profile.name,
          email: profile.email,
        });
      }
      await load();
    } catch {
      setError('That didn\u2019t go through — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <Link
        to={chapter ? `/volunteer/${encodeURIComponent(chapter.state)}/${chapter.id}` : '/volunteer'}
        className="text-sm font-medium text-ink-soft hover:text-plum"
      >
        &larr; {chapter?.name || 'Back to chapter'}
      </Link>

      <div className="mt-4 rounded-card border border-sand-dark bg-paper p-7">
        {past && (
          <span className="mb-3 inline-block rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-ink-soft">
            This event has passed
          </span>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{event.title}</h1>
        <p className="mt-2 text-base font-medium text-plum">{formatEventDateTime(event.dateTime)}</p>
        {event.location && <p className="text-ink-soft">{event.location}</p>}

        {event.description && (
          <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-soft">{event.description}</p>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-sand pt-5 text-sm">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
            <div
              className={`h-full rounded-full ${goalMet ? 'bg-sage' : 'bg-gold'}`}
              style={{ width: `${count === null ? 0 : Math.min(100, (count / Math.max(1, event.volunteersNeeded)) * 100)}%` }}
            />
          </div>
          <span className={`shrink-0 font-medium ${goalMet ? 'text-sage' : 'text-ink-soft'}`}>
            {count ?? '\u2013'} of {event.volunteersNeeded} volunteers{goalMet ? ' \u2013 goal met!' : ''}
          </span>
        </div>

        {error && <p className="mt-4 text-sm text-rust">{error}</p>}

        {!past && (
          <button
            onClick={handleToggleSignup}
            disabled={busy}
            className={`mt-5 w-full rounded-full py-3 text-sm font-semibold transition disabled:opacity-60 ${
              signedUp
                ? 'border border-rust text-rust hover:bg-rust-light'
                : 'bg-plum text-paper hover:bg-plum-dark'
            }`}
          >
            {busy ? 'Saving…' : signedUp ? 'Cancel my spot' : 'Sign up for this event'}
          </button>
        )}

        {signedUp && !past && (
          <p className="mt-3 text-center text-sm text-sage">You\u2019re signed up \u2014 see you there!</p>
        )}
      </div>
    </div>
  );
}
