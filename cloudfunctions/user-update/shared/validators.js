/**
 * 共享验证模块
 * 提供通用的参数验证函数
 */

/**
 * 验证并规范化分页参数
 * @param {Object} params - 包含 page 和 pageSize 的参数对象
 * @param {number} [defaultPageSize=20] - 默认每页数量
 * @param {number} [maxPageSize=100] - 最大每页数量
 * @returns {{ page: number, pageSize: number, skip: number }}
 */
function validatePagination(params, defaultPageSize = 20, maxPageSize = 100) {
  const page = Math.max(1, parseInt(params.page) || 1)
  const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(params.pageSize) || defaultPageSize))
  const skip = (page - 1) * pageSize
  return { page, pageSize, skip }
}

/**
 * 验证日期格式
 * @param {string} dateStr - 日期字符串
 * @returns {{ valid: boolean, date: Date|null, error: string|null }}
 */
function validateDate(dateStr) {
  if (!dateStr) {
    return { valid: true, date: null, error: null }
  }
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return { valid: false, date: null, error: '日期格式无效' }
  }
  return { valid: true, date, error: null }
}

/**
 * 验证正整数
 * @param {any} value - 要验证的值
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {{ valid: boolean, value: number|null, error: string|null }}
 */
function validatePositiveInt(value, fieldName) {
  if (value === undefined || value === null) {
    return { valid: true, value: null, error: null }
  }
  const num = parseInt(value)
  if (isNaN(num) || num < 1 || !Number.isInteger(Number(value))) {
    return { valid: false, value: null, error: `${fieldName}必须是正整数` }
  }
  return { valid: true, value: num, error: null }
}

/**
 * 验证非负数
 * @param {any} value - 要验证的值
 * @param {string} fieldName - 字段名称（用于错误消息）
 * @returns {{ valid: boolean, value: number|null, error: string|null }}
 */
function validateNonNegative(value, fieldName) {
  if (value === undefined || value === null) {
    return { valid: true, value: null, error: null }
  }
  const num = parseFloat(value)
  if (isNaN(num) || num < 0) {
    return { valid: false, value: null, error: `${fieldName}不能为负数` }
  }
  return { valid: true, value: num, error: null }
}

/**
 * 验证必填字段
 * @param {Object} params - 参数对象
 * @param {string[]} requiredFields - 必填字段数组
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateRequired(params, requiredFields) {
  for (const field of requiredFields) {
    if (params[field] === undefined || params[field] === null || params[field] === '') {
      return { valid: false, error: `缺少 ${field}` }
    }
  }
  return { valid: true, error: null }
}

/**
 * 验证枚举值
 * @param {any} value - 要验证的值
 * @param {Object|Array} allowedValues - 允许的值（对象的 keys 或数组）
 * @param {string} fieldName - 字段名称
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateEnum(value, allowedValues, fieldName) {
  if (value === undefined || value === null) {
    return { valid: true, error: null }
  }
  const allowed = Array.isArray(allowedValues) ? allowedValues : Object.keys(allowedValues)
  if (!allowed.includes(value)) {
    return { valid: false, error: `无效的${fieldName}` }
  }
  return { valid: true, error: null }
}

module.exports = {
  validatePagination,
  validateDate,
  validatePositiveInt,
  validateNonNegative,
  validateRequired,
  validateEnum
}
