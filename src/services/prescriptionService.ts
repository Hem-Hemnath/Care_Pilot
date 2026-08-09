import { getGeminiClient } from '../config/apiConfig'
import type { ExtractedPrescriptionMedicine } from '../types'

const MODEL_NAME = 'gemini-2.5-flash'
const TIMEOUT_MS = 20000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Prescription scan timed out. Please try again.')), ms)
  )
  return Promise.race([promise, timeout])
}

export async function scanPrescriptionImage(imageBase64: string): Promise<{
  medicines: ExtractedPrescriptionMedicine[]
  rawText?: string
  error?: string
}> {
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `You are an expert medical prescription reading assistant.
Examine this prescription image closely (printed or handwritten).
Extract all prescribed medicines listed in the document.

Return ONLY a valid JSON object in this format (no markdown, no backticks):
{
  "medicines": [
    {
      "name": "Exact Brand or Generic Name",
      "strength": "e.g. 500 mg or 10 mg",
      "dose": "e.g. 1 Tablet or 5 ml",
      "frequency": "e.g. Twice Daily or Once Daily",
      "timing": ["Morning", "Night"],
      "duration": "e.g. 5 days or 1 month",
      "confidence": 0.95
    }
  ]
}

Rules:
1. Extract medicine name, strength, dose, frequency, timings, and duration accurately. If fuzzy or unclear, output best estimated match instead of failing.
2. Set confidence between 0.0 and 1.0 depending on text clarity.
3. If handwriting is unreadable or no medicines are found, return {"medicines": []}.`

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
      return { medicines: [], error: 'Could not parse structured prescription output.' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    const medicines: ExtractedPrescriptionMedicine[] = (parsed.medicines || []).map((m: Record<string, unknown>) => ({
      name: String(m.name || 'Unknown Medicine'),
      strength: String(m.strength || ''),
      dose: String(m.dose || '1 Tablet'),
      frequency: String(m.frequency || 'Once Daily'),
      timing: Array.isArray(m.timing) ? m.timing.map(String) : ['Morning'],
      duration: String(m.duration || ''),
      confidence: typeof m.confidence === 'number' ? m.confidence : 0.8,
    }))

    if (medicines.length === 0) {
      return {
        medicines: [],
        error: 'Could not reliably read this prescription. Please upload a clearer image or manually enter medicine details.',
      }
    }

    return { medicines, rawText: text }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { medicines: [], error: `Prescription scan error: ${msg}` }
  }
}
