import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'gymflow-917db',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.appId)

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

export function getFirebase() {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured – fill in .env.local')
  if (!app) {
    app = initializeApp(config)
    // Offline-first: gyms often have poor reception, writes sync once the connection is back.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
    auth = getAuth(app)
    // Analytics is optional and unavailable in some browsers (e.g. with tracking protection);
    // loaded lazily so it never delays the first render.
    if (config.measurementId) {
      const firebaseApp = app
      void import('firebase/analytics')
        .then(async ({ getAnalytics, isSupported }) => (await isSupported()) && getAnalytics(firebaseApp))
        .catch(() => {})
    }
  }
  return { app, db: db!, auth: auth! }
}
