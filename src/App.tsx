import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './hooks/useAuth'
import { useChats } from './hooks/useChats'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { MessageInput } from './components/MessageInput'
import { AuthButton, TemporaryChatButton } from './components/AuthButton'
import { LoadingScreen } from './components/LoadingScreen'
import { getChatResponse, typeOutText, interruptibleDelay } from './lib/chatbot'
import type { Message } from './types/chat'
import './App.css'

type TypingPhase = 'idle' | 'thinking' | 'streaming'

function getUserName(user: { displayName: string | null; email: string | null } | null) {
  if (!user) return null
  return user.displayName ?? user.email?.split('@')[0] ?? null
}

function App() {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth()
  const { chats, loading: chatsLoading, createChat, addMessage, deleteChat } = useChats(user?.uid)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isTemporaryChat, setIsTemporaryChat] = useState(false)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [typingPhase, setTypingPhase] = useState<TypingPhase>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [appReady, setAppReady] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('Connecting...')
  const stopRef = useRef(false)
  const streamedTextRef = useRef('')

  const firebaseReady = !authLoading
  const chatsReady = !user || !chatsLoading
  const allLoaded = firebaseReady && chatsReady
  const isBotWriting = typingPhase !== 'idle'

  useEffect(() => {
    if (!firebaseReady) {
      setLoadingStatus('Connecting to Firebase...')
      return
    }
    if (user && chatsLoading) {
      setLoadingStatus('Loading your chats...')
      return
    }
    if (user) {
      setLoadingStatus('Welcome back!')
    } else {
      setLoadingStatus('Ready!')
    }
  }, [firebaseReady, user, chatsLoading])

  useEffect(() => {
    if (!allLoaded) return
    const timer = setTimeout(() => setAppReady(true), 400)
    return () => clearTimeout(timer)
  }, [allLoaded])

  const activeChat = chats.find((c) => c.id === activeChatId)
  const useLocalChat = !user || isTemporaryChat
  const messages = useLocalChat ? localMessages : activeChat?.messages ?? []
  const showTemporaryButton = !!user && messages.length === 0

  const resetChatState = () => {
    streamedTextRef.current = ''
    setStreamedText('')
    setTypingPhase('idle')
  }

  const handleStop = useCallback(() => {
    stopRef.current = true
    setIsSending(false)
  }, [])

  const handleTemporaryChat = useCallback(() => {
    stopRef.current = true
    setIsTemporaryChat(true)
    setActiveChatId(null)
    setLocalMessages([])
    resetChatState()
    setIsSending(false)
  }, [])

  const handleNewChat = useCallback(async () => {
    stopRef.current = true
    setLocalMessages([])
    resetChatState()
    setIsSending(false)
    setIsTemporaryChat(false)
    if (user) {
      const chatId = await createChat()
      setActiveChatId(chatId)
    } else {
      setActiveChatId(null)
    }
    setSidebarOpen(false)
  }, [user, createChat])

  const handleSelectChat = (chatId: string) => {
    stopRef.current = true
    setActiveChatId(chatId)
    setIsTemporaryChat(false)
    setLocalMessages([])
    resetChatState()
    setIsSending(false)
  }

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId)
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setLocalMessages([])
      resetChatState()
      setIsSending(false)
    }
  }

  const handleSend = async (content: string) => {
    if (isSending) return

    const response = getChatResponse(content, getUserName(user))
    stopRef.current = false
    setIsSending(true)

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: Date.now() + 1,
    }

    const shouldStop = () => stopRef.current

    const deliverAssistant = async (chatId?: string | null) => {
      const savePartial = async () => {
        const partial = streamedTextRef.current.trim()
        if (partial) {
          const partialMessage: Message = {
            role: 'assistant',
            content: partial,
            timestamp: Date.now(),
          }
          if (user && chatId && !isTemporaryChat) {
            await addMessage(chatId, partialMessage)
          } else {
            setLocalMessages((prev) => [...prev, partialMessage])
          }
        }
        resetChatState()
      }

      setTypingPhase('thinking')
      streamedTextRef.current = ''
      setStreamedText('')

      if (!(await interruptibleDelay(700, shouldStop))) {
        resetChatState()
        return
      }

      setTypingPhase('streaming')
      const completed = await typeOutText(
        response,
        (partial) => {
          streamedTextRef.current = partial
          setStreamedText(partial)
        },
        { shouldStop }
      )

      if (!completed || shouldStop()) {
        await savePartial()
        return
      }

      if (user && chatId && !isTemporaryChat) {
        await addMessage(chatId, assistantMessage)
      } else {
        setLocalMessages((prev) => [...prev, assistantMessage])
      }

      resetChatState()
    }

    if (user && !isTemporaryChat) {
      let chatId = activeChatId
      if (!chatId) {
        chatId = await createChat()
        setActiveChatId(chatId)
      }
      if (shouldStop()) return
      await addMessage(chatId, userMessage)
      if (shouldStop()) return
      await deliverAssistant(chatId)
    } else {
      setLocalMessages((prev) => [...prev, userMessage])
      if (shouldStop()) return
      await deliverAssistant()
    }

    if (!shouldStop()) {
      setIsSending(false)
    }
  }

  if (!appReady) {
    return <LoadingScreen status={loadingStatus} />
  }

  return (
    <div className={`app ${appReady ? 'app--ready' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        chats={chats}
        activeChatId={isTemporaryChat ? null : activeChatId}
        isSignedIn={!!user}
        user={user}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onSignOut={logout}
      />

      <main className="main">
        <header className="header">
          <button
            className="header__menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="header__title">YDS Chat</span>
          <div className="header__auth">
            {user ? (
              showTemporaryButton ? (
                <TemporaryChatButton
                  active={isTemporaryChat}
                  onClick={handleTemporaryChat}
                />
              ) : null
            ) : (
              <AuthButton loading={authLoading} onSignIn={signInWithGoogle} />
            )}
          </div>
        </header>

        <ChatArea
          messages={messages}
          typingPhase={typingPhase}
          streamedText={streamedText}
        />
        <MessageInput
          onSend={handleSend}
          onStop={handleStop}
          isBotWriting={isBotWriting}
          isSending={isSending}
        />
      </main>
    </div>
  )
}

export default App
