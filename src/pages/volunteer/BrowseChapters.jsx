import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getChaptersByState } from '../../lib/firestore';
import Spinner from '../../components/Spinner';

export default function BrowseChapters() {
  const { state } = useParams();
  const [chapters, setChapters] = useState(null);

  useEffect(() => {
    setChapters(null);
    getChaptersByState(state).then(setChapters);
  }, [state]);

  if (chapters === null) return <Spinner label={`Finding chapters in ${state}…`} />;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
      <Link to="/volunteer" className="text-sm font-medium text-ink-soft hover:text-plum">&larr; All states</Link>
      <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-gold-dark">Step 2 of 3</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Chapters in {state}</h1>

      {chapters.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-sand-dark p-8 text-center text-ink-soft">
          No chapters found in {state}.
        </p>
      ) : (
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {chapters.map((c) => (
            <Link
              key={c.id}
              to={`/volunteer/${encodeURIComponent(state)}/${c.id}`}
              className="rounded-card border border-sand-dark bg-paper p-5 transition hover:border-plum"
            >
              <h3 className="font-display text-lg font-semibold text-ink">{c.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{state}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-plum">See events &rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
