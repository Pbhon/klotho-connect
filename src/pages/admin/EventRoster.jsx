import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, subscribeToRoster } from '../../lib/firestore';
import { formatEventDateTime } from '../../lib/format';
import Spinner from '../../components/Spinner';

export default function EventRoster() {
  const { eventId } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [roster, setRoster] = useState(null);

  useEffect(() => {
    getEvent(eventId).then((ev) => {
      if (!ev || ev.chapterId !== profile.chapterId) {
        navigate('/admin', { replace: true });
        return;
      }
      setEvent(ev);
    });
    const unsubscribe = subscribeToRoster(eventId, setRoster);
    return unsubscribe;
  }, [eventId, profile.chapterId, navigate]);

  if (!event || roster === null) return <Spinner label="Loading roster…" />;

  const goalMet = roster.length >= event.volunteersNeeded;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <Link to="/admin" className="text-sm font-medium text-ink-soft hover:text-plum">&larr; Dashboard</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">{event.title}</h1>
          <p className="mt-1 text-sm font-medium text-plum">{formatEventDateTime(event.dateTime)}</p>
        </div>
        <Link
          to={`/admin/events/${eventId}/edit`}
          className="rounded-full border border-sand-dark px-4 py-2 text-sm font-semibold text-ink-soft hover:border-plum hover:text-plum"
        >
          Edit event
        </Link>
      </div>

      <p className={`mt-5 text-sm font-semibold ${goalMet ? 'text-sage' : 'text-ink-soft'}`}>
        {roster.length} of {event.volunteersNeeded} volunteers signed up{goalMet ? ' \u2013 goal met!' : ''}
      </p>

      {roster.length === 0 ? (
        <p className="mt-4 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
          No sign-ups yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-sand overflow-hidden rounded-card border border-sand-dark bg-paper">
          {roster.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-ink">{r.name}</p>
                <p className="text-sm text-ink-soft">{r.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        You'll also get an email with this list about a day before the event.
      </p>
    </div>
  );
}
