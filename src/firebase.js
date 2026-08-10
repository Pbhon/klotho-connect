// Firebase initialization.
//
// This is the ONLY place API keys are read from. They come from your
// .env file (copy .env.example to .env and fill in the values from your
// Firebase project settings -> General -> "Your apps" -> SDK setup and
// configuration). Nothing else in this app needs to change.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fails loudly in the console instead of a confusing blank screen.
  console.error(
    'Firebase config is missing. Copy .env.example to .env and fill in ' +
    'your Firebase project keys, then restart the dev server.'
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
