import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp,
  writeBatch, increment, documentId, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';

// ---------- Chapters ----------

export async function getStatesWithChapters() {
  const snap = await getDocs(collection(db, 'chapters'));
  const states = new Set(snap.docs.map((d) => d.data().state));
  return [...states].sort();
}

export async function getChaptersByState(state) {
  const q = query(collection(db, 'chapters'), where('state', '==', state));
  const snap = await getDocs(q);
  return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getChapter(chapterId) {
  const snap = await getDoc(doc(db, 'chapters', chapterId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getChaptersByIds(chapterIds) {
  if (!chapterIds || chapterIds.length === 0) return [];
  const q = query(collection(db, 'chapters'), where(documentId(), 'in', chapterIds.slice(0, 30)));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setChapterFavorite(uid, chapterId, favorited) {
  await updateDoc(doc(db, 'users', uid), {
    favoriteChapterIds: favorited ? arrayUnion(chapterId) : arrayRemove(chapterId),
  });
}

// ---------- Events ----------

export function toTimestamp(dateStr, timeStr) {
  return Timestamp.fromDate(new Date(`${dateStr}T${timeStr}`));
}

export async function createEvent({
                                    chapterId, title, description, location, dateTime, endDateTime, volunteersNeeded, createdBy,
                                  }) {
  return addDoc(collection(db, 'events'), {
    chapterId,
    title,
    description,
    location,
    dateTime,
    endDateTime,
    volunteersNeeded: Number(volunteersNeeded) || 1,
    signupCount: 0,
    // Quota tracking is locked in by the finalizeEventQuotas Cloud
    // Function shortly after each event's end time passes -- see
    // functions/index.js. firestore.rules prevents anyone else from
    // setting these three fields, so they're a trustworthy historical
    // record rather than something a chapter lead could self-report.
    quotaFinalized: false,
    quotaMet: null,
    finalSignupCount: null,
    createdBy,
    createdAt: serverTimestamp(),
  });
}

/** Updates an event, and keeps every signed-up volunteer's "My events"
 *  snapshot (users/{uid}/myEvents/{eventId}) in sync with whatever
 *  changed, in the same batch. This is why edits never go stale on a
 *  volunteer's My Events list. */
export async function updateEvent(eventId, data) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'events', eventId), data);

  const denormFields = {};
  ['title', 'description', 'location', 'dateTime', 'endDateTime', 'volunteersNeeded'].forEach((key) => {
    if (key in data) denormFields[key] = data[key];
  });
  if (Object.keys(denormFields).length > 0) {
    const signupsSnap = await getDocs(collection(db, 'events', eventId, 'signups'));
    signupsSnap.docs.forEach((signupDoc) => {
      batch.update(doc(db, 'users', signupDoc.id, 'myEvents', eventId), denormFields);
    });
  }

  await batch.commit();
}

/** Deletes an event, every signup doc under it, and every volunteer's
 *  denormalized copy of it -- Firestore never cascade-deletes any of
 *  this on its own. */
export async function deleteEvent(eventId) {
  const signupsSnap = await getDocs(collection(db, 'events', eventId, 'signups'));
  const batch = writeBatch(db);
  signupsSnap.docs.forEach((d) => {
    batch.delete(d.ref);
    batch.delete(doc(db, 'users', d.id, 'myEvents', eventId));
  });
  batch.delete(doc(db, 'events', eventId));
  await batch.commit();
}

export async function getEvent(eventId) {
  const snap = await getDoc(doc(db, 'events', eventId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getEventsByChapter(chapterId) {
  const q = query(collection(db, 'events'), where('chapterId', '==', chapterId));
  const snap = await getDocs(q);
  return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
}

export function subscribeToChapterEvents(chapterId, callback) {
  const q = query(collection(db, 'events'), where('chapterId', '==', chapterId));
  return onSnapshot(q, (snap) => {
    const events = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
    callback(events);
  });
}

/** Locks in a permanent quotaMet/finalSignupCount verdict for any of
 *  this chapter's past events that haven't been finalized yet.
 *
 *  There's no server-side scheduled job for this (the app runs on
 *  Firebase's free Spark plan, which doesn't support Cloud Functions) --
 *  instead, a chapter admin's own browser runs this whenever they view
 *  their events (see AdminDashboard.jsx / Analytics.jsx). That's safe to
 *  trust despite coming from a client because firestore.rules
 *  independently verifies every value being written is actually correct
 *  and that the flip only ever happens once -- see the "3. Quota
 *  finalization" branch of the events update rule. Filters client-side
 *  off the existing per-chapter fetch rather than a second compound
 *  query, so no extra index is needed. */
export async function finalizeChapterQuotas(chapterId) {
  const events = await getEventsByChapter(chapterId);
  const now = Date.now();
  const due = events.filter(
      (ev) => !ev.quotaFinalized && ev.endDateTime && ev.endDateTime.toMillis() <= now
  );
  if (due.length === 0) return;

  const batch = writeBatch(db);
  due.forEach((ev) => {
    const finalSignupCount = ev.signupCount || 0;
    batch.update(doc(db, 'events', ev.id), {
      quotaFinalized: true,
      finalSignupCount,
      quotaMet: finalSignupCount >= ev.volunteersNeeded,
    });
  });
  await batch.commit();
}

// ---------- Signups ----------
//
// Every sign-up writes to three places in one atomic batch:
//   1. events/{id}/signups/{uid}      -- the actual roster entry
//   2. events/{id}.signupCount        -- the denormalized progress counter
//   3. users/{uid}/myEvents/{id}      -- a copy of the event, owned by the
//                                         volunteer, so "My events" is a
//                                         single cheap read on their own
//                                         data instead of a cross-chapter
//                                         collection-group query.

export async function signUpForEvent({ event, uid, name, email }) {
  const batch = writeBatch(db);

  batch.set(doc(db, 'events', event.id, 'signups', uid), {
    uid,
    name,
    email,
    eventId: event.id,
    chapterId: event.chapterId,
    signedUpAt: serverTimestamp(),
  });

  batch.update(doc(db, 'events', event.id), { signupCount: increment(1) });

  batch.set(doc(db, 'users', uid, 'myEvents', event.id), {
    eventId: event.id,
    chapterId: event.chapterId,
    title: event.title,
    description: event.description || '',
    location: event.location || '',
    dateTime: event.dateTime,
    endDateTime: event.endDateTime,
    volunteersNeeded: event.volunteersNeeded,
    signedUpAt: serverTimestamp(),
  });

  await batch.commit();
}

export async function cancelSignup(eventId, uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'events', eventId, 'signups', uid));
  batch.update(doc(db, 'events', eventId), { signupCount: increment(-1) });
  batch.delete(doc(db, 'users', uid, 'myEvents', eventId));
  await batch.commit();
}

export async function isSignedUp(eventId, uid) {
  const snap = await getDoc(doc(db, 'events', eventId, 'signups', uid));
  return snap.exists();
}

/** Live roster for an event's admin view. Admin-only (see firestore.rules). */
export function subscribeToRoster(eventId, callback) {
  const q = query(collection(db, 'events', eventId, 'signups'), orderBy('signedUpAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** All events a volunteer has signed up for -- a single read of their own
 *  users/{uid}/myEvents subcollection. No cross-collection query, no
 *  index, no per-event follow-up reads. */
export async function getMyEvents(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'myEvents'));
  return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
}