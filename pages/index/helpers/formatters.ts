/**
 * 格式化工具函数
 */

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
export function getTodayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 获取当前时间字符串 (HH:MM)
 */
export function getCurrentTimeString(): string {
  const now = new Date()
  const hour = now.getHours().toString().padStart(2, '0')
  const minute = now.getMinutes().toString().padStart(2, '0')
  return `${hour}:${minute}`
}

/**
 * 格式化日期为友好显示
 */
export function formatDateFriendly(dateStr: string): string {
  const today = getTodayString()
  if (dateStr === today) {
    return '今天'
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  if (dateStr === yesterdayStr) {
    return '昨天'
  }

  return dateStr
}

/**
 * 格式化时间戳为日期字符串
 */
export function formatTimestamp(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 格式化时间戳为完整日期时间
 */
export function formatDateTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

/**
 * 格式化价格显示
 */
export function formatPrice(price: number | undefined): string {
  if (price === undefined || price === null) return '0'
  return price.toFixed(2)
}

/**
 * 格式化百分比显示
 */
export function formatPercent(value: number | undefined): string {
  if (value === undefined || value === null) return '0%'
  return `${Math.round(value)}%`
}

/**
 * 检查日期是否是今天
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayString()
}
