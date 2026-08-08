import type { Language } from '../types'

const tamilUnicodePattern = /[\u0B80-\u0BFF]/

const tanglishPatterns = [
  /\b(indha|enna|edhu|ethuku|ethukku|epaddi|eppo|naan|naanga|ungal|ungalukku|sollunga|sollu|parunga|paarunga|sapta|sappidalam|varum|illai|aagum|pannunga|pannu|kelunga|mudiyuma)\b/i,
  /\b(medicine|tablet|capsule|syrup)\b.*\b(safe|use|side|effect|dosage)\b/i,
  /\b(ah|la|da|ra|nga|va|ma|na|ka)\b/i,
]

export function detectLanguage(text: string): Language {
  if (!text || !text.trim()) return 'en'

  // If contains Tamil Unicode characters → Tamil
  if (tamilUnicodePattern.test(text)) {
    // Mixed? Check if mostly Tamil
    const tamilChars = (text.match(/[\u0B80-\u0BFF]/g) || []).length
    const totalChars = text.replace(/\s/g, '').length
    if (tamilChars / totalChars > 0.3) return 'ta'
    return 'tanglish'
  }

  // Tanglish patterns
  const matchCount = tanglishPatterns.filter((p) => p.test(text)).length
  if (matchCount >= 1) return 'tanglish'

  return 'en'
}

export function getVoiceLang(lang: Language): string {
  switch (lang) {
    case 'ta': return 'ta-IN'
    case 'tanglish': return 'en-IN'
    default: return 'en-IN'
  }
}

export function getLangInstruction(lang: Language): string {
  switch (lang) {
    case 'ta': return 'Answer completely in Tamil (Unicode Tamil script). Do not answer mostly in English.'
    case 'tanglish': return 'Answer naturally in Tanglish (Romanized Tamil mixed with English). Do not use Tamil Unicode script.'
    default: return 'Answer completely in English.'
  }
}

