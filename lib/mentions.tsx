import React from 'react'

/**
 * Extracts unique @mentions from text (e.g. "@horal @Dhan_Anjay" -> ["horal", "Dhan Anjay"])
 */
export function extractMentions(text: string): string[] {
  if (!text) return []
  const matches = text.match(/(?:^|\s)@([a-zA-Z0-9_.-]+)/g)
  if (!matches) return []

  const cleaned = matches.map((m) => m.trim().replace(/^@/, '').replace(/_/g, ' '))
  return [...new Set(cleaned.filter(Boolean))]
}

/**
 * Renders text with styled @mention pills
 */
export function renderWithMentions(text: string): React.ReactNode {
  if (!text) return null
  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g)

  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const username = part.slice(1).replace(/_/g, ' ')
      return (
        <span key={index} className="mention-pill" title={`Tagged: ${username}`}>
          @{username}
        </span>
      )
    }
    return part
  })
}
