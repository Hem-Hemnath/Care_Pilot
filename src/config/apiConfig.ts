import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Resolves the Gemini API key strictly from environment variables across Vite, Next.js, and Node.js environments.
 */
const getApiKey = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY
  }
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      ''
    )
  }
  return ''
}

const apiKey = getApiKey()

if (!apiKey) {
  console.error("CRITICAL ERROR: Gemini API key is missing from environment variables.")
}

/**
 * Returns the resolved API key string.
 */
export const getGeminiApiKey = (): string => apiKey

/**
 * Safely initializes and returns a GoogleGenerativeAI instance.
 * Throws a descriptive configuration error if no API key is present.
 */
export const getGeminiClient = (): GoogleGenerativeAI => {
  if (!apiKey) {
    throw new Error(
      'CRITICAL ERROR: Gemini API key is missing from environment variables. Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your .env file.'
    )
  }
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Pre-initialized GoogleGenerativeAI instance (null if API key missing).
 */
export const ai = apiKey ? new GoogleGenerativeAI(apiKey) : null
