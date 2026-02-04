/**
 * 工具函数
 * 注意：大部分格式化函数已移至 pages/index/helpers/formatters.ts
 * 此文件保留以保持兼容性
 */

/**
 * 格式化完整日期时间
 */
function formatTime(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const pad = (n: number): string => n < 10 ? `0${n}` : `${n}`

  return `${year}/${pad(month)}/${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`
}

export { formatTime }
