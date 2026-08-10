import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, setDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp,
  collectionGroup, writeBatch, getCountFromServer,
} from 'firebase/firestore';
import { db } from '../firebase';

// ---------- Chapters ----------

/** Unique, sorted list of states that currently have at least one chapter.
 *  Used for the volunteer-facing state picker so nobody lands on an empty
 *  state. (Admin signup uses the full US_STATES list instead, since it's
 *  creating a chapter that doesn't necessarily exist yet.) */
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

// ---------- Events ----------

/** Combines a date + time input pair into a Firestore Timestamp. */
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
    reminderSent: false,
    createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function updateEvent(eventId, data) {
  await updateDoc(doc(db, 'events', eventId), data);
}

/** Deletes an event and every signup doc under it, since Firestore never
 *  cascade-deletes subcollections on its own. */
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

/** One-time fetch, sorted soonest-first client-side (keeps this query
 *  index-free -- no composite index to deploy for a per-chapter list). */
export async function getEventsByChapter(chapterId) {
  const q = query(collection(db, 'events'), where('chapterId', '==', chapterId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
}

/** Live subscription variant, used on the chapter events page so a new
 *  event (or a cancelled one) appears without a refresh. */
export function subscribeToChapterEvents(chapterId, callback) {
  const q = query(collection(db, 'events'), where('chapterId', '==', chapterId));
  return onSnapshot(q, (snap) => {
    const events = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.dateTime.toMillis() - b.dateTime.toMillis());
    callback(events);
  });
}

export async function getSignupCount(eventId) {
  const snap = await getCountFromServer(collection(db, 'events', eventId, 'signups'));
  return snap.data().count;
}

// ---------- Signups ----------

export async function signUpForEvent({ eventId, chapterId, uid, name, email }) {
  await setDoc(doc(db, 'events', eventId, 'signups', uid), {
    uid,
    name,
    email,
    eventId,
    chapterId,
    signedUpAt: serverTimestamp(),
  });
}

export async function cancelSignup(eventId, uid) {
  await deleteDoc(doc(db, 'events', eventId, 'signups', uid));
}

export async function isSignedUp(eventId, uid) {
  const snap = await getDoc(doc(db, 'events', eventId, 'signups', uid));
  return snap.exists();
}

/** Live roster for an event's admin view -- name, email, and signup time
 *  for everyone currently signed up. */
export function subscribeToRoster(eventId, callback) {
  const q = query(collection(db, 'events', eventId, 'signups'), orderBy('signedUpAt', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** All events a volunteer has signed up for, newest-event-first. Uses a
 *  collection-group query across every events/*\/signups subcollection --
 *  see firestore.indexes.json for the index this needs. */
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
