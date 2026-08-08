import type { CabinetMedicine, MedicineRecord } from '../types'
import { findMedicineByName } from '../dataset/medicineService'

export function cabinetMedicineToMedicineRecord(cabinetMed: CabinetMedicine): MedicineRecord {
  // 1. Try exact or partial lookup from local Medicine Knowledge Library dataset
  const match = findMedicineByName(cabinetMed.name) || findMedicineByName(cabinetMed.generic)
  if (match) return match

  // 2. Safely adapt CabinetMedicine into MedicineRecord using available fields
  return {
    id: cabinetMed.id,
    medicineName: cabinetMed.name,
    composition: cabinetMed.generic || 'Not specified',
    uses: cabinetMed.notes || 'As prescribed by physician',
    sideEffects: 'Consult physician or pharmacist for detailed side effects.',
    imageUrl: cabinetMed.imageUrl || '',
    manufacturer: 'Verified Cabinet Entry',
    excellentReviewPct: null,
    averageReviewPct: null,
    poorReviewPct: null,
  }
}
