import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../types'
import { CarePilotIcon } from './CarePilotIcon'

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading?: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chat-messages">
      {messages.map((msg) => (
        <div key={msg.id} className={`chat-msg ${msg.role}`}>
          {msg.role === 'assistant' && (
            <div className="msg-avatar">
              <CarePilotIcon size={28} />
            </div>
          )}
          <div className="msg-bubble">
            <div className="msg-content">{msg.content}</div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="chat-msg assistant">
          <div className="msg-avatar"><CarePilotIcon size={28} /></div>
          <div className="msg-bubble">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
      <style>{`
        .chat-messages { display: flex; flex-direction: column; gap: 12px; padding: 16px 0; }
        .chat-msg { display: flex; align-items: flex-end; gap: 8px; }
        .chat-msg.user { flex-direction: row-reverse; }
        .msg-avatar { flex-shrink: 0; }
        .msg-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .chat-msg.user .msg-bubble {
          background: var(--accent);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .chat-msg.assistant .msg-bubble {
          background: var(--surface-secondary);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
          border: 1px solid var(--border);
        }
        .msg-content { white-space: pre-wrap; word-break: break-word; }
        .typing-dots { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .typing-dots span {
          width: 8px; height: 8px; background: var(--text-muted);
          border-radius: 50%; animation: typingBounce 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)} }
      `}</style>
    </div>
  )
}

