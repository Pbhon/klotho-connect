import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, getChapter, isSignedUp } from '../../lib/firestore';
import { formatEventDateTime, isPast } from '../../lib/format';
import SignupButton from '../../components/SignupButton';
import Spinner from '../../components/Spinner';

export default function EventDetail() {
  const { eventId } = useParams();
  const { profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [signedUp, setSignedUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const ev = await getEvent(eventId);
      if (!ev) {
        setError('This event doesn\u2019t exist anymore.');
        return;
      }
      const [ch, mine] = await Promise.all([
        getChapter(ev.chapterId),
        isSignedUp(eventId, profile.uid),
      ]);
      setEvent(ev);
      setChapter(ch);
      setSignedUp(mine);
    } catch {
      setError('Couldn\u2019t load this event.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (loading) return <Spinner label="Loading event…" />;

  if (error || !event) {
    return (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-14 text-center">
          <p className="text-ink-soft">{error || 'This event doesn\u2019t exist anymore.'}</p>
          <button
              onClick={load}
              className="rounded-full border border-sand-dark px-5 py-2 text-sm font-semibold text-ink-soft hover:border-plum hover:text-plum"
          >
            Try again
          </button>
          <Link to="/volunteer" className="text-sm font-semibold text-plum hover:underline">Back to browse</Link>
        </div>
    );
  }

  const past = isPast(event.dateTime);
  const signupCount = event.signupCount ?? 0;
  const goalMet = signupCount >= event.volunteersNeeded;

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
                  style={{ width: `${Math.min(100, (signupCount / Math.max(1, event.volunteersNeeded)) * 100)}%` }}
              />
            </div>
            <span className={`shrink-0 font-medium ${goalMet ? 'text-sage' : 'text-ink-soft'}`}>
            {signupCount} of {event.volunteersNeeded} volunteers{goalMet ? ' \u2013 goal met!' : ''}
          </span>
          </div>

          {!past && (
              <SignupButton
                  event={event}
                  initialSignedUp={signedUp}
                  onChange={(newSignedUp) => {
                    setSignedUp(newSignedUp);
                    setEvent((prev) => ({ ...prev, signupCount: (prev.signupCount ?? 0) + (newSignedUp ? 1 : -1) }));
                  }}
                  className="mt-5"
              />
          )}

          {signedUp && !past && (
              <p className="mt-3 text-center text-sm text-sage">You\u2019re signed up \u2014 see you there!</p>
          )}
        </div>
      </div>
  );
}