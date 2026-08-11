import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp,
  collectionGroup, writeBatch, increment, documentId, arrayUnion, arrayRemove,
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

/** Fetches multiple chapters by id in one query (used for the "starred
 *  chapters" shortcut list). Firestore's `in` operator caps at 30 ids,
 *  which a personal favorites list should never come close to. */
export async function getChaptersByIds(chapterIds) {
  if (!chapterIds || chapterIds.length === 0) return [];
  const q = query(collection(db, 'chapters'), where(documentId(), 'in', chapterIds.slice(0, 30)));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Star / unstar a chapter on the current volunteer's profile. */
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
                                    chapterId, title, description, location, dateTime, volunteersNeeded, createdBy,
                                  }) {
  return addDoc(collection(db, 'events'), {
    chapterId,
    title,
    description,
    location,
    dateTime,
    volunteersNeeded: Number(volunteersNeeded) || 1,
    signupCount: 0,
    reminderSent: false,
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function updateEvent(eventId, data) {
  await updateDoc(doc(db, 'events', eventId), data);
}

export async function deleteEvent(eventId) {
  const signupsSnap = await getDocs(collection(db, 'events', eventId, 'signups'));
  const batch = writeBatch(db);
  signupsSnap.docs.forEach((d) => batch.delete(d.ref));
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

// ---------- Signups ----------
//
// events/{id}.signupCount is a denormalized counter kept in sync with the
// signups subcollection by the two functions below (both write it in the
// same atomic batch as the signup doc itself). Every card/list reads this
// field directly off the already-public event doc instead of separately
// querying or counting the signups subcollection -- that subcollection is
// restricted to "yourself, or the chapter admin," and a bare count query
// with no owner-scoping isn't something Firestore rules can prove is safe.

export async function signUpForEvent({ eventId, chapterId, uid, name, email }) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'events', eventId, 'signups', uid), {
    uid,
    name,
    email,
    eventId,
    chapterId,
    signedUpAt: serverTimestamp(),
  });
  batch.update(doc(db, 'events', eventId), { signupCount: increment(1) });
  await batch.commit();
}

export async function cancelSignup(eventId, uid) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'events', eventId, 'signups', uid));
  batch.update(doc(db, 'events', eventId), { signupCount: increment(-1) });
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

/** All events a volunteer has signed up for. Scoped by the `uid` *field*
 *  (not the doc id) so Firestore can prove the query only touches the
 *  caller's own signup docs -- see firestore.rules. */
export async function getMyEvents(uid) {
  const q = query(collectionGroup(db, 'signups'), where('uid', '==', uid));
  const signupsSnap = await getDocs(q);
  const events = await Promise.all(
      signupsSnap.docs.map(async (signupDoc) => {
        const eventId = signupDoc.data().eventId;
        const eventSnap = await getDoc(doc(db, 'events', eventId));
        return eventSnap.exists() ? { id: eventSnap.id, ...eventSnap.data() } : null;
      })
  );
  return events
      .filter(Boolean)
      .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
}