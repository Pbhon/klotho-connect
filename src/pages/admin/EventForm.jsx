import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createEvent, updateEvent, getEvent, toTimestamp } from '../../lib/firestore';
import { toDateTimeInputs } from '../../lib/format';
import Spinner from '../../components/Spinner';

export default function EventForm({ mode }) {
  const { profile } = useAuth();
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [volunteersNeeded, setVolunteersNeeded] = useState(4);

  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode !== 'edit') return;
    getEvent(eventId).then((ev) => {
      if (!ev || ev.chapterId !== profile.chapterId) {
        navigate('/admin', { replace: true });
        return;
      }
      setTitle(ev.title);
      setDescription(ev.description || '');
      setLocation(ev.location || '');
      setVolunteersNeeded(ev.volunteersNeeded);
      const { date: d, time: t } = toDateTimeInputs(ev.dateTime);
      setDate(d);
      setTime(t);
      setLoading(false);
    });
  }, [mode, eventId, profile.chapterId, navigate]);

  if (loading) return <Spinner label="Loading event…" />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!date || !time) return setError('Pick a date and time.');
    if (Number(volunteersNeeded) < 1) return setError('You need at least 1 volunteer.');

    setSubmitting(true);
    try {
      const dateTime = toTimestamp(date, time);
      if (mode === 'create') {
        await createEvent({
          chapterId: profile.chapterId,
          title,
          description,
          location,
          dateTime,
          volunteersNeeded,
          createdBy: profile.uid,
        });
      } else {
        await updateEvent(eventId, { title, description, location, dateTime, volunteersNeeded: Number(volunteersNeeded) });
      }
      navigate('/admin');
    } catch {
      setError('Something went wrong saving this event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
      <Link to="/admin" className="text-sm font-medium text-ink-soft hover:text-plum">&larr; Dashboard</Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
        {mode === 'create' ? 'Create an event' : 'Edit event'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Title</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Game night at Willow Creek Senior Living"
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Description</span>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will volunteers be doing? Anything they should bring or know beforehand?"
            className="input resize-none"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Location</span>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="123 Maple St, Columbus, OH"
            className="input"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Date</span>
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Time</span>
            <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Volunteers needed</span>
          <input
            required
            type="number"
            min={1}
            value={volunteersNeeded}
            onChange={(e) => setVolunteersNeeded(e.target.value)}
            className="input"
          />
          <span className="text-xs text-ink-soft">
            This is a goal, not a cap \u2014 people can keep signing up after it's reached.
          </span>
        </label>

        {error && (
          <p className="rounded-lg bg-rust-light px-3.5 py-2.5 text-sm text-rust" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-plum py-3 text-sm font-semibold text-paper transition hover:bg-plum-dark disabled:opacity-60"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Post event' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
