import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Paperclip } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import { t } from '../i18n'
import { voiceService } from '../voice/voiceService'
import { detectLanguage } from '../utils/languageDetect'
import type { Language } from '../types'

interface ChatInputProps {
  onSend: (message: string, lang: Language) => void
  disabled?: boolean
  onFileSelected?: (file: File) => void
}

export function ChatInput({ onSend, disabled, onFileSelected }: ChatInputProps) {
  const { uiLang } = useApp()
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [text])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    const lang = detectLanguage(trimmed)
    onSend(trimmed, lang)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleVoice() {
    setVoiceError(null)
    if (!voiceService.isSupported()) {
      setVoiceError(t('micNotSupported', uiLang))
      return
    }
    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
      return
    }
    setIsListening(true)
    let latestTranscript = ''
    voiceService.startListening(
      uiLang,
      (transcript) => {
        if (transcript) {
          latestTranscript = transcript
          setText(transcript)
        }
      },
      (code, msg) => {
        setIsListening(false)
        if (code === 'PERMISSION_DENIED') {
          setVoiceError(t('micBlocked', uiLang))
        } else if (code === 'NOT_SUPPORTED') {
          setVoiceError(t('micNotSupported', uiLang))
        } else {
          setVoiceError(msg)
        }
      },
      () => {
        setIsListening(false)
        if (latestTranscript.trim()) {
          const lang = detectLanguage(latestTranscript.trim())
          onSend(latestTranscript.trim(), lang)
          setText('')
        }
      }
    )
  }

  return (
    <div className="chat-input-wrap">
      {voiceError && (
        <div className="voice-error" role="alert">
          {voiceError}
          <button onClick={() => setVoiceError(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
      <div className="chat-input-box">
        <button
          type="button"
          className="chat-icon-btn"
          onClick={() => fileRef.current?.click()}
          aria-label={t('upload', uiLang)}
          title={t('upload', uiLang)}
          disabled={disabled}
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && onFileSelected) onFileSelected(f)
            e.target.value = ''
          }}
        />
        <textarea
          ref={textareaRef}
          className="chat-textarea input-3d"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('askPlaceholder', uiLang)}
          rows={1}
          disabled={disabled}
          aria-label={t('askPlaceholder', uiLang)}
        />
        <button
          type="button"
          className={`chat-icon-btn ${isListening ? 'listening' : ''}`}
          onClick={handleVoice}
          aria-label={isListening ? t('micListening', uiLang) : t('voice', uiLang)}
          title={t('voice', uiLang)}
          disabled={disabled}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button
          type="button"
          className="chat-send-btn"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label={t('sendMessage', uiLang)}
        >
          <Send size={16} />
        </button>
      </div>
      <style>{`
        .chat-input-wrap { width: 100%; }
        .voice-error {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px; background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25); border-radius: 8px;
          font-size: 0.78rem; color: var(--danger); margin-bottom: 8px;
        }
        .voice-error button { background: none; border: none; cursor: pointer; color: var(--danger); font-size: 1rem; }
        .chat-input-box {
          display: flex; align-items: flex-end; gap: 6px;
          background: var(--input-background); border: 1px solid var(--input-border);
          border-radius: 14px; padding: 8px 10px;
          box-shadow: var(--shadow); transition: border-color 0.2s;
        }
        .chat-input-box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14,165,233,0.12); }
        .chat-textarea {
          flex: 1; background: none; border: none; outline: none;
          font-family: inherit; font-size: 0.9rem; color: var(--text-primary);
          resize: none; line-height: 1.5; min-height: 24px; max-height: 120px;
          padding: 2px 0;
        }
        .chat-textarea::placeholder { color: var(--text-muted); }
        .chat-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px; border: none;
          background: var(--surface-secondary); color: var(--text-secondary);
          cursor: pointer; transition: all 0.18s ease; flex-shrink: 0;
        }
        .chat-icon-btn:hover { background: var(--border); color: var(--accent); transform: translateY(-1px); }
        .chat-icon-btn.listening { background: rgba(239,68,68,0.15); color: var(--danger); animation: pulse 1.2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        .chat-send-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px; border-radius: 8px;
          background: var(--accent); color: white; border: none;
          cursor: pointer; transition: all 0.18s ease; flex-shrink: 0;
        }
        .chat-send-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); }
        .chat-send-btn:active:not(:disabled) { transform: scale(0.96); }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  )
}

