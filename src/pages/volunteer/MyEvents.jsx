import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyEvents } from '../../lib/firestore';
import { formatEventDateTime, isPast } from '../../lib/format';
import SignupButton from '../../components/SignupButton';
import Spinner from '../../components/Spinner';

export default function MyEvents() {
    const { profile } = useAuth();
    const [events, setEvents] = useState(null);

    useEffect(() => {
        getMyEvents(profile.uid).then(setEvents);
    }, [profile.uid]);

    if (events === null) return <Spinner label="Loading your events…" />;

    function handleCancelled(eventId) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
    }

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
                        <li key={ev.id} className="rounded-card border border-sand-dark bg-paper p-4">
                            <div className="flex items-start justify-between gap-4">
                                <Link to={`/volunteer/event/${ev.id}`} className="flex-1">
                                    <p className="font-display font-semibold text-ink hover:text-plum">{ev.title}</p>
                                    <p className="text-sm text-plum">{formatEventDateTime(ev.dateTime)}</p>
                                    {ev.location && <p className="text-sm text-ink-soft">{ev.location}</p>}
                                </Link>
                                <SignupButton
                                    eventId={ev.id}
                                    chapterId={ev.chapterId}
                                    initialSignedUp
                                    onChange={(signedUp) => !signedUp && handleCancelled(ev.id)}
                                    className="w-36 shrink-0"
                                />
                            </div>
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