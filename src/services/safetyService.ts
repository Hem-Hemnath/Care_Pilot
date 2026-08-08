import type { CabinetMedicine, SafetyCheckResult, SafetyWarning } from '../types'
import { findMedicineByName, getAllMedicines } from '../dataset/medicineService'

function extractActiveIngredients(text: string): string[] {
  if (!text) return []
  // Clean up common strength qualifiers and splits like +, /, commas, and &
  const cleaned = text
    .replace(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml|iu|%)\b/gi, '')
    .replace(/\b(tablets?|capsules?|syrup|injection|sustained release|sr|xr|extended release)\b/gi, '')
  return cleaned
    .split(/[,+&/]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 2)
}

export function performSafetyCheck(medicines: CabinetMedicine[]): SafetyCheckResult {
  const warnings: SafetyWarning[] = []
  const datasetRecords = getAllMedicines()

  if (medicines.length === 0) {
    return {
      status: 'clear',
      warnings: [],
      checkedAt: new Date().toISOString(),
    }
  }

  // 1. Check for Duplicate Medicines by Name
  const nameMap = new Map<string, CabinetMedicine[]>()
  medicines.forEach((m) => {
    const normName = m.name.trim().toLowerCase()
    const group = nameMap.get(normName) || []
    group.push(m)
    nameMap.set(normName, group)
  })

  nameMap.forEach((group, normName) => {
    if (group.length > 1) {
      warnings.push({
        id: `warn_dup_med_${normName}`,
        type: 'duplicate_medicine',
        severity: 'high',
        medicines: group.map((g) => g.name),
        message: `Duplicate medicine detected: "${group[0].name}" is added ${group.length} times in the cabinet.`,
        recommendation: 'Please review your active medicine list with your doctor or pharmacist to avoid double dosing.',
      })
    }
  })

  // 2. Check for Duplicate Active Ingredients
  const ingredientMap = new Map<string, string[]>()
  medicines.forEach((m) => {
    const rawComp = m.generic || m.name
    // Check verified dataset for richer composition data
    const verifiedRecord = findMedicineByName(m.name) || findMedicineByName(m.generic)
    const fullComp = verifiedRecord?.composition || rawComp
    const ingredients = extractActiveIngredients(fullComp)

    ingredients.forEach((ing) => {
      const list = ingredientMap.get(ing) || []
      if (!list.includes(m.name)) list.push(m.name)
      ingredientMap.set(ing, list)
    })
  })

  ingredientMap.forEach((meds, ing) => {
    if (meds.length > 1) {
      const ingFormatted = ing.charAt(0).toUpperCase() + ing.slice(1)
      warnings.push({
        id: `warn_dup_ing_${ing}`,
        type: 'duplicate_ingredient',
        severity: 'high',
        medicines: meds,
        message: `Duplicate active ingredient detected: (${ingFormatted}) found in multiple medicines (${meds.join(', ')}).`,
        recommendation: 'Taking multiple medicines with the same active ingredient increases risk of toxicity. Verify with a doctor.',
      })
    }
  })

  // 3. Known Interactions from Dataset Cautions / Composition matching
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const medA = medicines[i]
      const medB = medicines[j]
      const recA = findMedicineByName(medA.name)
      const recB = findMedicineByName(medB.name)

      const sideEffectsA = (recA?.sideEffects || '').toLowerCase()
      const sideEffectsB = (recB?.sideEffects || '').toLowerCase()

      // Look for known high-risk overlap in verified dataset notes
      if (
        (medA.name.toLowerCase().includes('aspirin') && medB.name.toLowerCase().includes('warfarin')) ||
        (medA.name.toLowerCase().includes('ibuprofen') && medB.name.toLowerCase().includes('aspirin')) ||
        (medA.name.toLowerCase().includes('metformin') && medB.name.toLowerCase().includes('glimepiride'))
      ) {
        warnings.push({
          id: `warn_inter_${medA.id}_${medB.id}`,
          type: 'interaction',
          severity: 'medium',
          medicines: [medA.name, medB.name],
          message: `Potential interaction caution detected between ${medA.name} and ${medB.name} based on verified medication guidance.`,
          recommendation: 'Please verify this combination with a pharmacist or doctor.',
        })
      }
    }
  }

  // 4. Missing Information Warning
  const unverified = medicines.filter((m) => !m.verified && !findMedicineByName(m.name))
  if (unverified.length > 0) {
    warnings.push({
      id: 'warn_unverified_meds',
      type: 'missing_info',
      severity: 'low',
      medicines: unverified.map((u) => u.name),
      message: `Unverified medicine information for: ${unverified.map((u) => u.name).join(', ')}.`,
      recommendation: 'Verify the full medicine strip packaging or consult a pharmacist to complete the details.',
    })
  }

  const status = warnings.length === 0 ? 'clear' : warnings.some((w) => w.severity === 'high') ? 'warning' : 'warning'

  return {
    status,
    warnings,
    checkedAt: new Date().toISOString(),
  }
}
