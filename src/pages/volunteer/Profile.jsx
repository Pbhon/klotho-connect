import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyEvents } from '../../lib/firestore';
import { formatEventDateTime, eventDurationHours, formatHours, isPast } from '../../lib/format';
import Spinner from '../../components/Spinner';

export default function Profile() {
    const { profile } = useAuth();
    const [events, setEvents] = useState(null);
    const [error, setError] = useState('');

    function load() {
        setError('');
        setEvents(null);
        getMyEvents(profile.uid)
            .then(setEvents)
            .catch(() => setError('Couldn\u2019t load your events.'));
    }

    useEffect(load, [profile.uid]);

    if (error) {
        return (
            <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-5 py-14 text-center">
                <p className="text-ink-soft">{error}</p>
                <button
                    onClick={load}
                    className="rounded-full border border-sand-dark px-5 py-2 text-sm font-semibold text-ink-soft hover:border-plum hover:text-plum"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (events === null) return <Spinner label="Loading your profile…" />;

    const pastEvents = events
        .filter((ev) => isPast(ev.dateTime))
        .sort((a, b) => b.dateTime.toMillis() - a.dateTime.toMillis());

    const totalHours = pastEvents.reduce(
        (sum, ev) => sum + eventDurationHours(ev.dateTime, ev.endDateTime),
        0
    );

    return (
        <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10">
            <h1 className="font-display text-3xl font-semibold text-ink">Your profile</h1>

            <div className="mt-6 rounded-card border border-sand-dark bg-paper p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-ink-soft">Name</p>
                        <p className="mt-0.5 font-medium text-ink">{profile.name}</p>
                    </div>
                    <div>
                        <p className="text-ink-soft">Email</p>
                        <p className="mt-0.5 font-medium text-ink">{profile.email}</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-card border border-gold-dark/40 bg-gold-light/20 p-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-gold-dark">Total volunteer time</p>
                <p className="mt-1 font-display text-4xl font-semibold text-ink">{formatHours(totalHours)}</p>
                <p className="mt-1 text-sm text-ink-soft">
                    across {pastEvents.length} past event{pastEvents.length === 1 ? '' : 's'}
                </p>
            </div>

            <h2 className="mt-9 font-display text-xl font-semibold text-ink">Past events</h2>
            {pastEvents.length === 0 ? (
                <p className="mt-4 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
                    Nothing here yet -- once you attend your first event it'll show up here.
                </p>
            ) : (
                <ul className="mt-4 flex flex-col gap-3">
                    {pastEvents.map((ev) => {
                        const hours = eventDurationHours(ev.dateTime, ev.endDateTime);
                        return (
                            <li key={ev.id} className="flex items-center justify-between rounded-card border border-sand-dark bg-paper p-4">
                                <div>
                                    <p className="font-display font-semibold text-ink">{ev.title}</p>
                                    <p className="text-sm text-plum">{formatEventDateTime(ev.dateTime, ev.endDateTime)}</p>
                                </div>
                                <span className="shrink-0 text-sm font-medium text-ink-soft">
                  {hours > 0 ? formatHours(hours) : '\u2013'}
                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}