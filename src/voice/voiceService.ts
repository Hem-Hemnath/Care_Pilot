import type { Language } from '../types'
import { getVoiceLang } from '../utils/languageDetect'

export type VoiceErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'NO_DEVICE'
  | 'NO_SPEECH'
  | 'NETWORK'
  | 'ABORTED'
  | 'UNKNOWN'

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  onspeechstart: (() => void) | null
}

type SpeechRecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export class VoiceService {
  private recognition: SpeechRecognitionLike | null = null
  private micStream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private _isListening = false

  isSupported(): boolean {
    return !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      (typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined')
    )
  }

  private stopMicStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop())
      this.micStream = null
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop() } catch { /* ignore */ }
      this.mediaRecorder = null
    }
  }

  async startListening(
    lang: Language,
    onResult: (transcript: string) => void,
    onError: (code: VoiceErrorCode, message: string) => void,
    onEnd: () => void,
    onSpeechStart?: () => void
  ): Promise<void> {
    if (!this.isSupported()) {
      onError('NOT_SUPPORTED', 'NOT_SUPPORTED')
      return
    }

    if (this._isListening) this.stopListening()

    // Try Web Speech API first
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRec) {
      try {
        if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            this.micStream = stream
          } catch (err) {
            const domErr = err as DOMException
            if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
              onError('PERMISSION_DENIED', 'PERMISSION_DENIED')
              return
            }
            if (domErr.name === 'NotFoundError' || domErr.name === 'DevicesNotFoundError' || domErr.name === 'NotReadableError') {
              onError('NO_DEVICE', 'NO_DEVICE')
              return
            }
          }
        }

        const rec = new SpeechRec()
        rec.continuous = false
        rec.interimResults = false
        rec.lang = getVoiceLang(lang)
        rec.maxAlternatives = 3

        rec.onspeechstart = () => {
          if (onSpeechStart) onSpeechStart()
        }

        rec.onresult = (event) => {
          let best = ''
          let bestConf = -1
          const results = event.results
          for (let i = 0; i < results.length; i++) {
            const alt = results[i][0]
            if (alt && alt.confidence > bestConf) {
              bestConf = alt.confidence
              best = alt.transcript
            }
          }
          if (best) onResult(best.trim())
        }

        rec.onerror = (event) => {
          this._isListening = false
          this.stopMicStream()
          const errMap: Record<string, VoiceErrorCode> = {
            'not-allowed': 'PERMISSION_DENIED',
            'service-not-allowed': 'PERMISSION_DENIED',
            'no-speech': 'NO_SPEECH',
            'network': 'NETWORK',
            'aborted': 'ABORTED',
            'audio-capture': 'NO_DEVICE',
          }
          const code: VoiceErrorCode = errMap[event.error] ?? 'UNKNOWN'
          onError(code, event.error)
        }

        rec.onend = () => {
          this._isListening = false
          this.stopMicStream()
          onEnd()
        }

        rec.start()
        this.recognition = rec
        this._isListening = true
        return
      } catch (err) {
        console.warn('[VoiceService] WebSpeech error, using MediaRecorder fallback:', err)
      }
    }

    // MediaRecorder Fallback if WebSpeech is not available or throws error
    if (typeof navigator.mediaDevices?.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        this.micStream = stream
        const recorder = new MediaRecorder(stream)

        recorder.onstart = () => {
          this._isListening = true
          if (onSpeechStart) onSpeechStart()
        }

        recorder.onstop = () => {
          this._isListening = false
          this.stopMicStream()
          onEnd()
        }

        recorder.onerror = () => {
          this._isListening = false
          this.stopMicStream()
          onError('UNKNOWN', 'MediaRecorder error')
        }

        recorder.start()
        this.mediaRecorder = recorder
      } catch (err) {
        this._isListening = false
        this.stopMicStream()
        onError('PERMISSION_DENIED', String(err))
      }
    } else {
      onError('NOT_SUPPORTED', 'NOT_SUPPORTED')
    }
  }

  stopListening() {
    if (this.recognition) {
      try { this.recognition.abort() } catch { /* ignore */ }
      this.recognition = null
    }
    this.stopMicStream()
    this._isListening = false
  }

  speakText(text: string, lang: Language, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd()
      return
    }
    this.stopSpeaking()

    const cleanText = text.replace(/[*_#`~]/g, '').trim()
    if (!cleanText) {
      if (onEnd) onEnd()
      return
    }

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = getVoiceLang(lang)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const targetLangCode = getVoiceLang(lang).split('-')[0]
    const matchedVoice = voices.find((v) => v.lang.startsWith(targetLangCode))
    if (matchedVoice) utterance.voice = matchedVoice

    utterance.onend = () => { if (onEnd) onEnd() }
    utterance.onerror = () => { if (onEnd) onEnd() }

    window.speechSynthesis.speak(utterance)
  }

  speak(text: string, lang: Language, onEnd?: () => void): void {
    this.speakText(text, lang, onEnd)
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    }
  }

  get isListening() { return this._isListening }
}

export const voiceService = new VoiceService()
