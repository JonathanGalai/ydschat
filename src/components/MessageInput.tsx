import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react'

interface MessageInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isBotWriting: boolean
  isSending: boolean
}

export function MessageInput({ onSend, onStop, isBotWriting, isSending }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const focusInput = () => {
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  useEffect(() => {
    focusInput()
  }, [])

  useEffect(() => {
    if (!isSending) {
      focusInput()
    }
  }, [isSending])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    onSend(trimmed)
    setInput('')
    focusInput()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <div className="message-input__wrapper">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          rows={1}
        />
        {isBotWriting ? (
          <button
            type="button"
            className="message-input__stop"
            onClick={onStop}
            aria-label="Stop generating"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()} aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        )}
      </div>
      <p className="message-input__hint">YDS Chat can make mistakes. Check important info.</p>
    </form>
  )
}
