import type { Language } from '../types'

const tamilUnicodePattern = /[\u0B80-\u0BFF]/

export function detectLanguage(text: string): Language {
  if (!text || !text.trim()) return 'en'

  // If contains Tamil Unicode characters → Tamil
  if (tamilUnicodePattern.test(text)) {
    return 'ta'
  }

  return 'en'
}

export function getVoiceLang(lang: Language): string {
  switch (lang) {
    case 'ta': return 'ta-IN'
    default: return 'en-IN'
  }
}

export function getLangInstruction(lang: Language): string {
  const grounding = "You are CarePilot AI. Respond strictly in the user's selected language: either clear, natural Tamil (தமிழ்) or standard English. Do not mix languages or use Romanized Tamil."
  if (lang === 'ta') {
    return `${grounding} The user selected Tamil (தமிழ்). Answer completely in clear, natural Tamil script.`
  }
  return `${grounding} The user selected English. Answer completely in standard English.`
}

