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
 * @param separator 分隔符，默认 '-'
 */
export function formatTimestamp(timestamp: number | string | Date, separator = '-'): string {
  const date = new Date(timestamp)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${separator}${m}${separator}${d}`
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

/**
 * 安全的日期解析函数 (兼容 iOS)
 * iOS 无法解析 "YYYY-MM-DD HH:mm:ss"，需要转换为 "YYYY/MM/DD HH:mm:ss"
 */
export function safeDate(date: string | number | Date): Date {
  if (date instanceof Date) return date
  if (typeof date === 'number') return new Date(date)
  if (typeof date === 'string') {
    // 如果是 ISO 格式 (2024-01-01T12:00:00.000Z)，直接解析
    if (date.includes('T')) return new Date(date)
    // 替换 - 为 / 以兼容 iOS
    return new Date(date.replace(/-/g, '/'))
  }
  return new Date()
}

/**
 * 从服务器返回的日期时间中提取日期和时间字符串
 * 服务器把本地时间当 UTC 存储，所以直接从字符串提取（不做时区转换）
 *
 * @param dateTime - ISO 字符串、空格分隔字符串、或时间戳
 * @returns { dateStr: 'YYYY-MM-DD', timeStr: 'HH:mm', sortTime: number }
 */
export function extractDateTimeFromServer(dateTime: string | number | Date): {
  dateStr: string
  timeStr: string
  sortTime: number
} {
  let dateStr: string
  let timeStr: string

  if (typeof dateTime === 'string' && dateTime.includes('T')) {
    // ISO 格式: "2026-02-04T19:30:00.000Z"
    dateStr = dateTime.split('T')[0]
    timeStr = dateTime.split('T')[1].slice(0, 5)
  } else if (typeof dateTime === 'string' && dateTime.includes(' ')) {
    // 空格分隔: "2026-02-04 19:30:00"
    dateStr = dateTime.split(' ')[0]
    timeStr = dateTime.split(' ')[1].slice(0, 5)
  } else {
    // 其他情况：使用本地时间
    const dateObj = safeDate(dateTime)
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    dateStr = `${y}-${m}-${d}`
    timeStr = dateObj.toTimeString().slice(0, 5)
  }

  // 用提取的日期时间计算 sortTime（当作本地时间）
  const sortTime = safeDate(`${dateStr} ${timeStr}:00`).getTime()

  return { dateStr, timeStr, sortTime }
}
