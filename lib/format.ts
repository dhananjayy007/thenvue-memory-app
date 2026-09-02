export const fmt = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T12:00:00`)
  )

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
