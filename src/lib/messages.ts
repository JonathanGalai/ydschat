import type { Message } from '../types/chat'

export function normalizeMessages(messages: unknown): Message[] {
  if (!messages) return []
  if (Array.isArray(messages)) return messages
  if (typeof messages === 'object') {
    return Object.entries(messages as Record<string, Message>)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, msg]) => msg)
      .filter((msg) => msg && typeof msg.content === 'string')
  }
  return []
}
