/**
 * 统一日志工具
 * 在开发环境输出调试日志，生产环境仅输出错误日志
 */

// 判断是否为开发环境
// __wxConfig 是微信小程序内置的全局配置对象
declare const __wxConfig: { envVersion: string }
const isDev = typeof __wxConfig !== 'undefined' && __wxConfig.envVersion === 'develop'

export const logger = {
  /**
   * 调试日志 - 仅开发环境输出
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * 信息日志 - 仅开发环境输出
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * 警告日志 - 始终输出
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },

  /**
   * 错误日志 - 始终输出
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  }
}

export default logger
