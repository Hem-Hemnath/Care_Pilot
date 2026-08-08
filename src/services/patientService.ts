import type { PatientRecord } from '../types'

const PATIENTS_KEY = 'cp_patients_data'
const ACTIVE_PATIENT_KEY = 'cp_active_patient_id'

const SEED_PATIENTS: PatientRecord[] = [
  {
    id: 'pat_mother_68',
    name: 'Meenakshi Ammal (Mother)',
    age: 68,
    conditions: ['Type 2 Diabetes', 'Hypertension', 'Mild Osteoarthritis'],
    caregiverIds: ['cg_lakshmi_101'],
    userId: 'pt_mother_202',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pat_father_72',
    name: 'Ramanan (Father)',
    age: 72,
    conditions: ['Hypertension', 'High Cholesterol'],
    caregiverIds: ['cg_lakshmi_101'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function getPatients(): PatientRecord[] {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(SEED_PATIENTS))
  return SEED_PATIENTS
}

export function savePatients(patients: PatientRecord[]): void {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients))
}

export function getPatientById(patientId: string): PatientRecord | null {
  const patients = getPatients()
  return patients.find((p) => p.id === patientId) || null
}

export function getPatientsForCaregiver(caregiverId: string): PatientRecord[] {
  const patients = getPatients()
  return patients.filter((p) => p.caregiverIds.includes(caregiverId) || p.caregiverIds.length === 0)
}

export function getActivePatientId(): string {
  const saved = localStorage.getItem(ACTIVE_PATIENT_KEY)
  if (saved) return saved
  const patients = getPatients()
  const firstId = patients[0]?.id || 'pat_mother_68'
  localStorage.setItem(ACTIVE_PATIENT_KEY, firstId)
  return firstId
}

export function setActivePatientId(id: string): void {
  localStorage.setItem(ACTIVE_PATIENT_KEY, id)
}

export function addPatientRecord(record: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt'>): PatientRecord {
  const patients = getPatients()
  const newPatient: PatientRecord = {
    ...record,
    id: `pat_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  patients.push(newPatient)
  savePatients(patients)
  setActivePatientId(newPatient.id)
  return newPatient
}
