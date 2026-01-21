/**
 * 通用格式化工具
 * 提取自 wiki.ts 和其他页面的格式化函数
 */

/**
 * 格式化温度范围
 * @param temp 温度范围对象
 * @returns 格式化后的字符串，如 "24-28°C"
 */
export function formatTemperature(temp?: { min: number; max: number }): string {
  if (!temp) return '-'
  return `${temp.min}-${temp.max}°C`
}

/**
 * 格式化 pH 范围
 * @param ph pH 范围对象
 * @returns 格式化后的字符串，如 "6.5-7.5"
 */
export function formatPh(ph?: { min: number; max: number }): string {
  if (!ph) return '-'
  return `${ph.min}-${ph.max}`
}

/**
 * 格式化体型尺寸范围
 * @param size 尺寸范围对象（单位 cm）
 * @returns 格式化后的字符串，如 "5-10 cm"
 */
export function formatSize(size?: { min: number; max: number }): string {
  if (!size) return '-'
  return `${size.min}-${size.max} cm`
}

/**
 * 难度等级标签映射
 */
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '容易',
  medium: '中等',
  hard: '困难'
}

/**
 * 获取难度等级标签
 * @param difficulty 难度等级 key
 * @returns 中文标签
 */
export function getDifficultyLabel(difficulty?: string): string {
  return DIFFICULTY_LABELS[difficulty || ''] || '-'
}

/**
 * 性格标签映射
 */
const TEMPERAMENT_LABELS: Record<string, string> = {
  peaceful: '温和',
  'semi-aggressive': '半攻击性',
  aggressive: '攻击性'
}

/**
 * 获取性格标签
 * @param temperament 性格 key
 * @returns 中文标签
 */
export function getTemperamentLabel(temperament?: string): string {
  return TEMPERAMENT_LABELS[temperament || ''] || '-'
}
