import type { CSSProperties } from 'react'
import type { User } from 'firebase/auth'
import type { Chat } from '../types/chat'
import { SidebarUser } from './AuthButton'

interface SidebarProps {
  isOpen: boolean
  chats: Chat[]
  activeChatId: string | null
  isSignedIn: boolean
  user: User | null
  onClose: () => void
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onSignOut: () => void
}

export function Sidebar({
  isOpen,
  chats,
  activeChatId,
  isSignedIn,
  user,
  onClose,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onSignOut,
}: SidebarProps) {
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <button className="sidebar__new-chat" onClick={onNewChat}>
            <img src="/icons/new-chat.png" alt="" className="sidebar__icon" width={22} height={22} />
            New chat
          </button>
        </div>

        <div className="sidebar__chats">
          {!isSignedIn ? (
            <p className="sidebar__empty">Sign in to save chats</p>
          ) : chats.length === 0 ? (
            <p className="sidebar__empty">No saved chats yet</p>
          ) : (
            chats.map((chat, index) => (
              <div
                key={chat.id}
                className={`sidebar__chat ${activeChatId === chat.id ? 'sidebar__chat--active' : ''}`}
                style={{ '--chat-index': index } as CSSProperties}
              >
                <button
                  className="sidebar__chat-btn"
                  onClick={() => {
                    onSelectChat(chat.id)
                    onClose()
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="sidebar__chat-title">{chat.title}</span>
                </button>
                <button
                  className="sidebar__delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                  aria-label="Delete chat"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {user && (
          <div className="sidebar__footer">
            <SidebarUser user={user} onSignOut={onSignOut} />
          </div>
        )}
      </aside>
    </>
  )
}
