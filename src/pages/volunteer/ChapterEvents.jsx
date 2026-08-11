import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToChapterEvents, getChapter, isSignedUp } from '../../lib/firestore';
import EventCard from '../../components/EventCard';
import SignupButton from '../../components/SignupButton';
import Spinner from '../../components/Spinner';
import { isPast } from '../../lib/format';

export default function ChapterEvents() {
  const { state, chapterId } = useParams();
  const { profile } = useAuth();
  const [chapter, setChapter] = useState(null);
  const [events, setEvents] = useState(null);
  const [signedUpMap, setSignedUpMap] = useState({});

  useEffect(() => {
    getChapter(chapterId).then(setChapter);
    const unsubscribe = subscribeToChapterEvents(chapterId, setEvents);
    return unsubscribe;
  }, [chapterId]);

  useEffect(() => {
    if (!events) return;
    events.forEach((ev) => {
      isSignedUp(ev.id, profile.uid).then((signedUp) =>
          setSignedUpMap((prev) => ({ ...prev, [ev.id]: signedUp }))
      );
    });
  }, [events, profile.uid]);

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
                    <EventCard
                        event={ev}
                        footer={
                          <SignupButton
                              eventId={ev.id}
                              chapterId={chapterId}
                              initialSignedUp={signedUpMap[ev.id] || false}
                              stopPropagation
                              onChange={(signedUp) => setSignedUpMap((prev) => ({ ...prev, [ev.id]: signedUp }))}
                          />
                        }
                    />
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
                    <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </details>
        )}
      </div>
  );
}