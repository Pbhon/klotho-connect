/** Formats a Firestore Timestamp as "Sat, Aug 15 · 2:00 PM". */
export function formatEventDateTime(timestamp) {
  if (!timestamp?.toDate) return '';
  const date = timestamp.toDate();
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} \u00B7 ${timePart}`;
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
