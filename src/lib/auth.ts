import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  GoogleAuthProvider, browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword,
  setPersistence, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
} from 'firebase/auth'
import { uid } from './format'
import { auth, firebaseEnabled } from './firebase'

interface Account {
  id: string
  name: string
  phone: string // numéro normalisé (chiffres seuls)
  salt: string
  hash: string
}

const useAccounts = create<{ accounts: Account[]; add: (a: Account) => void }>()(
  persist((set) => ({ accounts: [], add: (a) => set((s) => ({ accounts: [...s.accounts, a] })) }), { name: 'komerce-accounts-v2' }),
)

export const normPhone = (v: string) => {
  let d = v.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('225') && d.length > 10) d = d.slice(3)
  return d
}
export const isPhone = (v: string) => {
  const d = normPhone(v)
  return d.length >= 8 && d.length <= 15
}

const enc = (s: string) => new TextEncoder().encode(s)
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')

/** PBKDF2 quand le navigateur l'autorise ; repli simple hors contexte sécurisé (http sur le réseau local). */
async function hashPassword(password: string, salt: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    const key = await subtle.importKey('raw', enc(password), 'PBKDF2', false, ['deriveBits'])
    return hex(await subtle.deriveBits({ name: 'PBKDF2', salt: enc(salt), iterations: 100_000, hash: 'SHA-256' }, key, 256))
  }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (const ch of salt + password) {
    const c = ch.charCodeAt(0)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 'f' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

export type AuthResult = { ok: true; id: string; name: string } | { ok: false; error: string }

async function localSignUp(input: { name: string; phone: string; password: string }): Promise<AuthResult> {
  const { name, password } = input
  if (!name.trim()) return { ok: false, error: 'Indiquez votre nom.' }
  if (!isPhone(input.phone)) return { ok: false, error: 'Numéro de téléphone invalide.' }
  if (password.length < 6) return { ok: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' }
  const phone = normPhone(input.phone)
  if (useAccounts.getState().accounts.some((a) => a.phone === phone)) return { ok: false, error: 'Un compte existe déjà avec ce numéro.' }
  const salt = uid() + uid()
  const acc: Account = { id: uid(), name: name.trim(), phone, salt, hash: await hashPassword(password, salt) }
  useAccounts.getState().add(acc)
  return { ok: true, id: acc.id, name: acc.name }
}

async function localSignIn(input: { phone: string; password: string }): Promise<AuthResult> {
  const phone = normPhone(input.phone)
  const acc = useAccounts.getState().accounts.find((a) => a.phone === phone)
  if (!acc) return { ok: false, error: 'Aucun compte trouvé avec ce numéro. Créez-en un.' }
  if ((await hashPassword(input.password, acc.salt)) !== acc.hash) return { ok: false, error: 'Mot de passe incorrect.' }
  return { ok: true, id: acc.id, name: acc.name }
}

/* ---------- Firebase : le numéro devient un identifiant (adresse interne), avec mot de passe ---------- */

const emailOf = (phone: string) => `${normPhone(phone)}@phone.komerce.app`

const firebaseError = (e: unknown): string => {
  const code = (e as { code?: string })?.code ?? ''
  if (code === 'auth/email-already-in-use') return 'Un compte existe déjà avec ce numéro.'
  if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password', 'auth/invalid-login-credentials'].includes(code))
    return 'Numéro ou mot de passe incorrect.'
  if (code === 'auth/weak-password') return 'Mot de passe trop faible (6 caractères minimum).'
  if (code === 'auth/network-request-failed') return 'Pas de connexion internet.'
  if (code === 'auth/too-many-requests') return 'Trop de tentatives. Réessayez dans quelques minutes.'
  if (code === 'auth/operation-not-allowed') return "Ce mode de connexion n'est pas activé dans la console Firebase."
  if (code === 'auth/unauthorized-domain') return "Ce domaine n'est pas autorisé dans Firebase (Authentication > Paramètres)."
  return 'Connexion impossible. Réessayez.'
}

async function persistFor(remember: boolean) {
  await setPersistence(auth!, remember ? browserLocalPersistence : browserSessionPersistence)
}

async function cloudSignUp(input: { name: string; phone: string; password: string }, remember: boolean): Promise<AuthResult> {
  if (!input.name.trim()) return { ok: false, error: 'Indiquez votre nom.' }
  if (!isPhone(input.phone)) return { ok: false, error: 'Numéro de téléphone invalide.' }
  if (input.password.length < 6) return { ok: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' }
  try {
    await persistFor(remember)
    const cred = await createUserWithEmailAndPassword(auth!, emailOf(input.phone), input.password)
    await updateProfile(cred.user, { displayName: input.name.trim() })
    return { ok: true, id: cred.user.uid, name: input.name.trim() }
  } catch (e) {
    return { ok: false, error: firebaseError(e) }
  }
}

async function cloudSignIn(input: { phone: string; password: string }, remember: boolean): Promise<AuthResult> {
  if (!isPhone(input.phone)) return { ok: false, error: 'Numéro de téléphone invalide.' }
  try {
    await persistFor(remember)
    const cred = await signInWithEmailAndPassword(auth!, emailOf(input.phone), input.password)
    return { ok: true, id: cred.user.uid, name: cred.user.displayName || 'Utilisateur' }
  } catch (e) {
    return { ok: false, error: firebaseError(e) }
  }
}

/** Connexion Google (Firebase uniquement). Une erreur vide signifie « fenêtre fermée par l'utilisateur ». */
export async function signInWithGoogle(remember = true): Promise<AuthResult> {
  if (!firebaseEnabled) return { ok: false, error: 'La connexion Google nécessite Firebase.' }
  try {
    await persistFor(remember)
    const cred = await signInWithPopup(auth!, new GoogleAuthProvider())
    return { ok: true, id: cred.user.uid, name: cred.user.displayName || 'Utilisateur' }
  } catch (e) {
    const code = (e as { code?: string })?.code ?? ''
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return { ok: false, error: '' }
    return { ok: false, error: firebaseError(e) }
  }
}

export const signUp = (input: { name: string; phone: string; password: string }, remember = true) =>
  firebaseEnabled ? cloudSignUp(input, remember) : localSignUp(input)

export const signIn = (input: { phone: string; password: string }, remember = true) =>
  firebaseEnabled ? cloudSignIn(input, remember) : localSignIn(input)

export async function signOutUser() {
  if (firebaseEnabled) await signOut(auth!)
}
