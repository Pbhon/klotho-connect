import { Link } from 'react-router-dom';
import ThreadMark from '../components/ThreadMark';

const steps = [
  {
    n: '01',
    title: 'Pick your state',
    body: 'Klotho chapters are popping up across the country. Start with where you are.',
  },
  {
    n: '02',
    title: 'Find a chapter',
    body: 'Every chapter runs its own visits, game nights, and outings — browse what\u2019s nearby.',
  },
  {
    n: '03',
    title: 'Show up',
    body: 'Sign up for an event in one tap. Your chapter lead will know you\u2019re coming.',
  },
];

export default function Home() {
  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sand">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sand-dark bg-paper-dim px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-plum">
              <ThreadMark className="h-4 w-4" />
              The Klotho Foundation
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl md:text-6xl">
              One thread,<br />two generations.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              Klotho Connect is where local chapters post visits, game nights, and
              outings with seniors — and where volunteers find one worth showing
              up for.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="rounded-full bg-plum px-6 py-3 text-sm font-semibold text-paper shadow-sm transition hover:bg-plum-dark"
              >
                Find an event to join
              </Link>
              <Link
                to="/signup"
                className="rounded-full border border-sand-dark bg-white/40 px-6 py-3 text-sm font-semibold text-ink transition hover:border-plum hover:text-plum"
              >
                I lead a chapter
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center py-6">
            <ThreadMark className="h-56 w-56 md:h-72 md:w-72" animate />
          </div>
        </div>
      </section>

      {/* How it works — a genuine sequence, so numbered steps earn their keep */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Getting to your first visit
        </h2>
        <div className="relative mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
          <svg
            className="pointer-events-none absolute left-0 right-0 top-6 hidden w-full md:block"
            height="4"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="16%" y1="2" x2="84%" y2="2" stroke="#D8CBAE" strokeWidth="2" strokeDasharray="1 10" strokeLinecap="round" />
          </svg>
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-sand-dark bg-paper font-display text-lg font-semibold text-plum">
                {s.n}
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dual path */}
      <section className="border-y border-sand bg-paper-dim/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-2 md:py-20">
          <div className="rounded-card border border-sand-dark bg-paper p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-dark">Volunteers</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
              Spend an afternoon with someone who has time for you.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Browse chapters by state, see what each one has planned, and sign up
              for whatever fits your week. No minimum commitment.
            </p>
            <Link
              to="/signup"
              className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-dark hover:text-paper"
            >
              Create a volunteer account
            </Link>
          </div>

          <div className="rounded-card border border-sand-dark bg-paper p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-plum">Chapter leads</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
              Post the visit. Watch your roster fill in.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              Set a date, describe the visit, and say how many hands you need.
              You'll get an email the day before with who's coming.
            </p>
            <Link
              to="/signup"
              className="mt-5 inline-block rounded-full border border-plum px-5 py-2.5 text-sm font-semibold text-plum transition hover:bg-plum hover:text-paper"
            >
              Register your chapter
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center md:py-20">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Why the thread matters
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Klotho started with a simple idea: growing older shouldn't mean growing
          quieter. Chapters across the country pair students and young volunteers
          with seniors nearby for conversation, music, games, and company —
          small, regular visits that add up to real relationships on both ends.
        </p>
      </section>
    </div>
  );
}
