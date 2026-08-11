import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getChaptersByState, setChapterFavorite } from '../../lib/firestore';
import StarButton from '../../components/StarButton';
import Spinner from '../../components/Spinner';

export default function BrowseChapters() {
    const { state } = useParams();
    const { profile, refreshProfile } = useAuth();
    const [chapters, setChapters] = useState(null);
    const [favorites, setFavorites] = useState(new Set(profile.favoriteChapterIds || []));

    useEffect(() => {
        setChapters(null);
        getChaptersByState(state).then(setChapters);
    }, [state]);

    useEffect(() => {
        setFavorites(new Set(profile.favoriteChapterIds || []));
    }, [profile.favoriteChapterIds]);

    async function toggleFavorite(chapterId, currentlyFavorited) {
        setFavorites((prev) => {
            const next = new Set(prev);
            if (currentlyFavorited) next.delete(chapterId); else next.add(chapterId);
            return next;
        });
        await setChapterFavorite(profile.uid, chapterId, !currentlyFavorited);
        await refreshProfile();
    }

    if (chapters === null) return <Spinner label={`Finding chapters in ${state}…`} />;

    return (
        <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
            <Link to="/volunteer" className="text-sm font-medium text-ink-soft hover:text-plum">&larr; All states</Link>
            <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-gold-dark">Step 2 of 3</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Chapters in {state}</h1>
            <p className="mt-1.5 text-sm text-ink-soft">Star a chapter to pin it to your home screen.</p>

            {chapters.length === 0 ? (
                <p className="mt-8 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
                    No chapters found in {state}.
                </p>
            ) : (
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {chapters.map((c) => (
                        <div key={c.id} className="relative">
                            <Link
                                to={`/volunteer/${encodeURIComponent(state)}/${c.id}`}
                                className="block rounded-card border border-sand-dark bg-paper p-5 pr-12 transition hover:border-plum"
                            >
                                <h3 className="font-display text-lg font-semibold text-ink">{c.name}</h3>
                                <p className="mt-1 text-sm text-ink-soft">{state}</p>
                                <span className="mt-3 inline-block text-sm font-semibold text-plum">See events &rarr;</span>
                            </Link>
                            <StarButton
                                starred={favorites.has(c.id)}
                                onToggle={() => toggleFavorite(c.id, favorites.has(c.id))}
                                className="absolute right-4 top-4"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}