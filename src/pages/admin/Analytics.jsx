import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEventsByChapter, finalizeChapterQuotas } from '../../lib/firestore';
import { formatEventDateTime, eventDurationHours, formatHours, isPast } from '../../lib/format';
import QuotaChart from '../../components/QuotaChart';
import Spinner from '../../components/Spinner';

export default function Analytics() {
    const { profile } = useAuth();
    const [events, setEvents] = useState(null);
    const [error, setError] = useState('');

    function load() {
        setError('');
        setEvents(null);
        finalizeChapterQuotas(profile.chapterId)
            .catch(() => {
                // Best-effort -- if this fails, the fetch below still shows
                // whatever was already finalized, and it'll retry next visit.
            })
            .finally(() => {
                getEventsByChapter(profile.chapterId)
                    .then(setEvents)
                    .catch(() => setError('Couldn\u2019t load your chapter\u2019s history.'));
            });
    }

    useEffect(load, [profile.chapterId]);

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

    if (events === null) return <Spinner label="Crunching your chapter\u2019s numbers…" />;

    const pastEvents = events
        .filter((ev) => isPast(ev.dateTime))
        .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());

    const finalizedEvents = pastEvents.filter((ev) => ev.quotaFinalized);
    const quotaMetCount = finalizedEvents.filter((ev) => ev.quotaMet).length;
    const quotaMetRate = finalizedEvents.length > 0
        ? Math.round((quotaMetCount / finalizedEvents.length) * 100)
        : null;

    const totalHours = pastEvents.reduce((sum, ev) => {
        const count = ev.finalSignupCount ?? ev.signupCount ?? 0;
        return sum + eventDurationHours(ev.dateTime, ev.endDateTime) * count;
    }, 0);

    return (
        <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-dark">Chapter analytics</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Past events</h1>

            {/* Totals */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard label="Events held" value={pastEvents.length} />
                <StatCard
                    label="Quota met"
                    value={quotaMetRate === null ? '\u2013' : `${quotaMetRate}%`}
                    hint={finalizedEvents.length > 0 ? `${quotaMetCount} of ${finalizedEvents.length} finalized events` : 'No finalized events yet'}
                />
                <StatCard label="Volunteer hours given" value={formatHours(totalHours)} />
            </div>

            {/* Chart */}
            {finalizedEvents.length > 0 && (
                <div className="mt-6">
                    <h2 className="mb-3 font-display text-lg font-semibold text-ink">Goal fill rate by event</h2>
                    <QuotaChart events={finalizedEvents} />
                </div>
            )}

            {/* Table */}
            <h2 className="mt-9 font-display text-lg font-semibold text-ink">All past events</h2>
            {pastEvents.length === 0 ? (
                <p className="mt-4 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
                    Nothing here yet -- once an event's date passes, it'll show up here.
                </p>
            ) : (
                <div className="mt-4 overflow-x-auto rounded-card border border-sand-dark bg-paper">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                        <tr className="border-b border-sand text-xs uppercase tracking-wide text-ink-soft">
                            <th className="px-4 py-3 font-semibold">Event</th>
                            <th className="px-4 py-3 font-semibold">When</th>
                            <th className="px-4 py-3 font-semibold">Signups / goal</th>
                            <th className="px-4 py-3 font-semibold">Quota</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-sand">
                        {[...pastEvents].reverse().map((ev) => {
                            const count = ev.finalSignupCount ?? ev.signupCount ?? 0;
                            return (
                                <tr key={ev.id}>
                                    <td className="px-4 py-3 font-medium text-ink">{ev.title}</td>
                                    <td className="px-4 py-3 text-ink-soft">{formatEventDateTime(ev.dateTime, ev.endDateTime)}</td>
                                    <td className="px-4 py-3 text-ink-soft">{count} / {ev.volunteersNeeded}</td>
                                    <td className="px-4 py-3">
                                        {!ev.quotaFinalized ? (
                                            <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-ink-soft">Pending</span>
                                        ) : ev.quotaMet ? (
                                            <span className="rounded-full bg-sage-light px-2.5 py-1 text-xs font-medium text-sage">Met</span>
                                        ) : (
                                            <span className="rounded-full bg-rust-light px-2.5 py-1 text-xs font-medium text-rust">Not met</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="mt-3 text-xs text-ink-soft">
                Quota status locks in permanently about a day after each event ends -- events that finished more
                recently than that show as "Pending" until then.
            </p>
        </div>
    );
}

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-card border border-sand-dark bg-paper p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{label}</p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">{value}</p>
            {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
        </div>
    );
}