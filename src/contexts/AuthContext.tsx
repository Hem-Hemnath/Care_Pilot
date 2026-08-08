import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserProfile, PatientRecord, UserRole } from '../types'
import { getCurrentUser, loginUser, signupUser, logoutUser } from '../services/authService'
import {
  getPatientsForCaregiver,
  getActivePatientId,
  setActivePatientId as saveActivePatientId,
  getPatientById,
} from '../services/patientService'

interface AuthContextValue {
  user: UserProfile | null
  role: UserRole
  activePatient: PatientRecord | null
  patients: PatientRecord[]
  setActivePatient: (patientId: string) => void
  login: (email: string, role: UserRole) => Promise<UserProfile>
  signup: (name: string, email: string, role: UserRole) => Promise<UserProfile>
  logout: () => void
  refreshPatients: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getCurrentUser())
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [activePatient, setActivePatientState] = useState<PatientRecord | null>(null)

  const loadPatientData = useCallback((currentUser: UserProfile | null) => {
    if (!currentUser) {
      setPatients([])
      setActivePatientState(null)
      return
    }
    const caregiverPatients = getPatientsForCaregiver(currentUser.id)
    setPatients(caregiverPatients)

    let currentId = getActivePatientId()
    let currentPatient = getPatientById(currentId)

    if (!currentPatient && caregiverPatients.length > 0) {
      currentPatient = caregiverPatients[0]
      currentId = currentPatient.id
      saveActivePatientId(currentId)
    }
    setActivePatientState(currentPatient || null)
  }, [])

  useEffect(() => {
    loadPatientData(user)
  }, [user, loadPatientData])

  const setActivePatient = useCallback((patientId: string) => {
    saveActivePatientId(patientId)
    const found = getPatientById(patientId)
    setActivePatientState(found || null)
  }, [])

  const handleLogin = useCallback(async (email: string, role: UserRole) => {
    const logged = await loginUser(email, role)
    setUser(logged)
    loadPatientData(logged)
    return logged
  }, [loadPatientData])

  const handleSignup = useCallback(async (name: string, email: string, role: UserRole) => {
    const signed = await signupUser(name, email, role)
    setUser(signed)
    loadPatientData(signed)
    return signed
  }, [loadPatientData])

  const handleLogout = useCallback(() => {
    logoutUser()
    setUser(null)
    setPatients([])
    setActivePatientState(null)
  }, [])

  const refreshPatients = useCallback(() => {
    loadPatientData(user)
  }, [user, loadPatientData])

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'caregiver',
        activePatient,
        patients,
        setActivePatient,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        refreshPatients,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
