export function formatDate(isoDate: string): string {
  try {
    const parts = isoDate.split('-').map(Number)
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return isoDate
  }
}

export function formatDateShort(isoDate: string): string {
  try {
    const parts = isoDate.split('-').map(Number)
    const date = new Date(parts[0], parts[1] - 1, parts[2])
    const currentYear = new Date().getFullYear()
    if (parts[0] === currentYear) {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(date)
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  } catch {
    return isoDate
  }
}

export function formatTime(isoTime: string): string {
  try {
    const [h, m] = isoTime.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${period}`
  } catch {
    return isoTime
  }
}

export function formatAudioDuration(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

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
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')
  }
}

export function isSameCalendarDay(memoryDate: string, timeZone?: string): boolean {
  if (!memoryDate || typeof memoryDate !== 'string') return false
  const today = getTodayDateString(timeZone)
  return memoryDate.slice(0, 10) === today
}

/**
 * Safely converts a date string, time string, or combined timestamp into a valid ISO string.
 */
export function toValidIsoString(dateOrTimestamp?: string | null, timeStr?: string | null): string {
  if (!dateOrTimestamp && !timeStr) {
    return new Date().toISOString()
  }

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

