/**
 * 共享权限模块
 * 提供授权检查和资源所有权验证
 */

/**
 * 错误码常量
 */
const ErrorCodes = {
  SUCCESS: 0,
  PARAM_ERROR: 1001,
  UNAUTHORIZED: 1002,
  NOT_FOUND: 1003,
  FORBIDDEN: 1004,
  DB_ERROR: 2001
}

/**
 * 创建标准响应
 * @param {number} code - 错误码
 * @param {string} message - 消息
 * @param {any} [data] - 数据
 * @returns {Object}
 */
function response(code, message, data = null) {
  const res = { code, message }
  if (data !== null) {
    res.data = data
  }
  return res
}

/**
 * 成功响应
 * @param {any} [data] - 数据
 * @returns {Object}
 */
function success(data = null) {
  return response(ErrorCodes.SUCCESS, 'success', data)
}

/**
 * 参数错误响应
 * @param {string} [detail] - 错误详情
 * @returns {Object}
 */
function paramError(detail = '') {
  return response(ErrorCodes.PARAM_ERROR, detail ? `参数错误: ${detail}` : '参数错误')
}

/**
 * 未授权响应
 * @returns {Object}
 */
function unauthorized() {
  return response(ErrorCodes.UNAUTHORIZED, '未授权')
}

/**
 * 资源不存在响应
 * @returns {Object}
 */
function notFound() {
  return response(ErrorCodes.NOT_FOUND, '资源不存在')
}

/**
 * 权限不足响应
 * @param {string} [detail] - 错误详情
 * @returns {Object}
 */
function forbidden(detail = '') {
  return response(ErrorCodes.FORBIDDEN, detail || '权限不足')
}

/**
 * 数据库错误响应
 * @returns {Object}
 */
function dbError() {
  return response(ErrorCodes.DB_ERROR, '数据库操作失败')
}

/**
 * 验证资源所有权
 * @param {Object} db - 数据库实例
 * @param {string} collection - 集合名称
 * @param {string} docId - 文档 ID
 * @param {string} openid - 用户 openid
 * @param {string} [userIdField='userId'] - 用户 ID 字段名
 * @returns {Promise<{ owned: boolean, data: Object|null }>}
 */
async function verifyOwnership(db, collection, docId, openid, userIdField = 'userId') {
  try {
    const res = await db.collection(collection).doc(docId).get()
    if (!res.data) {
      return { owned: false, data: null }
    }
    const owned = res.data[userIdField] === openid
    return { owned, data: res.data }
  } catch (err) {
    return { owned: false, data: null }
  }
}

/**
 * 验证鱼缸所有权（常用操作的快捷方法）
 * @param {Object} db - 数据库实例
 * @param {string} tankId - 鱼缸 ID
 * @param {string} openid - 用户 openid
 * @returns {Promise<boolean>}
 */
async function verifyTankOwnership(db, tankId, openid) {
  const { owned } = await verifyOwnership(db, 'tanks', tankId, openid)
  return owned
}

module.exports = {
  ErrorCodes,
  response,
  success,
  paramError,
  unauthorized,
  notFound,
  forbidden,
  dbError,
  verifyOwnership,
  verifyTankOwnership
}
