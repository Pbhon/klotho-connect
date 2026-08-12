// Sign-up / sign-in logic.
//
// Volunteer sign-up is a single write. Admin (chapter lead) sign-up is a
// gated, multi-step write: the chapter-lead code is checked *server-side*
// by firestore.rules against the literal value in that file -- it is never
// shipped in the JS bundle and never stored anywhere the client can read
// back. See firestore.rules for where to set/change the code.
//
// Both signUpVolunteer and signUpAdmin return the exact profile they just
// wrote to Firestore, so callers can set it into AuthContext directly
// instead of re-fetching it -- re-fetching immediately after signup is
// racy, since Firebase Auth's onAuthStateChanged listener fires the
// instant the account is created, before these Firestore writes finish.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
  updateProfile,
} from 'firebase/auth';
import {
  doc, setDoc, updateDoc, getDoc, deleteDoc, addDoc, collection, serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export class AdminCodeError extends Error {}

/** Deletes a freshly-created auth user if a later signup step fails, so we
 *  never leave an orphaned auth-only account behind. */
async function rollbackAuthUser(user) {
  await deleteUser(user).catch(() => {
    // If this fails (e.g. token already stale) there's nothing more we can
    // do client-side; the account is harmless without a users/ profile,
    // since every protected route and rule requires that profile to exist.
  });
}

export async function signUpVolunteer({ name, email, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = { uid: cred.user.uid, name, email, role: 'volunteer' };
  try {
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role: 'volunteer',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    await rollbackAuthUser(cred.user);
    throw err;
  }
  return { user: cred.user, profile };
}

/**
 * @param {object} params
 * @param {string} params.code - the chapter-lead signup code
 * @param {string} params.state
 * @param {string} [params.chapterId] - set when joining an existing chapter
 * @param {string} [params.newChapterName] - set when creating a new chapter
 */
export async function signUpAdmin({
                                    name, email, password, code, state, chapterId, newChapterName,
                                  }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // Step 1: prove they know the code. This write is only allowed by
  // firestore.rules when `code` matches the value set there, and the
  // resulting document can never be read back by anyone (including the
  // person who wrote it) -- only its *existence* is checked later.
  try {
    await setDoc(doc(db, 'adminVerifications', uid), {
      code,
      verifiedAt: serverTimestamp(),
    });
  } catch {
    await rollbackAuthUser(cred.user);
    throw new AdminCodeError('That chapter-lead signup code isn\u2019t correct.');
  }

  // Step 2: create a brand-new chapter, or join an existing one as a
  // second/successor lead.
  let finalChapterId = chapterId || null;
  try {
    if (!finalChapterId) {
      const ref = await addDoc(collection(db, 'chapters'), {
        name: newChapterName.trim(),
        state,
        adminIds: [uid],
        createdBy: uid,
        createdAt: serverTimestamp(),
      });
      finalChapterId = ref.id;
    } else {
      await updateDoc(doc(db, 'chapters', finalChapterId), {
        adminIds: arrayUnion(uid),
      });
    }
  } catch (err) {
    await rollbackAuthUser(cred.user);
    throw err;
  }

  // Step 3: create the profile that the rest of the app reads the role from.
  try {
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      role: 'admin',
      chapterId: finalChapterId,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    await deleteDoc(doc(db, 'adminVerifications', uid)).catch(() => {});
    await rollbackAuthUser(cred.user);
    throw err;
  }

  // Step 4: the code credential is single-use -- remove it now that it's
  // done its job, so it can't later be replayed to claim a different
  // chapter. (firestore.rules also time-bounds it to 1 hour as a
  // backstop in case this delete doesn't go through.)
  await deleteDoc(doc(db, 'adminVerifications', uid)).catch(() => {});

  const profile = { uid, name, email, role: 'admin', chapterId: finalChapterId };
  return { user: cred.user, profile };
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}