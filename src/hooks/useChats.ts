import { useEffect, useState } from 'react'
import {
  ref,
  push,
  set,
  onValue,
  remove,
  update,
  type Unsubscribe,
} from 'firebase/database'
import { db } from '../lib/firebase'
import { normalizeMessages } from '../lib/messages'
import type { Chat, Message } from '../types/chat'

export function useChats(userId: string | undefined) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setChats([])
      setLoading(false)
      return
    }

    const chatsRef = ref(db, `users/${userId}/chats`)
    const unsubscribe: Unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        setChats([])
      } else {
        const chatList: Chat[] = Object.entries(data).map(([id, value]) => {
          const chat = value as Omit<Chat, 'id'>
          return {
            id,
            ...chat,
            messages: normalizeMessages(chat.messages),
          }
        })
        chatList.sort((a, b) => b.updatedAt - a.updatedAt)
        setChats(chatList)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  const createChat = async (): Promise<string> => {
    if (!userId) throw new Error('Must be signed in')
    const chatsRef = ref(db, `users/${userId}/chats`)
    const newChatRef = push(chatsRef)
    const now = Date.now()
    await set(newChatRef, {
      title: 'New chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    })
    return newChatRef.key!
  }

  const addMessage = async (chatId: string, message: Message) => {
    if (!userId) return
    const chatRef = ref(db, `users/${userId}/chats/${chatId}`)
    const chat = chats.find((c) => c.id === chatId)
    const messages = [...normalizeMessages(chat?.messages), message]
    const title =
      chat?.title === 'New chat' && message.role === 'user'
        ? message.content.slice(0, 40)
        : chat?.title ?? 'New chat'

    await update(chatRef, {
      messages,
      title,
      updatedAt: Date.now(),
    })
  }

  const deleteChat = async (chatId: string) => {
    if (!userId) return
    await remove(ref(db, `users/${userId}/chats/${chatId}`))
  }

  return { chats, loading, createChat, addMessage, deleteChat }
}
