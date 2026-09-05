'use client'

import { useEffect, useState, useRef } from 'react'
import { searchUsersAction } from '@/app/memories/actions'
import type { UserSearchResult } from '@/types/memory'
import { AtSign, User } from 'lucide-react'

const localMentionCache = new Map<string, UserSearchResult[]>()

export interface MentionAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (newValue: string) => void
  onSelectUser?: (user: UserSearchResult) => void
}

export function MentionAutocomplete({
  textareaRef,
  value,
  onChange,
  onSelectUser,
}: MentionAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null)
  const [users, setUsers] = useState<UserSearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect when cursor is right after @query
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleCheckMention = () => {
      const cursorPos = textarea.selectionStart ?? 0
      const textBeforeCursor = value.slice(0, cursorPos)

      // Match @word right before cursor (e.g. "dinner with @hor" or "@")
      const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/)

      if (match) {
        const fullMatch = match[0]
        const matchedQuery = match[1] ?? ''
        const startIndex = cursorPos - matchedQuery.length - 1 // index of '@'

        setMentionStartIndex(startIndex)
        setQuery(matchedQuery)
        setIsOpen(true)
        setSelectedIndex(0)
      } else {
        setIsOpen(false)
        setMentionStartIndex(null)
      }
    }

    handleCheckMention()
  }, [value, textareaRef])

  // Fetch users matching the query with client-side cache and 300ms debounce
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const normalized = query.trim().toLowerCase()

    if (localMentionCache.has(normalized)) {
      setUsers(localMentionCache.get(normalized)!)
      setSelectedIndex(0)
      setLoading(false)
      return
    }

    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsersAction(normalized)
        if (isMounted) {
          localMentionCache.set(normalized, results)
          setUsers(results)
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error('Failed to search users for mention:', err)
        if (isMounted) setUsers([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [query, isOpen])

  const handleSelect = (user: UserSearchResult) => {
    const textarea = textareaRef.current
    if (!textarea || mentionStartIndex === null) return

    const cursorPos = textarea.selectionStart ?? value.length
    const cleanName = user.displayName.replace(/\s+/g, '_') // Format multi-word names as @Dhan_Anjay or @horal
    const before = value.slice(0, mentionStartIndex)
    const after = value.slice(cursorPos)

    const nextValue = `${before}@${cleanName} ${after}`
    onChange(nextValue)
    onSelectUser?.(user)

    setIsOpen(false)
    setMentionStartIndex(null)

    // Reset cursor position right after the inserted mention
    const newCursorPos = mentionStartIndex + cleanName.length + 2 // for @ and space
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 10)
  }

  // Keyboard navigation
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || !isOpen || users.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % users.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (users[selectedIndex]) {
          e.preventDefault()
          handleSelect(users[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    textarea.addEventListener('keydown', handleKeyDown)
    return () => textarea.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, users, selectedIndex, textareaRef])

  if (!isOpen) return null

  return (
    <div ref={dropdownRef} className="mention-dropdown">
      <div className="mention-dropdown-header">
        <AtSign size={12} />
        <span>Tag a person</span>
      </div>

      {loading ? (
        <div className="mention-item loading">Searching users...</div>
      ) : users.length === 0 ? (
        <div className="mention-item empty">
          {query ? `No users found matching "@${query}"` : 'No other users found'}
        </div>
      ) : (
        users.map((user, idx) => (
          <button
            key={user.id}
            type="button"
            className={`mention-item ${idx === selectedIndex ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault() // Prevents textarea blur
              handleSelect(user)
            }}
          >
            <span className="mention-avatar">
              {user.displayName[0]?.toUpperCase() || <User size={12} />}
            </span>
            <div className="mention-info">
              <span className="mention-name">{user.displayName}</span>
              {user.email && <span className="mention-email">{user.email}</span>}
            </div>
          </button>
        ))
      )}
    </div>
  )
}
