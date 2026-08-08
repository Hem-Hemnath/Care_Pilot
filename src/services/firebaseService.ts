import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore'
import type { UserProfile, UserRole, PatientRecord, CabinetMedicine } from '../types'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

export function isFirebaseConfigured(): boolean {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId)
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  }
  return app
}

export function getFirebaseAuth(): Auth | null {
  const fApp = getFirebaseApp()
  if (!fApp) return null
  if (!authInstance) authInstance = getAuth(fApp)
  return authInstance
}

export function getFirebaseDb(): Firestore | null {
  const fApp = getFirebaseApp()
  if (!fApp) return null
  if (!dbInstance) dbInstance = getFirestore(fApp)
  return dbInstance
}

export const auth = isFirebaseConfigured() ? getFirebaseAuth() : null
export const db = isFirebaseConfigured() ? getFirebaseDb() : null

// Helper to save Firestore user document (users/{uid})
export async function saveUserDoc(profile: UserProfile): Promise<void> {
  const firestore = getFirebaseDb()
  if (!firestore) return
  const userRef = doc(firestore, 'users', profile.id)
  await setDoc(
    userRef,
    {
      uid: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    },
    { merge: true }
  )
}

// Helper to fetch Firestore user document (users/{uid})
export async function getUserDoc(uid: string): Promise<UserProfile | null> {
  const firestore = getFirebaseDb()
  if (!firestore) return null
  try {
    const userRef = doc(firestore, 'users', uid)
    const snap = await getDoc(userRef)
    if (snap.exists()) {
      const data = snap.data()
      return {
        id: data.uid || uid,
        name: data.name || 'User',
        email: data.email || '',
        role: (data.role as UserRole) || 'caregiver',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

// Helper to save Patient Document (patients/{patientId})
export async function savePatientDoc(patient: PatientRecord): Promise<void> {
  const firestore = getFirebaseDb()
  if (!firestore) return
  const pRef = doc(firestore, 'patients', patient.id)
  await setDoc(pRef, patient, { merge: true })
}

// Helper to save Patient Cabinet Medicine (patients/{patientId}/medicines/{medicineId})
export async function saveCabinetMedicineDoc(patientId: string, medicine: CabinetMedicine): Promise<void> {
  const firestore = getFirebaseDb()
  if (!firestore) return
  const mRef = doc(firestore, 'patients', patientId, 'medicines', medicine.id)
  await setDoc(mRef, medicine, { merge: true })
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSendPasswordResetEmail,
  firebaseSignOut,
  firebaseOnAuthStateChanged,
}

