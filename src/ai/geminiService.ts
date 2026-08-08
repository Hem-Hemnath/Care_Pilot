import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MedicineRecord, AnalysisResult } from '../types'
import { findMedicineByName } from '../dataset/medicineService'
import { getLangInstruction } from '../utils/languageDetect'
import type { Language } from '../types'

const API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  (typeof process !== 'undefined'
    ? process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    : '') || ''

const MODEL_NAME = 'gemini-2.5-flash'
const TIMEOUT_MS = 15000

function getClient() {
  if (!API_KEY) throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY or GEMINI_API_KEY to your .env file.')
  return new GoogleGenerativeAI(API_KEY)
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
  )
  return Promise.race([promise, timeout])
}

export async function identifyMedicineFromImage(imageBase64: string): Promise<AnalysisResult> {
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64
  const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `You are an expert medical OCR assistant. Analyze this medicine image (strip, label, box, or prescription). Extract whatever medicine name, dosage, or active ingredient is legible. If fuzzy, return your best estimated match with a list of missing details instead of throwing a confidence error.

Respond in this exact JSON format (no markdown):
{
  "medicine_name": "extracted name or best estimated match",
  "dosage": "strength or dosage if visible (e.g. 500mg)",
  "confidence": "HIGH" or "MEDIUM" or "LOW",
  "notes": "explanation or list of missing details"
}`

    const result = await withTimeout(
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ]),
      TIMEOUT_MS
    )

    const text = result.response.text().trim()
    let parsed: { medicine_name?: string; medicineName?: string; dosage?: string; confidence?: string; notes?: string; reasoning?: string }

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)
    } catch {
      return { medicine: null, confidence: 'unknown', source: 'none', error: 'Could not parse AI response' }
    }

    const extractedName = (parsed.medicine_name || parsed.medicineName || '').trim()
    const dosage = (parsed.dosage || '').trim()
    const rawConfidence = (parsed.confidence || 'MEDIUM').toUpperCase()
    const notes = parsed.notes || parsed.reasoning || ''

    if (!extractedName) {
      return { medicine: null, confidence: 'unknown', source: 'none', error: 'No medicine text could be detected in image' }
    }

    // Search local dataset first
    const datasetMatch = findMedicineByName(extractedName)
    if (datasetMatch) {
      return { medicine: datasetMatch, confidence: 'high', source: 'dataset' }
    }

    // Map confidence string
    const mappedConfidence: 'high' | 'medium' | 'low' =
      rawConfidence === 'HIGH' ? 'high' : rawConfidence === 'LOW' ? 'low' : 'medium'

    // Return AI extracted result with confidence & notes so user can edit manually if LOW/MEDIUM
    return {
      medicine: {
        id: 'ai_result_' + Date.now(),
        medicineName: extractedName + (dosage ? ` (${dosage})` : ''),
        composition: dosage || 'Extracted via Vision AI',
        uses: 'As prescribed by physician',
        sideEffects: notes || 'Consult physician or pharmacist for side effect information.',
        imageUrl: '',
        manufacturer: 'Extracted from scan',
        excellentReviewPct: null,
        averageReviewPct: null,
        poorReviewPct: null,
      },
      confidence: mappedConfidence,
      source: 'ai',
      rawAiText: notes,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { medicine: null, confidence: 'unknown', source: 'none', error: msg }
  }
}

export async function askAboutMedicine(
  question: string,
  medicine: MedicineRecord,
  conversationHistory: Array<{ role: string; content: string }>,
  lang: Language
): Promise<string> {
  const langInstruction = getLangInstruction(lang)

  const datasetContext = `
Medicine Name: ${medicine.medicineName}
Composition: ${medicine.composition || 'Not available'}
Uses: ${medicine.uses || 'Not available'}
Side Effects: ${medicine.sideEffects || 'Not available'}
Manufacturer: ${medicine.manufacturer || 'Not available'}
`.trim()

  const systemPrompt = `You are CarePilot, a helpful medicine information assistant.
You have verified information about the medicine. Use it to answer.
${langInstruction}
IMPORTANT: Never fabricate medical information. If information is unavailable, say so clearly.
Always include a brief disclaimer that users should consult a doctor.

Information for ${medicine.medicineName}:
${datasetContext}`

  const history = conversationHistory.slice(-8).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model' as const,
    parts: [{ text: m.content }],
  }))

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
    })
    const chat = model.startChat({ history })
    const result = await withTimeout(chat.sendMessage(question), TIMEOUT_MS)
    return result.response.text()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('timed out')) {
      return lang === 'ta'
        ? 'மன்னிக்கவும், பதில் வர அதிக நேரம் ஆகிறது. மீண்டும் முயற்சிக்கவும்.'
        : lang === 'tanglish'
        ? 'Sorry, response late aaguthu. Meedum try pannunga.'
        : 'Sorry, the response took too long. Please try again.'
    }
    if (msg.includes('API key')) return 'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.'
    return `I could not get an answer right now. Please try again. (${msg})`
  }
}

export async function identifyMedicineFromText(text: string): Promise<AnalysisResult> {
  const datasetMatch = findMedicineByName(text)
  if (datasetMatch) {
    return { medicine: datasetMatch, confidence: 'high', source: 'dataset' }
  }

  try {
    const genAI = getClient()
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })
    const prompt = `Extract the medicine name from this text: "${text}"
Respond in JSON format (no markdown):
{"medicineName": "extracted name or empty string", "confidence": "high" or "medium" or "low"}`
    
    const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS)
    const responseText = result.response.text().trim()
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    
    if (parsed.medicineName) {
      const match = findMedicineByName(parsed.medicineName)
      if (match) return { medicine: match, confidence: 'high', source: 'dataset' }

      return {
        medicine: {
          id: 'ai_text_match',
          medicineName: parsed.medicineName,
          composition: '',
          uses: '',
          sideEffects: '',
          imageUrl: '',
          manufacturer: '',
          excellentReviewPct: null,
          averageReviewPct: null,
          poorReviewPct: null,
        },
        confidence: parsed.confidence === 'low' ? 'low' : 'medium',
        source: 'ai',
      }
    }
  } catch {
    // ignore
  }
  
  return { medicine: null, confidence: 'unknown', source: 'none' }
}

export async function identifyMedicineFromUrl(url: string): Promise<AnalysisResult> {
  const urlPath = url.split('/').pop()?.replace(/[-_]/g, ' ').replace(/\.(html|php|asp)$/i, '') || ''
  const datasetMatch = findMedicineByName(urlPath)
  if (datasetMatch) return { medicine: datasetMatch, confidence: 'high', source: 'dataset' }
  
  return { medicine: null, confidence: 'unknown', source: 'none', error: 'Could not identify medicine from URL' }
}
