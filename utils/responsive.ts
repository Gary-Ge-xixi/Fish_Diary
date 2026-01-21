/**
 * 响应式适配工具
 * 处理多屏幕尺寸适配（iPhone SE ~ iPhone 13 Pro Max）
 */
import { logger } from './logger'

// 屏幕尺寸断点（基于 CSS 像素宽度）
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg'

// 断点定义
const BREAKPOINTS = {
  xs: 0,    // iPhone SE: 375px
  sm: 390,  // iPhone 12/13: 390px
  md: 414,  // iPhone 11 Pro Max: 414px
  lg: 428   // iPhone 13 Pro Max: 428px
}

// 设计稿基准宽度
const DESIGN_WIDTH = 750

export interface ScreenInfo {
  windowWidth: number
  windowHeight: number
  screenWidth: number
  screenHeight: number
  statusBarHeight: number
  safeArea: WechatMiniprogram.SafeArea | null
  pixelRatio: number
  size: ScreenSize
  isLargeScreen: boolean
}

export interface NavBarInfo {
  statusBarHeight: number
  titleBarHeight: number
  navBarHeight: number
  menuButtonInfo: WechatMiniprogram.ClientRect | null
}

// 缓存屏幕信息
let cachedScreenInfo: ScreenInfo | null = null
let cachedNavBarInfo: NavBarInfo | null = null

/**
 * 获取屏幕尺寸分类
 */
function getScreenSize(width: number): ScreenSize {
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

/**
 * 获取屏幕信息
 */
export function getScreenInfo(): ScreenInfo {
  if (cachedScreenInfo) {
    return cachedScreenInfo
  }

  try {
    const windowInfo = wx.getWindowInfo()
    const systemInfo = wx.getDeviceInfo()

    const size = getScreenSize(windowInfo.windowWidth)

    cachedScreenInfo = {
      windowWidth: windowInfo.windowWidth,
      windowHeight: windowInfo.windowHeight,
      screenWidth: windowInfo.screenWidth,
      screenHeight: windowInfo.screenHeight,
      statusBarHeight: windowInfo.statusBarHeight,
      safeArea: windowInfo.safeArea || null,
      pixelRatio: windowInfo.pixelRatio,
      size,
      isLargeScreen: size === 'lg' || size === 'md'
    }
  } catch (err) {
    logger.warn('[Responsive] 获取屏幕信息失败:', err)
    // 默认值（基于 iPhone 12）
    cachedScreenInfo = {
      windowWidth: 390,
      windowHeight: 844,
      screenWidth: 390,
      screenHeight: 844,
      statusBarHeight: 47,
      safeArea: null,
      pixelRatio: 3,
      size: 'sm',
      isLargeScreen: false
    }
  }

  return cachedScreenInfo
}

/**
 * 获取导航栏信息
 * 包含状态栏高度、标题栏高度、总导航栏高度
 */
export function getNavBarInfo(): NavBarInfo {
  if (cachedNavBarInfo) {
    return cachedNavBarInfo
  }

  const screenInfo = getScreenInfo()
  let menuButtonInfo: WechatMiniprogram.ClientRect | null = null

  try {
    menuButtonInfo = wx.getMenuButtonBoundingClientRect()
  } catch (err) {
    logger.warn('[Responsive] 获取菜单按钮信息失败:', err)
  }

  let navBarHeight = 91
  let titleBarHeight = 44
  const statusBarHeight = screenInfo.statusBarHeight

  if (menuButtonInfo && menuButtonInfo.top > 0) {
    // 标题栏高度 = 胶囊按钮高度 + 上下边距（对称）
    // 胶囊按钮距离状态栏底部的距离 = menuButton.top - statusBarHeight
    const menuButtonMarginTop = menuButtonInfo.top - statusBarHeight
    const menuButtonMarginBottom = menuButtonMarginTop // 对称

    titleBarHeight = menuButtonInfo.height + menuButtonMarginTop + menuButtonMarginBottom

    // 总高度 = 状态栏 + 标题栏
    navBarHeight = statusBarHeight + titleBarHeight

    logger.debug('[NavBar] 计算详情:', {
      statusBarHeight,
      menuButtonTop: menuButtonInfo.top,
      menuButtonHeight: menuButtonInfo.height,
      menuButtonBottom: menuButtonInfo.bottom,
      menuButtonMarginTop,
      titleBarHeight,
      navBarHeight
    })
  } else {
    // 降级：使用默认值
    const deviceInfo = wx.getDeviceInfo()
    titleBarHeight = deviceInfo.platform === 'android' ? 48 : 44
    navBarHeight = statusBarHeight + titleBarHeight
  }

  cachedNavBarInfo = {
    statusBarHeight,
    titleBarHeight,
    navBarHeight,
    menuButtonInfo
  }

  return cachedNavBarInfo
}

/**
 * px 转 rpx
 * @param px 像素值
 * @returns rpx 值
 */
export function px2rpx(px: number): number {
  const screenInfo = getScreenInfo()
  return (px / screenInfo.windowWidth) * DESIGN_WIDTH
}

/**
 * rpx 转 px
 * @param rpx rpx 值
 * @returns 像素值
 */
export function rpx2px(rpx: number): number {
  const screenInfo = getScreenInfo()
  return (rpx / DESIGN_WIDTH) * screenInfo.windowWidth
}

/**
 * 根据屏幕尺寸返回不同值
 * @param values 各尺寸对应的值
 * @param defaultValue 默认值
 */
export function responsive<T>(
  values: Partial<Record<ScreenSize, T>>,
  defaultValue: T
): T {
  const { size } = getScreenInfo()

  // 按优先级查找：当前尺寸 -> 更小尺寸 -> 默认值
  const priorities: ScreenSize[] = ['lg', 'md', 'sm', 'xs']
  const startIndex = priorities.indexOf(size)

  for (let i = startIndex; i < priorities.length; i++) {
    const s = priorities[i]
    if (values[s] !== undefined) {
      return values[s]!
    }
  }

  return defaultValue
}

/**
 * 获取安全区域 padding
 */
export function getSafeAreaPadding(): {
  top: number
  bottom: number
  left: number
  right: number
} {
  const screenInfo = getScreenInfo()
  const safeArea = screenInfo.safeArea

  if (!safeArea) {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  return {
    top: safeArea.top,
    bottom: screenInfo.screenHeight - safeArea.bottom,
    left: safeArea.left,
    right: screenInfo.screenWidth - safeArea.right
  }
}

/**
 * 清除缓存（用于屏幕旋转等场景）
 */
export function clearCache(): void {
  cachedScreenInfo = null
  cachedNavBarInfo = null
}

/**
 * 初始化响应式工具（在 App.onLaunch 中调用）
 */
export function initResponsive(): ScreenInfo {
  const screenInfo = getScreenInfo()
  const navBarInfo = getNavBarInfo()

  logger.debug('[Responsive] 屏幕信息:', {
    size: screenInfo.size,
    width: screenInfo.windowWidth,
    height: screenInfo.windowHeight,
    statusBar: screenInfo.statusBarHeight
  })

  logger.debug('[Responsive] 导航栏信息:', {
    statusBarHeight: navBarInfo.statusBarHeight,
    titleBarHeight: navBarInfo.titleBarHeight,
    navBarHeight: navBarInfo.navBarHeight
  })

  return screenInfo
}
