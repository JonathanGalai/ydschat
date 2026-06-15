import { useState, useCallback } from 'react'
import { useAuth } from './hooks/useAuth'
import { useChats } from './hooks/useChats'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { MessageInput } from './components/MessageInput'
import { AuthButton } from './components/AuthButton'
import type { Message } from './types/chat'
import './App.css'

function App() {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth()
  const { chats, createChat, addMessage, deleteChat } = useChats(user?.uid)
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const activeChat = chats.find((c) => c.id === activeChatId)
  const messages =
    user && activeChatId && activeChat ? activeChat.messages : localMessages

  const handleNewChat = useCallback(async () => {
    setLocalMessages([])
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
  }

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId)
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setLocalMessages([])
    }
  }

  const handleSend = async (content: string) => {
    if (isSending) return
    setIsSending(true)

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: 'hello',
      timestamp: Date.now() + 1,
    }

    if (user) {
      let chatId = activeChatId
      if (!chatId) {
        chatId = await createChat()
        setActiveChatId(chatId)
      }
      await addMessage(chatId, userMessage)
      setIsTyping(true)
      await new Promise((r) => setTimeout(r, 600))
      await addMessage(chatId, assistantMessage)
      setIsTyping(false)
    } else {
      setLocalMessages((prev) => [...prev, userMessage])
      setIsTyping(true)
      await new Promise((r) => setTimeout(r, 600))
      setLocalMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }

    setIsSending(false)
  }

  return (
    <div className="app">
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

        <ChatArea messages={messages} isTyping={isTyping} />
        <MessageInput onSend={handleSend} disabled={isSending} />
      </main>
    </div>
  )
}

export default App
