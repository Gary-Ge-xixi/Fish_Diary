/**
 * 平台检测与适配工具
 * 支持 iOS、Android、Windows、Mac、HarmonyOS 等平台
 */
import { logger } from './logger'

export type Platform = 'ios' | 'android' | 'windows' | 'mac' | 'devtools' | 'harmonyos' | 'unknown'

export interface PlatformInfo {
  platform: Platform
  isHarmonyOS: boolean
  isIOS: boolean
  isAndroid: boolean
  isDesktop: boolean
  isDevTools: boolean
  brand: string
  model: string
  system: string
}

// 缓存平台信息，避免重复调用
let cachedPlatformInfo: PlatformInfo | null = null

/**
 * 获取平台信息
 * 使用 wx.getDeviceInfo() 检测当前运行平台
 */
export function getPlatformInfo(): PlatformInfo {
  if (cachedPlatformInfo) {
    return cachedPlatformInfo
  }

  try {
    const deviceInfo = wx.getDeviceInfo()
    const platform = detectPlatform(deviceInfo.platform)

    cachedPlatformInfo = {
      platform,
      isHarmonyOS: platform === 'harmonyos',
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isDesktop: platform === 'windows' || platform === 'mac',
      isDevTools: platform === 'devtools',
      brand: deviceInfo.brand || '',
      model: deviceInfo.model || '',
      system: deviceInfo.system || ''
    }
  } catch (err) {
    logger.warn('获取设备信息失败，使用默认值:', err)
    cachedPlatformInfo = {
      platform: 'unknown',
      isHarmonyOS: false,
      isIOS: false,
      isAndroid: false,
      isDesktop: false,
      isDevTools: false,
      brand: '',
      model: '',
      system: ''
    }
  }

  return cachedPlatformInfo
}

/**
 * 检测平台类型
 */
function detectPlatform(platformStr: string): Platform {
  const p = platformStr.toLowerCase()

  // HarmonyOS 检测 (基础库 3.7.0+)
  if (p === 'harmonyos' || p.includes('harmony')) {
    return 'harmonyos'
  }

  if (p === 'ios') return 'ios'
  if (p === 'android') return 'android'
  if (p === 'windows') return 'windows'
  if (p === 'mac') return 'mac'
  if (p === 'devtools') return 'devtools'

  return 'unknown'
}

/**
 * 判断是否为 HarmonyOS 平台
 */
export function isHarmonyOS(): boolean {
  return getPlatformInfo().isHarmonyOS
}

/**
 * 判断是否为 iOS 平台
 */
export function isIOS(): boolean {
  return getPlatformInfo().isIOS
}

/**
 * 判断是否为 Android 平台
 */
export function isAndroid(): boolean {
  return getPlatformInfo().isAndroid
}

/**
 * 根据平台返回不同的值
 * @param options 各平台对应的值
 * @param defaultValue 默认值
 */
export function platformSelect<T>(
  options: Partial<Record<Platform, T>>,
  defaultValue: T
): T {
  const { platform } = getPlatformInfo()
  return options[platform] ?? defaultValue
}

/**
 * HarmonyOS 平台适配
 * 某些 API 在 HarmonyOS 上表现可能不同，这里提供统一的适配方法
 */
export const harmonyOSAdapter = {
  /**
   * 获取安全区域信息
   * HarmonyOS 的安全区域可能与 iOS/Android 不同
   */
  getSafeArea(): WechatMiniprogram.SafeArea | null {
    try {
      const systemInfo = wx.getWindowInfo()
      return systemInfo.safeArea || null
    } catch {
      return null
    }
  },

  /**
   * 震动反馈
   * HarmonyOS 可能需要不同的震动参数
   */
  vibrate(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    const info = getPlatformInfo()

    if (info.isHarmonyOS) {
      // HarmonyOS 使用 vibrateShort
      wx.vibrateShort({ type })
    } else if (info.isIOS) {
      // iOS 支持更细腻的震动反馈
      wx.vibrateShort({ type })
    } else {
      // Android 使用简单震动
      wx.vibrateShort({ type: 'medium' })
    }
  },

  /**
   * 获取状态栏高度
   * 不同平台状态栏高度不同
   */
  getStatusBarHeight(): number {
    try {
      const windowInfo = wx.getWindowInfo()
      return windowInfo.statusBarHeight || 0
    } catch {
      return 0
    }
  },

  /**
   * 获取导航栏高度（状态栏 + 标题栏）
   */
  getNavigationBarHeight(): number {
    const statusBarHeight = this.getStatusBarHeight()
    const info = getPlatformInfo()

    // 不同平台标题栏高度不同
    let titleBarHeight = 44 // 默认

    if (info.isHarmonyOS) {
      titleBarHeight = 48 // HarmonyOS 标题栏稍高
    } else if (info.isAndroid) {
      titleBarHeight = 48
    } else if (info.isIOS) {
      titleBarHeight = 44
    }

    return statusBarHeight + titleBarHeight
  }
}

/**
 * 初始化平台检测（在 App.onLaunch 中调用）
 */
export function initPlatform(): PlatformInfo {
  const info = getPlatformInfo()

  logger.debug('[Platform] 检测到平台:', info.platform)
  logger.debug('[Platform] 设备信息:', {
    brand: info.brand,
    model: info.model,
    system: info.system
  })

  if (info.isHarmonyOS) {
    logger.debug('[Platform] HarmonyOS 平台，已启用适配模式')
  }

  return info
}
