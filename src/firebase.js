// Firebase project for this app — lets every device (phone, tablet,
// desktop) read and write the SAME data instead of each device having its
// own separate localStorage copy.
//
// The apiKey below is not a secret the way a server password is — it's
// meant to be public in web apps. What actually controls access is the
// Firestore security rules set in the Firebase console (see README.md for
// the rules used here). Don't add anything more sensitive than this to
// this file.
import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyA1yn-jdhn_288VCTZ-nJREypDw9QA1IZ4',
  authDomain: 'kids-activity-tracker-78387.firebaseapp.com',
  projectId: 'kids-activity-tracker-78387',
  storageBucket: 'kids-activity-tracker-78387.firebasestorage.app',
  messagingSenderId: '545252221412',
  appId: '1:545252221412:web:3abce6b88b35c88ff027f1',
  measurementId: 'G-Z0BX5VSHRR',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Best-effort offline cache so the app still works (read-only, from the
// last-synced snapshot) with no internet, and queues writes to send once
// back online. Safe to ignore failures (e.g. private/incognito mode, or
// another tab already holding the persistence lock).
try {
  enableIndexedDbPersistence(db).catch(() => {})
} catch (e) {
  // Ignore — falls back to Firestore's default in-memory cache.
}
