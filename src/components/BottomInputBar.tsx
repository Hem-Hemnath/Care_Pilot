import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Paperclip, Link as LinkIcon } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { voiceService } from '../voice/voiceService'
import { detectLanguage } from '../utils/languageDetect'
import type { Language } from '../types'

type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

interface BottomInputBarProps {
  onSend: (message: string, lang: Language) => void
  onFileSelected: (file: File) => void
  onLinkClick: () => void
  disabled?: boolean
  placeholder?: string
  externalText?: string
  onExternalTextConsumed?: () => void
}

export function BottomInputBar({
  onSend, onFileSelected, onLinkClick,
  disabled, placeholder, externalText, onExternalTextConsumed,
}: BottomInputBarProps) {
  const { uiLang } = useApp()
  const [text, setText] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Accept external text (e.g. from voice recognition)
  useEffect(() => {
    if (externalText) {
      setText(externalText)
      textareaRef.current?.focus()
      onExternalTextConsumed?.()
    }
  }, [externalText, onExternalTextConsumed])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 130) + 'px'
    }
  }, [text])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    const lang = detectLanguage(trimmed)
    onSend(trimmed, lang)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleVoice() {
    setVoiceError(null)

    if (voiceState === 'listening') {
      voiceService.stopListening()
      setVoiceState('idle')
      return
    }

    if (!voiceService.isSupported()) {
      setVoiceError(t('micNotSupported', uiLang))
      return
    }

    setVoiceState('listening')

    await voiceService.startListening(
      uiLang,
      (transcript) => {
        setVoiceState('idle')
        if (transcript) {
          setText(transcript)
          textareaRef.current?.focus()
        }
      },
      (code, _raw) => {
        setVoiceState('error')
        setTimeout(() => setVoiceState('idle'), 3000)
        if (code === 'PERMISSION_DENIED') {
          setVoiceError(t('micBlocked', uiLang))
        } else if (code === 'NO_DEVICE') {
          setVoiceError(t('micNoDevice', uiLang))
        } else if (code === 'NOT_SUPPORTED') {
          setVoiceError(t('micNotSupported', uiLang))
        } else if (code === 'NO_SPEECH') {
          setVoiceError(t('micNoSpeech', uiLang))
        } else if (code === 'NETWORK') {
          setVoiceError(t('micNetwork', uiLang))
        } else {
          setVoiceError(t('micFailed', uiLang))
        }
      },
      () => {
        setVoiceState('idle')
      }
    )
  }

  const isListening = voiceState === 'listening'

  return (
    <div className="bib-outer">
      {voiceError && (
        <div className="bib-voice-err" role="alert">
          <span>{voiceError}</span>
          <button onClick={() => setVoiceError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {isListening && (
        <div className="bib-listening-indicator" aria-live="polite">
          <span className="bib-pulse" />
          <span>{t('micListening', uiLang)}</span>
        </div>
      )}

      <div className={`bib-bar ${isListening ? 'listening' : ''}`}>
        {/* Left icons */}
        <div className="bib-left-icons">
          <label className="bib-icon-btn" title={t('upload', uiLang)} aria-label={t('upload', uiLang)}>
            <Paperclip size={17} />
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelected(f); e.target.value = '' }} />
          </label>          <button
            type="button"
            className={`bib-icon-btn ${isListening ? 'bib-mic-active' : ''}`}
            title={isListening ? t('micListening', uiLang) : t('voice', uiLang)}
            onClick={handleVoice}
            aria-label={isListening ? 'Stop listening' : t('voice', uiLang)}
            aria-pressed={isListening}
          >
            {isListening ? <MicOff size={17} /> : <Mic size={17} />}
          </button>
          <button type="button" className="bib-icon-btn" title={t('link', uiLang)} onClick={onLinkClick} aria-label={t('link', uiLang)}>
            <LinkIcon size={17} />
          </button>
        </div>

        {/* Text area */}
        <textarea
          ref={textareaRef}
          className="bib-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('askPlaceholder', uiLang)}
          rows={1}
          disabled={disabled}
          aria-label={placeholder || t('askPlaceholder', uiLang)}
        />

        {/* Send */}
        <button
          type="button"
          className="bib-send-btn"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label={t('sendMessage', uiLang)}
        >
          <Send size={15} />
        </button>
      </div>

      <style>{`
        .bib-outer { width: 100%; display: flex; flex-direction: column; gap: 8px; }
        .bib-voice-err {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 9px 14px; background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25); border-radius: 10px;
          font-size: 0.78rem; color: var(--danger);
        }
        .bib-voice-err button { background: none; border: none; cursor: pointer; color: var(--danger); font-size: 1rem; flex-shrink: 0; }
        .bib-listening-indicator {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.78rem; color: var(--accent); padding: 0 4px;
        }
        .bib-pulse {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent);
          animation: bibPulse 1s ease-in-out infinite;
        }
        @keyframes bibPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.5)} }
        .bib-bar {
          display: flex; align-items: flex-end; gap: 8px;
          background: var(--surface-secondary);
          border: 1px solid var(--border); border-radius: 18px;
          padding: 6px 8px 6px 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .bib-bar:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14,165,233,0.1); }
        .bib-bar.listening { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14,165,233,0.15); }
        .bib-left-icons { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
        .bib-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 7px;
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); transition: all 0.15s ease;
        }
        .bib-icon-btn:hover { color: var(--text-primary); background: var(--border); }
        .bib-icon-btn:active { transform: scale(0.93); }
        .bib-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .bib-mic-active {
          color: var(--accent) !important;
          animation: micPulse 1.2s ease-in-out infinite;
        }
        @keyframes micPulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        .bib-textarea {
          flex: 1; background: none; border: none; outline: none;
          font-family: inherit; font-size: 0.85rem; color: var(--text-primary);
          resize: none; line-height: 1.45; min-height: 22px; max-height: 120px;
          padding: 4px 0; align-self: center;
        }
        .bib-textarea::placeholder { color: var(--text-muted); }
        .bib-send-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--accent); color: white; border: none;
          cursor: pointer; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(14,165,233,0.4);
          transition: all 0.15s ease;
        }
        .bib-send-btn:hover:not(:disabled) { background: var(--accent-hover); transform: scale(1.05); }
        .bib-send-btn:active:not(:disabled) { transform: scale(0.94); }
        .bib-send-btn:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
        @media (prefers-reduced-motion: reduce) {
          .bib-pulse, .bib-mic-active { animation: none; }
          .bib-bar, .bib-icon-btn, .bib-send-btn { transition: none; }
        }
      `}</style>
    </div>
  )
}


