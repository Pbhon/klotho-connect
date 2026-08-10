import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyEvents } from '../../lib/firestore';
import { formatEventDateTime, isPast } from '../../lib/format';
import Spinner from '../../components/Spinner';

export default function MyEvents() {
  const { profile } = useAuth();
  const [events, setEvents] = useState(null);

  useEffect(() => {
    getMyEvents(profile.uid).then(setEvents);
  }, [profile.uid]);

  if (events === null) return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
        <h1 className="font-display text-3xl font-semibold text-ink">My events</h1>
        <p className="mt-1.5 text-ink-soft">No current events</p>
      </div>
  );

  const upcoming = events.filter((e) => !isPast(e.dateTime));
  const past = events.filter((e) => isPast(e.dateTime));

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-ink">My events</h1>
      <p className="mt-1.5 text-ink-soft">Everything you've signed up for, across every chapter.</p>

      {upcoming.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
          No upcoming events yet.{' '}
          <Link to="/volunteer" className="font-semibold text-plum hover:underline">Browse chapters</Link> to find one.
        </div>
      ) : (
        <ul className="mt-7 flex flex-col gap-3">
          {upcoming.map((ev) => (
            <li key={ev.id}>
              <Link
                to={`/volunteer/event/${ev.id}`}
                className="flex items-center justify-between rounded-card border border-sand-dark bg-paper p-4 transition hover:border-plum"
              >
                <div>
                  <p className="font-display font-semibold text-ink">{ev.title}</p>
                  <p className="text-sm text-plum">{formatEventDateTime(ev.dateTime)}</p>
                  {ev.location && <p className="text-sm text-ink-soft">{ev.location}</p>}
                </div>
                <span className="text-sm font-semibold text-plum">Details &rarr;</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">
            Past events ({past.length})
          </summary>
          <ul className="mt-4 flex flex-col gap-3">
            {past.map((ev) => (
              <li key={ev.id} className="rounded-card border border-sand-dark bg-paper p-4 opacity-70">
                <p className="font-display font-semibold text-ink">{ev.title}</p>
                <p className="text-sm text-plum">{formatEventDateTime(ev.dateTime)}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
