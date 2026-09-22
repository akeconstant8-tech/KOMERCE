import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Vrai quand `.env.local` contient la configuration Firebase. Sinon l'application reste en mode local. */
export const firebaseEnabled = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)

const app = firebaseEnabled ? initializeApp(cfg) : null

export const auth = app ? getAuth(app) : null

// Cache local persistant : l'application continue de fonctionner hors connexion et se resynchronise ensuite.
export const db = app
  ? initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : null
