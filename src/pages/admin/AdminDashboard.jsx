import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToChapterEvents, getChapter, deleteEvent } from '../../lib/firestore';
import EventCard from '../../components/EventCard';
import Spinner from '../../components/Spinner';
import { isPast } from '../../lib/format';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [events, setEvents] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    getChapter(profile.chapterId).then(setChapter);
    const unsubscribe = subscribeToChapterEvents(profile.chapterId, setEvents);
    return unsubscribe;
  }, [profile.chapterId]);

  async function handleDelete(eventId) {
    await deleteEvent(eventId);
    setConfirmingId(null);
  }

  if (events === null) return <Spinner label="Loading your dashboard…" />;

  const upcoming = events.filter((e) => !isPast(e.dateTime));
  const past = events.filter((e) => isPast(e.dateTime));

  return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-dark">Chapter dashboard</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
              {chapter ? `${chapter.name}, ${chapter.state}` : '\u2026'}
            </h1>
          </div>
          <Link
              to="/admin/events/new"
              className="rounded-full bg-plum px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-plum-dark"
          >
            + Create event
          </Link>
        </div>

        <h2 className="mt-9 font-display text-xl font-semibold text-ink">Upcoming</h2>
        {upcoming.length === 0 ? (
            <p className="mt-4 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
              No events posted yet. Create your first one to start collecting sign-ups.
            </p>
        ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => (
                  <EventCard
                      key={ev.id}
                      event={ev}
                      footer={
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Link to={`/admin/events/${ev.id}/roster`} className="font-semibold text-plum hover:underline">
                            Roster
                          </Link>
                          <span className="text-sand-dark">&middot;</span>
                          <Link to={`/admin/events/${ev.id}/edit`} className="font-semibold text-ink-soft hover:text-ink">
                            Edit
                          </Link>
                          <span className="text-sand-dark">&middot;</span>
                          {confirmingId === ev.id ? (
                              <>
                                <button onClick={() => handleDelete(ev.id)} className="font-semibold text-rust hover:underline">
                                  Confirm delete
                                </button>
                                <button onClick={() => setConfirmingId(null)} className="text-ink-soft hover:underline">
                                  Cancel
                                </button>
                              </>
                          ) : (
                              <button onClick={() => setConfirmingId(ev.id)} className="font-semibold text-ink-soft hover:text-rust">
                                Delete
                              </button>
                          )}
                        </div>
                      }
                  />
              ))}
            </div>
        )}

        {past.length > 0 && (
            <details className="mt-10">
              <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">
                Past events ({past.length})
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((ev) => (
                    <EventCard
                        key={ev.id}
                        event={ev}
                        footer={
                          <Link to={`/admin/events/${ev.id}/roster`} className="text-sm font-semibold text-plum hover:underline">
                            View roster
                          </Link>
                        }
                    />
                ))}
              </div>
            </details>
        )}
      </div>
  );
}