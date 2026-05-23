/**
 * Format a timestamp for display inside a message bubble.
 * Shows HH:MM (24-hour).
 */
export function formatMessageTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

/**
 * Format a timestamp for the chat list preview.
 * - Today → HH:MM
 * - This week → day name (Mon, Tue …)
 * - Older → DD.MM.YYYY
 */
export function formatChatPreviewTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const diffMs = now - d
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' })
  }

  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Format date as a separator label between message groups (e.g. "Today", "Yesterday", "12 March").
 */
export function formatDateSeparator(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (isToday) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return 'Yesterday'

  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Check whether two dates fall on different calendar days.
 */
export function isDifferentDay(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return false
  const a = new Date(dateStr1)
  const b = new Date(dateStr2)
  return (
    a.getDate() !== b.getDate() ||
    a.getMonth() !== b.getMonth() ||
    a.getFullYear() !== b.getFullYear()
  )
}
