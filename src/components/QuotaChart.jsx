/** events: finalized past events, most-recent-last, each with
 *  finalSignupCount / volunteersNeeded / quotaMet already set. */
export default function QuotaChart({ events }) {
    if (events.length === 0) return null;

    return (
        <div className="rounded-card border border-sand-dark bg-paper p-6">
            <div className="flex items-end gap-2 overflow-x-auto pb-1">
                {events.map((ev) => {
                    const count = ev.finalSignupCount ?? 0;
                    const pct = Math.min(100, (count / Math.max(1, ev.volunteersNeeded)) * 100);
                    return (
                        <div key={ev.id} className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                            <div className="flex h-36 w-full items-end" title={`${ev.title}: ${count} of ${ev.volunteersNeeded}`}>
                                <div
                                    className={`w-full rounded-t-md transition-all ${ev.quotaMet ? 'bg-sage' : 'bg-gold'}`}
                                    style={{ height: `${Math.max(4, pct)}%` }}
                                />
                            </div>
                            <span className="w-full truncate text-center text-[10px] text-ink-soft">
                {ev.dateTime.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 flex items-center gap-4 border-t border-sand pt-3 text-xs text-ink-soft">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sage" /> Goal met</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gold" /> Below goal</span>
            </div>
        </div>
    );
}