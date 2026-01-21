import { getNavBarInfo, getScreenInfo } from '../../utils/responsive'
import { logger } from '../../utils/logger'

interface NavigationBarData {
  displayStyle: string
  ios?: boolean
  innerPaddingRight?: string
  leftWidth?: string
  navBarStyle?: string
  statusBarHeight: number
  titleBarHeight: number
  navBarHeight: number
}

interface NavigationBarProperties {
  extClass: string
  title: string
  background: string
  color: string
  back: boolean
  loading: boolean
  homeButton: boolean
  animated: boolean
  show: boolean
  delta: number
}

Component<NavigationBarData, NavigationBarProperties, Record<string, (...args: unknown[]) => void>>({
  options: {
    multipleSlots: true,
    virtualHost: false  // 确保组件有实际的包裹节点，:host 才能生效
  },

  properties: {
    extClass: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    background: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: ''
    },
    back: {
      type: Boolean,
      value: true
    },
    loading: {
      type: Boolean,
      value: false
    },
    homeButton: {
      type: Boolean,
      value: false
    },
    animated: {
      type: Boolean,
      value: true
    },
    show: {
      type: Boolean,
      value: true,
      observer: '_showChange'
    },
    delta: {
      type: Number,
      value: 1
    }
  },

  data: {
    displayStyle: '',
    statusBarHeight: 47,
    titleBarHeight: 44,
    navBarHeight: 91
  },

  lifetimes: {
    attached() {
      // 使用响应式工具获取导航栏信息
      const navBarInfo = getNavBarInfo()
      const screenInfo = getScreenInfo()
      const rect = wx.getMenuButtonBoundingClientRect()

      // 调试日志（仅开发环境输出）
      logger.debug('[NavBar] 系统信息:', {
        statusBarHeight: screenInfo.statusBarHeight,
        windowWidth: screenInfo.windowWidth,
        windowHeight: screenInfo.windowHeight
      })
      logger.debug('[NavBar] 胶囊按钮:', {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        width: rect.width
      })
      logger.debug('[NavBar] 计算结果:', {
        navBarHeight: navBarInfo.navBarHeight,
        titleBarHeight: navBarInfo.titleBarHeight,
        statusBarHeight: navBarInfo.statusBarHeight
      })

      const deviceInfo = wx.getDeviceInfo?.() || wx.getSystemInfoSync()
      const platform = deviceInfo.platform
      const isAndroid = platform === 'android'

      // 获取菜单按钮信息计算右侧 padding
      const rightPadding = screenInfo.windowWidth - rect.left

      // 构建导航栏样式（使用动态计算的高度）
      // 直接设置 height 而不是 CSS 变量，确保 Skyline 模式下生效
      const navBarStyle = [
        `--status-bar-height: ${navBarInfo.statusBarHeight}px`,
        `--title-bar-height: ${navBarInfo.titleBarHeight}px`,
        `--nav-bar-height: ${navBarInfo.navBarHeight}px`,
        `height: ${navBarInfo.navBarHeight}px`
      ].join(';')

      this.setData({
        ios: !isAndroid,
        innerPaddingRight: `padding-right: ${rightPadding}px`,
        leftWidth: `width: ${rightPadding}px`,
        navBarStyle,
        statusBarHeight: navBarInfo.statusBarHeight,
        titleBarHeight: navBarInfo.titleBarHeight,
        navBarHeight: navBarInfo.navBarHeight
      })
    }
  },

  methods: {
    _showChange(show: boolean) {
      const animated = this.data.animated
      let displayStyle = ''
      if (animated) {
        displayStyle = `opacity: ${show ? '1' : '0'};transition:opacity 0.5s;`
      } else {
        displayStyle = `display: ${show ? '' : 'none'}`
      }
      this.setData({ displayStyle })
    },

    back() {
      const { delta } = this.data
      if (delta) {
        wx.navigateBack({ delta })
      }
      this.triggerEvent('back', { delta })
    }
  }
})
