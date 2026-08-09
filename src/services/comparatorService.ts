import { getGeminiClient } from '../config/apiConfig'
import type { StripComparisonResult } from '../types'

const MODEL_NAME = 'gemini-2.5-flash'
const TIMEOUT_MS = 15000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Strip comparison timed out.')), ms)
  )
  return Promise.race([promise, timeout])
}

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export async function compareStripWithPrescription(
  stripImageBase64: string,
  prescriptionMedicine: string,
  prescriptionStrength: string
): Promise<StripComparisonResult> {
  const base64Data = stripImageBase64.includes(',') ? stripImageBase64.split(',')[1] : stripImageBase64
  const mimeType = stripImageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `You are an expert medicine verification assistant comparing a medicine strip photo against a prescription entry.

Target Prescription Entry:
- Medicine Name: "${prescriptionMedicine}"
- Prescribed Strength: "${prescriptionStrength}"

Examine the medicine strip photo carefully. Extract the brand/generic name and dosage strength printed on the foil, blister, box, or tablet label.

Respond in exact JSON format (no markdown):
{
  "detectedMedicine": "Name printed on strip",
  "detectedStrength": "Strength printed on strip",
  "confidence": "high" or "medium" or "low"
}`

    const result = await withTimeout(
      model.generateContent([
        prompt,
        {
          inlineData: { mimeType, data: base64Data },
        },
      ]),
      TIMEOUT_MS
    )

    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        status: 'UNKNOWN',
        prescriptionMedicine,
        prescriptionStrength,
        detectedMedicine: 'Unreadable',
        detectedStrength: 'Unreadable',
        nameMatch: false,
        strengthMatch: false,
        message: 'Could not read text on the medicine strip packaging clearly.',
        confidence: 'low',
      }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const detName = String(parsed.detectedMedicine || '').trim()
    const detStrength = String(parsed.detectedStrength || '').trim()
    const confidence = (parsed.confidence as 'high' | 'medium' | 'low') || 'medium'

    if (!detName || detName.toLowerCase() === 'unreadable') {
      return {
        status: 'UNKNOWN',
        prescriptionMedicine,
        prescriptionStrength,
        detectedMedicine: detName || 'Not detected',
        detectedStrength: detStrength || 'Not detected',
        nameMatch: false,
        strengthMatch: false,
        message: 'The information detected on the medicine strip is unclear. Please check the strip visually or consult a pharmacist.',
        confidence: 'low',
      }
    }

    const targetNormName = normalizeStr(prescriptionMedicine)
    const detNormName = normalizeStr(detName)
    const nameMatch = targetNormName.includes(detNormName) || detNormName.includes(targetNormName)

    const targetNormStr = normalizeStr(prescriptionStrength)
    const detNormStr = normalizeStr(detStrength)
    const strengthMatch = !targetNormStr || !detNormStr || targetNormStr === detNormStr || targetNormStr.includes(detNormStr) || detNormStr.includes(targetNormStr)

    if (nameMatch && strengthMatch) {
      return {
        status: 'MATCH',
        prescriptionMedicine,
        prescriptionStrength,
        detectedMedicine: detName,
        detectedStrength: detStrength,
        nameMatch: true,
        strengthMatch: true,
        message: 'Medicine name and strength match the prescription details.',
        confidence,
      }
    }

    return {
      status: 'MISMATCH',
      prescriptionMedicine,
      prescriptionStrength,
      detectedMedicine: detName,
      detectedStrength: detStrength,
      nameMatch,
      strengthMatch,
      message: 'The information detected on the medicine strip does not appear to match the prescription. Please verify with a pharmacist or doctor before using.',
      confidence,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      status: 'UNKNOWN',
      prescriptionMedicine,
      prescriptionStrength,
      detectedMedicine: 'Error',
      detectedStrength: 'Error',
      nameMatch: false,
      strengthMatch: false,
      message: `Comparison service error: ${msg}`,
      confidence: 'low',
    }
  }
}
