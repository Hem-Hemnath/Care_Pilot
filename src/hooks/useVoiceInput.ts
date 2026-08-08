import { useState, useRef, useCallback } from 'react'
import type { Language } from '../types'
import { getVoiceLang } from '../utils/languageDetect'

export interface UseVoiceInputOptions {
  lang?: Language
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
}

export function useVoiceInput({ lang = 'en', onResult, onError }: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null
    }

    setIsListening(false)
  }, [])

  const startListening = useCallback(async () => {
    setError(null)

    // Check Web Speech API support with browser vendor prefixes
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      try {
        if (recognitionRef.current) {
          stopListening()
        }

        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = getVoiceLang(lang)
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onresult = (event: any) => {
          const text = event.results?.[0]?.[0]?.transcript || ''
          if (text) {
            setTranscript(text)
            onResult?.(text)
          }
        }

        recognition.onerror = (event: any) => {
          const errMessage = event.error || 'Speech recognition failed'
          setError(errMessage)
          onError?.(errMessage)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
        return
      } catch (err) {
        console.warn('[useVoiceInput] SpeechRecognition error, attempting MediaRecorder fallback', err)
      }
    }

    // MediaRecorder Fallback if Web Speech API is missing or fails
    if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop())
          setIsListening(false)
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
        setIsListening(true)
      } catch (err) {
        const msg = 'Microphone access denied or unavailable'
        setError(msg)
        onError?.(msg)
        setIsListening(false)
      }
    } else {
      const msg = 'Voice input is not supported in this browser'
      setError(msg)
      onError?.(msg)
      setIsListening(false)
    }
  }, [lang, onResult, onError, stopListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
  }
}
