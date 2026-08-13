/** Formats a Firestore Timestamp as "Sat, Aug 15 · 2:00 PM", or as a
 *  range "Sat, Aug 15 · 2:00–4:00 PM" when an end timestamp is given. */
export function formatEventDateTime(start, end) {
  if (!start?.toDate) return '';
  const startDate = start.toDate();
  const datePart = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!end?.toDate) return `${datePart} \u00B7 ${startTime}`;
  const endTime = end.toDate().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} \u00B7 ${startTime}\u2013${endTime}`;
}

export function isPast(timestamp) {
  if (!timestamp?.toDate) return false;
  return timestamp.toDate().getTime() < Date.now();
}

/** Splits a Timestamp back into <input type="date"> / <input type="time">
 *  values, for pre-filling the edit-event form. */
export function toDateTimeInputs(timestamp) {
  if (!timestamp?.toDate) return { date: '', time: '' };
  const d = timestamp.toDate();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

/** Hours (can be fractional, e.g. 2.5) between an event's start and end
 *  Timestamps. Returns 0 if either is missing -- older events created
 *  before end times existed just don't contribute hours until edited. */
export function eventDurationHours(start, end) {
  if (!start?.toDate || !end?.toDate) return 0;
  const ms = end.toDate().getTime() - start.toDate().getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

/** "2.5 hours" / "1 hour" / "45 min" -- formats a decimal hour count for
 *  display, rounding to the nearest quarter-hour. */
/** "2 hours 30 min" / "1 hour" / "45 min" -- formats a decimal hour
 *  count as whole hours + minutes, rounded to the nearest minute. */
export function formatHours(totalHours) {
  const totalMinutes = Math.round(totalHours * 60);
  if (totalMinutes <= 0) return '0 min';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  const hourPart = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  if (minutes === 0) return hourPart;
  return `${hourPart} ${minutes} min`;
}