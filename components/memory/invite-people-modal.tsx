'use client'

import { useEffect, useState } from 'react'
import { Search, UserCheck, UserPlus, Users, X } from 'lucide-react'
import { searchUsersAction, inviteParticipantsAction } from '@/app/memories/actions'
import type { Memory, MemoryParticipant, UserSearchResult } from '@/types/memory'

export function InvitePeopleModal({
  memory,
  isOpen,
  onClose,
  onInvited,
}: {
  memory: Memory
  isOpen: boolean
  onClose: () => void
  onInvited?: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedUsers([])
      setError(null)
      setSuccessMessage(null)
      // Initial user search
      setSearching(true)
      searchUsersAction('')
        .then((res) => setResults(res))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }
  }, [isOpen])

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return
    const timeout = setTimeout(async () => {
      setSearching(true)
      setError(null)
      try {
        const list = await searchUsersAction(query)
        setResults(list)
      } catch (err) {
        console.error('Failed to search users:', err)
      } finally {
        setSearching(false)
      }
    }, 200)

    return () => clearTimeout(timeout)
  }, [query, isOpen])

  if (!isOpen) return null

  const existingParticipantUserIds = new Set((memory.participants || []).map((p) => p.userId))
  const selectedUserIds = new Set(selectedUsers.map((u) => u.id))

  const handleToggleUser = (user: UserSearchResult) => {
    if (existingParticipantUserIds.has(user.id)) return
    if (selectedUserIds.has(user.id)) {
      setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id))
    } else {
      setSelectedUsers((prev) => [...prev, user])
    }
  }

  const handleSendInvitations = async () => {
    if (selectedUsers.length === 0) return
    setSending(true)
    setError(null)
    try {
      await inviteParticipantsAction(
        memory.id,
        selectedUsers.map((u) => u.id)
      )
      setSuccessMessage(`Invitation${selectedUsers.length > 1 ? 's' : ''} sent!`)
      setTimeout(() => {
        onInvited?.()
        onClose()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invitations.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="invite-modal">
        <header className="invite-modal-header">
          <div className="invite-header-title">
            <Users size={18} className="invite-header-icon" />
            <div>
              <h3>Share this memory</h3>
              <p>Invite people who lived this moment with you</p>
            </div>
          </div>
          <button className="capture-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="invite-search-box">
          <Search size={16} className="invite-search-icon" />
          <input
            type="text"
            autoFocus
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="invite-clear-query" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Selected User Chips */}
        {selectedUsers.length > 0 && (
          <div className="invite-selected-chips">
            {selectedUsers.map((user) => (
              <span key={user.id} className="invite-chip">
                <span className="invite-chip-avatar">
                  {user.displayName[0]?.toUpperCase() || '?'}
                </span>
                <span className="invite-chip-name">{user.displayName}</span>
                <button
                  type="button"
                  onClick={() => handleToggleUser(user)}
                  aria-label={`Remove ${user.displayName}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* User Search Results */}
        <div className="invite-user-list">
          {searching ? (
            <div className="invite-empty">Searching users...</div>
          ) : results.length > 0 ? (
            results.map((user) => {
              const isAlreadyParticipant = existingParticipantUserIds.has(user.id)
              const isSelected = selectedUserIds.has(user.id)

              return (
                <button
                  key={user.id}
                  type="button"
                  className={`invite-user-row ${isSelected ? 'selected' : ''} ${
                    isAlreadyParticipant ? 'already-participant' : ''
                  }`}
                  onClick={() => handleToggleUser(user)}
                  disabled={isAlreadyParticipant}
                >
                  <div className="invite-user-avatar">
                    {user.displayName[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="invite-user-info">
                    <span className="invite-user-name">{user.displayName}</span>
                    {user.email && <span className="invite-user-email">{user.email}</span>}
                  </div>
                  <div className="invite-user-action">
                    {isAlreadyParticipant ? (
                      <span className="invite-status-tag">Already added</span>
                    ) : isSelected ? (
                      <span className="invite-check-icon">
                        <UserCheck size={16} />
                      </span>
                    ) : (
                      <span className="invite-add-icon">
                        <UserPlus size={16} />
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          ) : (
            <div className="invite-empty">
              {query ? 'No people found with that name.' : 'No other users found.'}
            </div>
          )}
        </div>

        {/* Existing Participants List */}
        {memory.participants && memory.participants.length > 0 && (
          <div className="invite-existing-section">
            <span className="invite-existing-label">Current participants</span>
            <div className="invite-existing-pills">
              {memory.participants.map((p: MemoryParticipant) => (
                <span key={p.id} className="invite-existing-pill">
                  <span className="pill-name">{p.displayName}</span>
                  <span className={`pill-status pill-status-${p.status}`}>{p.status}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {error && <p className="auth-error" style={{ margin: '8px 0 0' }}>{error}</p>}
        {successMessage && <p className="invite-success">{successMessage}</p>}

        <footer className="invite-modal-footer">
          <button type="button" className="voice-action-btn voice-action-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="save-memory"
            style={{ width: 'auto', padding: '10px 20px' }}
            onClick={handleSendInvitations}
            disabled={sending || selectedUsers.length === 0}
          >
            {sending
              ? 'Sending...'
              : `Send invitation${selectedUsers.length > 1 ? `s (${selectedUsers.length})` : selectedUsers.length === 1 ? ' (1)' : ''}`}
          </button>
        </footer>
      </div>
    </div>
  )
}
