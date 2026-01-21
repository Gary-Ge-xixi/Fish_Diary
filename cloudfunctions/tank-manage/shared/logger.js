/**
 * 结构化日志模块
 * 提供统一的日志记录格式
 */

/**
 * 日志级别
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
}

/**
 * 创建日志记录器
 * @param {string} functionName - 云函数名称
 * @returns {Object} 日志记录器实例
 */
function createLogger(functionName) {
  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} action - 操作名称
   * @param {string} message - 日志消息
   * @param {Object} [extra] - 额外数据
   * @returns {string}
   */
  function formatLog(level, action, message, extra = {}) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      function: functionName,
      action,
      message,
      ...extra
    }
    return JSON.stringify(logData)
  }

  return {
    /**
     * 调试日志
     */
    debug(action, message, extra) {
      console.log(formatLog(LogLevel.DEBUG, action, message, extra))
    },

    /**
     * 信息日志
     */
    info(action, message, extra) {
      console.log(formatLog(LogLevel.INFO, action, message, extra))
    },

    /**
     * 警告日志
     */
    warn(action, message, extra) {
      console.warn(formatLog(LogLevel.WARN, action, message, extra))
    },

    /**
     * 错误日志（不暴露内部错误信息到客户端）
     * @param {string} action - 操作名称
     * @param {string} message - 日志消息
     * @param {Error} [error] - 错误对象
     * @param {Object} [extra] - 额外数据
     */
    error(action, message, error, extra = {}) {
      const logExtra = {
        ...extra,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      }
      console.error(formatLog(LogLevel.ERROR, action, message, logExtra))
    },

    /**
     * 记录操作开始
     */
    start(action, params = {}) {
      // 过滤敏感信息
      const safeParams = { ...params }
      delete safeParams.password
      delete safeParams.token
      this.info(action, '操作开始', { params: safeParams })
    },

    /**
     * 记录操作成功
     */
    success(action, duration, extra = {}) {
      this.info(action, '操作成功', { duration: `${duration}ms`, ...extra })
    },

    /**
     * 记录操作失败
     */
    fail(action, error, duration, extra = {}) {
      this.error(action, '操作失败', error, { duration: `${duration}ms`, ...extra })
    }
  }
}

/**
 * 包装异步函数，自动记录执行时间和结果
 * @param {Function} logger - 日志记录器
 * @param {string} action - 操作名称
 * @param {Function} fn - 要执行的异步函数
 * @returns {Function}
 */
function withLogging(logger, action, fn) {
  return async (...args) => {
    const startTime = Date.now()
    try {
      const result = await fn(...args)
      logger.success(action, Date.now() - startTime)
      return result
    } catch (error) {
      logger.fail(action, error, Date.now() - startTime)
      throw error
    }
  }
}

module.exports = {
  LogLevel,
  createLogger,
  withLogging
}
