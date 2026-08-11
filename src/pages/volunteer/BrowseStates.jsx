import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStatesWithChapters, getChaptersByIds } from '../../lib/firestore';
import Spinner from '../../components/Spinner';

export default function BrowseStates() {
    const { profile } = useAuth();
    const [states, setStates] = useState(null);
    const [starred, setStarred] = useState(null);

    useEffect(() => {
        getStatesWithChapters().then(setStates);
    }, []);

    useEffect(() => {
        getChaptersByIds(profile.favoriteChapterIds || []).then(setStarred);
    }, [profile.favoriteChapterIds]);

    if (states === null) return <Spinner label="Finding chapters…" />;

    return (
        <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
            {starred && starred.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gold-dark">Starred Chapters</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {starred.map((c) => (
                            <Link
                                key={c.id}
                                to={`/volunteer/${encodeURIComponent(c.state)}/${c.id}`}
                                className="rounded-card border border-gold-dark/40 bg-gold-light/20 px-4 py-3.5 text-center transition hover:border-gold-dark"
                            >
                                <p className="text-sm font-semibold text-ink">{c.name}</p>
                                <p className="text-xs text-ink-soft">{c.state}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-sm font-semibold uppercase tracking-wide text-gold-dark">Step 1 of 3</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Choose a state</h1>
            <p className="mt-1.5 text-ink-soft">Find a Klotho chapter near you.</p>

            {states.length === 0 ? (
                <div className="mt-8 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
                    No chapters have been registered yet. Check back soon!
                </div>
            ) : (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {states.map((s) => (
                        <Link
                            key={s}
                            to={`/volunteer/${encodeURIComponent(s)}`}
                            className="rounded-card border border-sand-dark bg-paper px-4 py-3.5 text-center text-sm font-medium text-ink transition hover:border-plum hover:text-plum"
                        >
                            {s}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}