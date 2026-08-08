import type { UserProfile, UserRole } from '../types'
import { saveUserDoc } from './firebaseService'

const AUTH_KEY = 'cp_active_user'
const USERS_KEY = 'cp_registered_users'

const SEED_USERS: UserProfile[] = [
  {
    id: 'cg_lakshmi_101',
    name: 'Lakshmi Narayanan',
    email: 'lakshmi@carepilot.org',
    role: 'caregiver',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pt_mother_202',
    name: 'Meenakshi Ammal (Mother)',
    email: 'meenakshi@carepilot.org',
    role: 'patient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function getRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
  return SEED_USERS
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const defaultUser = SEED_USERS[0]
  localStorage.setItem(AUTH_KEY, JSON.stringify(defaultUser))
  return defaultUser
}

export function setCurrentUserSession(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_KEY)
  }
}

export async function loginUser(email: string, role: UserRole): Promise<UserProfile> {
  const users = getRegisteredUsers()
  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    const name = email.split('@')[0]
    user = {
      id: `user_${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    users.push(user)
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } else if (user.role !== role) {
    user.role = role
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
  setCurrentUserSession(user)
  await saveUserDoc(user)
  return user
}

export async function signupUser(name: string, email: string, role: UserRole): Promise<UserProfile> {
  const users = getRegisteredUsers()
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) {
    existing.name = name
    existing.role = role
    existing.updatedAt = new Date().toISOString()
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    setCurrentUserSession(existing)
    await saveUserDoc(existing)
    return existing
  }
  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  setCurrentUserSession(newUser)
  await saveUserDoc(newUser)
  return newUser
}

export function logoutUser(): void {
  setCurrentUserSession(null)
}

