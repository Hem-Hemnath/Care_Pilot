import type { CabinetMedicine } from '../types'

const CABINET_PREFIX = 'cp_cabinet_'

const SEED_MEDICINES: Record<string, CabinetMedicine[]> = {
  pat_mother_68: [
    {
      id: 'med_metformin_500',
      patientId: 'pat_mother_68',
      name: 'Metformin Hydrochloride',
      generic: 'Metformin',
      strength: '500 mg',
      dose: '1 Tablet',
      frequency: 'Twice Daily',
      times: ['08:00 AM', '08:00 PM'],
      imageUrl: '',
      expiresOn: '2027-04-15',
      stock: 45,
      notes: 'Take with or immediately after meals to reduce stomach discomfort.',
      source: 'prescription',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'med_telmisartan_40',
      patientId: 'pat_mother_68',
      name: 'Telmisartan',
      generic: 'Telmisartan',
      strength: '40 mg',
      dose: '1 Tablet',
      frequency: 'Once Daily',
      times: ['08:00 AM'],
      imageUrl: '',
      expiresOn: '2026-11-20',
      stock: 18,
      notes: 'Take in the morning with water.',
      source: 'scanner',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'med_atorvastatin_10',
      patientId: 'pat_mother_68',
      name: 'Atorvastatin Calcium',
      generic: 'Atorvastatin',
      strength: '10 mg',
      dose: '1 Tablet',
      frequency: 'Once Daily',
      times: ['09:00 PM'],
      imageUrl: '',
      expiresOn: '2027-01-10',
      stock: 30,
      notes: 'Take at night before sleep.',
      source: 'prescription',
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
}

export function getPatientMedicines(patientId: string): CabinetMedicine[] {
  try {
    const key = `${CABINET_PREFIX}${patientId}`
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }

  const seed = SEED_MEDICINES[patientId] || []
  localStorage.setItem(`${CABINET_PREFIX}${patientId}`, JSON.stringify(seed))
  return seed
}

export function savePatientMedicines(patientId: string, medicines: CabinetMedicine[]): void {
  localStorage.setItem(`${CABINET_PREFIX}${patientId}`, JSON.stringify(medicines))
}

export function addMedicineToCabinet(
  patientId: string,
  medicine: Omit<CabinetMedicine, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>
): CabinetMedicine {
  const list = getPatientMedicines(patientId)
  const newMed: CabinetMedicine = {
    ...medicine,
    id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    patientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const updated = [newMed, ...list]
  savePatientMedicines(patientId, updated)
  return newMed
}

export function updateCabinetMedicine(patientId: string, medicine: CabinetMedicine): CabinetMedicine {
  const list = getPatientMedicines(patientId)
  const idx = list.findIndex((m) => m.id === medicine.id)
  if (idx !== -1) {
    list[idx] = { ...medicine, updatedAt: new Date().toISOString() }
    savePatientMedicines(patientId, list)
  }
  return medicine
}

export function removeCabinetMedicine(patientId: string, medicineId: string): void {
  const list = getPatientMedicines(patientId)
  const updated = list.filter((m) => m.id !== medicineId)
  savePatientMedicines(patientId, updated)
}

export function logDoseTaken(patientId: string, medicineId: string): CabinetMedicine | null {
  const list = getPatientMedicines(patientId)
  const med = list.find((m) => m.id === medicineId)
  if (med && med.stock > 0) {
    med.stock -= 1
    med.updatedAt = new Date().toISOString()
    savePatientMedicines(patientId, list)
    return med
  }
  return null
}
