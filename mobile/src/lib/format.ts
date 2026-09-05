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

