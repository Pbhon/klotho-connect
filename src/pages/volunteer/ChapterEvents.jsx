import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { subscribeToChapterEvents, getChapter, getSignupCount } from '../../lib/firestore';
import EventCard from '../../components/EventCard';
import Spinner from '../../components/Spinner';
import { isPast } from '../../lib/format';

export default function ChapterEvents() {
  const { state, chapterId } = useParams();
  const [chapter, setChapter] = useState(null);
  const [events, setEvents] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    getChapter(chapterId).then(setChapter);
    const unsubscribe = subscribeToChapterEvents(chapterId, setEvents);
    return unsubscribe;
  }, [chapterId]);

  useEffect(() => {
    if (!events) return;
    events.forEach((ev) => {
      getSignupCount(ev.id).then((count) =>
        setCounts((prev) => ({ ...prev, [ev.id]: count }))
      );
    });
  }, [events]);

  if (events === null) return <Spinner label="Loading events…" />;

  const upcoming = events.filter((e) => !isPast(e.dateTime));
  const past = events.filter((e) => isPast(e.dateTime));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
      <Link to={`/volunteer/${encodeURIComponent(state)}`} className="text-sm font-medium text-ink-soft hover:text-plum">
        &larr; Chapters in {state}
      </Link>
      <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-gold-dark">Step 3 of 3</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{chapter?.name || 'Chapter'}</h1>

      {upcoming.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
          No upcoming events posted yet — check back soon.
        </p>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {upcoming.map((ev) => (
            <Link key={ev.id} to={`/volunteer/event/${ev.id}`}>
              <EventCard event={ev} signupCount={counts[ev.id]} />
            </Link>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">
            Past events ({past.length})
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {past.map((ev) => (
              <EventCard key={ev.id} event={ev} signupCount={counts[ev.id]} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
