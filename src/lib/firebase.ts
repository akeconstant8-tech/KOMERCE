import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Variables VITE_* lues au moment du build (Vite les fige dans le bundle : à définir AVANT le déploiement). */
const ENV_NAMES: Record<keyof typeof cfg, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}
export const missingFirebaseEnv = (Object.keys(cfg) as (keyof typeof cfg)[]).filter((k) => !cfg[k]).map((k) => ENV_NAMES[k])

/** Vrai quand la configuration Firebase est présente dans le build. Sinon l'application reste en mode local. */
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

/* ---------- Diagnostic (TEMPORAIRE) : à retirer une fois la connexion Google validée en production ---------- */
// Ne journalise que des booléens et des noms de variables, jamais les valeurs de configuration.
console.info('[KOMERCE][diag] Firebase', {
  'variables VITE_* manquantes': missingFirebaseEnv.length ? missingFirebaseEnv : 'aucune',
  'Firebase App initialisé': Boolean(app),
  'Firebase Auth disponible': Boolean(auth),
  'GoogleAuthProvider disponible': typeof GoogleAuthProvider === 'function',
  'authDomain configuré': Boolean(cfg.authDomain),
  'origine de la page': typeof location !== 'undefined' ? location.origin : 'n/a',
})
if (!firebaseEnabled) {
  console.error(
    '[KOMERCE][diag] Firebase désactivé : variables absentes du build →',
    missingFirebaseEnv.join(', '),
    '\nSur Vercel : Project → Settings → Environment Variables, puis Redeploy (les variables VITE_* sont lues au build).',
  )
}
