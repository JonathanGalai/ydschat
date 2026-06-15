import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useChats } from './hooks/useChats'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { MessageInput } from './components/MessageInput'
import { AuthButton } from './components/AuthButton'
import { LoadingScreen } from './components/LoadingScreen'
import { getGreetingResponse, typeOutText } from './lib/chatbot'
import type { Message } from './types/chat'
import './App.css'

type TypingPhase = 'idle' | 'thinking' | 'streaming'

function App() {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth()
  const { chats, loading: chatsLoading, createChat, addMessage, deleteChat } = useChats(user?.uid)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [typingPhase, setTypingPhase] = useState<TypingPhase>('idle')
  const [streamedText, setStreamedText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [appReady, setAppReady] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('Connecting...')

  const firebaseReady = !authLoading
  const chatsReady = !user || !chatsLoading
  const allLoaded = firebaseReady && chatsReady

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
  const messages =
    user && activeChatId && activeChat ? activeChat.messages : localMessages

  const handleNewChat = useCallback(async () => {
    setLocalMessages([])
    setStreamedText('')
    setTypingPhase('idle')
    if (user) {
      const chatId = await createChat()
      setActiveChatId(chatId)
    } else {
      setActiveChatId(null)
    }
    setSidebarOpen(false)
  }, [user, createChat])

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId)
    setLocalMessages([])
    setStreamedText('')
    setTypingPhase('idle')
  }

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId)
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setLocalMessages([])
      setStreamedText('')
      setTypingPhase('idle')
    }
  }

  const handleSend = async (content: string) => {
    if (isSending) return

    const response = getGreetingResponse(content)
    if (!response) return

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

    const deliverAssistant = async (chatId?: string | null) => {
      setTypingPhase('thinking')
      setStreamedText('')
      await new Promise((r) => setTimeout(r, 700))

      setTypingPhase('streaming')
      await typeOutText(response, setStreamedText)

      if (user && chatId) {
        await addMessage(chatId, assistantMessage)
      } else {
        setLocalMessages((prev) => [...prev, assistantMessage])
      }

      setStreamedText('')
      setTypingPhase('idle')
    }

    if (user) {
      let chatId = activeChatId
      if (!chatId) {
        chatId = await createChat()
        setActiveChatId(chatId)
      }
      await addMessage(chatId, userMessage)
      await deliverAssistant(chatId)
    } else {
      setLocalMessages((prev) => [...prev, userMessage])
      await deliverAssistant()
    }

    setIsSending(false)
  }

  if (!appReady) {
    return <LoadingScreen status={loadingStatus} />
  }

  return (
    <div className={`app ${appReady ? 'app--ready' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        chats={chats}
        activeChatId={activeChatId}
        isSignedIn={!!user}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
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
            <AuthButton
              user={user}
              loading={authLoading}
              onSignIn={signInWithGoogle}
              onSignOut={logout}
            />
          </div>
        </header>

        <ChatArea
          messages={messages}
          typingPhase={typingPhase}
          streamedText={streamedText}
        />
        <MessageInput onSend={handleSend} disabled={isSending} />
      </main>
    </div>
  )
}

export default App
