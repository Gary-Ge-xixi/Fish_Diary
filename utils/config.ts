/**
 * 应用配置文件
 * 集中管理开发模式开关和其他配置
 */

// 云开发环境 ID
// 可以在云开发控制台-设置-环境ID中获取
export const CLOUD_ENV_ID = 'cloudbase-9gnb2cyn0387e399'

// 开发模式开关：true 使用模拟数据，false 使用云函数
export const DEV_MODE = false

// 分页默认配置
export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20
}

// API 超时配置 (毫秒)
export const API_TIMEOUT = 10000

// 模拟数据延迟 (毫秒)
export const MOCK_DELAY = 500
