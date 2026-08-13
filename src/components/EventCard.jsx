import { formatEventDateTime, isPast } from '../lib/format';

export default function EventCard({ event, footer }) {
    const past = isPast(event.dateTime);
    const signupCount = event.signupCount ?? 0;
    const goalMet = signupCount >= event.volunteersNeeded;

    return (
        <div className={`rounded-card border border-sand-dark bg-paper p-5 ${past ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold leading-snug text-ink">{event.title}</h3>
                {past && (
                    <span className="shrink-0 rounded-full bg-sand px-2.5 py-1 text-xs font-medium text-ink-soft">Past</span>
                )}
            </div>

            <p className="mt-1.5 text-sm font-medium text-plum">{formatEventDateTime(event.dateTime, event.endDateTime)}</p>
            {event.location && <p className="text-sm text-ink-soft">{event.location}</p>}

            {event.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">{event.description}</p>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                    <div
                        className={`h-full rounded-full ${goalMet ? 'bg-sage' : 'bg-gold'}`}
                        style={{ width: `${Math.min(100, (signupCount / Math.max(1, event.volunteersNeeded)) * 100)}%` }}
                    />
                </div>
                <span className={`shrink-0 font-medium ${goalMet ? 'text-sage' : 'text-ink-soft'}`}>
          {signupCount} of {event.volunteersNeeded}{goalMet ? ' \u2713' : ''}
        </span>
            </div>

            {footer && <div className="mt-4">{footer}</div>}
        </div>
    );
}