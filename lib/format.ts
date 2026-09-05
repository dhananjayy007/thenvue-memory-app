export const fmt = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T12:00:00`)
  )

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`)
    const currentYear = new Date().getFullYear()
    if (d.getFullYear() === currentYear) {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
    }
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
  } catch {
    return dateStr
  }
}

/**
 * Returns today's date in YYYY-MM-DD format for a given timezone.
 */
export function getTodayDateString(timeZone?: string): string {
  try {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date())
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
}

/**
 * Checks if a given date string (YYYY-MM-DD or ISO) matches today's date in the user's timezone.
 */
export function isSameCalendarDay(dateStr: string, timeZone?: string): boolean {
  if (!dateStr) return false
  const targetDate = dateStr.slice(0, 10)
  const todayDate = getTodayDateString(timeZone)
  return targetDate === todayDate
}

/**
 * Safely converts a date string, time string, or combined timestamp into a valid ISO string.
 * Handles:
 * - Direct ISO strings: "2025-01-26T19:50:00.000Z"
 * - Separate date and 12-hour time: date="2025-01-26", time="7:50 PM" -> "2025-01-26T19:50:00.000Z"
 * - Malformed strings like "2025-01-26T7:50 PMZ" -> properly parsed to ISO.
 */
export function toValidIsoString(dateOrTimestamp?: string | null, timeStr?: string | null): string {
  if (!dateOrTimestamp && !timeStr) {
    return new Date().toISOString()
  }

  // If dateOrTimestamp is already a string
  if (dateOrTimestamp && !timeStr) {
    const malformedMatch = dateOrTimestamp.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i)
    if (malformedMatch) {
      const datePart = malformedMatch[1]
      let h = parseInt(malformedMatch[2], 10)
      const m = malformedMatch[3]
      const s = malformedMatch[4] || '00'
      const ampm = malformedMatch[5]
      if (ampm) {
        const isPM = ampm.toUpperCase() === 'PM'
        if (isPM && h < 12) h += 12
        if (!isPM && h === 12) h = 0
      }
      const iso = new Date(`${datePart}T${String(h).padStart(2, '0')}:${m}:${s}Z`)
      if (!isNaN(iso.getTime())) return iso.toISOString()
    }

    const d = new Date(dateOrTimestamp)
    if (!isNaN(d.getTime())) {
      return d.toISOString()
    }
  }

  const datePart = (dateOrTimestamp || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  let timePart = '12:00:00'

  if (timeStr && typeof timeStr === 'string') {
    const trimmed = timeStr.trim()
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i)
    if (match12) {
      let h = parseInt(match12[1], 10)
      const m = match12[2]
      const s = match12[3] || '00'
      const isPM = match12[4].toUpperCase() === 'PM'
      if (isPM && h < 12) h += 12
      if (!isPM && h === 12) h = 0
      timePart = `${String(h).padStart(2, '0')}:${m}:${s}`
    } else {
      const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
      if (match24) {
        const h = String(parseInt(match24[1], 10)).padStart(2, '0')
        const m = match24[2]
        const s = match24[3] || '00'
        timePart = `${h}:${m}:${s}`
      }
    }
  }

  const combined = new Date(`${datePart}T${timePart}Z`)
  if (!isNaN(combined.getTime())) {
    return combined.toISOString()
  }

  return new Date().toISOString()
}
